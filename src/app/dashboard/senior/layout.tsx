'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function SeniorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're certain there's no user or wrong role
    if (!loading && (!user || user.role !== 'senior')) {
      if (!user) {
        router.push('/signup');
      } else {
        router.push('/dashboard/junior'); // Redirect to junior dashboard
      }
    }
  }, [user, loading, router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'white'
      }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid #F3F4F6',
          borderTop: '3px solid #7C3AED',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg) }
          }
        `}</style>
      </div>
    )
  }

  // Only render if user is authenticated and is a senior
  if (!user || user.role !== 'senior') {
    return null;
  }

  return <>{children}</>;
}
