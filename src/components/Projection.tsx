import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Profile } from '@/engine/types'
import type { Scenario, SimulationPoint } from '@/engine/simulate'
import { projectProfile, simulate } from '@/engine/simulate'
import { swapGain } from '@/engine/crs'
import { addMonths, todayIso } from '@/engine/dates'
import { defaultScenario } from '@/lib/profile'
import { describeEvent } from '@/lib/labels'
import { EventDialog } from './EventDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const MAX_SCENARIOS = 5
const MILESTONES = [6, 12, 24, 36]

const seriesColor = (index: number) => `var(--series-${index + 1})`

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

  const maxHorizon = Math.max(0, ...scenarios.map((s) => s.horizonMonths))
  const chartData = useMemo(() => {
    const rows: Array<Record<string, number | string>> = []
    for (let offset = 0; offset <= maxHorizon; offset++) {
      const row: Record<string, number | string> = {
        date: simulations[0]?.points[Math.min(offset, simulations[0].points.length - 1)]?.date ?? '',
        offset,
      }
      for (const { scenario, points } of simulations) {
        if (offset < points.length) row[scenario.id] = points[offset].score.total
      }
      rows.push(row)
    }
    return rows
  }, [simulations, maxHorizon])

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

  const selectedPoint = useMemo(() => {
    if (!selected) return null
    const sim = simulations.find((s) => s.scenario.id === selected.scenarioId)
    const point = sim?.points[selected.monthOffset]
    return point ? { ...selected, date: point.date, total: point.score.total } : null
  }, [selected, simulations])

  const seriesIndex = (scenarioId: string) => scenarios.findIndex((s) => s.id === scenarioId)

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
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d: string) => d.slice(0, 7)}
                  minTickGap={48}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border)' }}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value, name) => [
                    value,
                    scenarios.find((s) => s.id === name)?.name ?? String(name),
                  ]}
                  labelFormatter={(d) => String(d)}
                  contentStyle={{
                    background: 'var(--popover)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    color: 'var(--popover-foreground)',
                  }}
                />
                {scenarios.length > 1 && (
                  <Legend formatter={(id) => scenarios.find((s) => s.id === id)?.name ?? id} />
                )}
                {scenarios.map((s, i) => (
                  <Line
                    key={s.id}
                    type="stepAfter"
                    dataKey={s.id}
                    stroke={seriesColor(i)}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{
                      r: 5,
                      stroke: 'var(--background)',
                      strokeWidth: 2,
                      cursor: 'pointer',
                      onClick: (...args: unknown[]) => {
                        const dot = args.find(
                          (a): a is { payload: { offset: number } } =>
                            typeof a === 'object' && a !== null && 'payload' in a,
                        )
                        if (dot) select(s.id, dot.payload.offset)
                      },
                    }}
                  />
                ))}
                {selectedPoint && (
                  <ReferenceDot
                    x={selectedPoint.date}
                    y={selectedPoint.total}
                    r={7}
                    fill={seriesColor(seriesIndex(selectedPoint.scenarioId))}
                    stroke="var(--background)"
                    strokeWidth={2}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-105 text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left text-xs">
                  <th className="py-2 pr-3 font-medium">{t('projection.scenarioCol')}</th>
                  <th className="py-2 pr-3 font-medium">{t('projection.current')}</th>
                  {MILESTONES.map((m) => (
                    <th key={m} className="py-2 pr-3 font-medium">{t('projection.plusMonths', { m })}</th>
                  ))}
                  <th className="py-2 font-medium">{t('projection.peak')}</th>
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
                        className={`cursor-pointer rounded px-1 py-0.5 tabular-nums hover:bg-muted ${
                          isSelected ? 'bg-sky-500/10 font-medium text-sky-700 dark:text-sky-400' : ''
                        }`}
                        onClick={() => select(scenario.id, offset)}
                      >
                        {label}
                      </button>
                    )
                  }
                  return (
                    <tr key={scenario.id} className="border-b last:border-0">
                      <td className="py-2 pr-3">
                        <span
                          className="mr-2 inline-block size-2.5 rounded-full align-middle"
                          style={{ background: seriesColor(i) }}
                        />
                        {scenario.name}
                      </td>
                      <td className="py-1.5 pr-3">{cell(0, points[0].score.total)}</td>
                      {MILESTONES.map((m) => (
                        <td key={m} className="py-1.5 pr-3">
                          {m < points.length ? cell(m, points[m].score.total) : '—'}
                        </td>
                      ))}
                      <td className="py-1.5 font-medium">
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
                  className="w-36 sm:w-48"
                  onChange={(e) => updateScenario(scenario.id, { name: e.target.value })}
                  aria-label={t('projection.scenarioName')}
                />
                <div className="flex items-center gap-2 sm:ml-auto">
                  <Label className="text-muted-foreground whitespace-nowrap text-xs">
                    {t('projection.horizon')}
                  </Label>
                  <Select
                    value={String(scenario.horizonMonths)}
                    onValueChange={(v) => updateScenario(scenario.id, { horizonMonths: Number(v) })}
                  >
                    <SelectTrigger className="w-24" size="sm">
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
                  {scenarios.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onChange(scenarios.filter((s) => s.id !== scenario.id))}
                    >
                      {t('projection.delete')}
                    </Button>
                  )}
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
                        <span className="text-muted-foreground mr-2 tabular-nums text-xs">
                          {event.date}
                        </span>
                        {describeEvent(t, event)}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground shrink-0"
                        onClick={() =>
                          updateScenario(scenario.id, {
                            events: scenario.events.filter((e) => e.id !== event.id),
                          })
                        }
                      >
                        {t('projection.remove')}
                      </Button>
                    </div>
                  ))}
                <EventDialog
                  profile={profile}
                  onAdd={(event) =>
                    updateScenario(scenario.id, { events: [...scenario.events, event] })
                  }
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
