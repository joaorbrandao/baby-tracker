import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { api } from './api/client'
import { useAuth } from './auth/AuthContext'
import Dashboard from './components/Dashboard'
import DeleteAccount from './components/DeleteAccount'
import LanguageSwitcher from './components/LanguageSwitcher'
import Login from './components/Login'
import TrackPanel from './components/TrackPanel'

export default function App() {
  const [events, setEvents] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { t } = useTranslation()
  const { isAuthenticated, logout } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
      setEvents(null)
      return
    }

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await api.get('/events')
        setEvents(data.map((e) => ({ ...e, datetime: new Date(e.datetime) })))
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [isAuthenticated])

  const footer = (
    <div className="text-center text-violet-300 dark:text-violet-700 text-sm select-none mt-8">
      <Trans i18nKey="app.trackHint">Track events to see your dashboard ✨</Trans>
      <br />
      <Trans i18nKey="app.privacyNote">🔒 Your data stays on your server 💜</Trans>
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans transition-colors">
      {/* Header */}
      <header className="w-full max-w-2xl mx-auto px-4 pt-6 pb-6">
        <div className="flex justify-between items-center mb-2">
          <LanguageSwitcher />
          {isAuthenticated && (
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={logout}
                className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-200 underline"
              >
                {t('login.logout')}
              </button>
              <DeleteAccount />
            </div>
          )}
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

      {!isAuthenticated && <Login />}

      {isAuthenticated && loading && (
        <div className="text-center text-violet-500 dark:text-violet-400 mt-12">
          {t('app.loading')}
        </div>
      )}

      {isAuthenticated && error && (
        <div className="w-full max-w-2xl mx-auto px-4 mt-4">
          <div className="rounded-xl bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-4 py-3 text-sm">
            {error}
          </div>
        </div>
      )}

      {isAuthenticated && !loading && !error && (
        <main className="space-y-6 pb-12">
          <TrackPanel events={events || []} setEvents={setEvents} />
          <Dashboard events={events || []} />
          {footer}
        </main>
      )}

      {!isAuthenticated && footer}
    </div>
  )
}
