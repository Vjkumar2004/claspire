'use client'

import React, { useState, useEffect, useRef, useCallback, memo } from 'react'

// ─── Constants ────────────────────────────────────────────────────────────────
const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY || ''
const GIPHY_SEARCH_URL = 'https://api.giphy.com/v1/gifs/search'
const GIPHY_TRENDING_URL = 'https://api.giphy.com/v1/gifs/trending'
const RESULT_LIMIT = 12                          // matches Instagram / LinkedIn
const TRENDING_CACHE_KEY = 'gif_trending_cache'  // sessionStorage key
const RECENT_GIFS_KEY = 'gif_recent'             // localStorage key
const CACHE_TTL_MS = 5 * 60 * 1000              // 5 minutes
const MAX_RECENT = 10

// ─── sessionStorage cache helpers ─────────────────────────────────────────────
function getTrendingCache(): any[] | null {
  try {
    const raw = sessionStorage.getItem(TRENDING_CACHE_KEY)
    if (!raw) return null
    const { timestamp, data } = JSON.parse(raw)
    if (Date.now() - timestamp > CACHE_TTL_MS) return null
    return data
  } catch {
    return null
  }
}

function setTrendingCache(data: any[]) {
  try {
    sessionStorage.setItem(
      TRENDING_CACHE_KEY,
      JSON.stringify({ timestamp: Date.now(), data })
    )
  } catch { /* quota exceeded – silently skip */ }
}

