# Booking and shop LINE notifications on Vercel

The browser Firebase API key does not authenticate Firebase Admin. Configure the
following server-only environment variables in the Vercel project, Production
environment, then redeploy. Never put credentials in Git or NEXT_PUBLIC variables.

| Variable | Value |
| --- | --- |
| `FIREBASE_PROJECT_ID` | `ddjung-salon-v2` |
| `FIREBASE_CLIENT_EMAIL` | Existing Firebase service account client email |
| `FIREBASE_PRIVATE_KEY` | Matching private key; actual or escaped newlines supported |
| `LINE_CHANNEL_ACCESS_TOKEN` | Messaging API channel access token for the shop LINE OA |
| `LINE_NOTIFICATION_TARGET_ID` | Shop LINE group ID (`C...`) from a verified LINE webhook event |

Use an existing authorized service account with the necessary Firestore access.
Google-hosted deployments can continue using Application Default Credentials.
The LINE OA must be in the destination group and allow joining group chats.
The public LINE ID `@ddjung` is not a Messaging API group ID.

The booking endpoint saves a Pending booking transactionally before sending a
bounded LINE push request. Messages include booking ID, service, date and time;
customer contact details and payment slips remain in the authenticated admin UI.
`lineNotificationStatus` records `sent` (API accepted), `failed`, or
`not_configured`. There is no automatic resend; inspect Vercel logs and Firestore
for failures. An accepted API request is not proof that a group member read it.
LINE outages must not cause a saved booking to return a failure to the customer.

Validation:

```sh
node --test tests/booking.test.cjs
npm run build
```

After configuring Production, verify `/api/booked-times?date=YYYY-MM-DD` returns
200. Then use an explicitly agreed test booking to verify both its saved record
and receipt in the shop group. Do not create fake customer records or send group
messages merely to probe configuration.

References: [Firebase Admin setup](https://firebase.google.com/docs/admin/setup),
[LINE push messages](https://developers.line.biz/en/docs/messaging-api/sending-messages/).
