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

// The static HTML carries the full SEO title; keep it for English and use the
// localized short name elsewhere. Description and canonical follow the active
// language so each ?lang= URL is indexable as its own hreflang variant.
const seoTitle = document.title
const BASE_URL = 'https://muhac.github.io/ee-crs-planner/'
const applyLanguage = (lng: string) => {
  document.documentElement.lang = lng
  document.title = lng === 'en' ? seoTitle : i18n.t('common.appTitle')
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute('content', i18n.t('common.metaDescription'))
  document
    .querySelector('link[rel="canonical"]')
    ?.setAttribute('href', lng === 'en' ? BASE_URL : `${BASE_URL}?lang=${lng}`)
}
i18n.on('languageChanged', applyLanguage)

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
      order: ['querystring', 'localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupQuerystring: 'lang',
      lookupLocalStorage: 'ee-crs-lang',
      convertDetectedLanguage: (lng: string) =>
        lng.startsWith('zh') ? (/tw|hk|mo|hant/i.test(lng) ? 'zh-TW' : 'zh-CN') : lng,
    },
  })
  .then(() => applyLanguage(i18n.language))

export default i18n
