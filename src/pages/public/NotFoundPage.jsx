import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-bold text-royal-600 uppercase tracking-wider">404 · Page Not Found</p>
      <h1 className="text-3xl font-extrabold text-navy-950 dark:text-white mt-2">
        We couldn’t find that UDAAN page
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md">
        The link may have moved or you may need to sign in with the appropriate demo role.
      </p>
      <div className="mt-6 flex gap-3">
        <Link to="/" className="btn-primary">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <Link to="/login" className="btn-secondary">
          Open Demo Login
        </Link>
      </div>
    </div>
  );
}
