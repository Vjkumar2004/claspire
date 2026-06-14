export default function CommunityLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0A0E14] font-plus-jakarta-sans antialiased">
      <div className="w-full max-w-[1600px] mx-auto px-0 sm:px-6 lg:px-8 mt-0 sm:mt-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          <aside className="hidden md:block md:col-span-3 space-y-4">
            <div className="bg-white dark:bg-[#283036] rounded-md border border-slate-200 dark:border-[#38434F] p-5 shadow-sm animate-pulse">
              <div className="w-16 h-16 bg-slate-200 dark:bg-[#38434F] rounded-full mx-auto mb-3" />
              <div className="h-4 bg-slate-200 dark:bg-[#38434F] rounded w-24 mx-auto mb-2" />
              <div className="h-3 bg-slate-200 dark:bg-[#38434F] rounded w-32 mx-auto" />
            </div>
            <div className="bg-white dark:bg-[#283036] rounded-md border border-slate-200 dark:border-[#38434F] p-4 shadow-sm animate-pulse space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-3 bg-slate-200 dark:bg-[#38434F] rounded w-full" />
              ))}
            </div>
            <div className="bg-white dark:bg-[#283036] rounded-md border border-slate-200 dark:border-[#38434F] p-4 shadow-sm animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 dark:bg-[#38434F] rounded w-28 mb-3" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-slate-200 dark:bg-[#38434F] rounded-full" />
                  <div className="h-3 bg-slate-200 dark:bg-[#38434F] rounded flex-1" />
                </div>
              ))}
            </div>
          </aside>

          <main className="md:col-span-9 lg:col-span-6 space-y-4">
            <div className="bg-white dark:bg-[#283036] rounded-none sm:rounded-md border-y sm:border border-slate-200 dark:border-[#38434F] p-5 shadow-sm animate-pulse space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-200 dark:bg-[#38434F] rounded-full" />
                <div className="h-10 bg-slate-200 dark:bg-[#38434F] rounded-full flex-1" />
                <div className="w-10 h-10 bg-slate-200 dark:bg-[#38434F] rounded-full" />
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-8 bg-slate-200 dark:bg-[#38434F] rounded-full w-24 flex-shrink-0" />
                ))}
              </div>
            </div>

            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#283036] rounded-md border border-slate-200 dark:border-[#38434F] p-5 shadow-sm animate-pulse space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-slate-200 dark:bg-[#38434F] rounded-full" />
                  <div className="h-3 bg-slate-200 dark:bg-[#38434F] rounded w-32" />
                </div>
                <div className="h-4 bg-slate-200 dark:bg-[#38434F] rounded w-3/4" />
                <div className="h-3 bg-slate-200 dark:bg-[#38434F] rounded w-full" />
                <div className="h-3 bg-slate-200 dark:bg-[#38434F] rounded w-2/3" />
                <div className="flex gap-2 pt-2">
                  <div className="h-8 bg-slate-200 dark:bg-[#38434F] rounded w-16" />
                  <div className="h-8 bg-slate-200 dark:bg-[#38434F] rounded w-20" />
                  <div className="h-8 bg-slate-200 dark:bg-[#38434F] rounded w-16" />
                </div>
              </div>
            ))}
          </main>

          <aside className="hidden lg:block lg:col-span-3 space-y-4">
            <div className="bg-white dark:bg-[#283036] rounded-md border border-slate-200 dark:border-[#38434F] p-4 shadow-sm animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 dark:bg-[#38434F] rounded w-28 mb-3" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2 pb-2 border-b border-slate-100 dark:border-[#38434F] last:border-0">
                  <div className="h-3 bg-slate-200 dark:bg-[#38434F] rounded w-full" />
                  <div className="h-3 bg-slate-200 dark:bg-[#38434F] rounded w-1/2" />
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-[#283036] rounded-md border border-slate-200 dark:border-[#38434F] p-4 shadow-sm animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 dark:bg-[#38434F] rounded w-24 mb-3" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-200 dark:bg-[#38434F] rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-slate-200 dark:bg-[#38434F] rounded w-20" />
                  <div className="h-2 bg-slate-200 dark:bg-[#38434F] rounded w-32" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-200 dark:bg-[#38434F] rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-slate-200 dark:bg-[#38434F] rounded w-24" />
                  <div className="h-2 bg-slate-200 dark:bg-[#38434F] rounded w-28" />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