// ─── localStorage recent-GIF helpers ─────────────────────────────────────────
/** Returns the last MAX_RECENT selected GIFs (slim objects only) */
function getRecentGifs(): any[] {
  try {
    const raw = localStorage.getItem(RECENT_GIFS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/** Prepend gif to recent list, deduplicate, cap at MAX_RECENT */
function persistRecentGif(gif: any) {
  try {
    const current = getRecentGifs()
    const deduped = current.filter((g: any) => g.id !== gif.id)
    const updated = [gif, ...deduped].slice(0, MAX_RECENT)
    localStorage.setItem(RECENT_GIFS_KEY, JSON.stringify(updated))
  } catch { /* silently skip */ }
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface GifPickerProps {
  onSelect: (url: string) => void
  onClose: () => void
}

// ─── GifPicker ────────────────────────────────────────────────────────────────
// All GIF search state lives here — typing never re-renders Feed or parent page.
// Exported with React.memo so stable onSelect/onClose props prevent re-mounts.
function GifPicker({ onSelect, onClose }: GifPickerProps) {
  const [query, setQuery] = useState('')
  const [gifs, setGifs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [recentGifs, setRecentGifs] = useState<any[]>([])

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortCtrl = useRef<AbortController | null>(null)
  // Skip the debounce effect on the very first render (mount effect handles it)
  const isFirstRender = useRef(true)

  // ── Stable fetch function ──────────────────────────────────────────────────
  const fetchGifs = useCallback(async (searchQuery: string) => {
    // Cancel any in-flight request — prevents stale responses overwriting results
    abortCtrl.current?.abort()
    abortCtrl.current = new AbortController()

    setLoading(true)
    try {
      const isSearch = searchQuery.trim().length > 0
      const url = isSearch
        ? `${GIPHY_SEARCH_URL}?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(searchQuery)}&limit=${RESULT_LIMIT}&rating=g`
        : `${GIPHY_TRENDING_URL}?api_key=${GIPHY_API_KEY}&limit=${RESULT_LIMIT}&rating=g`

      const res = await fetch(url, { signal: abortCtrl.current.signal })
      const data = await res.json()
      const results: any[] = data.data || []

      setGifs(results)

      // Cache only trending results (search results are query-specific)
      if (!isSearch) setTrendingCache(results)
    } catch (err: any) {
      // AbortError = superseded by a newer request — not a real error
      if (err?.name !== 'AbortError') {
        console.error('[GifPicker] fetch error:', err)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Mount: load recent + trending (instant from cache or fetch) ───────────
  useEffect(() => {
    setRecentGifs(getRecentGifs())

    const cached = getTrendingCache()
    if (cached) {
      setGifs(cached) // ← instant open, zero network cost
    } else {
      fetchGifs('')   // ← fetch while showing skeleton
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally run once on mount only

  // ── Debounced search (skips initial mount — handled above) ────────────────
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    // 400ms debounce: user types "f u n n y" → only "funny" fires a request
    debounceTimer.current = setTimeout(() => fetchGifs(query), 400)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [query, fetchGifs])

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => () => { abortCtrl.current?.abort() }, [])

  // ── GIF selection ─────────────────────────────────────────────────────────
  const handleSelect = useCallback(
    (gif: any) => {
      // Store fixed_height (≤500 KB) NOT original (5–20 MB) — same as Instagram
      const selectedUrl: string =
        gif.images?.fixed_height?.url ||
        gif.images?.fixed_height_small?.url ||
        gif.images?.preview_gif?.url ||
        ''
      if (!selectedUrl) return

      // Persist only the minimal data needed to render the recent tile
      persistRecentGif({
        id: gif.id,
        title: gif.title || '',
        images: {
          fixed_height:       gif.images?.fixed_height       ? { url: gif.images.fixed_height.url }       : undefined,
          fixed_height_small: gif.images?.fixed_height_small ? { url: gif.images.fixed_height_small.url } : undefined,
          preview_gif:        gif.images?.preview_gif        ? { url: gif.images.preview_gif.url }        : undefined,
        },
      })
      // Refresh the recent panel immediately (optimistic update)
      setRecentGifs(getRecentGifs())

      onSelect(selectedUrl)
    },
    [onSelect]
  )

  const isSearching = query.trim().length > 0
  const showRecent = !isSearching && recentGifs.length > 0

  return (
    <div className="bg-white dark:bg-[#283036] rounded-xl border border-slate-200 dark:border-[#38434F] shadow-xl overflow-hidden flex flex-col w-full sm:w-[320px] h-[370px] sm:h-[430px]">

      {/* ── Search bar ──────────────────────────────────────────────────── */}
      <div className="p-2.5 border-b border-slate-100 dark:border-[#38434F] flex items-center gap-2 flex-shrink-0 bg-slate-50 dark:bg-[#1D2226]">
        <div className="flex-1 relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search GIFs…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-white dark:bg-[#283036] border border-slate-200 dark:border-[#38434F] rounded-full pl-7 pr-7 py-1.5 text-xs outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/20 dark:text-white transition-all"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              aria-label="Clear search"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#38434F] transition-colors flex-shrink-0 text-base font-bold"
          aria-label="Close GIF picker"
        >
          ×
        </button>
      </div>

      {/* ── Scrollable content ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-2 space-y-3">

        {/* Recently used GIFs (shown only when not searching) */}
        {showRecent && (
          <section>
            <p className="text-[9px] font-bold text-slate-400 dark:text-[#B0B7BE] uppercase tracking-widest mb-1.5 px-0.5">
              Recently Used
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {recentGifs.slice(0, 4).map(gif => {
                const previewUrl =
                  gif.images?.fixed_height_small?.url ||
                  gif.images?.preview_gif?.url || ''
                if (!previewUrl) return null
                return (
                  <GifTile key={gif.id} gif={gif} previewUrl={previewUrl} onSelect={handleSelect} />
                )
              })}
            </div>
            <div className="border-b border-slate-100 dark:border-[#38434F] mt-3" />
          </section>
        )}

        {/* Section label */}
        {!loading && gifs.length > 0 && (
          <p className="text-[9px] font-bold text-slate-400 dark:text-[#B0B7BE] uppercase tracking-widest px-0.5 -mb-1">
            {isSearching ? `Results for "${query.slice(0, 20)}${query.length > 20 ? '…' : ''}"` : 'Trending'}
          </p>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-2 gap-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-full h-[88px] bg-slate-200 dark:bg-[#38434F] rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && gifs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-28 gap-2 text-slate-400 dark:text-[#B0B7BE]">
            <span className="text-2xl">{isSearching ? '🔍' : '✨'}</span>
            <span className="text-xs font-semibold">
              {isSearching ? 'No GIFs found' : 'Loading GIFs…'}
            </span>
          </div>
        )}

        {/* GIF grid
            ▸ Previews use fixed_height_small (lightest format, ~20-80 KB)
            ▸ loading="lazy" + decoding="async" → browser handles IntersectionObserver natively
            ▸ onSelect stores fixed_height (NOT original) → ≤500 KB per selected GIF
        */}
        {!loading && gifs.length > 0 && (
          <div className="grid grid-cols-2 gap-1.5">
            {gifs.map(gif => {
              const previewUrl: string =
                gif.images?.fixed_height_small?.url ||
                gif.images?.preview_gif?.url || ''
              if (!previewUrl) return null
              return (
                <GifTile key={gif.id} gif={gif} previewUrl={previewUrl} onSelect={handleSelect} />
              )
            })}
          </div>
        )}
      </div>

      {/* ── GIPHY attribution (required by ToS) ────────────────────────── */}
      <div className="px-3 py-1.5 border-t border-slate-100 dark:border-[#38434F] flex-shrink-0 flex items-center justify-end gap-1 bg-slate-50 dark:bg-[#1D2226]">
        <span className="text-[9px] text-slate-400 dark:text-[#B0B7BE]">Powered by</span>
        <span className="text-[9px] font-black text-[#7C3AED] tracking-tight">GIPHY</span>
      </div>
    </div>
  )
}

// ─── GifTile ─ memoised to prevent full-grid re-renders on state changes ─────
const GifTile = memo(function GifTile({
  gif,
  previewUrl,
  onSelect,
}: {
  gif: any
  previewUrl: string
  onSelect: (gif: any) => void
}) {
  return (
    <button
      type="button"
      className="relative w-full rounded-lg overflow-hidden cursor-pointer hover:opacity-75 active:scale-95 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:ring-offset-1 bg-slate-100 dark:bg-[#1D2226]"
      onClick={() => onSelect(gif)}
      title={gif.title || 'GIF'}
    >
      <img
        src={previewUrl}
        alt={gif.title || 'GIF'}
        loading="lazy"
        decoding="async"
        className="w-full h-auto object-cover"
      />
    </button>
  )
})

export default memo(GifPicker)
