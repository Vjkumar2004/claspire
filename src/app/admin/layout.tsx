import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { verifySessionCookie } from '@/lib/session'
import AdminSidebar from '@/components/AdminSidebar'
import { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false, follow: false }
}
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('claspire_session')?.value

  if (!sessionCookie) {
    redirect('/signup')
  }

  const session = verifySessionCookie(sessionCookie)
  if (!session) {
    redirect('/signup')
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  )

  const { data: user } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', session.userId)
    .single()

  if (!user || !user.is_admin) {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-[#1D2226]">
      <AdminSidebar />
      <main className="flex-1 min-w-0 overflow-auto pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  )
}
