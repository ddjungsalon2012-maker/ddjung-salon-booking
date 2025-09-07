import ClientPage from './ClientPage';

// Next.js 15: params เป็น Promise<Record<string, string>>
export default async function Page({
  params,
}: {
  params: Promise<Record<string, string>>;
}) {
  const { id } = await params;
  return <ClientPage id={id} />;
}
