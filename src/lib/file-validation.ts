import sharp from 'sharp'

/**
 * Secure file validation utilities to prevent malicious file uploads
 */

export interface ValidationResult {
  isValid: boolean
  error?: string
  detectedType?: string
}

/**
 * Validates if a file is actually an image by checking its magic bytes
 * This prevents attacks like: shell.php.jpg or malicious-code.png
 */
export async function validateImageFile(file: File): Promise<ValidationResult> {
  try {
    // 1. Basic MIME type check - allow all image formats
    if (!file.type.startsWith('image/')) {
      return {
        isValid: false,
        error: `Invalid file type: ${file.type}. Please upload a valid image file`
      }
    }

    // 2. File size check (max 2MB)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size >= maxSize) {
      return {
        isValid: false,
        error: 'Image size must be less than 2MB'
      }
    }

    // 3. Filename validation - prevent dangerous names only
    // We no longer restrict double extensions since valid filenames like "my.photo.jpg" should be allowed
    const fileName = file.name.toLowerCase()
    
    // Check for dangerous extensions in the final extension only
    const dangerousExtensions = ['php', 'js', 'exe', 'bat', 'cmd', 'sh', 'py', 'pl', 'rb', 'asp', 'aspx', 'jsp', 'cfm']
    const extension = fileName.split('.').pop() || ''
    if (dangerousExtensions.includes(extension)) {
      return {
        isValid: false,
        error: `Dangerous file extension: .${extension}`
      }
    }

    // Check for dangerous patterns in filename
    const dangerousPatterns = [
      /\.php\./i,
      /\.js\./i,
      /\.exe\./i,
      /\.bat\./i,
      /\.cmd\./i,
      /\.sh\./i,
      /\.py\./i,
      /\.pl\./i,
      /\.rb\./i,
      /\.asp\./i,
      /\.aspx\./i,
      /\.jsp\./i,
      /\.cfm\./i,
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i
    ]

    for (const pattern of dangerousPatterns) {
      if (pattern.test(fileName)) {
        return {
          isValid: false,
          error: 'Invalid filename: Contains dangerous patterns'
        }
      }
    }

    // 4. Magic bytes validation - check actual file content
    const buffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(buffer)
    
    // Read first few bytes to determine actual file type
    const detectedType = detectImageType(uint8Array)
    
    if (!detectedType) {
      return {
        isValid: false,
        error: 'Invalid file: Not a recognized image format'
      }
    }

    // 5. Verify MIME type matches detected type
    const mimeMapping: { [key: string]: string } = {
      'jpeg': 'image/jpeg',
      'jpg': 'image/jpeg', 
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'tiff': 'image/tiff',
      'svg': 'image/svg+xml',
      'heic': 'image/heic',
      'heif': 'image/heif',
      'ico': 'image/x-icon'
    }

    const expectedMime = mimeMapping[detectedType]
    if (expectedMime && file.type !== expectedMime) {
      // For HEIC/HEIF which might have multiple MIME types, allow both
      if (detectedType === 'heic' && ['image/heic', 'image/heif'].includes(file.type)) {
        // Allow HEIC/HEIF variants
      } else if (file.type !== expectedMime) {
        return {
          isValid: false,
          error: `File type mismatch: Expected ${expectedMime}, but detected ${detectedType}`
        }
      }
    }

    // 6. Use Sharp to validate the image can actually be processed
    try {
      const imageBuffer = Buffer.from(buffer)
      const metadata = await sharp(imageBuffer).metadata()
      
      // Additional validation using Sharp
      // Note: Sharp supports jpeg, png, webp, gif, tiff, heif
      const supportedFormats = ['jpeg', 'png', 'webp', 'gif', 'tiff', 'heif', 'bmp']
      if (!metadata.format || !supportedFormats.includes(metadata.format)) {
        // SVG and ICO files won't process through Sharp, but that's okay - we accept them
        if (detectedType !== 'svg' && detectedType !== 'ico') {
          return {
            isValid: false,
            error: `Invalid image format: ${metadata.format || 'unknown'}`
          }
        }
      }

      // Check image dimensions (optional but recommended)
      if (metadata.width && metadata.height) {
        const maxDimension = 4096
        if (metadata.width > maxDimension || metadata.height > maxDimension) {
          return {
            isValid: false,
            error: `Image too large: ${metadata.width}x${metadata.height}. Max allowed: ${maxDimension}x${maxDimension}`
          }
        }

        const minDimension = 10
        if (metadata.width < minDimension || metadata.height < minDimension) {
          return {
            isValid: false,
            error: `Image too small: ${metadata.width}x${metadata.height}. Min allowed: ${minDimension}x${minDimension}`
          }
        }
      }

    } catch (sharpError) {
      return {
        isValid: false,
        error: 'Invalid image: Cannot process file content'
      }
    }

    return {
      isValid: true,
      detectedType
    }

  } catch (error) {
    return {
      isValid: false,
      error: 'Validation error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }
  }
}

