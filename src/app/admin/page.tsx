import { createClient } from '@supabase/supabase-js'
import { Shield, Building2, MessageSquare, Users, FileText, Clock, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

async function getStats() {
  const [
    { count: totalUsers },
    { count: totalColleges },
    { count: totalCommunities },
    { count: totalPosts },
    { count: pendingClaims },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('colleges').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('communities').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase.from('college_claims').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  return {
    totalUsers: totalUsers ?? 0,
    totalColleges: totalColleges ?? 0,
    totalCommunities: totalCommunities ?? 0,
    totalPosts: totalPosts ?? 0,
    pendingClaims: pendingClaims ?? 0,
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-blue-500' },
    { label: 'Total Colleges', value: stats.totalColleges, icon: Building2, color: 'bg-purple-500' },
    { label: 'Total Communities', value: stats.totalCommunities, icon: MessageSquare, color: 'bg-emerald-500' },
    { label: 'Total Posts', value: stats.totalPosts, icon: FileText, color: 'bg-amber-500' },
    { label: 'Pending Claims', value: stats.pendingClaims, icon: Shield, color: 'bg-rose-500', href: '/admin/college-claims' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-[#B0B7BE] mt-1">Platform overview and management</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((card) => {
          const Icon = card.icon
          const content = (
            <div className="bg-white dark:bg-[#283036] rounded-xl border border-gray-200 dark:border-[#38434F] p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <Icon size={22} className="text-white" />
                </div>
                <span className="text-3xl font-black text-gray-900 dark:text-white">{card.value.toLocaleString()}</span>
              </div>
              <p className="text-sm font-bold text-gray-500 dark:text-[#B0B7BE]">{card.label}</p>
            </div>
          )

          if (card.href) {
            return (
              <Link key={card.label} href={card.href} className="no-underline">
                {content}
              </Link>
            )
          }

          return <div key={card.label}>{content}</div>
        })}
      </div>

      {stats.pendingClaims > 0 && (
        <div className="mt-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <Clock size={20} className="text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-amber-800 dark:text-amber-200 text-sm">
                {stats.pendingClaims} college claim{stats.pendingClaims > 1 ? 's' : ''} pending review
              </p>
              <Link
                href="/admin/college-claims"
                className="text-xs font-bold text-amber-700 dark:text-amber-300 underline underline-offset-2"
              >
                Review claims
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
