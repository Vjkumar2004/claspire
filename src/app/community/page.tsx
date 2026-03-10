'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';

// Mock data for all posts from different colleges
const allPosts = [
  {
    id: 1,
    type: "doubt",
    community: "srm",
    communityName: "c/srm",
    communityColor: "#7C3AED",
    answered: true,
    avatar: "AK", 
    avatarColor: "#7C3AED",
    name: "Arun Kumar",
    meta: "3rd Year · CSE",
    time: "2h ago",
    question: "How competitive is Swiggy off-campus for CSE 2025? CGPA 7.8",
    tags: ["Swiggy", "Placement", "CSE"],
    answers: 4, 
    upvotes: 23,
    topAnswer: {
      name: "Rahul Sharma",
      badge: "SDE-2 @ Swiggy · SRM 2022",
      text: "7.8 is fine. Focus on DSA and projects. OA has 2 medium questions. DM me your resume..."
    }
  },
  {
    id: 2,
    type: "doubt",
    community: "vit",
    communityName: "c/vit",
    communityColor: "#06B6D4",
    answered: false,
    avatar: "SK", 
    avatarColor: "#06B6D4",
    name: "Sneha Kumar",
    meta: "Final Year · ECE",
    time: "3h ago",
    question: "Can ECE students apply for Amazon SDE role? What are the eligibility criteria for 2025?",
    tags: ["Amazon", "ECE", "Eligibility"],
    answers: 1, 
    upvotes: 18,
    topAnswer: null
  },
  {
    id: 3,
    type: "doubt",
    community: "aaacet",
    communityName: "c/aaacet",
    communityColor: "#DC2626",
    answered: true,
    avatar: "MP", 
    avatarColor: "#DC2626",
    name: "Mohan Prakash",
    meta: "3rd Year · MECH",
    time: "5h ago",
    question: "What are the placement opportunities for Mechanical students at AAACET? Which companies visit campus?",
    tags: ["Placement", "Mechanical", "AAACET"],
    answers: 3, 
    upvotes: 15,
    topAnswer: {
      name: "Karthik R",
      badge: "Senior Design Engineer · AAACET 2021",
      text: "Mechanical placements are decent. Core companies like L&T, Ashok Leyland visit. Software roles also available if you have coding skills..."
    }
  },
  {
    id: 4,
    type: "doubt",
    community: "nit-trichy",
    communityName: "c/nit-trichy",
    communityColor: "#F59E0B",
    answered: true,
    avatar: "PR", 
    avatarColor: "#F59E0B",
    name: "Priya R",
    meta: "3rd Year · CSE",
    time: "5h ago",
    question: "What is the exact Zoho interview process? How many rounds and what topics to prepare?",
    tags: ["Zoho", "Interview", "Process"],
    answers: 6, 
    upvotes: 45,
    topAnswer: {
      name: "Karthik M",
      badge: "Dev @ Zoho · NIT Trichy 2023",
      text: "4 rounds total: Written test (C/C++ MCQ), Advanced programming, Technical interview, HR. Focus on data structures and logic..."
    }
  }
];

// Joined communities
const joinedCommunities = [
  { short: "SR", name: "c/srm", members: "3.4k", color: "#7C3AED" },
  { short: "VI", name: "c/vit", members: "2.8k", color: "#06B6D4" }
];

// All colleges for discover
const allColleges = [
  { short: "SR", name: "SRM Chennai", members: "3,420", seniors: "234", color: "7C3AED", joined: true },
  { short: "VI", name: "VIT Vellore", members: "2,841", seniors: "198", color: "06B6D4", joined: true },
  { short: "AA", name: "AAACET", members: "1,245", seniors: "89", color: "DC2626", joined: false },
  { short: "NI", name: "NIT Trichy", members: "1,920", seniors: "156", color: "F59E0B", joined: false },
  { short: "AN", name: "Anna University", members: "2,103", seniors: "187", color: "10B981", joined: false },
  { short: "PS", name: "PSG Tech", members: "987", seniors: "89", color: "EF4444", joined: false },
  { short: "BI", name: "BITS Pilani", members: "1,654", seniors: "143", color: "8B5CF6", joined: false }
];

