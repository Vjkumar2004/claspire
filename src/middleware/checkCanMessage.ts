import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function canUsersMessage(userId1: string, userId2: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('message_requests')
      .select('id')
      .eq('status', 'accepted')
      .or(`and(student_id.eq.${userId1},senior_id.eq.${userId2}),and(student_id.eq.${userId2},senior_id.eq.${userId1})`)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Can message check error:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Can message check error:', error)
    return false
  }
}
