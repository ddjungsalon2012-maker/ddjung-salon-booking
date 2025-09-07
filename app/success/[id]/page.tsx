import ClientPage from './ClientPage';

// ❗️ห้ามใส่ 'use client' ในไฟล์นี้ (ต้องเป็น Server Component)
export default async function Page(props: any) {
  // ใน Next.js 15, props.params เป็น Promise -> ต้อง await
  const { id } = await props.params;
  return <ClientPage id={id as string} />;
}
