import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { processPump } from '../utils/dataProcessors'
import { DATE_FNS_LOCALES } from '../i18n'
import DailyCountChart from './DailyCountChart'

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

export default function PumpDashboard({ events }) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage || 'en').split('-')[0]
  const dateLocale = DATE_FNS_LOCALES[lang]

  const { sessions, dailyCounts, bySide } = processPump(events, dateLocale)

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 text-violet-400 dark:text-violet-600">
        <p className="text-4xl mb-3">⚡</p>
        <p>{t('pump.empty')}</p>
      </div>
    )
  }

  const totalSessions = sessions.length
  const avgDuration = Math.round(
    sessions.reduce((s, c) => s + c.durationSec, 0) / totalSessions
  )

  const durationData = sessions.map(c => ({
    label: c.label,
    seconds: c.durationSec,
    duration: c.durationLabel,
  }))

  const renderDrilldown = (selectedDate) => {
    const dayByHour = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      label: `${String(h).padStart(2, '0')}:00`,
      count: 0,
    }))
    sessions.forEach(c => {
      if (format(c.start, 'yyyy-MM-dd') === selectedDate) {
        dayByHour[c.start.getHours()].count += 1
      }
    })
    return (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={dayByHour} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis dataKey="label" tick={{ fontSize: 9 }} stroke="var(--chart-axis)" interval={3} />
          <YAxis tick={{ fontSize: 11 }} stroke="var(--chart-axis)" allowDecimals={false} />
          <Tooltip {...tooltipStyle} />
          <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t('pump.total'), value: totalSessions },
          { label: t('pump.avgDuration'), value: avgDuration ? `${Math.floor(avgDuration / 60)}m ${avgDuration % 60}s` : '—' },
          { label: t('pump.bySide'), value: Object.entries(bySide).filter(([, c]) => c > 0).map(([s]) => t(`pump.side_${s}`)).join(', ') || '—' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-sm p-4 text-center shadow-sm">
            <p className="text-2xl font-serif font-bold text-cyan-600 dark:text-cyan-300">{value}</p>
            <p className="text-xs text-violet-500 dark:text-violet-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <DailyCountChart
        dailyCounts={dailyCounts}
        dateLocale={dateLocale}
        barColor="#06b6d4"
        i18nNamespace="pump"
        renderDrilldown={renderDrilldown}
      />

      <ChartCard title={t('pump.durationChart')}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={durationData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="label" tick={{ fontSize: 9 }} stroke="var(--chart-axis)" interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--chart-axis)" unit="s" />
            <Tooltip
              {...tooltipStyle}
              formatter={(v, _, p) => [p.payload.duration, t('pump.durationLabel')]}
            />
            <Bar dataKey="seconds" fill="#22d3ee" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}
