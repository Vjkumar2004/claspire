import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id: jobId } = await params
    const body = await req.json()

    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('posted_by')
      .eq('id', jobId)
      .single()

    if (fetchError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.posted_by !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to edit this job' }, { status: 403 })
    }

    const updateData: any = {}
    if (body.company_name !== undefined) updateData.company_name = body.company_name
    if (body.role !== undefined) updateData.role = body.role
    if (body.location !== undefined) updateData.location = body.location
    if (body.job_type !== undefined) updateData.job_type = body.job_type
    if (body.salary_range !== undefined) updateData.salary_range = body.salary_range
    if (body.description !== undefined) updateData.description = body.description
    if (body.referral_available !== undefined) updateData.referral_available = body.referral_available
    if (body.is_active !== undefined) updateData.is_active = body.is_active
    if (body.deadline !== undefined) updateData.deadline = body.deadline
    updateData.updated_at = new Date().toISOString()

    const { error: updateError } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', jobId)

    if (updateError) {
      console.error('Job update error:', updateError)
      return NextResponse.json({ error: 'Failed to update job' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Job updated successfully' })
  } catch (err: any) {
    console.error('Edit job error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id: jobId } = await params

    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('posted_by')
      .eq('id', jobId)
      .single()

    if (fetchError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.posted_by !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to delete this job' }, { status: 403 })
    }

    const { error: deleteError } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId)

    if (deleteError) {
      console.error('Job delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Job deleted successfully' })
  } catch (err: any) {
    console.error('Delete job error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
