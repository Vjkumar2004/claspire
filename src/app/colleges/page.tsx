'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';

export default function CollegesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch communities from API
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const res = await fetch('/api/colleges');
        const data = await res.json();
        if (data.success) {
          setCommunities(data.communities);
        }
      } catch (err) {
        console.error('Failed to fetch colleges:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchColleges();
  }, []);

  const filters = ["All", "Private", "Deemed", "Engineering", "Arts"];

  // Filter colleges based on search query and active filter
  const filtered = communities.filter(c =>
    c.colleges?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.colleges?.short_name?.toLowerCase().includes(searchQuery.toLowerCase())
  ).filter(c =>
    activeFilter === "All" ? true : c.colleges?.type === activeFilter
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-14">
      <Navbar />
      
      <div className="page-wrapper max-w-[740px] mx-auto p-8 md:p-12">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="font-instrument-serif font-normal text-[clamp(28px,5vw,32px)] text-black mb-1.5">
            Find your college community
          </h1>
          <p className="text-sm text-gray-400">
            Search and join your college. Connect with verified seniors.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <span 
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none"
          >
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search college name... e.g. AAACET, VVV College, ANJAC"
            className="w-full bg-white border border-gray-200 rounded-xl px-11 py-3.5 text-base text-black font-plus-jakarta-sans outline-none focus:border-purple-600 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.09)] transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-5">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-colors ${
                activeFilter === filter
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Results Header */}
        <div className="flex justify-between items-center mb-3">
          <div>
            {loading ? (
              <div className="text-sm font-bold text-gray-700">Loading communities...</div>
            ) : searchQuery ? (
              <>
                <div className="text-sm font-bold text-gray-700">
                  Results for "{searchQuery}"
                </div>
                <div className="text-xs text-gray-400">
                  {filtered.length} communities found
                </div>
              </>
            ) : (
              <>
                <div className="text-sm font-bold text-gray-700">
                  All Communities
                </div>
                <div className="text-xs text-gray-400">
                  Showing all colleges
                </div>
              </>
            )}
          </div>
        </div>

        {/* College List */}
        <div className="flex flex-col gap-2">
          {loading ? (
            // Skeleton loading state
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4 animate-pulse">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 rounded w-1/4 mb-2" />
                  <div className="h-3 bg-gray-50 rounded w-1/2" />
                </div>
              </div>
            ))
          ) : filtered.length > 0 ? (
            filtered.map((c) => (
              <div 
                key={c.id}
                className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3.5 hover:border-purple-200 transition-colors cursor-pointer md:gap-3.5 md:p-4"
                onClick={() => window.location.href = `/community/c/${c.slug}`}
              >
                {/* Avatar */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: (c.slug === 'aaacet' || c.slug === 'vvvclg' || c.slug === 'vvv' || c.slug === 'anjac' || c.slug === 'sfr') ? '#F8FAFC' : 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                  border: (c.slug === 'aaacet' || c.slug === 'vvvclg' || c.slug === 'vvv' || c.slug === 'anjac' || c.slug === 'sfr') ? '1px solid #F1F5F9' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  padding: (c.slug === 'aaacet' || c.slug === 'vvvclg' || c.slug === 'vvv' || c.slug === 'anjac' || c.slug === 'sfr') ? '6px' : '0',
                  flexShrink: 0,
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: 800
                }}>
                  {c.slug === 'aaacet' ? (
                    <img src="/aaaclg_logo.jpg" alt="AAACET" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }} />
                  ) : (c.slug === 'vvvclg' || c.slug === 'vvv') ? (
                    <img src="/vvvclogo.png" alt="VVV" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }} />
                  ) : c.slug === 'anjac' ? (
                    <img src="/anjac.jpg" alt="ANJAC" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }} />
                  ) : c.slug === 'sfr' ? (
                    <img src="/sfr.jpg" alt="SFR" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }} />
                  ) : (
                    c.colleges?.short_name?.[0] || c.slug?.[0]?.toUpperCase() || 'C'
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {/* Top Row */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-bold text-black">
                      c/{c.slug}
                    </span>
                    <span className="bg-gray-100 rounded px-2 py-0.5 text-[10px] font-bold text-gray-500">
                      {c.colleges?.type || 'College'}
                    </span>
                  </div>

                  {/* College Name */}
                  <div className="text-sm text-gray-500 mb-2 truncate">
                    {c.colleges?.name}
                  </div>

                  {/* Stats Row */}
                  <div className="flex gap-4 flex-wrap text-xs text-gray-400 md:gap-4">
                    <span>👥 {c.member_count?.toLocaleString() || 0} members</span>
                    <span>🎓 {c.senior_count || 0} seniors</span>
                    <span className="hidden sm:inline">💬 {c.doubt_count || 0} doubts</span>
                    <span>📍 {c.colleges?.location}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            /* Empty State */
            <div className="text-center py-16 px-6">
              <div className="text-4xl mb-4">🔍</div>
              <div className="text-lg font-bold text-gray-700 mb-1.5">
                No colleges found
              </div>
              <div className="text-sm text-gray-400 mb-4">
                Try searching with a different name
              </div>
              <button className="text-sm text-purple-600 font-semibold cursor-pointer hover:text-purple-700">
                Request your college →
              </button>
            </div>
          )}
        </div>

        {/* Request College Banner */}
        <div className="mt-5 bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3 md:flex-nowrap md:gap-3">
          <div>
            <div className="text-sm font-bold text-black mb-0.5">
              Can't find your college?
            </div>
            <div className="text-xs text-gray-500">
              Request it and we'll add it within 24 hours
            </div>
          </div>
          <button className="bg-purple-600 text-white rounded-lg px-4.5 py-2 text-sm font-semibold border-none cursor-pointer hover:bg-purple-700 transition-colors md:px-4.5 md:py-2">
            Request College →
          </button>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
