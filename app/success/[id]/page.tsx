import ClientPage from './ClientPage';

// ❗️อย่านำเข้า PageProps ใด ๆ และอย่าใส่ 'use client' ในหน้านี้
export default async function Page(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // Next.js 15 ต้อง await
  return <ClientPage id={id} />;
}
