import { useState } from 'react'
import type { CanadianEducationCredential, ClbScores, EducationLevel, OfficialLanguage, Profile } from '@/engine/types'
import type { FutureEvent } from '@/engine/simulate'
import { addMonths, todayIso } from '@/engine/dates'
import { newId } from '@/lib/profile'
import { CANADIAN_EDUCATION_LABELS, EDUCATION_LABELS, EDUCATION_ORDER, EVENT_TYPE_LABELS } from '@/lib/labels'
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

export function EventDialog({ profile, onAdd }: Props) {
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

  const types = (Object.keys(EVENT_TYPE_LABELS) as Array<FutureEvent['type']>).filter(
    (t) => t !== 'spouse-language-update' || profile.spouse !== null,
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
        <Button variant="outline" size="sm">+ 添加未来事件</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>添加未来事件</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>事件类型</Label>
            <Select value={type} onValueChange={(v) => setType(v as FutureEvent['type'])}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t} value={t}>
                    {EVENT_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="event-date">生效日期</Label>
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
                  <Label>更新哪门语言</Label>
                  <Select value={target} onValueChange={(v) => selectTarget(v as 'first' | 'second')}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first">第一语言</SelectItem>
                      <SelectItem value="second">第二语言</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>语种</Label>
                  <Select value={language} onValueChange={(v) => setLanguage(v as OfficialLanguage)}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">英语</SelectItem>
                      <SelectItem value="french">法语</SelectItem>
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
                <Label>新学历</Label>
                <Select value={education} onValueChange={(v) => setEducation(v as EducationLevel)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EDUCATION_ORDER.map((level) => (
                      <SelectItem key={level} value={level}>
                        {EDUCATION_LABELS[level]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>加拿大境内学历</Label>
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
                        {CANADIAN_EDUCATION_LABELS[v]}
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
            添加
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
