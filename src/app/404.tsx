import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-sky-50 p-6">
      <div className="bg-white rounded-xl shadow-lg p-10 flex flex-col items-center">
        <h1 className="text-6xl font-bold text-cyan-600 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-sky-700 mb-2">Page Not Found</h2>
        <p className="text-slate-600 mb-6 text-center max-w-md">
          Oops! The page you're looking for doesn't exist or has been moved.<br />
          Let's get you back to the coast!
        </p>
        <Link href="/" className="px-6 py-3 bg-cyan-500 text-white rounded-lg font-semibold hover:bg-cyan-600 transition-all">
          Go to Homepage
        </Link>
      </div>
    </div>
  );
} 