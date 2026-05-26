'use client'
import React from 'react'

export default function SearchSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((index) => (
        <div 
          key={index}
          className="bg-white border border-gray-200 rounded-md p-4 sm:p-5 flex flex-col sm:flex-row gap-4 justify-between items-start animate-pulse"
        >
          <div className="flex gap-4 items-start min-w-0 flex-1 w-full">
            {/* Logo placeholder */}
            <div className="w-12 h-12 bg-gray-200 rounded-md flex-shrink-0" />
            
            {/* Text lines */}
            <div className="flex-1 space-y-2.5 min-w-0">
              <div className="flex items-center gap-2">
                <div className="h-4 bg-gray-200 rounded w-16" />
                <div className="h-4 bg-gray-200 rounded w-12" />
              </div>
              <div className="h-5 bg-gray-200 rounded w-3/4 sm:w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="space-y-1.5 pt-2">
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-5/6" />
              </div>
            </div>
          </div>
          
          {/* Button placeholder */}
          <div className="w-full sm:w-24 h-8 bg-gray-200 rounded-md mt-3 sm:mt-0" />
        </div>
      ))}
    </div>
  )
}
