import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )

    console.log('=== TESTING GROUPS TABLE ===')
    
    // Test 1: Check if table exists and get count
    const { count, error: countError } = await supabase
      .from('student_groups')
      .select('*', { count: 'exact', head: true })
    
    console.log('Total groups count:', count)
    console.log('Count error:', countError)
    
    // Test 2: Get recent groups
    const { data: recentGroups, error: recentError } = await supabase
      .from('student_groups')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    console.log('Recent groups:', recentGroups)
    console.log('Recent error:', recentError)
    
    // Test 3: Get only active groups
    const { data: activeGroups, error: activeError } = await supabase
      .from('student_groups')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5)
    
    console.log('Active groups:', activeGroups)
    console.log('Active error:', activeError)
    
    // Test 4: Check specific creator and college
    if (activeGroups && activeGroups.length > 0) {
      const firstGroup = activeGroups[0]
      console.log('First group details:', {
        id: firstGroup.id,
        name: firstGroup.name,
        created_by: firstGroup.created_by,
        college_id: firstGroup.college_id
      })
      
      // Check if creator exists
      const { data: creator, error: creatorError } = await supabase
        .from('users')
        .select('*')
        .eq('id', firstGroup.created_by)
        .single()
      
      console.log('Creator data:', creator)
      console.log('Creator error:', creatorError)
      
      // Check if college exists
      const { data: college, error: collegeError } = await supabase
        .from('colleges')
        .select('*')
        .eq('id', firstGroup.college_id)
        .single()
      
      console.log('College data:', college)
      console.log('College error:', collegeError)
      
      // List all colleges to see what's available
      const { data: allColleges, error: allCollegesError } = await supabase
        .from('colleges')
        .select('id, name')
        .limit(10)
      
      console.log('All colleges:', allColleges)
      console.log('All colleges error:', allCollegesError)
    }
    
    return NextResponse.json({
      success: true,
      data: {
        totalCount: count,
        recentGroups: recentGroups || [],
        activeGroups: activeGroups || [],
        errors: {
          count: countError?.message,
          recent: recentError?.message,
          active: activeError?.message
        }
      }
    })

  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 })
  }
}

