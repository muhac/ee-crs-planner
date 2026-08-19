import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { StoredProfile } from '@/storage/schema'
import type { SimulationPoint } from '@/engine/simulate'
import { projectProfile, simulate } from '@/engine/simulate'
import { checkEligibility } from '@/engine/eligibility'
import { addMonths, todayIso } from '@/engine/dates'
import type { ChartSeries } from './ProjectionChart'
import { ProjectionChart, seriesColor } from './ProjectionChart'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

const MILESTONES = [6, 12, 24, 36]
const MAX_SERIES = 8

type HomeSeries = ChartSeries & { profileId: string; scenarioId: string }

interface Props {
  profiles: StoredProfile[]
  onOpen: (profileId: string, selection?: { scenarioId: string; monthOffset: number }) => void
}

/** Combined projection of every pinned scenario across all profiles. */
export function HomeOverview({ profiles, onOpen }: Props) {
  const { t } = useTranslation()
  const [start] = useState(todayIso)

  const { series, hiddenCount } = useMemo(() => {
    const entries = profiles.flatMap((p) =>
      p.scenarios.filter((s) => s.pinned).map((s) => ({ p, s })),
    )
    const multi = profiles.length > 1
    const shown = entries.slice(0, MAX_SERIES)
    const series: HomeSeries[] = shown.map(({ p, s }, i) => {
      const eligible: boolean[] = []
      for (let offset = 0; offset <= s.horizonMonths; offset++) {
        eligible.push(
          checkEligibility(projectProfile(p.profile, s, start, offset), addMonths(start, offset))
            .anyEligible,
        )
      }
      return {
        id: `${p.id}|${s.id}`,
        name: multi ? `${p.name} · ${s.name}` : s.name,
        colorIndex: i,
        points: simulate(p.profile, s, start),
        eligible,
        profileId: p.id,
        scenarioId: s.id,
      }
    })
    return { series, hiddenCount: entries.length - shown.length }
  }, [profiles, start])

  if (series.length === 0) return null

  const open = (seriesId: string, monthOffset?: number) => {
    const s = series.find((x) => x.id === seriesId)
    if (!s) return
    onOpen(
      s.profileId,
      monthOffset !== undefined ? { scenarioId: s.scenarioId, monthOffset } : undefined,
    )
  }

  const peak = (points: SimulationPoint[]) =>
    points.reduce((best, p) => (p.score.total > best.score.total ? p : best), points[0])

  const earliestEntry = (s: HomeSeries): number | null => {
    const idx = s.eligible.indexOf(true)
    return idx === -1 ? null : idx
  }

  const cell = (seriesId: string, offset: number, label: React.ReactNode) => (
    <button
      className="cursor-pointer rounded px-1 py-0.5 tabular-nums hover:bg-muted"
      onClick={() => open(seriesId, offset)}
    >
      {label}
    </button>
  )

  return (
    <Card>
      <CardHeader className="pb-0">
        <h3 className="font-semibold">{t('projection.chartTitle')}</h3>
        {hiddenCount > 0 && (
          <p className="text-muted-foreground text-xs">{t('projection.homeCap')}</p>
        )}
      </CardHeader>
      <CardContent>
        <ProjectionChart series={series} onSelectPoint={(id, offset) => open(id, offset)} />

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-105 text-sm">
            <thead>
              <tr className="text-muted-foreground border-b text-left text-xs">
                <th className="py-2 pr-3 font-medium">{t('projection.scenarioCol')}</th>
                <th className="py-2 pr-3 font-medium">{t('projection.current')}</th>
                {MILESTONES.map((m) => (
                  <th key={m} className="py-2 pr-3 font-medium">
                    {t('projection.plusMonths', { m })}
                  </th>
                ))}
                <th className="py-2 pr-3 font-medium">{t('projection.peak')}</th>
                <th className="py-2 font-medium">{t('projection.earliestEntry')}</th>
              </tr>
            </thead>
            <tbody>
              {series.map((s) => {
                const p = peak(s.points)
                return (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="py-2 pr-3">
                      <button
                        className="cursor-pointer hover:underline"
                        onClick={() => open(s.id)}
                      >
                        <span
                          className="mr-2 inline-block size-2.5 rounded-full align-middle"
                          style={{ background: seriesColor(s.colorIndex) }}
                        />
                        {s.name}
                      </button>
                    </td>
                    <td className="py-1.5 pr-3">{cell(s.id, 0, s.points[0].score.total)}</td>
                    {MILESTONES.map((m) => (
                      <td key={m} className="py-1.5 pr-3">
                        {m < s.points.length ? cell(s.id, m, s.points[m].score.total) : '—'}
                      </td>
                    ))}
                    <td className="py-1.5 pr-3 font-medium">
                      {cell(
                        s.id,
                        p.monthOffset,
                        <>
                          {p.score.total}
                          <span className="text-muted-foreground ml-1 text-xs font-normal">
                            @{p.date.slice(0, 7)}
                          </span>
                        </>,
                      )}
                    </td>
                    <td className="py-1.5">
                      {(() => {
                        const entry = earliestEntry(s)
                        if (entry === null) return <span className="text-muted-foreground">—</span>
                        if (entry === 0)
                          return <span className="text-emerald-600 dark:text-emerald-500">✓</span>
                        return cell(s.id, entry, s.points[entry].date.slice(0, 7))
                      })()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
