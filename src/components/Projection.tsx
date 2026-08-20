import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Profile } from '@/engine/types'
import type { Scenario, SimulationPoint } from '@/engine/simulate'
import { projectProfile, simulate } from '@/engine/simulate'
import { swapGain } from '@/engine/crs'
import { checkEligibility } from '@/engine/eligibility'
import { addMonths, todayIso } from '@/engine/dates'
import { defaultScenario } from '@/lib/profile'
import { describeEvent } from '@/lib/labels'
import { Pencil, Trash2, X } from 'lucide-react'
import { EventDialog } from './EventDialog'
import { ProjectionChart, seriesColor } from './ProjectionChart'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const MAX_SCENARIOS = 5
const MILESTONES = [6, 12, 24, 36]

export interface ProjectionSelection {
  scenarioId: string
  monthOffset: number
}

interface Props {
  profile: Profile
  scenarios: Scenario[]
  onChange: (scenarios: Scenario[]) => void
  selected?: ProjectionSelection | null
  onSelect?: (selection: ProjectionSelection | null) => void
}

export function Projection({ profile, scenarios, onChange, selected, onSelect }: Props) {
  const { t } = useTranslation()
  const [start] = useState(todayIso)

  const simulations = useMemo(
    () => scenarios.map((s) => ({ scenario: s, points: simulate(profile, s, start) })),
    [profile, scenarios, start],
  )

  // Highest score any month could gain by swapping the language designations
  // (a designation is freely chosen at submission time).
  const maxSwapGain = useMemo(() => {
    let max = 0
    for (const scenario of scenarios) {
      for (let offset = 0; offset <= scenario.horizonMonths; offset++) {
        const projected = projectProfile(profile, scenario, start, offset)
        max = Math.max(max, swapGain(projected, addMonths(start, offset)))
      }
    }
    return max
  }, [profile, scenarios, start])

  /** Per scenario: whether the profile qualifies for any EE program each month. */
  const eligibilityByScenario = useMemo(() => {
    const map = new Map<string, boolean[]>()
    for (const scenario of scenarios) {
      const flags: boolean[] = []
      for (let offset = 0; offset <= scenario.horizonMonths; offset++) {
        const projected = projectProfile(profile, scenario, start, offset)
        flags.push(checkEligibility(projected, addMonths(start, offset)).anyEligible)
      }
      map.set(scenario.id, flags)
    }
    return map
  }, [profile, scenarios, start])

  const chartSeries = useMemo(
    () =>
      simulations.map(({ scenario, points }, i) => ({
        id: scenario.id,
        name: scenario.name,
        colorIndex: i,
        points,
        eligible: eligibilityByScenario.get(scenario.id) ?? [],
      })),
    [simulations, eligibilityByScenario],
  )

  const earliestEntry = (scenarioId: string): number | null => {
    const flags = eligibilityByScenario.get(scenarioId) ?? []
    const idx = flags.indexOf(true)
    return idx === -1 ? null : idx
  }

  const updateScenario = (id: string, patch: Partial<Scenario>) =>
    onChange(scenarios.map((s) => (s.id === id ? { ...s, ...patch } : s)))

  const select = (scenarioId: string, monthOffset: number) => {
    if (!onSelect) return
    onSelect(
      selected?.scenarioId === scenarioId && selected.monthOffset === monthOffset
        ? null
        : { scenarioId, monthOffset },
    )
  }

  const peak = (points: SimulationPoint[]) =>
    points.reduce((best, p) => (p.score.total > best.score.total ? p : best), points[0])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-0">
          <h3 className="font-semibold">{t('projection.chartTitle')}</h3>
          <p className="text-muted-foreground text-xs">{t('projection.chartHint')}</p>
          {maxSwapGain > 0 && (
            <p className="rounded-md bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-700 dark:text-amber-500">
              {t('projection.swapHint', { n: maxSwapGain })}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <ProjectionChart
            series={chartSeries}
            selected={
              selected ? { seriesId: selected.scenarioId, monthOffset: selected.monthOffset } : null
            }
            onSelectPoint={(id, offset) => select(id, offset)}
          />

          <div className="no-scrollbar mt-4 overflow-x-auto">
            <table className="w-full text-sm sm:min-w-105">
              <thead>
                <tr className="text-muted-foreground border-b text-left text-xs">
                  <th className="py-2 pr-2 font-medium sm:pr-3">{t('projection.scenarioCol')}</th>
                  <th className="py-2 pr-2 font-medium sm:pr-3">{t('projection.current')}</th>
                  {MILESTONES.map((m) => (
                    <th key={m} className="py-2 pr-2 font-medium sm:pr-3">{t('projection.plusMonths', { m })}</th>
                  ))}
                  <th className="hidden py-2 pr-2 font-medium sm:pr-3 sm:table-cell">{t('projection.peak')}</th>
                  <th className="hidden py-2 font-medium sm:table-cell">{t('projection.earliestEntry')}</th>
                </tr>
              </thead>
              <tbody>
                {simulations.map(({ scenario, points }, i) => {
                  const p = peak(points)
                  const cell = (offset: number, label: React.ReactNode) => {
                    const isSelected =
                      selected?.scenarioId === scenario.id && selected.monthOffset === offset
                    return (
                      <button
                        className={`cursor-pointer rounded px-1 py-0.5 tabular-nums ${
                          isSelected
                            ? 'bg-primary text-primary-foreground font-medium'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => select(scenario.id, offset)}
                      >
                        {label}
                      </button>
                    )
                  }
                  return (
                    <tr key={scenario.id} className="border-b last:border-0">
                      <td className="py-2 pr-2 sm:pr-3">
                        <span className="flex max-w-24 items-center sm:max-w-none">
                          <span
                            className="mr-2 inline-block size-2.5 shrink-0 rounded-full"
                            style={{ background: seriesColor(i) }}
                          />
                          <span className="truncate">{scenario.name}</span>
                        </span>
                      </td>
                      <td className="py-1.5 pr-2 sm:pr-3">{cell(0, points[0].score.total)}</td>
                      {MILESTONES.map((m) => (
                        <td key={m} className="py-1.5 pr-2 sm:pr-3">
                          {m < points.length ? cell(m, points[m].score.total) : '—'}
                        </td>
                      ))}
                      <td className="hidden py-1.5 pr-2 sm:pr-3 font-medium sm:table-cell">
                        {cell(
                          p.monthOffset,
                          <>
                            {p.score.total}
                            <span className="text-muted-foreground ml-1 text-xs font-normal">
                              @{p.date.slice(0, 7)}
                            </span>
                          </>,
                        )}
                      </td>
                      <td className="hidden py-1.5 sm:table-cell">
                        {(() => {
                          const entry = earliestEntry(scenario.id)
                          if (entry === null) return <span className="text-muted-foreground">—</span>
                          if (entry === 0) return <span>✓</span>
                          return cell(entry, points[entry].date.slice(0, 7))
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

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{t('projection.scenarios')}</h3>
          <Button
            variant="outline"
            size="sm"
            disabled={scenarios.length >= MAX_SCENARIOS}
            onClick={() =>
              onChange([
                ...scenarios,
                defaultScenario(t('projection.defaultScenarioName', { n: scenarios.length + 1 })),
              ])
            }
          >
            {t('projection.addScenario')}
          </Button>
        </div>

        {simulations.map(({ scenario }, i) => (
          <Card key={scenario.id}>
            <CardContent className="space-y-4 pt-4">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="inline-block size-2.5 shrink-0 rounded-full"
                  style={{ background: seriesColor(i) }}
                />
                <Input
                  value={scenario.name}
                  className="min-w-0 flex-1 sm:max-w-56 sm:flex-none"
                  onChange={(e) => updateScenario(scenario.id, { name: e.target.value })}
                  aria-label={t('projection.scenarioName')}
                />
                <div className="order-last flex w-full items-center justify-between gap-4 sm:order-none sm:ml-auto sm:w-auto sm:gap-2">
                  <Label htmlFor={`pin-${scenario.id}`} className="font-normal">
                    {t('projection.showOnHome')}
                  </Label>
                  <Switch
                    id={`pin-${scenario.id}`}
                    checked={scenario.pinned}
                    onCheckedChange={(on) => updateScenario(scenario.id, { pinned: on })}
                  />
                </div>
                <div className="order-last flex w-full items-center justify-between gap-4 sm:hidden">
                  <Label className="font-normal">{t('projection.horizon')}</Label>
                  <Select
                    value={String(scenario.horizonMonths)}
                    onValueChange={(v) => updateScenario(scenario.id, { horizonMonths: Number(v) })}
                  >
                    <SelectTrigger className="w-32" size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[12, 24, 36, 48, 60].map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {t('projection.horizonMonths', { m })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                {scenario.events
                  .slice()
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((event) => (
                    <div
                      key={event.id}
                      className="bg-muted/50 flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm"
                    >
                      <div>
                        <span className="text-muted-foreground mr-2 font-mono text-xs">
                          {event.date}
                        </span>
                        {describeEvent(t, event)}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <EventDialog
                          profile={profile}
                          event={event}
                          onSave={(updated) =>
                            updateScenario(scenario.id, {
                              events: scenario.events.map((e) =>
                                e.id === updated.id ? updated : e,
                              ),
                            })
                          }
                          trigger={
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={t('events.edit')}
                              className="text-muted-foreground"
                            >
                              <Pencil className="size-4" />
                            </Button>
                          }
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={t('projection.remove')}
                          className="text-muted-foreground"
                          onClick={() =>
                            updateScenario(scenario.id, {
                              events: scenario.events.filter((e) => e.id !== event.id),
                            })
                          }
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                <div className="flex flex-wrap items-center gap-3">
                  <EventDialog
                    profile={profile}
                    onSave={(event) =>
                      updateScenario(scenario.id, { events: [...scenario.events, event] })
                    }
                  />
                  <Label className="text-muted-foreground hidden text-xs font-normal sm:flex sm:items-center sm:gap-2">
                    {t('projection.horizon')}
                    <Select
                      value={String(scenario.horizonMonths)}
                      onValueChange={(v) =>
                        updateScenario(scenario.id, { horizonMonths: Number(v) })
                      }
                    >
                      <SelectTrigger className="w-32" size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[12, 24, 36, 48, 60].map((m) => (
                          <SelectItem key={m} value={String(m)}>
                            {t('projection.horizonMonths', { m })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Label>
                  {scenarios.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={t('projection.delete')}
                      className="text-muted-foreground ml-auto shrink-0"
                      onClick={() => onChange(scenarios.filter((s) => s.id !== scenario.id))}
                    >
                      <Trash2 className="size-4" />
                      <span className="hidden sm:inline">{t('projection.delete')}</span>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
