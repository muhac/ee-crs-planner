import { useTranslation } from 'react-i18next'
import type { OfficialLanguage, Profile } from '@/engine/types'
import { defaultSpouse } from '@/lib/profile'
import { EDUCATION_ORDER } from '@/lib/labels'
import { ClbInput } from './ClbInput'
import { LanguageScoreInput } from './LanguageScoreInput'
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
  const { t } = useTranslation()
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Profile['education'])}>
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
  )
}

function LanguagePicker({
  value,
  onChange,
}: {
  value: OfficialLanguage
  onChange: (v: OfficialLanguage) => void
}) {
  const { t } = useTranslation()
  return (
    <Select value={value} onValueChange={(v) => onChange(v as OfficialLanguage)}>
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="english">{t('common.english')}</SelectItem>
        <SelectItem value="french">{t('common.french')}</SelectItem>
      </SelectContent>
    </Select>
  )
}

export function ProfileForm({ profile, onChange }: Props) {
  const { t } = useTranslation()
  const set = (patch: Partial<Profile>) => onChange({ ...profile, ...patch })

  return (
    <Accordion type="multiple" defaultValue={SECTIONS} className="w-full">
      <AccordionItem value="basics">
        <AccordionTrigger className="text-base">{t('form.basics')}</AccordionTrigger>
        <AccordionContent className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="dob">{t('form.dob')}</Label>
            <Input
              id="dob"
              type="date"
              className="w-44"
              value={profile.dateOfBirth}
              onChange={(e) => e.target.value && set({ dateOfBirth: e.target.value })}
            />
            <p className="text-muted-foreground text-xs">{t('form.dobHint')}</p>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="education">
        <AccordionTrigger className="text-base">{t('form.educationSection')}</AccordionTrigger>
        <AccordionContent className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>{t('form.highestEducation')}</Label>
            <EducationSelect value={profile.education} onChange={(v) => set({ education: v })} />
          </div>
          <div className="space-y-1.5">
            <Label>{t('form.canadianEducation')}</Label>
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
                    {t(`canadianEdu.${v}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="language">
        <AccordionTrigger className="text-base">{t('form.languageSection')}</AccordionTrigger>
        <AccordionContent className="space-y-5 pt-1">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{t('form.firstLanguage')}</Label>
              <LanguagePicker
                value={profile.firstLanguage.language}
                onChange={(language) =>
                  // Raw test scores are language-specific — drop them on switch.
                  set({ firstLanguage: { language, clb: profile.firstLanguage.clb } })
                }
              />
            </div>
            <LanguageScoreInput
              value={profile.firstLanguage}
              onChange={(firstLanguage) => set({ firstLanguage })}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="second-lang">{t('form.secondLanguage')}</Label>
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
                      set({ secondLanguage: { language, clb: profile.secondLanguage!.clb } })
                    }
                  />
                </div>
                <LanguageScoreInput
                  value={profile.secondLanguage}
                  onChange={(secondLanguage) => set({ secondLanguage })}
                />
              </>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="work">
        <AccordionTrigger className="text-base">{t('form.workSection')}</AccordionTrigger>
        <AccordionContent className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="cdn-work">{t('form.canadianWork')}</Label>
            <MonthsInput
              id="cdn-work"
              value={profile.canadianWorkMonths}
              onChange={(canadianWorkMonths) => set({ canadianWorkMonths })}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="working-in-canada" className="font-normal">
              {t('form.workingInCanada')}
            </Label>
            <Switch
              id="working-in-canada"
              checked={profile.workingInCanada}
              onCheckedChange={(on) => set({ workingInCanada: on })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="foreign-work">{t('form.foreignWork')}</Label>
            <MonthsInput
              id="foreign-work"
              value={profile.foreignWorkMonths}
              onChange={(foreignWorkMonths) => set({ foreignWorkMonths })}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="working-abroad" className="font-normal">
              {t('form.workingAbroad')}
            </Label>
            <Switch
              id="working-abroad"
              checked={profile.workingAbroad}
              onCheckedChange={(on) => set({ workingAbroad: on })}
            />
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="extra">
        <AccordionTrigger className="text-base">{t('form.extraSection')}</AccordionTrigger>
        <AccordionContent className="space-y-4 pt-1">
          {(
            [
              ['certificateOfQualification', t('form.certificate')],
              ['provincialNomination', t('form.pnp')],
              ['siblingInCanada', t('form.sibling')],
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
        <AccordionTrigger className="text-base">{t('form.spouseSection')}</AccordionTrigger>
        <AccordionContent className="space-y-4 pt-1">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="has-spouse" className="font-normal">
              {t('form.hasSpouse')}
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
                <Label>{t('form.spouseEducation')}</Label>
                <EducationSelect
                  value={profile.spouse.education}
                  onChange={(education) => set({ spouse: { ...profile.spouse!, education } })}
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="spouse-lang">{t('form.spouseLanguage')}</Label>
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
                <Label htmlFor="spouse-work">{t('form.spouseWork')}</Label>
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