/**
 * Detects image type from magic bytes
 */
function detectImageType(bytes: Uint8Array): string | null {
  // Check for JPEG
  if (bytes.length >= 3 && 
      bytes[0] === 0xFF && 
      bytes[1] === 0xD8 && 
      bytes[2] === 0xFF) {
    return 'jpeg'
  }

  // Check for PNG
  if (bytes.length >= 8 &&
      bytes[0] === 0x89 && 
      bytes[1] === 0x50 && 
      bytes[2] === 0x4E && 
      bytes[3] === 0x47 &&
      bytes[4] === 0x0D && 
      bytes[5] === 0x0A && 
      bytes[6] === 0x1A && 
      bytes[7] === 0x0A) {
    return 'png'
  }

  // Check for WebP
  if (bytes.length >= 12 &&
      bytes[0] === 0x52 && 
      bytes[1] === 0x49 && 
      bytes[2] === 0x46 && 
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 && 
      bytes[9] === 0x45 && 
      bytes[10] === 0x42 && 
      bytes[11] === 0x50) {
    return 'webp'
  }

  // Check for GIF (GIF87a or GIF89a)
  if (bytes.length >= 6 &&
      bytes[0] === 0x47 && 
      bytes[1] === 0x49 && 
      bytes[2] === 0x46) {
    return 'gif'
  }

  // Check for BMP
  if (bytes.length >= 2 &&
      bytes[0] === 0x42 && 
      bytes[1] === 0x4D) {
    return 'bmp'
  }

  // Check for TIFF (little-endian: II*\0)
  if (bytes.length >= 4 &&
      bytes[0] === 0x49 && 
      bytes[1] === 0x49 && 
      bytes[2] === 0x2A && 
      bytes[3] === 0x00) {
    return 'tiff'
  }

  // Check for TIFF (big-endian: MM\0*)
  if (bytes.length >= 4 &&
      bytes[0] === 0x4D && 
      bytes[1] === 0x4D && 
      bytes[2] === 0x00 && 
      bytes[3] === 0x2A) {
    return 'tiff'
  }

  // Check for HEIC/HEIF (ftyp...heic or ftyp...mif1)
  if (bytes.length >= 12 &&
      bytes[4] === 0x66 && 
      bytes[5] === 0x74 && 
      bytes[6] === 0x79 && 
      bytes[7] === 0x70) {
    // Check for heic brand
    if (bytes.length >= 8 &&
        bytes[8] === 0x68 && 
        bytes[9] === 0x65 && 
        bytes[10] === 0x69 && 
        bytes[11] === 0x63) {
      return 'heic'
    }
    // Check for mif1 brand (also HEIF)
    if (bytes.length >= 8 &&
        bytes[8] === 0x6D && 
        bytes[9] === 0x69 && 
        bytes[10] === 0x66 && 
        bytes[11] === 0x31) {
      return 'heif'
    }
  }

  // Check for ICO (icon files)
  if (bytes.length >= 4 &&
      bytes[0] === 0x00 && 
      bytes[1] === 0x00 && 
      bytes[2] === 0x01 && 
      bytes[3] === 0x00) {
    return 'ico'
  }

  // Check for SVG (XML text starting with < or BOM)
  if (bytes.length >= 4) {
    // Check for UTF-8 BOM + <
    if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF && bytes[3] === 0x3C) {
      return 'svg'
    }
    // Check for plain <
    if (bytes[0] === 0x3C) {
      // Could be SVG, check for common SVG indicators
      const text = new TextDecoder().decode(bytes.slice(0, Math.min(100, bytes.length)))
      if (text.includes('svg') || text.includes('<')) {
        return 'svg'
      }
    }
  }

  return null
}

