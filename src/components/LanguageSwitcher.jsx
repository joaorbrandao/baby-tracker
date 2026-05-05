import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES } from '../i18n'

const FLAGS = {
  en: '🇬🇧',
  pt: '🇵🇹',
}

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const current = (i18n.resolvedLanguage || 'en').split('-')[0]

  function onChange(e) {
    i18n.changeLanguage(e.target.value)
  }

  return (
    <label className="inline-flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 cursor-pointer">
      <span className="sr-only">{t('language.label')}</span>
      <select
        value={current}
        onChange={onChange}
        className="bg-transparent border border-violet-200 dark:border-violet-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400"
        aria-label={t('language.label')}
      >
        {SUPPORTED_LANGUAGES.map(lng => (
          <option key={lng} value={lng}>
            {`${FLAGS[lng] ?? '🌐'} ${t(`language.${lng}`)}`}
          </option>
        ))}
      </select>
    </label>
  )
}
