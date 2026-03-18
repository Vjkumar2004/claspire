import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { r2Client, R2_BUCKET, getR2Url } from '@/lib/r2'
import { createClient } from '@supabase/supabase-js'
import { validateImageFile, generateSafeFilename, sanitizeImageMetadata } from '@/lib/file-validation'

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

    console.log('Upload request:', {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      type,
      userId
    })

    // SECURE VALIDATION - Multiple layers of protection
    const validation = await validateImageFile(file)
    if (!validation.isValid) {
      console.warn('Security: Invalid file upload blocked:', {
        fileName: file.name,
        error: validation.error,
        userId,
        ip: req.headers.get('x-forwarded-for') || 'unknown'
      })
      return NextResponse.json(
        { error: validation.error || 'Invalid file' },
        { status: 400 }
      )
    }

    console.log('File validation passed:', {
      detectedType: validation.detectedType,
      fileName: file.name
    })

    // Sanitize image metadata to remove potentially dangerous EXIF data
    let sanitizedBuffer: Buffer
    try {
      sanitizedBuffer = await sanitizeImageMetadata(file)
      console.log('Image metadata sanitized successfully')
    } catch (error) {
      console.error('Failed to sanitize image metadata:', error)
      return NextResponse.json(
        { error: 'Failed to process image metadata' },
        { status: 400 }
      )
    }

    // Generate secure filename
    let key: string
    try {
      key = generateSafeFilename(file.name, userId, type || 'misc')
      console.log('Generated secure filename:', key)
    } catch (error) {
      console.error('Failed to generate secure filename:', error)
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      )
    }

    // Upload to R2 with sanitized buffer
    try {
      await r2Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
          Body: sanitizedBuffer,
          ContentType: file.type,
          CacheControl: 'public, max-age=31536000',
          Metadata: {
            'original-name': file.name,
            'user-id': userId,
            'validated-type': validation.detectedType || 'unknown'
          }
        })
      )
      console.log('File uploaded successfully to R2:', key)
    } catch (uploadError) {
      console.error('R2 upload failed:', uploadError)
      return NextResponse.json(
        { error: 'Upload failed: Could not store file' },
        { status: 500 }
      )
    }

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
            console.log('Old avatar deleted:', oldKey)
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

      if (dbError) {
        console.error('DB update failed:', dbError)
        throw dbError
      }

      // Update cookie
      const updatedSession = {
        ...session,
        avatar_url: publicUrl
      }

      const response = NextResponse.json({
        success: true,
        url: publicUrl,
        message: 'Avatar uploaded successfully'
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
      
      console.log('Avatar upload completed successfully')
      return response
    }

    console.log('File upload completed successfully:', publicUrl)
    return NextResponse.json({
      success: true,
      url: publicUrl,
      key,
      message: 'File uploaded successfully'
    })

  } catch (err: any) {
    console.error('Upload error:', {
      error: err.message,
      stack: err.stack,
      userId: req.cookies.get('claspire_session') ? JSON.parse(req.cookies.get('claspire_session')!.value).id : 'unknown'
    })
    return NextResponse.json(
      { error: 'Upload failed: ' + err.message },
      { status: 500 }
    )
  }
}
