import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export type NotificationType = 
  | 'post_like' 
  | 'post_answered' 
  | 'job_post' 
  | 'referral_approved' 
  | 'referral_request'
  | 'post_in_community'
  | 'post_upvoted'
  | 'new_job'
  | 'group_created'

interface CreateNotificationParams {
  receiver_id: string
  sender_id?: string
  type: NotificationType
  title: string
  message: string
  link?: string
  post_id?: string
}

export async function createNotification({
  receiver_id,
  sender_id,
  type,
  title,
  message,
  link,
  post_id
}: CreateNotificationParams) {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        receiver_id,
        sender_id: sender_id || null,
        type,
        title,
        message,
        link,
        post_id: post_id || null,
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

export async function notifyNewPost({
  communityId,
  communitySlug,
  postId,
  postTitle,
  postType,
  authorId,
  authorName,
  customTitle,
  customMessage
}: {
  communityId: string
  communitySlug: string
  postId: string
  postTitle: string
  postType: string
  authorId: string
  authorName: string
  customTitle?: string
  customMessage?: string
}) {
  try {
    const { data: members } = await supabase
      .from('community_members')
      .select('user_id')
      .eq('community_id', communityId)
      .neq('user_id', authorId)

    if (!members?.length) return

    const title = customTitle || `New ${postType} in c/${communitySlug}`
    const message = customMessage || `${authorName}: "${postTitle.slice(0, 60)}"`

    const notifs = members.map(m => ({
      type: 'post_in_community',
      title,
      message,
      receiver_id: m.user_id,
      sender_id: authorId,
      post_id: postId,
      link: `/community/c/${communitySlug}`,
      is_read: false,
      created_at: new Date().toISOString()
    }))

    // Bulk insert with chunks to avoid size limits
    for (let i = 0; i < notifs.length; i += 50) {
      await supabase
        .from('notifications')
        .insert(notifs.slice(i, i + 50))
    }

    // Push notification via OneSignal
    const { data: playerIds } = await supabase
      .from('users')
      .select('onesignal_player_id')
      .in('id', members.map(m => m.user_id))
      .not('onesignal_player_id', 'is', null)

    if (playerIds?.length) {
      await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
        },
        body: JSON.stringify({
          app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
          include_player_ids: playerIds.map(u => u.onesignal_player_id),
          headings: { en: title },
          contents: { en: message },
          url: `${process.env.NEXT_PUBLIC_APP_URL}/community/c/${communitySlug}`
        })
      })
    }
  } catch (err) {
    console.error('Notify post error:', err)
  }
}

export async function createBulkNotifications(
  params: Omit<CreateNotificationParams, 'receiver_id'> & { receiver_ids: string[] }
) {
  try {
    const { receiver_ids, sender_id, type, title, message, link, post_id } = params
    
    const notifications = receiver_ids.map(receiver_id => ({
      receiver_id,
      sender_id: sender_id || null,
      type,
      title,
      message,
      link,
      post_id: post_id || null,
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
    const { data: users } = await supabase
      .from('users')
      .select('onesignal_player_id')
      .in('id', userIds)
      .not('onesignal_player_id', 'is', null)

    const playerIds = users?.map(u => u.onesignal_player_id).filter(Boolean) || []

    if (!playerIds.length) return

    await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify({
        app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
        include_player_ids: playerIds,
        headings: { en: title },
        contents: { en: message },
        url: `${process.env.NEXT_PUBLIC_APP_URL}${link}`
      })
    })
  } catch (err) {
    console.error('Push send error:', err)
  }
}

export async function notifyGroupCreated({
  groupId,
  groupSlug,
  groupName,
  groupDescription,
  creatorId,
  creatorName,
  collegeId,
  scope
}: {
  groupId: string
  groupSlug: string
  groupName: string
  groupDescription: string
  creatorId: string
  creatorName: string
  collegeId: string
  scope: string
}) {
  try {
    // Get all users from the same college except the creator
    const { data: collegeUsers } = await supabase
      .from('users')
      .select('id, onesignal_player_id')
      .eq('college_id', collegeId)
      .neq('id', creatorId)
      .eq('role', 'student') // Only notify students
      .not('onesignal_player_id', 'is', null)

    if (!collegeUsers?.length) return

    const title = `New Group: ${groupName}`
    const scopeText = scope === 'private' ? 'Private' : scope === 'college' ? 'College Only' : 'Public'
    const message = `${creatorName} created a ${scopeText.toLowerCase()} group. Join now!`
    const link = `/groups/${groupSlug}`

    // Create in-app notifications
    const notifications = collegeUsers.map(user => ({
      type: 'group_created' as const,
      title,
      message,
      receiver_id: user.id,
      sender_id: creatorId,
      link,
      is_read: false,
      created_at: new Date().toISOString()
    }))

    // Bulk insert notifications in chunks
    for (let i = 0; i < notifications.length; i += 50) {
      await supabase
        .from('notifications')
        .insert(notifications.slice(i, i + 50))
    }

    // Send push notifications
    const playerIds = collegeUsers.map(u => u.onesignal_player_id).filter(Boolean)
    
    if (playerIds.length) {
      await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
        },
        body: JSON.stringify({
          app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
          include_player_ids: playerIds,
          headings: { en: title },
          contents: { en: message },
          url: `${process.env.NEXT_PUBLIC_APP_URL}${link}`,
          data: {
            type: 'group_created',
            groupId,
            groupSlug
          }
        })
      })
    }

    console.log(`Group creation notification sent to ${collegeUsers.length} users`)
  } catch (err) {
    console.error('Group creation notification error:', err)
  }
}
