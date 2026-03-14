import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export type NotificationType = 'post_like' | 'post_answer' | 'job_post' | 'referral_status' | 'referral_request'

interface CreateNotificationParams {
  receiverId: string
  senderId?: string
  type: NotificationType
  title: string
  message: string
  link?: string
  postId?: string
}

export async function createNotification({
  receiverId,
  senderId,
  type,
  title,
  message,
  link,
  postId
}: CreateNotificationParams) {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        receiver_id: receiverId,
        sender_id: senderId || null,
        type,
        title,
        message,
        link,
        post_id: postId || null,
        is_read: false,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error creating notification:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error('Notification utility error:', error)
    return { success: false, error }
  }
}

export async function createBulkNotifications(
  params: Omit<CreateNotificationParams, 'receiverId'> & { receiverIds: string[] }
) {
  try {
    const { receiverIds, senderId, type, title, message, link, postId } = params
    
    const notifications = receiverIds.map(receiverId => ({
      receiver_id: receiverId,
      sender_id: senderId || null,
      type,
      title,
      message,
      link,
      post_id: postId || null,
      is_read: false,
      created_at: new Date().toISOString()
    }))

    const { error } = await supabase
      .from('notifications')
      .insert(notifications)

    if (error) {
      console.error('Error creating bulk notifications:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error('Bulk notification utility error:', error)
    return { success: false, error }
  }
}

export async function sendPushToUsers(
  userIds: string[],
  title: string,
  message: string,
  link: string
) {
  try {
    // Get onesignal_player_ids
    const { data: users } = await supabase
      .from('users')
      .select('onesignal_player_id')
      .in('id', userIds)
      .not('onesignal_player_id', 'is', null)

    const playerIds = users?.map(u => u.onesignal_player_id).filter(Boolean) || []

    if (!playerIds.length) return

    // Send push via OneSignal (internal API call)
    await fetch('http://localhost:3000/api/notifications/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        receiver_ids: playerIds,
        title,
        message,
        url: link
      })
    })
  } catch (err) {
    console.error('Push send error:', err)
  }
}
