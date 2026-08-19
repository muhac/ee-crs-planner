import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CanadianEducationCredential, ClbScores, EducationLevel, OfficialLanguage, Profile } from '@/engine/types'
import type { FutureEvent } from '@/engine/simulate'
import { addMonths, todayIso } from '@/engine/dates'
import { newId } from '@/lib/profile'
import { EDUCATION_ORDER } from '@/lib/labels'
import { ClbInput } from './ClbInput'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const UNIFORM_7: ClbScores = { listening: 7, reading: 7, writing: 7, speaking: 7 }

interface Props {
  profile: Profile
  onAdd: (event: FutureEvent) => void
}

const EVENT_TYPES: Array<FutureEvent['type']> = [
  'language-update',
  'education-update',
  'provincial-nomination',
  'certificate-of-qualification',
  'sibling-in-canada',
  'spouse-language-update',
]

export function EventDialog({ profile, onAdd }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<FutureEvent['type']>('language-update')
  const [date, setDate] = useState(() => addMonths(todayIso(), 6))
  const [target, setTarget] = useState<'first' | 'second'>('first')
  const [language, setLanguage] = useState<OfficialLanguage>(profile.firstLanguage.language)
  const [clb, setClb] = useState<ClbScores>(profile.firstLanguage.clb)
  const [education, setEducation] = useState<EducationLevel>(profile.education)
  const [canadianEducation, setCanadianEducation] = useState<CanadianEducationCredential>(
    profile.canadianEducationCredential,
  )

  const types = EVENT_TYPES.filter(
    (v) => v !== 'spouse-language-update' || profile.spouse !== null,
  )

  const build = (): FutureEvent => {
    const base = { id: newId(), date }
    switch (type) {
      case 'language-update':
        return { ...base, type, target, test: { language, clb } }
      case 'education-update':
        return { ...base, type, education, canadianEducationCredential: canadianEducation }
      case 'spouse-language-update':
        return { ...base, type, clb }
      default:
        return { ...base, type }
    }
  }

  const selectTarget = (t: 'first' | 'second') => {
    setTarget(t)
    const test = t === 'first' ? profile.firstLanguage : profile.secondLanguage
    if (test) {
      setLanguage(test.language)
      setClb(test.clb)
    } else {
      setLanguage(profile.firstLanguage.language === 'english' ? 'french' : 'english')
      setClb(UNIFORM_7)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">{t('events.addTrigger')}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('events.dialogTitle')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t('events.type')}</Label>
            <Select value={type} onValueChange={(v) => setType(v as FutureEvent['type'])}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {types.map((v) => (
                  <SelectItem key={v} value={v}>
                    {t(`events.types.${v}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="event-date">{t('events.date')}</Label>
            <Input
              id="event-date"
              type="date"
              className="w-44"
              value={date}
              onChange={(e) => e.target.value && setDate(e.target.value)}
            />
          </div>

          {type === 'language-update' && (
            <>
              <div className="flex items-center gap-3">
                <div className="space-y-1.5">
                  <Label>{t('events.whichLanguage')}</Label>
                  <Select value={target} onValueChange={(v) => selectTarget(v as 'first' | 'second')}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first">{t('events.first')}</SelectItem>
                      <SelectItem value="second">{t('events.second')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t('events.languageKind')}</Label>
                  <Select value={language} onValueChange={(v) => setLanguage(v as OfficialLanguage)}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">{t('common.english')}</SelectItem>
                      <SelectItem value="french">{t('common.french')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <ClbInput
                value={clb}
                onChange={setClb}
                scaleName={language === 'french' ? 'NCLC' : 'CLB'}
              />
            </>
          )}

          {type === 'spouse-language-update' && <ClbInput value={clb} onChange={setClb} />}

          {type === 'education-update' && (
            <>
              <div className="space-y-1.5">
                <Label>{t('events.newEducation')}</Label>
                <Select value={education} onValueChange={(v) => setEducation(v as EducationLevel)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EDUCATION_ORDER.map((level) => (
                      <SelectItem key={level} value={level}>
                        {t(`education.${level}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('events.canadianEducation')}</Label>
                <Select
                  value={canadianEducation}
                  onValueChange={(v) => setCanadianEducation(v as CanadianEducationCredential)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['none', 'one-or-two-year', 'three-plus-year'] as const).map((v) => (
                      <SelectItem key={v} value={v}>
                        {t(`canadianEdu.${v}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              onAdd(build())
              setOpen(false)
            }}
          >
            {t('events.add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
