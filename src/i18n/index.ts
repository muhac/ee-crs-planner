import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { zhCN } from './locales/zh-CN'
import { zhTW } from './locales/zh-TW'
import { en } from './locales/en'
import { fr } from './locales/fr'
import { hi } from './locales/hi'
import { es } from './locales/es'

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'zh-CN', name: '简体中文' },
  { code: 'zh-TW', name: '繁體中文' },
  { code: 'hi', name: 'हिन्दी' },
] as const

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'en': { translation: en },
      'fr': { translation: fr },
      'zh-CN': { translation: zhCN },
      'zh-TW': { translation: zhTW },
      'hi': { translation: hi },
      'es': { translation: es },
    },
    supportedLngs: LANGUAGES.map((l) => l.code),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'ee-crs-lang',
      convertDetectedLanguage: (lng: string) =>
        lng.startsWith('zh') ? (/tw|hk|mo|hant/i.test(lng) ? 'zh-TW' : 'zh-CN') : lng,
    },
  })

// The static HTML carries the full SEO title; keep it for English and use the
// localized short name elsewhere.
const seoTitle = document.title
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
  document.title = lng === 'en' ? seoTitle : i18n.t('common.appTitle')
})

export default i18n
