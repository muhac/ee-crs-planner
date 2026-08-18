import type { CanadianEducationCredential, EducationLevel } from '@/engine/types'
import type { FutureEvent } from '@/engine/simulate'

export const EDUCATION_LABELS: Record<EducationLevel, string> = {
  'less-than-secondary': '高中以下',
  'secondary': '高中毕业',
  'one-year-post-secondary': '一年制大专 / 证书',
  'two-year-post-secondary': '两年制大专',
  'bachelors': '本科(或三年及以上高等教育)',
  'two-or-more-credentials': '两个及以上文凭(其一为三年及以上)',
  'masters-or-professional': '硕士(或受监管职业学位)',
  'doctoral': '博士',
}

export const EDUCATION_ORDER: EducationLevel[] = [
  'less-than-secondary',
  'secondary',
  'one-year-post-secondary',
  'two-year-post-secondary',
  'bachelors',
  'two-or-more-credentials',
  'masters-or-professional',
  'doctoral',
]

export const CANADIAN_EDUCATION_LABELS: Record<CanadianEducationCredential, string> = {
  'none': '无',
  'one-or-two-year': '一至两年制文凭',
  'three-plus-year': '三年及以上文凭',
}

/** CLB selector options; 3 stands for "below CLB 4". */
export const CLB_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 3, label: '低于 CLB 4' },
  { value: 4, label: 'CLB 4' },
  { value: 5, label: 'CLB 5' },
  { value: 6, label: 'CLB 6' },
  { value: 7, label: 'CLB 7' },
  { value: 8, label: 'CLB 8' },
  { value: 9, label: 'CLB 9' },
  { value: 10, label: 'CLB 10+' },
]

export const ABILITY_LABELS = {
  listening: '听力',
  reading: '阅读',
  writing: '写作',
  speaking: '口语',
} as const

export const EVENT_TYPE_LABELS: Record<FutureEvent['type'], string> = {
  'language-update': '语言重考',
  'education-update': '学历提升',
  'provincial-nomination': '获得省提名',
  'certificate-of-qualification': '获得技工证书',
  'sibling-in-canada': '兄弟姐妹成为公民/PR',
  'spouse-language-update': '配偶语言重考',
}

export function describeEvent(event: FutureEvent): string {
  switch (event.type) {
    case 'language-update': {
      const which = event.target === 'first' ? '第一语言' : '第二语言'
      const lang = event.test.language === 'english' ? '英语' : '法语'
      const c = event.test.clb
      return `${which}重考(${lang}):听 ${c.listening} / 读 ${c.reading} / 写 ${c.writing} / 说 ${c.speaking}`
    }
    case 'education-update':
      return `学历提升为「${EDUCATION_LABELS[event.education]}」${
        event.canadianEducationCredential && event.canadianEducationCredential !== 'none'
          ? `(加拿大学历:${CANADIAN_EDUCATION_LABELS[event.canadianEducationCredential]})`
          : ''
      }`
    case 'spouse-language-update': {
      const c = event.clb
      return `配偶语言重考:听 ${c.listening} / 读 ${c.reading} / 写 ${c.writing} / 说 ${c.speaking}`
    }
    default:
      return EVENT_TYPE_LABELS[event.type]
  }
}
