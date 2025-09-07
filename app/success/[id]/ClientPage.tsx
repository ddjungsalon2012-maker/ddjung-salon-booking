'use client';

type Props = { id: string };

export default function ClientPage({ id }: Props) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 text-gray-100">
      <div className="w-full max-w-2xl bg-white/5 backdrop-blur rounded-2xl p-6 shadow">
        <h1 className="text-2xl font-bold mb-4">จองสำเร็จ 🎉</h1>
        <p className="mb-6">
          รหัสการจอง:{' '}
          <span className="font-mono bg-white/10 px-2 py-1 rounded">{id}</span>
        </p>
      </div>
    </main>
  );
}
