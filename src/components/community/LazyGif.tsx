'use client'

import React, { useState, useRef, useEffect, memo } from 'react'

interface LazyGifProps {
  src: string
  alt?: string
  className?: string
  /** Max display width (CSS value). Defaults to 200px */
  maxWidth?: string
}

/**
 * LazyGif — production-grade GIF renderer for comment feeds.
 *
 * Strategy (identical to Facebook / LinkedIn feed GIFs):
 *  1. A stable skeleton placeholder holds the layout — no content jumping.
 *  2. IntersectionObserver watches the container (rootMargin: 200px).
 *  3. The <img> tag is only inserted into the DOM once the element is
 *     ≈200px from entering the viewport — GIFs off-screen are never fetched.
 *  4. Once the image finishes decoding, it fades in over 300ms.
 *
 * loading="lazy" + decoding="async" are also set as a secondary safety net
 * for browsers that do not support IntersectionObserver.
 */
function LazyGif({
  src,
  alt = 'GIF',
  className = '',
  maxWidth = '200px',
}: LazyGifProps) {
  const [nearViewport, setNearViewport] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Trigger once when the wrapper enters the 200px proximity zone
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return

    // Fallback: IntersectionObserver not supported (very old browsers)
    if (typeof IntersectionObserver === 'undefined') {
      setNearViewport(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNearViewport(true)
          observer.disconnect() // observe only once
        }
      },
      {
        rootMargin: '200px 0px', // begin loading 200px before entering viewport
        threshold: 0,
      }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={wrapperRef}
      className="relative mt-1.5 rounded-lg overflow-hidden"
      style={{ maxWidth, width: '100%' }}
    >
      {/* Skeleton — always rendered until image finishes loading.
          Fixed height prevents layout shift (CLS) during and after load. */}
      {!loaded && (
        <div
          aria-hidden="true"
          className="w-full rounded-lg bg-slate-200 dark:bg-[#38434F] animate-pulse"
          style={{ height: '112px' }}
        />
      )}

      {/* Image — only inserted into DOM once near viewport.
          Placed absolutely while loading so it doesn't push skeleton down.
          Becomes block-level and drives height after loaded. */}
      {nearViewport && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={`
            rounded-lg object-cover w-full
            transition-opacity duration-300 ease-in-out
            ${loaded ? 'opacity-100 relative' : 'opacity-0 absolute inset-0 w-full h-full'}
            ${className}
          `}
        />
      )}
    </div>
  )
}

export default memo(LazyGif)
