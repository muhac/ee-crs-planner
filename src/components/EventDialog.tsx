import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  CanadianEducationCredential,
  EducationLevel,
  LanguageTestResult,
  Profile,
} from '@/engine/types'
import type { FutureEvent } from '@/engine/simulate'
import { addMonths, todayIso } from '@/engine/dates'
import { newId } from '@/lib/profile'
import { EDUCATION_ORDER } from '@/lib/labels'
import { LanguageScoreInput } from './LanguageScoreInput'
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

const EVENT_TYPES: Array<FutureEvent['type']> = [
  'language-update',
  'work-status-update',
  'education-update',
  'provincial-nomination',
  'certificate-of-qualification',
  'sibling-in-canada',
  'spouse-language-update',
  'spouse-education-update',
  'spouse-work-status-update',
]

const SPOUSE_EVENT_TYPES: Array<FutureEvent['type']> = [
  'spouse-language-update',
  'spouse-education-update',
  'spouse-work-status-update',
]

const WORK_STATUS_OPTIONS = ['canada-start', 'canada-stop', 'abroad-start', 'abroad-stop'] as const

const DEFAULT_TEST: LanguageTestResult = {
  language: 'english',
  clb: { listening: 7, reading: 7, writing: 7, speaking: 7 },
}

interface Props {
  profile: Profile
  onSave: (event: FutureEvent) => void
  /** When set, the dialog edits this event in place instead of adding one. */
  event?: FutureEvent
  /** Custom trigger element (defaults to the "add event" button). */
  trigger?: React.ReactNode
}

export function EventDialog({ profile, onSave, event, trigger }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<FutureEvent['type']>('language-update')
  const [date, setDate] = useState(() => addMonths(todayIso(), 6))
  const [target, setTarget] = useState<'first' | 'second'>('first')
  const [test, setTest] = useState<LanguageTestResult>(profile.firstLanguage)
  const [spouseTest, setSpouseTest] = useState<LanguageTestResult>(
    profile.spouse?.language ?? DEFAULT_TEST,
  )
  const [workStatus, setWorkStatus] = useState<(typeof WORK_STATUS_OPTIONS)[number]>('canada-start')
  const [spouseWorking, setSpouseWorking] = useState(true)
  const [education, setEducation] = useState<EducationLevel>(profile.education)
  const [spouseEducation, setSpouseEducation] = useState<EducationLevel>(
    profile.spouse?.education ?? 'bachelors',
  )
  const [canadianEducation, setCanadianEducation] = useState<CanadianEducationCredential>(
    profile.canadianEducationCredential,
  )

  const types = EVENT_TYPES.filter(
    (v) => !SPOUSE_EVENT_TYPES.includes(v) || profile.spouse !== null,
  )

  /** Reset the form to the edited event's values (or leave add-mode defaults). */
  const seed = () => {
    if (!event) return
    setType(event.type)
    setDate(event.date)
    switch (event.type) {
      case 'language-update':
        setTarget(event.target)
        setTest(event.test)
        break
      case 'work-status-update':
        setWorkStatus(`${event.target}-${event.working ? 'start' : 'stop'}`)
        break
      case 'education-update':
        setEducation(event.education)
        if (event.canadianEducationCredential) {
          setCanadianEducation(event.canadianEducationCredential)
        }
        break
      case 'spouse-language-update':
        setSpouseTest(event.test)
        break
      case 'spouse-education-update':
        setSpouseEducation(event.education)
        break
      case 'spouse-work-status-update':
        setSpouseWorking(event.working)
        break
    }
  }

  const build = (): FutureEvent => {
    const base = { id: event?.id ?? newId(), date }
    switch (type) {
      case 'language-update':
        return { ...base, type, target, test }
      case 'work-status-update': {
        const [place, action] = workStatus.split('-')
        return {
          ...base,
          type,
          target: place as 'canada' | 'abroad',
          working: action === 'start',
        }
      }
      case 'education-update':
        return { ...base, type, education, canadianEducationCredential: canadianEducation }
      case 'spouse-language-update':
        return { ...base, type, test: spouseTest }
      case 'spouse-education-update':
        return { ...base, type, education: spouseEducation }
      case 'spouse-work-status-update':
        return { ...base, type, working: spouseWorking }
      default:
        return { ...base, type }
    }
  }

  const selectTarget = (next: 'first' | 'second') => {
    setTarget(next)
    const current = next === 'first' ? profile.firstLanguage : profile.secondLanguage
    setTest(
      current ?? {
        language: profile.firstLanguage.language === 'english' ? 'french' : 'english',
        clb: DEFAULT_TEST.clb,
      },
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) seed()
        setOpen(next)
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline" size="sm">{t('events.addTrigger')}</Button>}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t(event ? 'events.editTitle' : 'events.dialogTitle')}</DialogTitle>
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
              <LanguageScoreInput
                value={test}
                onChange={setTest}
                lockLanguage={target === 'second'}
              />
            </>
          )}

          {type === 'work-status-update' && (
            <Select
              value={workStatus}
              onValueChange={(v) => setWorkStatus(v as (typeof WORK_STATUS_OPTIONS)[number])}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WORK_STATUS_OPTIONS.map((v) => (
                  <SelectItem key={v} value={v}>
                    {t(`events.workStatus.${v}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {type === 'spouse-language-update' && (
            <LanguageScoreInput value={spouseTest} onChange={setSpouseTest} />
          )}

          {type === 'spouse-education-update' && (
            <div className="space-y-1.5">
              <Label>{t('events.newEducation')}</Label>
              <Select
                value={spouseEducation}
                onValueChange={(v) => setSpouseEducation(v as EducationLevel)}
              >
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
          )}

          {type === 'spouse-work-status-update' && (
            <Select
              value={spouseWorking ? 'start' : 'stop'}
              onValueChange={(v) => setSpouseWorking(v === 'start')}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="start">{t('events.spouseWorkStatus.start')}</SelectItem>
                <SelectItem value="stop">{t('events.spouseWorkStatus.stop')}</SelectItem>
              </SelectContent>
            </Select>
          )}

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
                    {(['none', 'one-year', 'two-year', 'three-plus-year'] as const).map((v) => (
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
              onSave(build())
              setOpen(false)
            }}
          >
            {t(event ? 'events.save' : 'events.add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
