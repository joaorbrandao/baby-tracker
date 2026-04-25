import { useState } from 'react'
import CsvUpload from './components/CsvUpload'
import Dashboard from './components/Dashboard'

export default function App() {
  const [events, setEvents] = useState(null)

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans transition-colors">
      {/* Header */}
      <header className="w-full max-w-2xl mx-auto px-4 pt-8 pb-6 text-center">
        <h1 className="font-serif text-3xl font-bold text-violet-900 dark:text-violet-100 tracking-tight">
          Baby Tracker
        </h1>
        <p className="text-sm text-violet-500 dark:text-violet-400 mt-1">
          Kicks &amp; contractions dashboard
        </p>
      </header>

      {/* Upload area */}
      <CsvUpload onData={setEvents} />

      {/* Dashboard — shown only after data is loaded */}
      {events && (
        <div className="mt-8">
          <Dashboard events={events} />
        </div>
      )}

      {!events && (
        <div className="mt-16 text-center text-violet-300 dark:text-violet-700 text-sm select-none">
          Upload a CSV to see your dashboard ✨
        </div>
      )}
    </div>
  )
}
