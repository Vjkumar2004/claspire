import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { r2Client, R2_BUCKET, getR2Url } from '@/lib/r2'
import { createClient } from '@supabase/supabase-js'
import { validateImageFile, generateSafeFilename, sanitizeImageMetadata } from '@/lib/file-validation'
import { getAuthenticatedUser } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(req: NextRequest) {
  let userId: string | undefined
  try {
    // SECURITY: Use signed session verification instead of direct cookie parsing
    // Direct JSON.parse(cookie.value) is unsafe because cookies can be modified
    // via DevTools or proxy tools, allowing session hijacking and privilege escalation
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    userId = user.id

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

    // Generate secure filename using detectedType as primary source
    let key: string
    try {
      key = generateSafeFilename(file.name, userId!, type || 'misc', validation.detectedType, file.type)
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
            'user-id': userId!,
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
    if (type === 'avatar' || type === 'banner') {
      const columnToUpdate = type === 'avatar' ? 'avatar_url' : 'banner_url'
      
      // Delete old file from R2 if it exists
      const { data: user } = await supabase
        .from('users')
        .select('avatar_url, banner_url')
        .eq('id', userId)
        .single()

      const oldUrl = columnToUpdate === 'avatar_url' ? (user as any)?.avatar_url : (user as any)?.banner_url
      if (oldUrl?.includes('.r2.dev')) {
        const oldKey = oldUrl.split('.r2.dev/')[1]
        if (oldKey) {
          try {
            await r2Client.send(
              new DeleteObjectCommand({
                Bucket: R2_BUCKET,
                Key: oldKey
              })
            )
            console.log(`Old ${type} deleted:`, oldKey)
          } catch (e) {
            console.warn(`Failed to delete old ${type}:`, e)
          }
        }
      }

      // Update DB
      const { error: dbError } = await supabase
        .from('users')
        .update({ [columnToUpdate]: publicUrl })
        .eq('id', userId)

      if (dbError) {
        console.error('DB update failed:', dbError)
        throw dbError
      }

      // SECURITY: No longer update session cookie with user data
      // Cookie now only contains signed userId, version, and timestamp
      // User data is always fetched fresh from database
      const response = NextResponse.json({
        success: true,
        url: publicUrl,
        message: `${type === 'avatar' ? 'Avatar' : 'Banner'} uploaded successfully`
      })
      
      console.log(`${type === 'avatar' ? 'Avatar' : 'Banner'} upload completed successfully`)
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
      userId: userId || 'unknown'
    })
    return NextResponse.json(
      { error: 'Upload failed: ' + err.message },
      { status: 500 }
    )
  }
}
