import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { StoredProfile } from '@/storage/schema'
import { isShareEnvelope, upgradeStoredProfile } from '@/storage/schema'
import { calculateCrs } from '@/engine/crs'
import { checkEligibility, eligibleProgramNames } from '@/engine/eligibility'
import { simulate } from '@/engine/simulate'
import { todayIso } from '@/engine/dates'
import { newId, newStoredProfile } from '@/lib/profile'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Props {
  profiles: StoredProfile[]
  onOpen: (id: string) => void
  onAdd: (profile: StoredProfile) => void
}

export function ProfileList({ profiles, onOpen, onAdd }: Props) {
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {profiles.map((p) => {
          const score = calculateCrs(p.profile, today)
          const programs = eligibleProgramNames(checkEligibility(p.profile, today))
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
              <CardContent className="flex items-center justify-between gap-3 py-4 sm:h-36 sm:flex-col sm:items-stretch">
                <div className="min-w-0">
                  <p className="font-heading sm:text-muted-foreground truncate text-3xl font-bold">
                    {p.name}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {programs.length > 0 ? programs.join(' / ') : t('eligibility.none')}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end text-right sm:self-end">
                  <span className="font-heading text-3xl font-bold tabular-nums">{score.total}</span>
                  {change && (
                    <p className="text-muted-foreground font-mono text-xs">
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
