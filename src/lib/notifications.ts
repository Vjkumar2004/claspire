import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

const ONESIGNAL_API = 'https://onesignal.com/api/v1/notifications'

async function sendOneSignalPush(body: Record<string, any>, label: string) {
  try {
    const res = await fetch(ONESIGNAL_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify(body)
    })

    const result = await res.json()

    if (!res.ok || result.errors) {
      console.error(`[OneSignal] API error [${label}]:`, {
        status: res.status,
        errors: result.errors,
        recipientCount: body.include_player_ids?.length || body.include_external_user_ids?.length || 0
      })
      return
    }

    console.log(`[OneSignal] Push sent [${label}]:`, {
      id: result.id,
      recipients: result.recipients,
      success: result.successful,
      failed: result.failed,
      converted: result.converted
    })
  } catch (err) {
    console.error(`[OneSignal] Fetch error [${label}]:`, err)
  }
}

export type NotificationType = 
  | 'post_answered' 
  | 'post_in_community'
  | 'post_upvoted'
  | 'referral_approved' 
  | 'referral_request'
  | 'new_job'
  | 'group_created'
  | 'group_join_request'
  | 'group_join_accepted'
  | 'group_join_rejected'
  | 'message_request'
  | 'message_request_accepted'
  | 'message_request_rejected'
  | 'welcome'
  | 'password_changed'
  | 'college_claim_approved'
  | 'college_claim_rejected'

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
        user_id: receiver_id,
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
      user_id: m.user_id,
      receiver_id: m.user_id,
      sender_id: authorId,
      post_id: postId,
      link: `/community/c/${communitySlug}`,
      is_read: false,
      created_at: new Date().toISOString()
    }))

    for (let i = 0; i < notifs.length; i += 50) {
      await supabase
        .from('notifications')
        .insert(notifs.slice(i, i + 50))
    }

    const { data: playerIds } = await supabase
      .from('users')
      .select('onesignal_player_id')
      .in('id', members.map(m => m.user_id))
      .not('onesignal_player_id', 'is', null)

    if (playerIds?.length) {
      console.log(`[OneSignal] Sending new post notification to ${playerIds.length} users`)
      await sendOneSignalPush({
        app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
        include_player_ids: playerIds.map(u => u.onesignal_player_id),
        headings: { en: title },
        contents: { en: message },
        url: `${process.env.NEXT_PUBLIC_APP_URL}/community/c/${communitySlug}`
      }, 'notifyNewPost')
    } else {
      console.log('[OneSignal] No player IDs for new post notification (no subscribers)')
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
      user_id: receiver_id,
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

    if (!playerIds.length) {
      console.log(`[OneSignal] No player IDs for users [${userIds.length} target(s)]`, {
        userIds,
        label: 'sendPushToUsers'
      })
      return
    }

    console.log(`[OneSignal] Sending push to ${playerIds.length} device(s) for ${userIds.length} user(s)`)
    await sendOneSignalPush({
      app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
      include_player_ids: playerIds,
      headings: { en: title },
      contents: { en: message },
      url: `${process.env.NEXT_PUBLIC_APP_URL}${link}`
    }, 'sendPushToUsers')
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
    const { data: collegeUsers } = await supabase
      .from('users')
      .select('id, onesignal_player_id')
      .eq('college_id', collegeId)
      .neq('id', creatorId)
      .not('onesignal_player_id', 'is', null)

    if (!collegeUsers?.length) {
      console.log('[OneSignal] No college users with player IDs for group notification')
      return
    }

    const title = `New Group: ${groupName}`
    const scopeText = scope === 'private' ? 'Private' : scope === 'college' ? 'College Only' : 'Public'
    const message = `${creatorName} created a ${scopeText.toLowerCase()} group. Join now!`
    const link = `/groups/${groupSlug}`

    const notifications = collegeUsers.map(user => ({
      type: 'group_created' as const,
      title,
      message,
      user_id: user.id,
      receiver_id: user.id,
      sender_id: creatorId,
      link,
      is_read: false,
      created_at: new Date().toISOString()
    }))

    for (let i = 0; i < notifications.length; i += 50) {
      await supabase
        .from('notifications')
        .insert(notifications.slice(i, i + 50))
    }

    const playerIds = collegeUsers.map(u => u.onesignal_player_id).filter(Boolean)
    
    if (playerIds.length) {
      console.log(`[OneSignal] Sending group notification to ${playerIds.length} user(s)`)
      await sendOneSignalPush({
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
      }, 'notifyGroupCreated')
    }
  } catch (err) {
    console.error('Group creation notification error:', err)
  }
}
