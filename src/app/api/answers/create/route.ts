import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    const { post_id, content } = await req.json()

    if (!post_id || !content?.trim()) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    // Insert answer
    const { data: answer, error: insertError } = await supabase
      .from('answers')
      .insert({
        post_id,
        author_id: userId,
        content: content.trim(),
        created_at: new Date().toISOString()
      })
      .select('*, users(full_name, branch, year)')
      .single()

    if (insertError) {
      console.error('Answer insert error:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Award 5 RP to answerer
    const { data: user } = await supabase
      .from('users')
      .select('rise_points, answer_count')
      .eq('id', userId)
      .single()

    await supabase
      .from('users')
      .update({ 
        rise_points: (user?.rise_points || 0) + 5,
        answer_count: (user?.answer_count || 0) + 1
      })
      .eq('id', userId)

    await supabase
      .from('rise_points_log')
      .insert({
        user_id: userId,
        points: 5,
        reason: 'Answered a question 🤝',
        created_at: new Date().toISOString()
      })

    // Update post: increment answer_count and set is_answered
    const { data: postData } = await supabase
      .from('posts')
      .select('answer_count')
      .eq('id', post_id)
      .single()

    await supabase
      .from('posts')
      .update({ 
        answer_count: (postData?.answer_count || 0) + 1,
        is_answered: true 
      })
      .eq('id', post_id)

    return NextResponse.json({
      success: true,
      answer
    })

  } catch (err: any) {
    console.error('Answer API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
