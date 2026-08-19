import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import type { StoredProfile } from '@/storage/schema'
import { isShareEnvelope, upgradeStoredProfile } from '@/storage/schema'
import { calculateCrs } from '@/engine/crs'
import { checkEligibility } from '@/engine/eligibility'
import { simulate } from '@/engine/simulate'
import { todayIso } from '@/engine/dates'
import { newId, newStoredProfile } from '@/lib/profile'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Props {
  profiles: StoredProfile[]
  onOpen: (id: string) => void
  onAdd: (profile: StoredProfile) => void
  onRemove: (id: string) => void
}

export function ProfileList({ profiles, onOpen, onAdd, onRemove }: Props) {
  const { t } = useTranslation()
  const fileInput = useRef<HTMLInputElement>(null)
  const today = todayIso()

  const importJson = async (file: File) => {
    try {
      const parsed: unknown = JSON.parse(await file.text())
      if (!isShareEnvelope(parsed)) throw new Error('bad format')
      onAdd({ ...upgradeStoredProfile(parsed.profile), id: newId() })
    } catch {
      alert(t('list.importFailed'))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('list.myProfiles')}</h2>
        <div className="flex gap-2">
          <input
            ref={fileInput}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void importJson(f)
              e.target.value = ''
            }}
          />
          <Button variant="outline" onClick={() => fileInput.current?.click()}>
            {t('list.importJson')}
          </Button>
          <Button
            onClick={() => {
              const p = newStoredProfile(
                t('list.defaultName', { n: profiles.length + 1 }),
                t('projection.defaultScenarioName', { n: 1 }),
              )
              onAdd(p)
              onOpen(p.id)
            }}
          >
            {t('list.newProfile')}
          </Button>
        </div>
      </div>

      {profiles.length === 0 && (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            {t('list.emptyHint')}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {profiles.map((p) => {
          const score = calculateCrs(p.profile, today)
          const eligibility = checkEligibility(p.profile, today)
          const programs = (
            [
              ['CEC', eligibility.cec.eligible],
              ['FSW', eligibility.fsw.eligible],
              ['FST', eligibility.fst.eligible],
            ] as const
          )
            .filter(([, ok]) => ok)
            .map(([name]) => name)
          // First month the score moves, in the first pinned scenario.
          const scenario = p.scenarios.find((s) => s.pinned) ?? p.scenarios[0]
          const points = scenario ? simulate(p.profile, scenario, today) : []
          const change = points.find((pt) => pt.score.total !== points[0].score.total)
          return (
            <Card
              key={p.id}
              className="hover:border-ring cursor-pointer transition-colors"
              onClick={() => onOpen(p.id)}
            >
              <CardContent className="flex items-stretch justify-between gap-3 py-4">
                <div className="flex min-w-0 flex-col">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {programs.length > 0 ? (
                      programs.join(' / ')
                    ) : (
                      <span className="text-red-600 dark:text-red-500">NONE</span>
                    )}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('list.delete')}
                    className="text-muted-foreground -mb-1 -ml-2 mt-auto size-8 self-start pt-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(t('list.deleteConfirm', { name: p.name }))) onRemove(p.id)
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <div className="flex shrink-0 flex-col items-end justify-between">
                  <span className="text-3xl font-bold tabular-nums">{score.total}</span>
                  {change && (
                    <p className="text-muted-foreground text-xs tabular-nums">
                      {change.date.slice(0, 7)} → {change.score.total}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