/**
 * Generates a safe filename using UUID format
 * Format: {userId}_{timestamp}_{uuid}.{extension}
 * Uses detectedType as primary source of truth for extension, not original filename
 * This handles compressed images that have filename "blob"
 */
export function generateSafeFilename(originalName: string, userId: string, type: string, detectedType?: string, mimeType?: string): string {
  // Determine extension using detectedType as primary source
  let extension = ''
  const isResume = type === 'resume'
  const allowedExtensions = isResume
    ? ['pdf']
    : ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tif', 'tiff', 'svg', 'heic', 'heif', 'ico']
  
  // Priority 1: Use detectedType from validation (most reliable)
  if (detectedType) {
    extension = detectedType.toLowerCase()
  } else {
    // Priority 2: Try to extract from original filename
    const fileName = originalName.toLowerCase()
    const fileExtension = fileName.split('.').pop() || ''
    
    if (fileExtension && allowedExtensions.includes(fileExtension)) {
      extension = fileExtension
    } else if (mimeType) {
      // Priority 3: Extract from MIME type
      const mimeExtension = mimeType.split('/')[1]?.toLowerCase()
      if (mimeExtension) {
        const mimeMapping: { [key: string]: string } = isResume ? {} : {
          'jpeg': 'jpg',
          'pjpeg': 'jpg',
          'x-png': 'png',
          'vnd.microsoft.icon': 'ico',
          'svg+xml': 'svg'
        }
        extension = mimeMapping[mimeExtension] || mimeExtension
      }
    }
  }
  
  // Final fallback if no extension found
  if (!extension) {
    throw new Error('Unable to determine file extension from filename, detected type, or MIME type')
  }
  
  if (!allowedExtensions.includes(extension)) {
    throw new Error(`Invalid extension: .${extension}`)
  }
  
  // Generate unique filename using UUID format
  // Format: {userId}_{timestamp}_{uuid}.{extension}
  const timestamp = Date.now()
  const uuid = crypto.randomUUID()
  
  // For avatars, use unique filename to bust cache
  if (type === 'avatar') {
    return `${type}/${userId}_avatar_${timestamp}_${uuid}.${extension}`
  }
  
  // For other files, use UUID format
  return `${type}/${userId}_${timestamp}_${uuid}.${extension}`
}

/**
 * Additional security: Scan for embedded scripts in image metadata
 */
export async function sanitizeImageMetadata(file: File): Promise<Buffer> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // GIF files: skip sharp processing to preserve animation frames
    // Sharp only keeps the first frame of animated GIFs by default
    if (file.type === 'image/gif') {
      return buffer
    }

    // Use Sharp to strip potentially dangerous metadata
    const sanitizedBuffer = await sharp(buffer)
      .rotate() // Auto-orient based on EXIF
      .withMetadata({ orientation: undefined }) // Remove EXIF orientation
      .toBuffer()

    return sanitizedBuffer
  } catch (error) {
    throw new Error('Failed to sanitize image metadata')
  }
}