// Trending tags
const trendingTags = [
  "#Swiggy", "#Amazon", "#TCS", "#Placement", 
  "#DSA", "#Referral", "#Zoho", "#Infosys",
  "#Internship", "#CGPA", "#CSE", "#ECE"
];

export default function CommunityPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Latest");
  const [joinedColleges, setJoinedColleges] = useState(
    new Set(allColleges.filter(c => c.joined).map(c => c.short))
  );

  const filters = ["All", "Doubts", "Unanswered", "Trending"];

  const toggleJoinCollege = (short: string) => {
    setJoinedColleges(prev => {
      const newSet = new Set(prev);
      if (newSet.has(short)) {
        newSet.delete(short);
      } else {
        newSet.add(short);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-14">
      <Navbar />
      
      <div className="page-wrapper max-w-[1200px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-[240px_1fr_300px] md:grid-cols-[1fr_280px] gap-6">
        {/* Left Sidebar - Desktop Only */}
        <div className="hidden lg:block">
          <div className="sticky top-20 h-fit">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs font-bold tracking-[0.08em] uppercase text-gray-400 mb-3">
                YOUR COMMUNITIES
              </div>
              
              <div className="space-y-1">
                {joinedCommunities.map((community) => (
                  <a
                    key={community.name}
                    href={`/community/c/${community.short.toLowerCase()}`}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-colors no-underline"
                  >
                    <div 
                      className="w-7 h-7 rounded-md text-white text-[11px] font-bold flex items-center justify-center"
                      style={{ backgroundColor: community.color }}
                    >
                      {community.short}
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{community.name}</span>
                    <span className="text-xs text-gray-400 ml-auto">{community.members}</span>
                  </a>
                ))}
              </div>

              <div className="border-t border-gray-100 mt-3 pt-2">
                <a 
                  href="/colleges"
                  className="block p-2 text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors no-underline"
                >
                  Browse all colleges →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Center - Main Feed */}
        <div className="space-y-4">
          {/* Back to Community Link */}
          <a 
            href="/community"
            className="flex items-center gap-1.5 text-sm text-gray-500 font-semibold mb-4 hover:text-purple-600 transition-colors no-underline"
          >
            ← All Communities
          </a>

          {/* Feed Header */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <h1 className="font-instrument-serif font-normal text-[22px] text-black mb-1">
                Community Feed
              </h1>
              <p className="text-sm text-gray-400">Doubts from all colleges</p>
            </div>
            
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white"
            >
              <option>Latest ▾</option>
              <option>Top</option>
              <option>Trending</option>
            </select>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mb-1 pb-1">
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

          {/* Feed Posts */}
          <div className="space-y-2.5">
            {allPosts.map((post) => (
              <div key={post.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-purple-200 transition-colors">
                <div className="flex">
                  {/* Vote Column */}
                  <div className="w-12 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-4 gap-1">
                    <button className="text-gray-400 hover:text-purple-600 transition-colors text-lg">▲</button>
                    <span className="text-sm font-bold text-gray-700">{post.upvotes}</span>
                    <button className="text-gray-400 hover:text-red-500 transition-colors text-lg">▼</button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4">
                    {/* Community Badge Row */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <div 
                        className="w-5 h-5 rounded text-white text-[8px] font-bold flex items-center justify-center"
                        style={{ backgroundColor: post.communityColor }}
                      >
                        {post.communityName.split('/')[1].toUpperCase().slice(0, 2)}
                      </div>
                      <a 
                        href={`/community/c/${post.community}`}
                        className="text-xs font-bold text-gray-700 hover:text-purple-600 transition-colors no-underline"
                      >
                        {post.communityName}
                      </a>
                      <span className="text-gray-400">·</span>
                      <span className="text-xs text-gray-400">Posted by {post.name}</span>
                    </div>

                    {/* Author Info */}
                    <div className="flex items-center gap-2 mb-2.5">
                      <div 
                        className="w-7 h-7 rounded-full text-white text-xs font-bold text-center leading-7"
                        style={{ backgroundColor: post.avatarColor }}
                      >
                        {post.avatar}
                      </div>
                      <span className="text-sm font-bold text-black">{post.name}</span>
                      <span className="text-gray-400">·</span>
                      <span className="text-xs text-gray-400">{post.meta}</span>
                      <span className="text-gray-400">·</span>
                      <span className="text-xs text-gray-400">{post.time}</span>
                    </div>

                    {/* Question */}
                    <div className="text-sm font-semibold text-gray-900 mb-2.5 leading-relaxed">
                      {post.question}
                    </div>

                    {/* Tags */}
                    <div className="flex gap-1.5 flex-wrap mb-3">
                      {post.tags.map((tag) => (
                        <span key={tag} className="bg-gray-100 rounded px-2 py-0.5 text-xs font-semibold text-gray-600">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">💬 {post.answers} answers</span>
                      
                      <div className="ml-auto">
                        {post.answered ? (
                          <div className="bg-green-50 border border-green-300 text-green-700 font-semibold rounded-full px-2.5 py-1 text-xs">
                            ✓ Senior answered
                          </div>
                        ) : (
                          <div className="bg-orange-50 border border-orange-300 text-orange-700 font-semibold rounded-full px-2.5 py-1 text-xs">
                            ⏳ Awaiting senior
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Top Answer Preview */}
                    {post.topAnswer && (
                      <div className="mt-3 bg-purple-50 border border-purple-100 border-l-[3px] border-purple-600 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs font-bold text-center leading-6">
                            {post.topAnswer.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-xs font-bold text-black">{post.topAnswer.name}</span>
                          <div className="bg-purple-100 text-purple-700 rounded px-2 py-0.5 text-[10px] font-bold">
                            {post.topAnswer.badge}
                          </div>
                        </div>
                        <div className="text-xs text-gray-700 leading-relaxed line-clamp-2">
                          {post.topAnswer.text}
                        </div>
                        <button className="text-xs text-purple-600 font-semibold mt-1.5 hover:text-purple-700 transition-colors">
                          Read full answer →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="hidden md:block">
          <div className="sticky top-20 space-y-4">
            {/* Discover Communities */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs font-bold tracking-[0.08em] uppercase text-gray-400 mb-1">
                DISCOVER COLLEGES
              </div>
              <p className="text-xs text-gray-400 mb-3.5">Join your college community</p>
              
              <div className="space-y-0">
                {allColleges.map((college) => (
                  <div key={college.short} className="flex items-center gap-2.5 py-2.5 border-b border-gray-50 last:border-0">
                    <img 
                      src={`https://ui-avatars.com/api/?name=${college.short}&background=${college.color}&color=fff&size=36&bold=true`}
                      alt={college.short}
                      className="w-9 h-9 rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-black truncate">{college.name}</div>
                      <div className="text-xs text-gray-400">
                        {college.members} members · {college.seniors} seniors
                      </div>
                    </div>
                    <div className="ml-auto">
                      {joinedColleges.has(college.short) ? (
                        <span className="text-xs font-semibold text-green-600">
                          ✓ Joined
                        </span>
                      ) : (
                        <button
                          onClick={() => toggleJoinCollege(college.short)}
                          className="bg-white border border-purple-600 text-purple-600 font-bold rounded-md px-3.5 py-1 text-xs cursor-pointer hover:bg-purple-50 transition-colors"
                        >
                          Join
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Tags */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs font-bold tracking-[0.08em] uppercase text-gray-400 mb-3">
                TRENDING THIS WEEK
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingTags.map((tag) => (
                  <button
                    key={tag}
                    className="bg-gray-100 rounded-md px-3 py-1 text-xs font-semibold text-gray-700 cursor-pointer hover:bg-purple-100 hover:text-purple-600 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
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
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
