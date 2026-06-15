import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function requireAdmin(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return { error: 'Not authenticated', status: 401 }
  }
  if (!user.is_admin) {
    return { error: 'Unauthorized', status: 403 }
  }
  return { user }
}

export async function logAdminAction(
  adminId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  metadata?: Record<string, any>,
  ipAddress?: string
) {
  const { error } = await supabase
    .from('admin_audit_logs')
    .insert({
      admin_id: adminId,
      action,
      target_type: targetType || null,
      target_id: targetId || null,
      metadata: metadata || {},
      ip_address: ipAddress || null,
      created_at: new Date().toISOString()
    })

  if (error) {
    console.error('Audit log error:', error)
  }
}
