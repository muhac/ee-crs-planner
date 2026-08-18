import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  id: string
  value: number
  onChange: (months: number) => void
}

/** Duration entry as years + months, stored as total months. */
export function MonthsInput({ id, value, onChange }: Props) {
  const years = Math.floor(value / 12)
  const months = value % 12

  const set = (y: number, m: number) => {
    const clamp = (n: number, max: number) => Math.max(0, Math.min(max, Math.floor(n) || 0))
    onChange(clamp(y, 60) * 12 + clamp(m, 11))
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        max={60}
        className="w-20"
        value={years}
        onChange={(e) => set(Number(e.target.value), months)}
      />
      <Label htmlFor={id} className="text-muted-foreground font-normal">年</Label>
      <Input
        type="number"
        inputMode="numeric"
        min={0}
        max={11}
        className="w-20"
        value={months}
        onChange={(e) => set(years, Number(e.target.value))}
        aria-label="月"
      />
      <span className="text-muted-foreground text-sm">个月</span>
    </div>
  )
}
