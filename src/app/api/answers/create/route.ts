import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createNotification } from '@/lib/notifications'
import { getAuthenticatedUser } from '@/lib/session'
import { applyRateLimit, getUserIdentifier } from '@/lib/rateLimitRedis'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Use signed session verification instead of direct cookie parsing
    // Direct JSON.parse(cookie.value) is unsafe because cookies can be modified
    // via DevTools or proxy tools, allowing session hijacking and privilege escalation
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Rate limiting: 20 comments per minute per user
    const userIdentifier = await getUserIdentifier(req)
    const rateLimitResult = await applyRateLimit(req, 'createComment', userIdentifier)
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response
    }

    const userId = user.id

    const { post_id, content, is_senior_answer, parent_answer_id, gif_url } = await req.json()

    if (!content?.trim() && !gif_url?.trim()) {
      console.log('[DEBUG] 400 Error: Answer or GIF required');
      return NextResponse.json({ error: 'Answer or GIF required' }, { status: 400 })
    }

    let finalGifUrl = null;
    if (gif_url?.trim()) {
      try {
        const url = new URL(gif_url);
        const allowedDomains = ['media.giphy.com', 'i.giphy.com', 'media0.giphy.com', 'media1.giphy.com', 'media2.giphy.com', 'media3.giphy.com', 'media4.giphy.com'];
        if (!allowedDomains.includes(url.hostname)) {
          console.log('[DEBUG] 400 Error: Invalid GIF domain', url.hostname);
          return NextResponse.json({ error: 'Invalid GIF domain' }, { status: 400 })
        }
        finalGifUrl = gif_url.trim();
      } catch (e) {
        console.log('[DEBUG] 400 Error: Invalid GIF URL', gif_url);
        return NextResponse.json({ error: 'Invalid GIF URL' }, { status: 400 })
      }
    }

    // Insert answer
    const insertPayload: any = {
      post_id,
      author_id: userId,
      content: content?.trim() || '',
      gif_url: finalGifUrl,
      is_senior_answer: is_senior_answer || false,
      upvote_count: 0,
      created_at: new Date().toISOString()
    }
    
    if (parent_answer_id) {
      insertPayload.parent_answer_id = parent_answer_id
    }

    console.log('[DEBUG answers/create] Request payload parent_answer_id:', parent_answer_id)
    console.log('[DEBUG answers/create] Initial insert payload:', insertPayload)

    let { data: answer, error } = await supabase
      .from('answers')
      .insert(insertPayload)
      .select('*, users(full_name, branch, year)')
      .single()

    if (error) {
      console.error('Answer insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update post answer_count and set is_answered
    const { data: post } = await supabase
      .from('posts')
      .select('author_id, title, answer_count, communities(slug)')
      .eq('id', post_id)
      .single()

    if (post) {
      if (!parent_answer_id) {
        await supabase
          .from('posts')
          .update({
            answer_count: (post.answer_count || 0) + 1,
            is_answered: true
          })
          .eq('id', post_id)
      }

      // Get answerer name
      const { data: answerer } = await supabase
        .from('users')
        .select('full_name, role')
        .eq('id', userId)
        .single()

      const isSenior = answerer?.role === 'senior'
      const isReply = !!parent_answer_id

      // Determine notification target
      let notifyUserId = post.author_id
      let notifyTitle: string
      let notifyMessage: string

      if (isReply) {
        // For replies, notify the parent answer author
        const { data: parentAnswer } = await supabase
          .from('answers')
          .select('author_id')
          .eq('id', parent_answer_id)
          .single()

        if (parentAnswer) {
          notifyUserId = parentAnswer.author_id
        }
        notifyTitle = isSenior ? '🎓 A Senior replied to your answer!' : '💬 Someone replied to your answer!'
        notifyMessage = `${answerer?.full_name || 'Someone'} replied: "${post.title?.slice(0, 50)}"`
      } else {
        // For top-level answers, notify the post author
        notifyTitle = isSenior ? '🎓 A Senior answered your doubt!' : '💬 Someone answered your post!'
        notifyMessage = `${answerer?.full_name || 'Someone'} answered: "${post.title?.slice(0, 50)}"`
      }

      // Skip notification if answering/replyhing to own content
      if (notifyUserId !== userId) {
        await createNotification({
          type: 'post_answered',
          title: notifyTitle,
          message: notifyMessage,
          receiver_id: notifyUserId,
          sender_id: userId,
          post_id: post_id,
          link: `/community/c/${(post.communities as any)?.slug || 'all'}/p/${post_id}`
        })

        // Push to notify target
        try {
          const { data: targetUser } = await supabase
            .from('users')
            .select('onesignal_player_id')
            .eq('id', notifyUserId)
            .single()

          if (targetUser?.onesignal_player_id) {
            const pushTitle = isSenior
              ? (isReply ? '🎓 Senior replied to your answer!' : '🎓 Senior answered your doubt!')
              : (isReply ? '💬 Someone replied to your answer!' : '💬 Your post got an answer!')
            const pushRes = await fetch('https://onesignal.com/api/v1/notifications', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
              },
              body: JSON.stringify({
                app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
                include_player_ids: [targetUser.onesignal_player_id],
                headings: { en: pushTitle },
                contents: { en: `${answerer?.full_name} ${isReply ? 'replied' : 'answered'}: "${post.title?.slice(0, 50)}"` },
                url: `${process.env.NEXT_PUBLIC_APP_URL}/community/c/${(post.communities as any)?.slug || 'all'}/p/${post_id}`
              })
            })
            const pushResult = await pushRes.json()
            if (!pushRes.ok || pushResult.errors) {
              console.error('[OneSignal] Answer push error:', { status: pushRes.status, errors: pushResult.errors })
            } else {
              console.log('[OneSignal] Answer push sent:', { id: pushResult.id, recipients: pushResult.recipients })
            }
          } else {
            console.log('[OneSignal] Answer push skipped — no player ID for target')
          }
        } catch (pushErr) {
          console.error('[OneSignal] Answer push fetch error:', pushErr)
        }
      }

      // RP for answering
      const { data: user } = await supabase
        .from('users')
        .select('rise_points, answer_count')
        .eq('id', userId)
        .single()

      const rpAmount = (content?.trim()?.length || 0) >= 20 ? 5 : 0

      if (rpAmount > 0) {
        await supabase
          .from('rise_points_log')
          .insert({
            user_id: userId,
            points: rpAmount,
            reason: `Answered a ${isSenior ? 'doubt as Senior' : 'post'}`,
            created_at: new Date().toISOString()
          })
      }

      if (user) {
        if (!parent_answer_id) {
          await supabase
            .from('users')
            .update({
              rise_points: (user?.rise_points || 0) + rpAmount,
              answer_count: (user?.answer_count || 0) + 1
            })
            .eq('id', userId)
        } else {
          await supabase
            .from('users')
            .update({
              rise_points: (user?.rise_points || 0) + rpAmount
            })
            .eq('id', userId)
        }
      }
    }

    return NextResponse.json({
      success: true,
      answer
    })

  } catch (err: any) {
    console.error('Answer API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
