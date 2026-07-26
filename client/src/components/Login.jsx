import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'

export default function Login() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.post('/auth/login', { email, password })
      login(data.accessToken, data.user)
    } catch (err) {
      setError(err.message || t('login.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="w-full max-w-md mx-auto px-4 mt-12">
      <div className="rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-sm p-8 shadow-sm">
        <h2 className="font-serif text-2xl font-bold text-violet-900 dark:text-violet-100 text-center mb-6">
          {t('login.title')}
        </h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-violet-700 dark:text-violet-300 mb-1">
              {t('login.email')}
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-violet-200 dark:border-violet-700 bg-white dark:bg-white/10 px-4 py-2 text-violet-900 dark:text-violet-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-violet-700 dark:text-violet-300 mb-1">
              {t('login.password')}
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-violet-200 dark:border-violet-700 bg-white dark:bg-white/10 px-4 py-2 text-violet-900 dark:text-violet-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          {error && (
            <div className="text-sm text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold py-2.5 transition-colors"
          >
            {loading ? t('login.signingIn') : t('login.submit')}
          </button>
        </form>
      </div>
    </section>
  )
}
