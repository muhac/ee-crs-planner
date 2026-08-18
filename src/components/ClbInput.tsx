import type { Ability, ClbScores } from '@/engine/types'
import { ABILITIES } from '@/engine/types'
import { ABILITY_LABELS, CLB_OPTIONS } from '@/lib/labels'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  value: ClbScores
  onChange: (next: ClbScores) => void
  /** NCLC for French tests, CLB for English. */
  scaleName?: string
}

export function ClbInput({ value, onChange, scaleName = 'CLB' }: Props) {
  const setAbility = (ability: Ability, level: number) =>
    onChange({ ...value, [ability]: level })

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {ABILITIES.map((ability) => (
        <div key={ability} className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">{ABILITY_LABELS[ability]}</Label>
          <Select
            value={String(value[ability])}
            onValueChange={(v) => setAbility(ability, Number(v))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLB_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label.replace('CLB', scaleName)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  )
}
