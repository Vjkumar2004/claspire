import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createNotification } from '@/lib/notifications'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const cookie = req.cookies.get('claspire_session')
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const session = JSON.parse(cookie.value)
    const userId = session.id

    const { post_id, content, is_senior_answer } = await req.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Answer required' }, { status: 400 })
    }

    // Insert answer
    const { data: answer, error } = await supabase
      .from('answers')
      .insert({
        post_id,
        author_id: userId,
        content: content.trim(),
        is_senior_answer: is_senior_answer || false,
        upvote_count: 0,
        created_at: new Date().toISOString()
      })
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
      await supabase
        .from('posts')
        .update({
          answer_count: (post.answer_count || 0) + 1,
          is_answered: true
        })
        .eq('id', post_id)

      // Get answerer name
      const { data: answerer } = await supabase
        .from('users')
        .select('full_name, role')
        .eq('id', userId)
        .single()

      const isSenior = answerer?.role === 'senior'

      // Notify post author
      await createNotification({
        type: 'post_answered',
        title: isSenior ? '🎓 A Senior answered your doubt!' : '💬 Someone answered your post!',
        message: `${answerer?.full_name || 'Someone'} answered: "${post.title?.slice(0, 50)}"`,
        receiver_id: post.author_id,
        sender_id: userId,
        post_id: post_id,
        link: `/community/c/${(post.communities as any)?.slug || 'all'}/p/${post_id}`
      })

      // Push to post author
      const { data: postAuthor } = await supabase
        .from('users')
        .select('onesignal_player_id')
        .eq('id', post.author_id)
        .single()

      if (postAuthor?.onesignal_player_id) {
        await fetch('https://onesignal.com/api/v1/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
          },
          body: JSON.stringify({
            app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
            include_player_ids: [postAuthor.onesignal_player_id],
            headings: { en: isSenior ? '🎓 Senior answered your doubt!' : '💬 Your post got an answer!' },
            contents: { en: `${answerer?.full_name} answered: "${post.title?.slice(0, 50)}"` },
            url: `${process.env.NEXT_PUBLIC_APP_URL}/community/c/${(post.communities as any)?.slug || 'all'}/p/${post_id}`
          })
        })
      }

      // RP for answering
      const { data: user } = await supabase
        .from('users')
        .select('rise_points, answer_count')
        .eq('id', userId)
        .single()

      const rpAmount = isSenior ? 10 : 5

      await supabase
        .from('rise_points_log')
        .insert({
          user_id: userId,
          points: rpAmount,
          reason: `Answered a ${isSenior ? 'doubt as Senior' : 'post'}`,
          created_at: new Date().toISOString()
        })

      await supabase
        .from('users')
        .update({
          rise_points: (user?.rise_points || 0) + rpAmount,
          answer_count: (user?.answer_count || 0) + 1
        })
        .eq('id', userId)
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
