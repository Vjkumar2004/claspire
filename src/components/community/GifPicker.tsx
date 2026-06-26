'use client'

import React, { useState, useEffect, useRef } from 'react'

const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY || ''
const GIPHY_SEARCH_URL = `https://api.giphy.com/v1/gifs/search`
const GIPHY_TRENDING_URL = `https://api.giphy.com/v1/gifs/trending`

interface GifPickerProps {
  onSelect: (url: string) => void
  onClose: () => void
}

export default function GifPicker({ onSelect, onClose }: GifPickerProps) {
  const [query, setQuery] = useState('')
  const [gifs, setGifs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const fetchGifs = async (searchQuery: string) => {
    setLoading(true)
    try {
      let url = `${GIPHY_TRENDING_URL}?api_key=${GIPHY_API_KEY}&limit=20&rating=g`
      if (searchQuery.trim()) {
        url = `${GIPHY_SEARCH_URL}?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(searchQuery)}&limit=20&rating=g`
      }
      const res = await fetch(url)
      const data = await res.json()
      setGifs(data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      fetchGifs(query)
    }, 400) // Debounce by 400ms
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query])

  return (
    <div className="bg-white dark:bg-[#283036] rounded-xl border border-surface dark:border-[#38434F] shadow-xl overflow-hidden flex flex-col w-full sm:w-[320px] h-[350px] sm:h-[400px]">
      <div className="p-3 border-b border-surface dark:border-[#38434F] flex items-center justify-between">
        <input
          type="text"
          placeholder="Search GIFs..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="flex-1 bg-slate-50 dark:bg-[#1D2226] border border-surface dark:border-[#38434F] rounded-full px-3 py-1.5 text-xs outline-none focus:border-[#7C3AED] dark:text-white"
        />
        <button onClick={onClose} className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold px-2">&times;</button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {loading && (
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-full h-24 bg-slate-200 dark:bg-[#38434F] rounded animate-pulse" />
            ))}
          </div>
        )}
        {!loading && gifs.length === 0 && <div className="text-center text-xs p-4 text-slate-500">No GIFs found</div>}
        {!loading && gifs.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {gifs.map(gif => (
              <img
                key={gif.id}
                src={gif.images.fixed_height_small.url}
                alt={gif.title}
                className="w-full h-auto rounded cursor-pointer hover:opacity-80 object-cover bg-slate-100 dark:bg-[#1D2226]"
                onClick={() => onSelect(gif.images.original.url)}
                loading="lazy"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
