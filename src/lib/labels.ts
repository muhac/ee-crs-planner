import type { TFunction } from 'i18next'
import type { EducationLevel } from '@/engine/types'
import type { FutureEvent } from '@/engine/simulate'

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

/** CLB selector values; 3 stands for "below CLB 4". */
export const CLB_LEVELS = [3, 4, 5, 6, 7, 8, 9, 10]

export function clbLevelLabel(t: TFunction, level: number, scaleName: string): string {
  if (level <= 3) return t('form.belowLevel', { scale: scaleName })
  return level >= 10 ? `${scaleName} 10+` : `${scaleName} ${level}`
}

export function describeEvent(t: TFunction, event: FutureEvent): string {
  switch (event.type) {
    case 'language-update': {
      const c = event.test.clb
      return t('events.descLanguage', {
        which: t(event.target === 'first' ? 'events.first' : 'events.second'),
        lang: t(event.test.language === 'english' ? 'common.english' : 'common.french'),
        l: c.listening, r: c.reading, w: c.writing, s: c.speaking,
      })
    }
    case 'education-update': {
      const education = t(`education.${event.education}`)
      return event.canadianEducationCredential && event.canadianEducationCredential !== 'none'
        ? t('events.descEducationCanadian', {
            education,
            canadian: t(`canadianEdu.${event.canadianEducationCredential}`),
          })
        : t('events.descEducation', { education })
    }
    case 'work-status-update':
      return t(`events.workStatus.${event.target}-${event.working ? 'start' : 'stop'}`)
    case 'spouse-work-status-update':
      return t(`events.spouseWorkStatus.${event.working ? 'start' : 'stop'}`)
    case 'spouse-education-update':
      return t('events.descSpouseEducation', { education: t(`education.${event.education}`) })
    case 'spouse-language-update': {
      const c = event.test.clb
      return t('events.descSpouseLanguage', {
        l: c.listening, r: c.reading, w: c.writing, s: c.speaking,
      })
    }
    default:
      return t(`events.types.${event.type}`)
  }
}
