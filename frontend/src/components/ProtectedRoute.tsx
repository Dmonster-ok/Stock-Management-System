'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'Owner' | 'Manager' | 'Staff';
}

export default function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // Check role-based access
    if (requireRole && user) {
      const roleHierarchy = { 'Staff': 1, 'Manager': 2, 'Owner': 3 };
      const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
      const requiredLevel = roleHierarchy[requireRole];

      if (userLevel < requiredLevel) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [isAuthenticated, user, requireRole, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}