import ClientPage from './ClientPage';

// ❗ ต้องเป็น Server Component (ห้าม 'use client')
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Next.js 15: params เป็น Promise ต้อง await
  const { id } = await params;
  return <ClientPage id={id} />;
}
