import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { answer_id } = await req.json()

    if (!answer_id) {
      return NextResponse.json({ error: 'Answer ID required' }, { status: 400 })
    }

    // Check if the answer exists and if the user is the author
    const { data: answer, error: fetchError } = await supabase
      .from('answers')
      .select('id, author_id, post_id, parent_answer_id')
      .eq('id', answer_id)
      .single()

    if (fetchError || !answer) {
      return NextResponse.json({ error: 'Answer not found' }, { status: 404 })
    }

    if (answer.author_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to delete this answer' }, { status: 403 })
    }

    // Delete the answer (also delete its children if it has any, usually handled by cascade or explicitly)
    const { error: deleteError } = await supabase
      .from('answers')
      .delete()
      .eq('id', answer_id)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete answer' }, { status: 500 })
    }

    // If it's a top level answer, decrement the answer count on the post
    if (!answer.parent_answer_id) {
      const { data: post } = await supabase
        .from('posts')
        .select('answer_count')
        .eq('id', answer.post_id)
        .single()

      if (post && post.answer_count > 0) {
        await supabase
          .from('posts')
          .update({
            answer_count: post.answer_count - 1,
            is_answered: post.answer_count - 1 > 0
          })
          .eq('id', answer.post_id)
      }
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('Answer delete API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
