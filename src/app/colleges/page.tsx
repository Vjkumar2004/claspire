'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Users, GraduationCap, Building2, ChevronRight, MessageSquare } from 'lucide-react';

export default function CollegesPage() {
  const router = useRouter();
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
    c.colleges?.short_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  ).filter(c =>
    activeFilter === "All" ? true : c.colleges?.type === activeFilter
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      
      {/* Hero Section */}
      <div className="relative pt-28 pb-16 overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-purple-100/30 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-blue-50/30 rounded-full blur-[100px] -z-10" />

        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 rounded-full border border-purple-100 mb-6">
            <Building2 size={14} className="text-purple-600" />
            <span className="text-[12px] font-bold text-purple-600 uppercase tracking-wider">Tamil Nadu Colleges</span>
          </div>
          
          <h1 className="font-extrabold text-4xl md:text-5xl text-gray-900 mb-6 leading-[1.2] tracking-tight">
            Connect with your <span className="text-[#7C3AED]">college seniors</span>
          </h1>
          
          <p className="text-gray-500 max-w-2xl mx-auto text-base md:text-lg mb-10 font-medium">
            Join students from AAACET, Kamaraj, ANJAC, VVV and more. Get real guidance, 
            placement help, and referrals from verified seniors in your area.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-0 bg-purple-600/5 rounded-xl blur-xl group-hover:bg-purple-600/10 transition-all" />
            <div className="relative bg-white border border-gray-200 rounded-lg p-2 flex items-center shadow-sm">
              <div className="pl-4 pr-2 text-gray-400">
                <Search size={20} />
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your college... e.g. AAACET, Kamaraj, ANJAC"
                className="flex-1 py-3 text-black outline-none bg-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 pb-32">
        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide py-4 mb-8 sticky top-[72px] bg-[#F8FAFC]/80 backdrop-blur-md z-10 border-b border-gray-250">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-5 py-2 rounded-md text-sm font-bold whitespace-nowrap flex-shrink-0 transition-all ${
                activeFilter === filter
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900 tracking-tight">
              {searchQuery ? `Results for "${searchQuery}"` : "All Communities"}
            </h2>
            <span className="text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
              {filtered.length}
            </span>
          </div>
        </div>

        {/* College List */}
        <div className="flex flex-col gap-4">
          {loading ? (
            // Skeleton loading state
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-md p-6 flex items-start gap-4 animate-pulse shadow-[0_1px_3px_rgba(0,0,0,0.05)] bg-gray-50">
                <div className="w-16 h-16 bg-gray-150 rounded-md flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
                  <div className="h-4 bg-gray-150 rounded w-2/3 mb-4" />
                  <div className="flex gap-3">
                    <div className="h-4 bg-gray-150 rounded w-20" />
                    <div className="h-4 bg-gray-150 rounded w-20" />
                  </div>
                </div>
              </div>
            ))
          ) : filtered.length > 0 ? (
            filtered.map((c) => (
              <div 
                key={c.id}
                className="group bg-white border border-gray-200 rounded-md p-6 hover:border-purple-300 hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
                onClick={() => router.push(`/colleges/${c.slug}`)}
              >
                <div className="flex items-start gap-5">
                  {/* Avatar */}
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '6px',
                    background: (c.slug === 'aaacet' || c.slug === 'vvvclg' || c.slug === 'vvv' || c.slug === 'anjac' || c.slug === 'sfr' || c.slug === 'skc' || c.slug === 'kamaraj' || c.slug === 'agpc' || c.slug === 'vhnsn') ? '#F8FAFC' : 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                    border: (c.slug === 'aaacet' || c.slug === 'vvvclg' || c.slug === 'vvv' || c.slug === 'anjac' || c.slug === 'sfr' || c.slug === 'skc' || c.slug === 'kamaraj' || c.slug === 'agpc' || c.slug === 'vhnsn') ? '1px solid #E2E8F0' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    padding: (c.slug === 'aaacet' || c.slug === 'vvvclg' || c.slug === 'vvv' || c.slug === 'anjac' || c.slug === 'sfr' || c.slug === 'skc' || c.slug === 'kamaraj' || c.slug === 'agpc' || c.slug === 'vhnsn') ? '8px' : '0',
                    flexShrink: 0,
                    color: 'white',
                    fontSize: '24px',
                    fontWeight: 800
                  }}
                  className="shadow-sm"
                  >
                    {c.slug === 'aaacet' ? (
                      <img src="/aaaclg_logo.jpg" alt="AAACET" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }} />
                    ) : (c.slug === 'vvvclg' || c.slug === 'vvv') ? (
                      <img src="/vvvclogo.png" alt="VVV" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }} />
                    ) : c.slug === 'anjac' ? (
                      <img src="/anjac.jpg" alt="ANJAC" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }} />
                    ) : c.slug === 'sfr' ? (
                      <img src="/sfr.jpg" alt="SFR" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }} />
                    ) : c.slug === 'skc' ? (
                      <img src="/skc.jpg" alt="SKC" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }} />
                    ) : c.slug === 'kamaraj' ? (
                      <img src="/kamaraj.jpg" alt="Kamaraj" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }} />
                    ) : c.slug === 'agpc' ? (
                      <img src="/agpc.jpg" alt="AGPC" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }} />
                    ) : c.slug === 'vhnsn' ? (
                      <img src="/vhnsn_college.jpg" alt="VHNSN" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }} />
                    ) : (
                      c.colleges?.short_name?.[0] || c.slug?.[0]?.toUpperCase() || 'C'
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    {/* Top Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-base font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                          c/{c.slug}
                        </span>
                        <span className="bg-purple-50 text-purple-600 border border-purple-100 rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                          {c.colleges?.type || 'College'}
                        </span>
                      </div>
                      
                      {/* Location Badge */}
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded border border-gray-150">
                        <MapPin size={12} className="text-gray-400" />
                        {c.colleges?.location}
                      </div>
                    </div>

                    {/* College Name */}
                    <div className="text-[14px] font-medium text-gray-500 mb-4 line-clamp-1 leading-snug">
                      {c.colleges?.name}
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-5 flex-wrap mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                        <Users size={15} className="text-blue-500" />
                        <span className="text-gray-800 font-bold">{c.member_count?.toLocaleString() || 0}</span> students
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                        <GraduationCap size={15} className="text-cyan-500" />
                        <span className="text-gray-800 font-bold">{c.senior_count || 0}</span> seniors
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                        <MessageSquare size={15} className="text-purple-500" />
                        <span className="text-gray-800 font-bold">{c.doubt_count || 0}</span> doubts
                      </div>
                    </div>
                  </div>

                  {/* Action Icon */}
                  <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-md bg-gray-50 text-gray-400 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors self-center flex-shrink-0">
                    <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            /* Empty State */
            <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-md shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                <Search size={24} className="text-gray-300" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">No colleges found</h3>
              <p className="text-gray-550 text-sm mb-6 font-medium">We couldn't find any college matching "{searchQuery}"</p>
              <button 
                onClick={() => window.location.href = '/colleges/request'}
                className="text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 px-6 py-2.5 rounded-md transition-all shadow-sm cursor-pointer border-none"
              >
                Request your college
              </button>
            </div>
          )}
        </div>

        {/* Request College Banner */}
        {!loading && filtered.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50/40 border border-purple-100 rounded-md p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <div>
              <div className="text-base font-bold text-gray-900 mb-1 tracking-tight">
                Can't find your college?
              </div>
              <div className="text-sm text-gray-500 font-medium">
                Request it and our team will verify and add it within 24 hours.
              </div>
            </div>
            <button 
              onClick={() => window.location.href = '/colleges/request'}
              className="whitespace-nowrap bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-6 py-3 rounded-md font-bold text-sm transition-all flex items-center gap-2 group cursor-pointer border-none shadow-sm"
            >
              Request College
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;  
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

