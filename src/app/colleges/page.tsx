'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';

// Mock data for colleges
const colleges = [
  {
    slug: "srm",
    name: "SRM Institute of Science and Technology",
    shortName: "SRM Chennai",
    short: "SR",
    type: "Private",
    location: "Chennai, Tamil Nadu",
    color: "7C3AED",
    members: 3420,
    seniors: 234,
    doubts: 1847,
    joined: true
  },
  {
    slug: "vit",
    name: "Vellore Institute of Technology",
    shortName: "VIT Vellore",
    short: "VI",
    type: "Deemed",
    location: "Vellore, Tamil Nadu",
    color: "06B6D4",
    members: 2841,
    seniors: 198,
    doubts: 1203,
    joined: true
  },
  {
    slug: "nit-trichy",
    name: "National Institute of Technology",
    shortName: "NIT Trichy",
    short: "NI",
    type: "NIT",
    location: "Trichy, Tamil Nadu",
    color: "F59E0B",
    members: 1920,
    seniors: 156,
    doubts: 934,
    joined: false
  },
  {
    slug: "anna-univ",
    name: "Anna University",
    shortName: "Anna University",
    short: "AN",
    type: "Deemed",
    location: "Chennai, Tamil Nadu",
    color: "10B981",
    members: 2103,
    seniors: 187,
    doubts: 1102,
    joined: false
  },
  {
    slug: "psg",
    name: "PSG College of Technology",
    shortName: "PSG Tech",
    short: "PS",
    type: "Private",
    location: "Coimbatore, Tamil Nadu",
    color: "EF4444",
    members: 987,
    seniors: 89,
    doubts: 543,
    joined: false
  },
  {
    slug: "bits",
    name: "BITS Pilani",
    shortName: "BITS Pilani",
    short: "BI",
    type: "Deemed",
    location: "Pilani, Rajasthan",
    color: "8B5CF6",
    members: 1654,
    seniors: 143,
    doubts: 876,
    joined: false
  },
  {
    slug: "iit-madras",
    name: "Indian Institute of Technology",
    shortName: "IIT Madras",
    short: "II",
    type: "IIT",
    location: "Chennai, Tamil Nadu",
    color: "0EA5E9",
    members: 2234,
    seniors: 312,
    doubts: 1567,
    joined: false
  },
  {
    slug: "srm-ktr",
    name: "SRM Institute of Science and Technology, Kattankulathur",
    shortName: "SRM KTR",
    short: "SK",
    type: "Private",
    location: "Kattankulathur, Tamil Nadu",
    color: "7C3AED",
    members: 1823,
    seniors: 167,
    doubts: 934,
    joined: false
  },
  {
    slug: "sastra",
    name: "SASTRA Deemed University",
    shortName: "SASTRA University",
    short: "SA",
    type: "Deemed",
    location: "Thanjavur, Tamil Nadu",
    color: "F97316",
    members: 743,
    seniors: 67,
    doubts: 412,
    joined: false
  },
  {
    slug: "nit-surathkal",
    name: "NIT Karnataka",
    shortName: "NIT Surathkal",
    short: "NK",
    type: "NIT",
    location: "Surathkal, Karnataka",
    color: "EC4899",
    members: 1102,
    seniors: 98,
    doubts: 623,
    joined: false
  },
  {
    slug: "amrita",
    name: "Amrita Vishwa Vidyapeetham",
    shortName: "Amrita University",
    short: "AM",
    type: "Deemed",
    location: "Coimbatore, Tamil Nadu",
    color: "14B8A6",
    members: 1234,
    seniors: 112,
    doubts: 698,
    joined: false
  },
  {
    slug: "vit-chennai",
    name: "VIT Chennai Campus",
    shortName: "VIT Chennai",
    short: "VC",
    type: "Deemed",
    location: "Chennai, Tamil Nadu",
    color: "06B6D4",
    members: 1456,
    seniors: 134,
    doubts: 789,
    joined: false
  }
];

export default function CollegesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [joinedColleges, setJoinedColleges] = useState(
    new Set(colleges.filter(c => c.joined).map(c => c.slug))
  );

  const filters = ["All", "IIT", "NIT", "Private", "Deemed"];

  // Filter colleges based on search query and active filter
  const filtered = colleges.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.shortName.toLowerCase().includes(searchQuery.toLowerCase())
  ).filter(c =>
    activeFilter === "All" ? true : c.type === activeFilter
  );

  const toggleJoinCollege = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setJoinedColleges(prev => {
      const newSet = new Set(prev);
      if (newSet.has(slug)) {
        newSet.delete(slug);
      } else {
        newSet.add(slug);
      }
      return newSet;
    });
  };

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
            placeholder="Search college name... e.g. SRM, VIT, NIT"
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
            {searchQuery ? (
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
          
          <select className="border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-700 bg-white">
            <option>Members ▾</option>
            <option>Seniors</option>
            <option>Doubts</option>
          </select>
        </div>

        {/* College List */}
        <div className="flex flex-col gap-2">
          {filtered.length > 0 ? (
            filtered.map((college) => (
              <div 
                key={college.slug}
                className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3.5 hover:border-purple-200 transition-colors cursor-pointer md:gap-3.5 md:p-4"
                onClick={() => window.location.href = `/community/${college.slug}`}
              >
                {/* Avatar */}
                <img 
                  src={`https://ui-avatars.com/api/?name=${college.short}&background=${college.color}&color=fff&size=48&bold=true`}
                  alt={college.short}
                  className="w-12 h-12 rounded-lg flex-shrink-0 md:w-12 md:h-12"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {/* Top Row */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-bold text-black">
                      c/{college.slug}
                    </span>
                    <span className="bg-gray-100 rounded px-2 py-0.5 text-[10px] font-bold text-gray-500">
                      {college.type}
                    </span>
                  </div>

                  {/* College Name */}
                  <div className="text-sm text-gray-500 mb-2">
                    {college.shortName}
                  </div>

                  {/* Stats Row */}
                  <div className="flex gap-4 flex-wrap text-xs text-gray-400 md:gap-4">
                    <span>👥 {college.members.toLocaleString()} members</span>
                    <span>🎓 {college.seniors} seniors</span>
                    <span className="hidden sm:inline">💬 {college.doubts} doubts</span>
                    <span>📍 {college.location}</span>
                  </div>
                </div>

                {/* Action */}
                <div className="flex-shrink-0">
                  {joinedColleges.has(college.slug) ? (
                    <span className="text-sm font-semibold text-green-600">
                      ✓ Joined
                    </span>
                  ) : (
                    <button
                      onClick={(e) => toggleJoinCollege(college.slug, e)}
                      className="border border-purple-600 text-purple-600 font-bold rounded-lg px-5 py-1.5 text-sm bg-white hover:bg-purple-600 hover:text-white transition-colors md:px-5 md:py-1.5"
                    >
                      Join
                    </button>
                  )}
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
