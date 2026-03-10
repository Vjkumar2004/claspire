'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're certain there's no user
    // Don't redirect while loading or if user exists
    if (!loading && !user) {
      console.log('Dashboard layout - no user found, redirecting to signup')
      router.push('/signup');
    } else if (user) {
      console.log('Dashboard layout - user authenticated:', user.email, user.role)
    }
  }, [user, loading, router]);

  // Show loading while checking authentication
  if (loading) {
    console.log('Dashboard layout - showing loading')
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

  // Only render children if user exists
  if (!user) {
    console.log('Dashboard layout - no user, not rendering')
    return null;
  }

  console.log('Dashboard layout - rendering children for:', user.role)
  return <>{children}</>;
}
