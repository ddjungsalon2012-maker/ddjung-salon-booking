/**
 * This is the main page component for the success page.
 * It shows a success message after a user action.
 * Note: This code has been updated to handle 'params' as a Promise,
 * which is a change in Next.js 15.
 */
import type { NextPage } from 'next';

// Define the type for the props received by the Page component.
// In Next.js 15, 'params' is a Promise, so we must define it as such.
interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

// The Page component is now an async function to handle the Promise.
const SuccessPage: NextPage<PageProps> = async ({ params }) => {
  // Use 'await' to resolve the Promise and get the actual params object.
  const resolvedParams = await params;
  const { id } = resolvedParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold text-green-600">
        Success!
      </h1>
      <p className="mt-4 text-lg">
        Your ID is: <span className="font-mono">{id}</span>
      </p>
    </div>
  );
};

export default SuccessPage;
