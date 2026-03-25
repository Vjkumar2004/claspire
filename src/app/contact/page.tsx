import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="bg-black text-white min-h-screen">
      <div className="max-w-3xl mx-auto px-6 pt-24 pb-16">
        {/* Back to Home */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M5 12L12 19M5 12L12 5"/>
          </svg>
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Get in touch</h1>
          <p className="text-xl text-gray-400">
            Have a question, feedback, or just want to say hi? We'd love to hear from you.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="border border-gray-800 rounded-xl p-6">
            <div className="text-2xl mb-3">📧</div>
            <h3 className="font-semibold mb-2">Email Us</h3>
            <a 
              href="mailto:support@claspire.in" 
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              support@claspire.in
            </a>
          </div>
          <div className="border border-gray-800 rounded-xl p-6">
            <div className="text-2xl mb-3">🐦</div>
            <h3 className="font-semibold mb-2">Twitter/X</h3>
            <a 
              href="https://x.com/claspire" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              @claspire
            </a>
          </div>
        </div>

        {/* College Partnerships */}
        <div className="text-center mb-6">
          <p className="text-gray-400">
            For college partnership requests, email:{" "}
            <a 
              href="mailto:colleges@claspire.in" 
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              colleges@claspire.in
            </a>
          </p>
        </div>

        {/* Response Time */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            We typically respond within 24–48 hours.
          </p>
        </div>
      </div>
    </div>
  );
}
