import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { processContractions } from '../utils/dataProcessors'
import FiveOneOneAlert from './FiveOneOneAlert'

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

export default function ContractionsDashboard({ events }) {
  const { contractions, dailyCounts, fiveOneOne } = processContractions(events)

  if (contractions.length === 0) {
    return (
      <div className="text-center py-12 text-violet-400 dark:text-violet-600">
        <p className="text-4xl mb-3">🤰</p>
        <p>No contractions found in this CSV.</p>
      </div>
    )
  }

  const totalContractions = contractions.length
  const avgDuration = Math.round(
    contractions.reduce((s, c) => s + c.durationSec, 0) / totalContractions
  )
  const intervalsWithData = contractions.filter(c => c.intervalMin !== null)
  const avgInterval = intervalsWithData.length
    ? Math.round(intervalsWithData.reduce((s, c) => s + c.intervalMin, 0) / intervalsWithData.length)
    : null

  const durationData = contractions.map(c => ({
    label: c.label,
    seconds: c.durationSec,
    duration: c.durationLabel,
  }))

  const intervalData = contractions
    .filter(c => c.intervalMin !== null)
    .map(c => ({ label: c.label, minutes: c.intervalMin }))

  return (
    <div className="space-y-4">
      {/* 5-1-1 alert — always on top */}
      <FiveOneOneAlert result={fiveOneOne} />

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: totalContractions },
          { label: 'Avg duration', value: `${avgDuration}s` },
          { label: 'Avg interval', value: avgInterval != null ? `${avgInterval}m` : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-sm p-4 text-center shadow-sm">
            <p className="text-2xl font-serif font-bold text-pink-600 dark:text-pink-300">{value}</p>
            <p className="text-xs text-violet-500 dark:text-violet-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Daily count */}
      <ChartCard title="Daily Contraction Count">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dailyCounts} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--chart-axis)" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--chart-axis)" allowDecimals={false} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="count" fill="#ec4899" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Duration per contraction */}
      <ChartCard title="Duration per Contraction">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={durationData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="label" tick={{ fontSize: 9 }} stroke="var(--chart-axis)" interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--chart-axis)" unit="s" />
            <Tooltip
              {...tooltipStyle}
              formatter={(v, _, p) => [p.payload.duration, 'Duration']}
            />
            <Bar dataKey="seconds" fill="#f472b6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-center text-violet-400 dark:text-violet-600 mt-2">
          45s threshold for 5-1-1 rule shown as reference
        </p>
      </ChartCard>

      {/* Interval between contractions */}
      {intervalData.length > 0 && (
        <ChartCard title="Interval Between Contractions (minutes)">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={intervalData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="label" tick={{ fontSize: 9 }} stroke="var(--chart-axis)" interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--chart-axis)" unit="m" />
              <Tooltip {...tooltipStyle} formatter={v => [`${v} min`]} />
              <Line
                type="monotone"
                dataKey="minutes"
                stroke="#f9a8d4"
                strokeWidth={2}
                dot={{ r: 3, fill: '#ec4899' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  )
}
