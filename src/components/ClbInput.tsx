import { useTranslation } from 'react-i18next'
import type { Ability, ClbScores } from '@/engine/types'
import { ABILITIES } from '@/engine/types'
import { CLB_LEVELS, clbLevelLabel } from '@/lib/labels'
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
  const { t } = useTranslation()
  const setAbility = (ability: Ability, level: number) =>
    onChange({ ...value, [ability]: level })

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {ABILITIES.map((ability) => (
        <div key={ability} className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">{t(`abilities.${ability}`)}</Label>
          <Select
            value={String(value[ability])}
            onValueChange={(v) => setAbility(ability, Number(v))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLB_LEVELS.map((level) => (
                <SelectItem key={level} value={String(level)}>
                  {clbLevelLabel(t, level, scaleName)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  )
}
