import imageCompression from 'browser-image-compression'

export interface CompressionOptions {
  maxSizeMB: number
  maxWidthOrHeight?: number
  useWebWorker?: boolean
  initialQuality?: number
}

export interface CompressionResult {
  compressedFile: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
}

/**
 * Compresses an image file to meet size requirements
 * 
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise with compressed file and metadata
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {
    maxSizeMB: 2,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    initialQuality: 0.8
  }
): Promise<CompressionResult> {
  const originalSize = file.size
  
  // Check if file is already under the size limit
  if (originalSize <= options.maxSizeMB * 1024 * 1024) {
    return {
      compressedFile: file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1
    }
  }

  try {
    const compressedFile = await imageCompression(file, {
      maxSizeMB: options.maxSizeMB,
      maxWidthOrHeight: options.maxWidthOrHeight,
      useWebWorker: options.useWebWorker,
      initialQuality: options.initialQuality || 0.8,
      fileType: file.type
    })

    const compressedSize = compressedFile.size
    const compressionRatio = originalSize / compressedSize

    return {
      compressedFile,
      originalSize,
      compressedSize,
      compressionRatio
    }
  } catch (error) {
    throw new Error(`Image compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Formats file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Checks if a file needs compression based on size limit
 */
export function needsCompression(file: File, maxSizeMB: number = 2): boolean {
  return file.size > maxSizeMB * 1024 * 1024
}
