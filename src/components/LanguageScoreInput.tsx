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
}

interface Mode {
  id: string
  label: string
  language: OfficialLanguage
  test?: LanguageTestType
}

/** One unified selector: the choice implies the official language. */
const MODES: Mode[] = [
  { id: 'clb', label: 'CLB', language: 'english' },
  { id: 'celpip', label: TEST_LABELS.celpip, language: 'english', test: 'celpip' },
  { id: 'ielts', label: TEST_LABELS.ielts, language: 'english', test: 'ielts' },
  { id: 'pte', label: TEST_LABELS.pte, language: 'english', test: 'pte' },
  { id: 'nclc', label: 'NCLC', language: 'french' },
  { id: 'tef', label: TEST_LABELS.tef, language: 'french', test: 'tef' },
  { id: 'tcf', label: TEST_LABELS.tcf, language: 'french', test: 'tcf' },
]

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
export function LanguageScoreInput({ value, onChange }: Props) {
  const { t } = useTranslation()
  const scale = value.language === 'french' ? 'NCLC' : 'CLB'
  const modeId = value.raw?.test ?? (value.language === 'french' ? 'nclc' : 'clb')

  const switchMode = (id: string) => {
    const mode = MODES.find((m) => m.id === id)!
    if (!mode.test) {
      onChange({ language: mode.language, clb: value.clb })
      return
    }
    const test = mode.test
    const scores: ClbScores = {
      listening: clbToMinScore(test, 'listening', value.clb.listening),
      reading: clbToMinScore(test, 'reading', value.clb.reading),
      writing: clbToMinScore(test, 'writing', value.clb.writing),
      speaking: clbToMinScore(test, 'speaking', value.clb.speaking),
    }
    onChange({ language: mode.language, raw: { test, scores }, clb: convertAll(test, scores) })
  }

  const setScore = (ability: Ability, score: number) => {
    if (!value.raw) return
    const scores = { ...value.raw.scores, [ability]: score }
    onChange({ ...value, raw: { ...value.raw, scores }, clb: convertAll(value.raw.test, scores) })
  }

  return (
    <div className="space-y-3">
      <Select value={modeId} onValueChange={switchMode}>
        <SelectTrigger className="w-full sm:w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MODES.map((mode) => (
            <SelectItem key={mode.id} value={mode.id}>
              {mode.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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
