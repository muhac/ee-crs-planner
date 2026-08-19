import { useTranslation } from 'react-i18next'
import type {
  Ability,
  ClbScores,
  LanguageTestResult,
  LanguageTestType,
  OfficialLanguage,
} from '@/engine/types'
import { ABILITIES } from '@/engine/types'
import {
  TESTS_FOR_LANGUAGE,
  TEST_LABELS,
  clbToMinScore,
  scoreToClb,
  testInputSpec,
} from '@/engine/language-tests'
import { clbLevelLabel } from '@/lib/labels'
import { ClbInput } from './ClbInput'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  value: LanguageTestResult
  onChange: (next: LanguageTestResult) => void
  /** Hide the English/French picker when the language is implied (e.g. second official language). */
  hideLanguagePicker?: boolean
}

const DIRECT = 'direct'

function convertAll(test: LanguageTestType, scores: ClbScores): ClbScores {
  return {
    listening: scoreToClb(test, 'listening', scores.listening),
    reading: scoreToClb(test, 'reading', scores.reading),
    writing: scoreToClb(test, 'writing', scores.writing),
    speaking: scoreToClb(test, 'speaking', scores.speaking),
  }
}

/**
 * Language input with two modes: direct CLB/NCLC levels (default), or raw
 * scores from an approved test converted per the official IRCC charts.
 */
export function LanguageScoreInput({ value, onChange, hideLanguagePicker = false }: Props) {
  const { t } = useTranslation()
  const scale = value.language === 'french' ? 'NCLC' : 'CLB'
  const mode = value.raw?.test ?? DIRECT

  const switchLanguage = (language: OfficialLanguage) => {
    // Raw test scores are language-specific — fall back to direct levels.
    onChange({ language, clb: value.clb })
  }

  const switchMode = (m: string) => {
    if (m === DIRECT) {
      onChange({ language: value.language, clb: value.clb })
      return
    }
    const test = m as LanguageTestType
    const scores: ClbScores = {
      listening: clbToMinScore(test, 'listening', value.clb.listening),
      reading: clbToMinScore(test, 'reading', value.clb.reading),
      writing: clbToMinScore(test, 'writing', value.clb.writing),
      speaking: clbToMinScore(test, 'speaking', value.clb.speaking),
    }
    onChange({ ...value, raw: { test, scores }, clb: convertAll(test, scores) })
  }

  const setScore = (ability: Ability, score: number) => {
    if (!value.raw) return
    const scores = { ...value.raw.scores, [ability]: score }
    onChange({ ...value, raw: { ...value.raw, scores }, clb: convertAll(value.raw.test, scores) })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {!hideLanguagePicker && (
          <Select
            value={value.language}
            onValueChange={(v) => switchLanguage(v as OfficialLanguage)}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="english">{t('common.english')}</SelectItem>
              <SelectItem value="french">{t('common.french')}</SelectItem>
            </SelectContent>
          </Select>
        )}
        <Select value={mode} onValueChange={switchMode}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={DIRECT}>{scale}</SelectItem>
            {TESTS_FOR_LANGUAGE[value.language].map((test) => (
              <SelectItem key={test} value={test}>
                {TEST_LABELS[test]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!value.raw ? (
        <ClbInput
          value={value.clb}
          scaleName={scale}
          onChange={(clb) => onChange({ ...value, clb })}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ABILITIES.map((ability) => {
            const spec = testInputSpec(value.raw!.test, ability)
            const raw = value.raw!.scores[ability]
            return (
              <div key={ability} className="space-y-1.5">
                <Label className="text-muted-foreground text-xs">
                  {t(`abilities.${ability}`)}
                </Label>
                {spec.kind === 'select' ? (
                  <Select
                    value={String(raw)}
                    onValueChange={(v) => setScore(ability, Number(v))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {spec.options.map((opt) => (
                        <SelectItem key={opt} value={String(opt)}>
                          {opt === spec.options[0] ? `≤ ${opt}` : String(opt)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={spec.min}
                    max={spec.max}
                    step={spec.step}
                    value={raw}
                    onChange={(e) => {
                      const n = Number(e.target.value)
                      if (!Number.isNaN(n)) setScore(ability, n)
                    }}
                  />
                )}
                <p className="text-muted-foreground text-xs">
                  → {clbLevelLabel(t, value.clb[ability], scale)}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
