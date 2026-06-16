'use client'
import { useState, useRef } from 'react'
import ImageViewer from './ImageViewer'

interface MediaGalleryProps {
  imageUrls: string | null
}

export default function MediaGallery({ imageUrls }: MediaGalleryProps) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const closeCooldownRef = useRef(false)

  if (!imageUrls) return null

  let urls: string[] = []
  try {
    urls = imageUrls.startsWith('[') ? JSON.parse(imageUrls) : [imageUrls]
  } catch {
    urls = [imageUrls]
  }

  if (urls.length === 0) return null

  const openViewer = (index: number) => {
    // Prevent reopening during the close cooldown (mobile ghost-click protection)
    if (closeCooldownRef.current) return
    setViewerIndex(index)
    setViewerOpen(true)
  }

  const closeViewer = () => {
    setViewerOpen(false)
    // Set a brief cooldown to prevent ghost-click from reopening the viewer
    closeCooldownRef.current = true
    setTimeout(() => {
      closeCooldownRef.current = false
    }, 400)
  }

  const remaining = urls.length > 5 ? urls.length - 5 : 0

  const renderGallery = () => {
    switch (urls.length) {
      case 1:
        return (
          <div
            onClick={() => openViewer(0)}
            className="relative overflow-hidden rounded-none cursor-pointer flex justify-center bg-slate-50 dark:bg-[#1D2226]"
          >
            <img
              src={urls[0]}
              alt="Post media"
              loading="lazy"
              className="w-full h-auto max-h-[700px] object-contain rounded-none"
            />
          </div>
        )
      case 2:
        return (
          <div className="grid grid-cols-2 gap-1.5">
            {urls.slice(0, 2).map((url, i) => (
              <div
                key={i}
                onClick={() => openViewer(i)}
                className="relative overflow-hidden rounded-none cursor-pointer aspect-[4/3]"
              >
                <img
                  src={url}
                  alt={`Post media ${i + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover rounded-none"
                />
              </div>
            ))}
          </div>
        )
      case 3:
        return (
          <div className="flex gap-1.5 rounded-none overflow-hidden">
            <div
              onClick={() => openViewer(0)}
              className="w-[65%] aspect-[4/3] relative overflow-hidden cursor-pointer rounded-none"
            >
              <img
                src={urls[0]}
                alt="Post media 1"
                loading="lazy"
                className="w-full h-full object-cover rounded-none"
              />
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              {urls.slice(1, 3).map((url, i) => (
                <div
                  key={i}
                  onClick={() => openViewer(i + 1)}
                  className="flex-1 relative overflow-hidden cursor-pointer rounded-none"
                >
                  <img
                    src={url}
                    alt={`Post media ${i + 2}`}
                    loading="lazy"
                    className="w-full h-full object-cover rounded-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )
      case 4:
        return (
          <div className="grid grid-cols-2 gap-1.5">
            {urls.slice(0, 4).map((url, i) => (
              <div
                key={i}
                onClick={() => openViewer(i)}
                className="relative overflow-hidden rounded-none cursor-pointer aspect-[4/3]"
              >
                <img
                  src={url}
                  alt={`Post media ${i + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover rounded-none"
                />
              </div>
            ))}
          </div>
        )
      default: {
        const displayUrls = urls.slice(0, 5)
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
            {displayUrls.map((url, i) => {
              const isLastOverlay = i === displayUrls.length - 1 && remaining > 0
              return (
                <div
                  key={i}
                  onClick={() => openViewer(i)}
                  className="relative overflow-hidden rounded-none cursor-pointer aspect-[4/3]"
                >
                  <img
                    src={url}
                    alt={`Post media ${i + 1}`}
                    loading="lazy"
                    className={`w-full h-full object-cover rounded-none ${isLastOverlay ? 'opacity-80' : ''}`}
                  />
                  {isLastOverlay && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-none">
                      <span className="text-white text-base md:text-lg font-bold">+{remaining} more</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      }
    }
  }

  return (
    <>
      <div>{renderGallery()}</div>
      {viewerOpen && (
        <ImageViewer
          images={urls}
          initialIndex={viewerIndex}
          onClose={closeViewer}
        />
      )}
    </>
  )
}
