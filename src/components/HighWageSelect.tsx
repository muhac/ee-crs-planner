import { useTranslation } from 'react-i18next'
import type { HighWageLevel } from '@/engine/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const HIGH_WAGE_LEVELS: HighWageLevel[] = ['none', '130', '150', '200']

interface Props {
  value: HighWageLevel
  onChange: (level: HighWageLevel) => void
}

export function HighWageSelect({ value, onChange }: Props) {
  const { t } = useTranslation()
  return (
    <Select value={value} onValueChange={(v) => onChange(v as HighWageLevel)}>
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {HIGH_WAGE_LEVELS.map((level) => (
          <SelectItem key={level} value={level}>
            {t(`highWage.${level}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
