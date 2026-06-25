import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { r2Client, R2_BUCKET, getR2Url } from '@/lib/r2'
import { generateSafeFilename } from '@/lib/file-validation'
import { getAuthenticatedUser } from '@/lib/session'
import { applyRateLimit, getUserIdentifier } from '@/lib/rateLimitRedis'

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Use signed session verification instead of direct cookie parsing
    // Direct JSON.parse(cookie.value) is unsafe because cookies can be modified
    // via DevTools or proxy tools, allowing session hijacking and privilege escalation
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Rate limiting: 5 uploads per hour per user
    const userIdentifier = await getUserIdentifier(req)
    const rateLimitResult = await applyRateLimit(req, 'uploadResume', userIdentifier)
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response
    }

    const userId = user.id
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 5MB.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Validate PDF magic bytes: %PDF- (0x25 0x50 0x44 0x46 0x2D)
    if (buffer.length < 5 || buffer[0] !== 0x25 || buffer[1] !== 0x50 || buffer[2] !== 0x44 || buffer[3] !== 0x46 || buffer[4] !== 0x2D) {
      return NextResponse.json({ error: 'Invalid file format. Not a valid PDF.' }, { status: 400 })
    }

    const key = generateSafeFilename(file.name, userId, 'resume')

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: 'application/pdf',
      })
    )

    const url = getR2Url(key)
    return NextResponse.json({ success: true, url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
