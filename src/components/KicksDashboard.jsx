import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { processKicks } from '../utils/dataProcessors'

const PERIOD_COLORS = {
  Night:     '#818cf8', // indigo-400
  Morning:   '#fb923c', // orange-400
  Afternoon: '#facc15', // yellow-400
  Evening:   '#c084fc', // purple-400
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-sm p-5 shadow-sm">
      <h3 className="font-serif font-semibold text-violet-900 dark:text-violet-200 mb-4">{title}</h3>
      {children}
    </div>
  )
}

const tooltipStyle = {
  contentStyle: {
    background: 'var(--tooltip-bg)',
    border: 'none',
    borderRadius: '12px',
    fontSize: '13px',
    color: 'var(--tooltip-text)',
  }
}

export default function KicksDashboard({ events }) {
  const { dailyCounts, byHour, byPeriod, intervals } = processKicks(events)

  const totalKicks = dailyCounts.reduce((s, d) => s + d.count, 0)
  const avgPerDay = dailyCounts.length
    ? (totalKicks / dailyCounts.length).toFixed(1)
    : 0
  const peakHour = byHour.reduce((a, b) => (b.count > a.count ? b : a), byHour[0])

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total kicks', value: totalKicks },
          { label: 'Avg per day', value: avgPerDay },
          { label: 'Peak hour', value: peakHour?.label ?? '—' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-sm p-4 text-center shadow-sm">
            <p className="text-2xl font-serif font-bold text-violet-700 dark:text-violet-300">{value}</p>
            <p className="text-xs text-violet-500 dark:text-violet-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Daily count */}
      <ChartCard title="Daily Kick Count">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dailyCounts} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--chart-axis)" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--chart-axis)" />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="count" fill="#7c3aed" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* By hour */}
      <ChartCard title="Kicks by Hour of Day">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={byHour} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="label" tick={{ fontSize: 9 }} stroke="var(--chart-axis)" interval={3} />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--chart-axis)" />
            <Tooltip {...tooltipStyle} formatter={(v, _, p) => [v, p.payload.period]} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {byHour.map((entry, i) => (
                <Cell key={i} fill={PERIOD_COLORS[entry.period]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 mt-3 justify-center">
          {Object.entries(PERIOD_COLORS).map(([period, color]) => (
            <div key={period} className="flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400">
              <span className="w-3 h-3 rounded-full inline-block" style={{ background: color }} />
              {period}
            </div>
          ))}
        </div>
      </ChartCard>

      {/* By period */}
      <ChartCard title="Kicks by Time of Day">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={byPeriod} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="var(--chart-axis)" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--chart-axis)" />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {byPeriod.map((entry, i) => (
                <Cell key={i} fill={PERIOD_COLORS[entry.period]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Average interval */}
      {intervals.length > 0 && (
        <ChartCard title="Interval Between Kicks (minutes)">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={intervals} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="label" tick={{ fontSize: 9 }} stroke="var(--chart-axis)" interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--chart-axis)" />
              <Tooltip {...tooltipStyle} formatter={v => [`${v} min`]} />
              <Line
                type="monotone"
                dataKey="minutes"
                stroke="#a78bfa"
                strokeWidth={2}
                dot={{ r: 3, fill: '#7c3aed' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  )
}
