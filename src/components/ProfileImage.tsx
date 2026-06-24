'use client'
import Image from 'next/image'
import { useState } from 'react'

interface ProfileImageProps {
  src?: string
  alt: string
  name: string
  width?: number
  height?: number
  className?: string
}

export default function ProfileImage({ 
  src, 
  alt, 
  name, 
  width = 40, 
  height = 40, 
  className = "w-full h-full rounded-full object-cover" 
}: ProfileImageProps) {
  const [imageError, setImageError] = useState(false)

  const isValidUrl = src && src !== '' && src.startsWith('http')

  if (!isValidUrl || imageError) {
    return (
      <span className="text-sm font-bold text-[#F4A01C]">
        {name?.charAt(0)?.toUpperCase() || 'S'}
      </span>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setImageError(true)}
    />
  )
}
