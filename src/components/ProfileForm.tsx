import type { OfficialLanguage, Profile } from '@/engine/types'
import { defaultSpouse } from '@/lib/profile'
import {
  CANADIAN_EDUCATION_LABELS,
  EDUCATION_LABELS,
  EDUCATION_ORDER,
} from '@/lib/labels'
import { ClbInput } from './ClbInput'
import { MonthsInput } from './MonthsInput'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  profile: Profile
  onChange: (next: Profile) => void
}

const SECTIONS = ['basics', 'education', 'language', 'work', 'extra', 'spouse']

function EducationSelect({
  value,
  onChange,
}: {
  value: Profile['education']
  onChange: (v: Profile['education']) => void
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Profile['education'])}>
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
  )
}

function LanguagePicker({
  value,
  onChange,
}: {
  value: OfficialLanguage
  onChange: (v: OfficialLanguage) => void
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as OfficialLanguage)}>
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="english">英语</SelectItem>
        <SelectItem value="french">法语</SelectItem>
      </SelectContent>
    </Select>
  )
}

export function ProfileForm({ profile, onChange }: Props) {
  const set = (patch: Partial<Profile>) => onChange({ ...profile, ...patch })

  return (
    <Accordion type="multiple" defaultValue={SECTIONS} className="w-full">
      <AccordionItem value="basics">
        <AccordionTrigger className="text-base">基本信息</AccordionTrigger>
        <AccordionContent className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="dob">出生日期</Label>
            <Input
              id="dob"
              type="date"
              className="w-44"
              value={profile.dateOfBirth}
              onChange={(e) => e.target.value && set({ dateOfBirth: e.target.value })}
            />
            <p className="text-muted-foreground text-xs">
              年龄按打分日精确计算,推演时会自动随时间增长。
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="education">
        <AccordionTrigger className="text-base">教育</AccordionTrigger>
        <AccordionContent className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>最高学历</Label>
            <EducationSelect value={profile.education} onChange={(v) => set({ education: v })} />
          </div>
          <div className="space-y-1.5">
            <Label>加拿大境内学历(额外加分)</Label>
            <Select
              value={profile.canadianEducationCredential}
              onValueChange={(v) =>
                set({ canadianEducationCredential: v as Profile['canadianEducationCredential'] })
              }
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
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="language">
        <AccordionTrigger className="text-base">语言成绩</AccordionTrigger>
        <AccordionContent className="space-y-5 pt-1">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>第一官方语言</Label>
              <LanguagePicker
                value={profile.firstLanguage.language}
                onChange={(language) =>
                  set({ firstLanguage: { ...profile.firstLanguage, language } })
                }
              />
            </div>
            <ClbInput
              value={profile.firstLanguage.clb}
              scaleName={profile.firstLanguage.language === 'french' ? 'NCLC' : 'CLB'}
              onChange={(clb) => set({ firstLanguage: { ...profile.firstLanguage, clb } })}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="second-lang">第二官方语言</Label>
              <Switch
                id="second-lang"
                checked={profile.secondLanguage !== null}
                onCheckedChange={(on) =>
                  set({
                    secondLanguage: on
                      ? {
                          language: profile.firstLanguage.language === 'english' ? 'french' : 'english',
                          clb: { listening: 5, reading: 5, writing: 5, speaking: 5 },
                        }
                      : null,
                  })
                }
              />
            </div>
            {profile.secondLanguage && (
              <>
                <div className="flex justify-end">
                  <LanguagePicker
                    value={profile.secondLanguage.language}
                    onChange={(language) =>
                      set({ secondLanguage: { ...profile.secondLanguage!, language } })
                    }
                  />
                </div>
                <ClbInput
                  value={profile.secondLanguage.clb}
                  scaleName={profile.secondLanguage.language === 'french' ? 'NCLC' : 'CLB'}
                  onChange={(clb) => set({ secondLanguage: { ...profile.secondLanguage!, clb } })}
                />
              </>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="work">
        <AccordionTrigger className="text-base">工作经验</AccordionTrigger>
        <AccordionContent className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="cdn-work">加拿大境内工作经验(NOC TEER 0-3)</Label>
            <MonthsInput
              id="cdn-work"
              value={profile.canadianWorkMonths}
              onChange={(canadianWorkMonths) => set({ canadianWorkMonths })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="foreign-work">海外工作经验(近 10 年内)</Label>
            <MonthsInput
              id="foreign-work"
              value={profile.foreignWorkMonths}
              onChange={(foreignWorkMonths) => set({ foreignWorkMonths })}
            />
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="extra">
        <AccordionTrigger className="text-base">附加项</AccordionTrigger>
        <AccordionContent className="space-y-4 pt-1">
          {(
            [
              ['certificateOfQualification', '持有省/联邦技工职业证书'],
              ['provincialNomination', '省提名(PNP)'],
              ['siblingInCanada', '有兄弟姐妹是加拿大公民或永久居民'],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <Label htmlFor={key} className="font-normal">{label}</Label>
              <Switch
                id={key}
                checked={profile[key]}
                onCheckedChange={(on) => set({ [key]: on })}
              />
            </div>
          ))}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="spouse">
        <AccordionTrigger className="text-base">随行配偶</AccordionTrigger>
        <AccordionContent className="space-y-4 pt-1">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="has-spouse" className="font-normal">
              有随行配偶(配偶非加拿大公民/PR)
            </Label>
            <Switch
              id="has-spouse"
              checked={profile.spouse !== null}
              onCheckedChange={(on) => set({ spouse: on ? defaultSpouse() : null })}
            />
          </div>
          {profile.spouse && (
            <div className="space-y-4 border-l-2 pl-4">
              <div className="space-y-1.5">
                <Label>配偶最高学历</Label>
                <EducationSelect
                  value={profile.spouse.education}
                  onChange={(education) => set({ spouse: { ...profile.spouse!, education } })}
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="spouse-lang">配偶语言成绩</Label>
                  <Switch
                    id="spouse-lang"
                    checked={profile.spouse.language !== null}
                    onCheckedChange={(on) =>
                      set({
                        spouse: {
                          ...profile.spouse!,
                          language: on
                            ? { listening: 5, reading: 5, writing: 5, speaking: 5 }
                            : null,
                        },
                      })
                    }
                  />
                </div>
                {profile.spouse.language && (
                  <ClbInput
                    value={profile.spouse.language}
                    onChange={(language) => set({ spouse: { ...profile.spouse!, language } })}
                  />
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="spouse-work">配偶加拿大工作经验</Label>
                <MonthsInput
                  id="spouse-work"
                  value={profile.spouse.canadianWorkMonths}
                  onChange={(canadianWorkMonths) =>
                    set({ spouse: { ...profile.spouse!, canadianWorkMonths } })
                  }
                />
              </div>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
