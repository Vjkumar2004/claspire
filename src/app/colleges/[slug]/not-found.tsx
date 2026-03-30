import Link from 'next/link'
import { GraduationCap, ArrowLeft, Search } from 'lucide-react'

export default function CollegeNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <GraduationCap className="w-10 h-10 text-purple-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">College Not Found</h1>
        <p className="text-gray-600 mb-8">
          The college community you're looking for doesn't exist or hasn't been added to Claspire yet.
        </p>

        <div className="space-y-4">
          <Link 
            href="/colleges" 
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Browse All Colleges
          </Link>
          
          <div className="text-sm text-gray-500">
            Or{' '}
            <Link 
              href="/signup" 
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              sign up
            </Link>{' '}
            to request your college
          </div>
        </div>

        <div className="mt-12 p-4 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Search className="w-4 h-4" />
            <span className="font-medium">Popular Colleges</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {['AAACET', 'Kamaraj', 'ANJAC', 'VVV College'].map((college) => (
              <Link
                key={college}
                href={`/colleges/${college.toLowerCase().replace(/\s+/g, '')}`}
                className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors"
              >
                {college}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
