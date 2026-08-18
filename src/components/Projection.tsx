import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Profile } from '@/engine/types'
import type { Scenario, SimulationPoint } from '@/engine/simulate'
import { simulate } from '@/engine/simulate'
import { todayIso } from '@/engine/dates'
import { defaultScenario } from '@/lib/profile'
import { describeEvent } from '@/lib/labels'
import { EventDialog } from './EventDialog'
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

const seriesColor = (index: number) => `var(--series-${index + 1})`

interface Props {
  profile: Profile
  scenarios: Scenario[]
  onChange: (scenarios: Scenario[]) => void
}

export function Projection({ profile, scenarios, onChange }: Props) {
  const [start] = useState(todayIso)

  const simulations = useMemo(
    () => scenarios.map((s) => ({ scenario: s, points: simulate(profile, s, start) })),
    [profile, scenarios, start],
  )

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

  const peak = (points: SimulationPoint[]) =>
    points.reduce((best, p) => (p.score.total > best.score.total ? p : best), points[0])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-0">
          <h3 className="font-semibold">分数推演曲线</h3>
          <p className="text-muted-foreground text-xs">
            从今天起逐月推演:年龄自动增长,工作经验按方案设置累积,事件按日期生效。
          </p>
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
                    activeDot={{ r: 4, stroke: 'var(--background)', strokeWidth: 2 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-105 text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left text-xs">
                  <th className="py-2 pr-3 font-medium">方案</th>
                  <th className="py-2 pr-3 font-medium">当前</th>
                  {MILESTONES.map((m) => (
                    <th key={m} className="py-2 pr-3 font-medium">+{m} 月</th>
                  ))}
                  <th className="py-2 font-medium">峰值</th>
                </tr>
              </thead>
              <tbody>
                {simulations.map(({ scenario, points }, i) => {
                  const p = peak(points)
                  return (
                    <tr key={scenario.id} className="border-b last:border-0">
                      <td className="py-2 pr-3">
                        <span
                          className="mr-2 inline-block size-2.5 rounded-full align-middle"
                          style={{ background: seriesColor(i) }}
                        />
                        {scenario.name}
                      </td>
                      <td className="py-2 pr-3 tabular-nums">{points[0].score.total}</td>
                      {MILESTONES.map((m) => (
                        <td key={m} className="py-2 pr-3 tabular-nums">
                          {m < points.length ? points[m].score.total : '—'}
                        </td>
                      ))}
                      <td className="py-2 tabular-nums font-medium">
                        {p.score.total}
                        <span className="text-muted-foreground ml-1 text-xs">
                          @{p.date.slice(0, 7)}
                        </span>
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
          <h3 className="font-semibold">推演方案</h3>
          <Button
            variant="outline"
            size="sm"
            disabled={scenarios.length >= MAX_SCENARIOS}
            onClick={() => onChange([...scenarios, defaultScenario(`方案 ${scenarios.length + 1}`)])}
          >
            + 新增方案
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
                  aria-label="方案名称"
                />
                <div className="flex items-center gap-2 sm:ml-auto">
                  <Label className="text-muted-foreground whitespace-nowrap text-xs">推演时长</Label>
                  <Select
                    value={String(scenario.horizonMonths)}
                    onValueChange={(v) => updateScenario(scenario.id, { horizonMonths: Number(v) })}
                  >
                    <SelectTrigger className="w-24" size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[12, 24, 36, 48, 60].map((m) => (
                        <SelectItem key={m} value={String(m)}>{m} 个月</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {scenarios.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onChange(scenarios.filter((s) => s.id !== scenario.id))}
                    >
                      删除
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-x-8 gap-y-3">
                <div className="flex items-center gap-2">
                  <Switch
                    id={`wic-${scenario.id}`}
                    checked={scenario.workingInCanada}
                    onCheckedChange={(on) => updateScenario(scenario.id, { workingInCanada: on })}
                  />
                  <Label htmlFor={`wic-${scenario.id}`} className="font-normal">
                    正在加拿大工作(经验持续累积)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id={`wa-${scenario.id}`}
                    checked={scenario.workingAbroad}
                    onCheckedChange={(on) => updateScenario(scenario.id, { workingAbroad: on })}
                  />
                  <Label htmlFor={`wa-${scenario.id}`} className="font-normal">
                    正在海外工作
                  </Label>
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
                        {describeEvent(event)}
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
                        移除
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
