import ClientPage from './ClientPage';

type PageProps = { params: Promise<{ id: string }> };

export default async function Page({ params }: PageProps) {
  const { id } = await params; // ✅ Next.js 15 ต้องใช้ await
  return <ClientPage id={id} />;
}
