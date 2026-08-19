import { useMemo } from 'react'
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
import type { SimulationPoint } from '@/engine/simulate'

export const seriesColor = (index: number) => `var(--series-${(index % 8) + 1})`

export interface ChartSeries {
  id: string
  name: string
  colorIndex: number
  points: SimulationPoint[]
  /** Whether any EE program qualifies each month (solid vs dashed segments). */
  eligible: boolean[]
}

interface Props {
  series: ChartSeries[]
  selected?: { seriesId: string; monthOffset: number } | null
  onSelectPoint?: (seriesId: string, monthOffset: number) => void
}

/** Monthly score curves with dashed segments while no EE program qualifies. */
export function ProjectionChart({ series, selected, onSelectPoint }: Props) {
  const chartData = useMemo(() => {
    const maxLen = Math.max(0, ...series.map((s) => s.points.length))
    const rows: Array<Record<string, number | string | null>> = []
    for (let offset = 0; offset < maxLen; offset++) {
      const withDate = series.find((s) => offset < s.points.length)
      const row: Record<string, number | string | null> = {
        date: withDate?.points[offset]?.date ?? '',
        offset,
      }
      for (const s of series) {
        if (offset >= s.points.length) continue
        const total = s.points[offset].score.total
        const ok = s.eligible[offset] ?? true
        const last = s.points.length - 1
        // Solid line while eligible; dashed while not, extended one point into
        // eligible territory at each boundary so the segments connect.
        row[s.id] = ok ? total : null
        const boundary =
          (offset > 0 && s.eligible[offset - 1] === false) ||
          (offset < last && s.eligible[offset + 1] === false)
        row[`${s.id}:no`] = !ok || boundary ? total : null
      }
      rows.push(row)
    }
    return rows
  }, [series])

  const selectedPoint = useMemo(() => {
    if (!selected) return null
    const s = series.find((x) => x.id === selected.seriesId)
    const point = s?.points[selected.monthOffset]
    return point && s
      ? { date: point.date, total: point.score.total, colorIndex: s.colorIndex }
      : null
  }, [selected, series])

  const dotClick = (seriesId: string) => (...args: unknown[]) => {
    if (!onSelectPoint) return
    const dot = args.find(
      (a): a is { payload: { offset: number } } =>
        typeof a === 'object' && a !== null && 'payload' in a,
    )
    if (dot) onSelectPoint(seriesId, dot.payload.offset)
  }

  const activeDot = (seriesId: string) => ({
    r: 5,
    stroke: 'var(--background)',
    strokeWidth: 2,
    cursor: 'pointer',
    onClick: dotClick(seriesId),
  })

  return (
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
              series.find((s) => s.id === name)?.name ?? String(name),
            ]}
            labelFormatter={(d) => String(d).slice(0, 7)}
            contentStyle={{
              background: 'var(--popover)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--popover-foreground)',
            }}
          />
          {series.length > 1 && (
            <Legend formatter={(id) => series.find((s) => s.id === id)?.name ?? id} />
          )}
          {series.map((s) => (
            <Line
              key={`${s.id}:no`}
              type="stepAfter"
              dataKey={`${s.id}:no`}
              stroke={seriesColor(s.colorIndex)}
              strokeWidth={2}
              strokeDasharray="4 4"
              strokeOpacity={0.55}
              dot={false}
              legendType="none"
              tooltipType="none"
              activeDot={activeDot(s.id)}
            />
          ))}
          {series.map((s) => (
            <Line
              key={s.id}
              type="stepAfter"
              dataKey={s.id}
              stroke={seriesColor(s.colorIndex)}
              strokeWidth={2}
              dot={false}
              activeDot={activeDot(s.id)}
            />
          ))}
          {selectedPoint && (
            <ReferenceDot
              x={selectedPoint.date}
              y={selectedPoint.total}
              r={7}
              fill={seriesColor(selectedPoint.colorIndex)}
              stroke="var(--background)"
              strokeWidth={2}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
