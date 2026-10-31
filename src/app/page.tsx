import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-lg px-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          GHL Support Desk
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          + SCORM Progress Tracker
        </p>
        <p className="text-sm text-gray-400 mb-8">
          Webhook-driven support tickets from GoHighLevel with SCORM learning
          progress sync. Built with Next.js, Supabase, and GHL API v2.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/dashboard"
            className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Open Dashboard
          </Link>
          <a
            href="https://github.com/Ayushant/ghl-support-desk"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            GitHub Repo
          </a>
        </div>
      </div>
    </div>
  )
}
