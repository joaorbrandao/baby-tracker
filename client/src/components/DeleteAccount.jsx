import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'

export default function DeleteAccount() {
  const { t } = useTranslation()
  const { logout } = useAuth()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setLoading(true)
    setError('')
    try {
      await api.del('/users/me')
      logout()
    } catch (err) {
      setError(err.message || t('account.deleteError'))
      setLoading(false)
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
      >
        {t('account.delete')}
      </button>
    )
  }

  return (
    <div className="rounded-xl bg-red-50 dark:bg-red-900/30 p-3 text-sm">
      <p className="text-red-700 dark:text-red-300 mb-2 font-medium">
        {t('account.deleteWarning')}
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3 py-1.5 font-semibold transition-colors"
        >
          {loading ? t('account.deleting') : t('account.confirmDelete')}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="rounded-lg bg-white dark:bg-white/10 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 px-3 py-1.5 font-semibold transition-colors"
        >
          {t('account.cancel')}
        </button>
      </div>
      {error && <p className="mt-2 text-red-600 dark:text-red-300">{error}</p>}
    </div>
  )
}
