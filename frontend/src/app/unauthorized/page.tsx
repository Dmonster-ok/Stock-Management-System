'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function UnauthorizedPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-error mb-2">Access Denied</h1>
          <p className="text-base-content/70 mb-4">
            Sorry, you don't have permission to access this page.
          </p>
          {user && (
            <p className="text-sm text-base-content/50 mb-6">
              Current role: <span className="badge badge-outline">{user.role}</span>
            </p>
          )}
          <div className="card-actions justify-center">
            <Link href="/" className="btn btn-primary">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}