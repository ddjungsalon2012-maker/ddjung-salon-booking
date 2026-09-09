const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Compile the real route/module, replacing only external services. No live writes/messages.
function load(file, mocks = {}, globals = {}) {
  const code = ts.transpileModule(readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module, exports: module.exports,
    require: name => name in mocks ? mocks[name] : require(name),
    process: { env: {} }, console: { error() {} }, AbortSignal, ...globals,
  });
  return module.exports;
}

const valid = { name: 'Test', phone: '0000000000', service: 'ตัดผม', date: '2026-09-10', time: '10:00', slipUrl: 'https://example.com/test.png' };
function route({ conflict = false, dbError = false, notification = 'sent', updateError = false } = {}) {
  const writes = [], calls = [];
  const ref = { id: 'test-booking', update: async value => { if (updateError) throw Error('update failed'); writes.push(value); } };
  const db = {
    collection: () => ({ doc: () => ref, where: () => ({}) }),
    runTransaction: async callback => {
      if (dbError) throw Error('credential failure');
      return callback({
        get: async () => ({ docs: conflict ? [{ get: key => key === 'time' ? valid.time : 'Pending' }] : [] }),
        create: (_, value) => writes.push(value),
      });
    },
  };
  const { POST } = load('app/api/bookings/route.ts', {
    '@/lib/firebaseAdmin': { getAdminDb: () => db },
    '@/lib/lineNotification': { notifyBooking: async value => { calls.push(value); return notification; } },
    'firebase-admin': { firestore: { FieldValue: { serverTimestamp: () => 'now' } } },
  });
  return { submit: body => POST(new Request('http://localhost/api/bookings', { method: 'POST', body: JSON.stringify(body) })), writes, calls };
}

test('successful booking persists Pending before notifying', async () => {
  const r = route();
  const response = await r.submit({ ...valid, status: 'Confirmed' });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).id, 'test-booking');
  assert.equal(r.writes[0].status, 'Pending');
  assert.equal(r.writes[1].lineNotificationStatus, 'sent');
  assert.equal(r.calls.length, 1);
});
test('invalid booking never writes or notifies', async () => {
  const r = route();
  assert.equal((await r.submit({ ...valid, name: ' ' })).status, 400);
  assert.equal(r.writes.length + r.calls.length, 0);
});
test('occupied slot returns conflict without writes/messages', async () => {
  const r = route({ conflict: true });
  assert.equal((await r.submit(valid)).status, 409);
  assert.equal(r.writes.length + r.calls.length, 0);
});
test('Firebase failure returns safe error and never notifies', async () => {
  const r = route({ dbError: true });
  const response = await r.submit(valid);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, 'BOOKING_UNAVAILABLE');
  assert.equal(r.calls.length, 0);
});
for (const notification of ['failed', 'not_configured']) {
  test(`saved booking stays successful when LINE is ${notification}`, async () => {
    const r = route({ notification });
    assert.equal((await r.submit(valid)).status, 200);
    assert.equal(r.writes[1].lineNotificationStatus, notification);
  });
}
test('notification status write failure does not undo booking success', async () => {
  const r = route({ updateError: true });
  assert.equal((await r.submit(valid)).status, 200);
});

test('LINE uses only configured destination and handles rejected/timeout requests', async () => {
  for (const mode of ['ok', 'rejected', 'timeout']) {
    const { notifyBooking } = load('lib/lineNotification.ts', {}, {
      process: { env: { LINE_CHANNEL_ACCESS_TOKEN: 'test-token', LINE_NOTIFICATION_TARGET_ID: 'test-group' } },
      fetch: async (url, init) => {
        assert.equal(url, 'https://api.line.me/v2/bot/message/push');
        assert.equal(JSON.parse(init.body).to, 'test-group');
        assert.equal(init.headers.Authorization, 'Bearer test-token');
        assert(init.signal);
        if (mode === 'timeout') throw Error('timeout');
        return { ok: mode === 'ok', status: mode === 'ok' ? 200 : 401 };
      },
    });
    assert.equal(await notifyBooking({ ...valid, id: 'test' }), mode === 'ok' ? 'sent' : 'failed');
  }
});
test('missing LINE settings never send requests', async () => {
  const { notifyBooking } = load('lib/lineNotification.ts', {}, { fetch: () => assert.fail('must not send') });
  assert.equal(await notifyBooking({ ...valid, id: 'test' }), 'not_configured');
});
test('Vercel service account configuration normalizes escaped newlines', () => {
  let config;
  const { getAdminApp } = load('lib/firebaseAdmin.ts', {
    'firebase-admin': { apps: [], credential: { cert: value => { config = value; return 'credential'; } }, initializeApp: value => value },
  }, { process: { env: { FIREBASE_PROJECT_ID: 'test-project', FIREBASE_CLIENT_EMAIL: 'test@example.com', FIREBASE_PRIVATE_KEY: 'first\\nsecond' } } });
  assert.equal(getAdminApp().projectId, 'test-project');
  assert.equal(config.privateKey, 'first\nsecond');
});
