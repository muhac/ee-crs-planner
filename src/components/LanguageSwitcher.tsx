import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { LANGUAGES } from '@/i18n'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = LANGUAGES.find((l) => l.code === i18n.resolvedLanguage) ?? LANGUAGES[0]

  return (
    <Select value={current.code} onValueChange={(code) => void i18n.changeLanguage(code)}>
      <SelectTrigger
        size="sm"
        className="text-muted-foreground hover:bg-accent hover:text-accent-foreground gap-1.5 border-0 bg-transparent shadow-none"
        aria-label="Language"
      >
        <Languages className="size-4" />
        <span className="hidden sm:inline">{current.name}</span>
      </SelectTrigger>
      <SelectContent position="popper" align="end">
        {LANGUAGES.map((l) => (
          <SelectItem key={l.code} value={l.code}>
            {l.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
