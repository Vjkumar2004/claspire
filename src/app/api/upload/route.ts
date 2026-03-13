import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { r2Client, R2_BUCKET, getR2Url } from '@/lib/r2'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const cookie = req.cookies.get('claspire_session')
    if (!cookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    const session = JSON.parse(cookie.value)
    const userId = session.id

    const formData = await req.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate type
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPG, PNG, WebP allowed' },
        { status: 400 }
      )
    }

    // Max 2MB
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Max file size is 2MB' },
        { status: 400 }
      )
    }

    // Generate unique key
    const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const ext = fileName.split('.').pop()
    const timestamp = Date.now()
    let key = ''

    if (type === 'avatar') {
      key = `avatars/${userId}-${timestamp}.${ext}`
    } else if (type === 'college_logo') {
      key = `colleges/${timestamp}-${userId}.${ext}`
    } else if (type === 'post_image') {
      key = `posts/${userId}-${timestamp}.${ext}`
    } else {
      key = `misc/${userId}-${timestamp}.${ext}`
    }

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to R2
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        CacheControl: 'public, max-age=31536000'
      })
    )

    const publicUrl = getR2Url(key)

    // Avatar → update DB + cookie
    if (type === 'avatar') {
      // Delete old avatar from R2 if it exists
      const { data: user } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('id', userId)
        .single()

      if (user?.avatar_url?.includes('.r2.dev')) {
        const oldKey = user.avatar_url.split('.r2.dev/')[1]
        if (oldKey) {
          try {
            await r2Client.send(
              new DeleteObjectCommand({
                Bucket: R2_BUCKET,
                Key: oldKey
              })
            )
          } catch (e) {
            console.warn('Failed to delete old avatar:', e)
          }
        }
      }

      // Update DB
      const { error: dbError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (dbError) throw dbError

      // Update cookie
      const updatedSession = {
        ...session,
        avatar_url: publicUrl
      }

      const response = NextResponse.json({
        success: true,
        url: publicUrl
      })

      response.cookies.set(
        'claspire_session',
        JSON.stringify(updatedSession),
        {
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30,
          path: '/'
        }
      )
      return response
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      key
    })

  } catch (err: any) {
    console.error('Upload error:', err)
    return NextResponse.json(
      { error: 'Upload failed: ' + err.message },
      { status: 500 }
    )
  }
}
