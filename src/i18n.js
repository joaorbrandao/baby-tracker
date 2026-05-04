import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { enGB, pt } from 'date-fns/locale'

import en from './locales/en.json'
import ptTranslations from './locales/pt.json'

export const SUPPORTED_LANGUAGES = ['en', 'pt']

export const DATE_FNS_LOCALES = {
  en: enGB,
  pt: pt,
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      pt: { translation: ptTranslations },
    },
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    nonExplicitSupportedLngs: true, // pt-PT, pt-BR all map to pt
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'babytracker-lang',
      caches: ['localStorage'],
    },
  })

export default i18n
