import { Trans, useTranslation } from 'react-i18next'

export default function FiveOneOneAlert({ result }) {
  const { t } = useTranslation()

  if (result.triggered) {
    return (
      <div className="rounded-2xl p-5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700">
        <div className="flex items-start gap-4">
          <span className="text-3xl" aria-hidden>🚨</span>
          <div>
            <p className="font-serif font-semibold text-red-800 dark:text-red-200 text-lg">
              {t('alert.triggered')}
            </p>
            <p className="text-red-700 dark:text-red-300 text-sm mt-1">
              <Trans
                i18nKey="alert.triggeredDetail"
                values={{ count: result.count, when: result.label }}
                components={{ strong: <strong /> }}
              />
            </p>
            <p className="text-red-600 dark:text-red-400 text-sm mt-2 font-semibold">
              {t('alert.triggeredCta')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-5 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700">
      <div className="flex items-start gap-4">
        <span className="text-3xl" aria-hidden>✅</span>
        <div>
          <p className="font-serif font-semibold text-green-800 dark:text-green-200 text-lg">
            {t('alert.safe')}
          </p>
          <p className="text-green-700 dark:text-green-300 text-sm mt-1">
            {t('alert.safeDetail')}
          </p>
        </div>
      </div>
    </div>
  )
}
