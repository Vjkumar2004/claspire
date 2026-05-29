import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function canUsersMessage(userId1: string, userId2: string): Promise<boolean> {
  try {
    const { data: juniorRequests, error: juniorError } = await supabase
      .from('message_requests')
      .select('id')
      .eq('status', 'accepted')
      .or(`and(student_id.eq.${userId1},senior_id.eq.${userId2}),and(student_id.eq.${userId2},senior_id.eq.${userId1})`)
      .limit(1)

    if (juniorError) {
      console.error('Junior can message check error:', juniorError)
      return false
    }

    if (juniorRequests && juniorRequests.length > 0) {
      return true
    }

    const { data: seniorRequests, error: seniorError } = await supabase
      .from('senior_message_requests')
      .select('id')
      .eq('status', 'accepted')
      .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
      .limit(1)

    if (seniorError) {
      console.error('Senior can message check error:', seniorError)
      return false
    }

    return !!(seniorRequests && seniorRequests.length > 0)
  } catch (error) {
    console.error('Can message check error:', error)
    return false
  }
}
