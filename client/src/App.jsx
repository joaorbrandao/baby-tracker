import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import CsvUpload from './components/CsvUpload'
import Dashboard from './components/Dashboard'
import LanguageSwitcher from './components/LanguageSwitcher'

export default function App() {
  const [events, setEvents] = useState(null)
  const { t } = useTranslation()

  const footer = (
    <div className="text-center text-violet-300 dark:text-violet-700 text-sm select-none">
      <Trans i18nKey="app.uploadHint">Upload a file to see your dashboard ✨</Trans>
      <br />
      <Trans i18nKey="app.privacyNote">🔒 No data collection! 💜</Trans>
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans transition-colors">
      {/* Header */}
      <header className="w-full max-w-2xl mx-auto px-4 pt-6 pb-6">
        <div className="flex justify-end mb-2">
          <LanguageSwitcher />
        </div>
        <div className="text-center">
          <h1 className="font-serif text-3xl font-bold text-violet-900 dark:text-violet-100 tracking-tight">
            {t('app.title')}
          </h1>
          <p className="text-sm text-violet-500 dark:text-violet-400 mt-1">
            {t('app.subtitle')}
          </p>
        </div>
      </header>

      {/* Upload area */}
      <CsvUpload onData={setEvents} />

      {/* Dashboard — shown only after data is loaded */}
      {events && (
        <div className="mt-8">
          <Dashboard events={events} />
          <div className="mt-8">{footer}</div>
        </div>
      )}

      {!events && <div className="mt-16">{footer}</div>}
    </div>
  )
}
