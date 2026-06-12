import { supabase, supabaseAnonClient } from './supabase'

// 1. Send OTP to email
export async function sendOTP(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({ 
    email,
    options: {
      shouldCreateUser: false, // Don't create user yet, wait for profile creation
    }
  })
  
  return { data, error }
}

// 2. Verify OTP
export async function verifyOTP(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({ 
    email, 
    token, 
    type: 'email' 
  })
  
  return { data, error }
}

// 3. Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// 4. Get current user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// 5. Create user profile
export async function createUserProfile(data: {
  full_name: string,
  email: string,
  role: 'student' | 'senior',
  college_id: string,
  branch?: string,
  year?: number,
  passout_year?: number,
  company?: string,
  designation?: string,
  graduation_year?: number,
}) {
  try {
    // Generate unique ID
    const currentYear = new Date().getFullYear()
    const randomDigits = Math.floor(10000 + Math.random() * 90000)
    const prefix = data.role === 'senior' ? 'CLS-S' : 'CLS'
    const unique_id = `${prefix}-${currentYear}-${randomDigits}`

    // Get avatar initials
    const initials = data.full_name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

    // Insert user profile
    const { data: profile, error } = await supabase
      .from('users')
      .insert({
        id: (await getCurrentUser()).user?.id, // Get from auth session
        full_name: data.full_name,
        email: data.email,
        role: data.role,
        college_id: data.college_id,
        unique_id: unique_id,
        branch: data.branch,
        year: data.year,
        passout_year: data.passout_year,
        company: data.company,
        designation: data.designation,
        graduation_year: data.graduation_year,
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${initials}`,
        verification_status: 'pending',
        rise_points: data.role === 'senior' ? 100 : 0, // Seniors start with some RP
        rp_level: data.role === 'senior' ? 2 : 1,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating user profile:', error)
      return { profile: null, error }
    }

    // Add to community members
    if (data.college_id) {
      const { error: memberError } = await supabase
        .from('community_members')
        .insert({
          community_id: data.college_id,
          user_id: profile.id,
          membership_type: 'joined',
          is_verified: false,
          role: data.role === 'senior' ? 'senior' : 'member'
        })

      if (memberError) {
        console.error('Error adding to community:', memberError)
      }
    }

    return { profile, error: null }

  } catch (error) {
    console.error('Error in createUserProfile:', error)
    return { profile: null, error }
  }
}

// Helper: Get user profile with college info
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      colleges (
        id,
        name,
        short_name,
        slug
      )
    `)
    .eq('id', userId)
    .single()

  return { profile: data, error }
}

// Helper: Update user profile
export async function updateUserProfile(userId: string, updates: any) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  return { profile: data, error }
}

// Helper: Check if email exists
export async function checkEmailExists(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('email')
    .eq('email', email)
    .single()

  return { exists: !!data, error }
}
