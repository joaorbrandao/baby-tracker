import { useEffect, useMemo, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { format, parseISO } from 'date-fns'
import { processContractions } from '../utils/dataProcessors'
import { DATE_FNS_LOCALES } from '../i18n'
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
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage || 'en').split('-')[0]
  const dateLocale = DATE_FNS_LOCALES[lang]

  const { contractions, dailyCounts, fiveOneOne } = processContractions(events, dateLocale)

  if (contractions.length === 0) {
    return (
      <div className="text-center py-12 text-violet-400 dark:text-violet-600">
        <p className="text-4xl mb-3">🤰</p>
        <p>{t('contractions.empty')}</p>
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

  const [selectedDate, setSelectedDate] = useState(null)

  useEffect(() => {
    if (selectedDate && !dailyCounts.some(d => d.date === selectedDate)) {
      setSelectedDate(null)
    }
  }, [dailyCounts, selectedDate])

  const dayByHour = useMemo(() => {
    if (!selectedDate) return null
    const counts = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      label: `${String(h).padStart(2, '0')}:00`,
      count: 0,
    }))
    contractions.forEach(c => {
      if (format(c.start, 'yyyy-MM-dd') === selectedDate) {
        counts[c.start.getHours()].count += 1
      }
    })
    return counts
  }, [contractions, selectedDate])

  const prettyDate = selectedDate
    ? format(parseISO(selectedDate), 'PPP', dateLocale ? { locale: dateLocale } : undefined)
    : ''

  return (
    <div className="space-y-4">
      {/* 5-1-1 alert — always on top */}
      <FiveOneOneAlert result={fiveOneOne} />

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t('contractions.total'), value: totalContractions },
          { label: t('contractions.avgDuration'), value: `${avgDuration}s` },
          { label: t('contractions.avgInterval'), value: avgInterval != null ? `${avgInterval}m` : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-sm p-4 text-center shadow-sm">
            <p className="text-2xl font-serif font-bold text-pink-600 dark:text-pink-300">{value}</p>
            <p className="text-xs text-violet-500 dark:text-violet-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Daily count (with drill-down to by-hour for the clicked day) */}
      <div className="rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-sm p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="font-serif font-semibold text-violet-900 dark:text-violet-200">
              {selectedDate
                ? t('contractions.dailyChartForDay', { date: prettyDate })
                : t('contractions.dailyChart')}
            </h3>
            <p className="text-xs text-violet-500 dark:text-violet-400 mt-1">
              {selectedDate ? t('contractions.drilldownHint') : t('contractions.dailyChartHint')}
            </p>
          </div>
          {selectedDate && (
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="shrink-0 rounded-full px-3 py-1 text-xs font-medium bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-200 hover:bg-violet-200 dark:hover:bg-violet-900/60 transition-colors"
            >
              {t('contractions.backToOverview')}
            </button>
          )}
        </div>
        {selectedDate ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dayByHour} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="label" tick={{ fontSize: 9 }} stroke="var(--chart-axis)" interval={3} />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--chart-axis)" allowDecimals={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="count" fill="#ec4899" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyCounts} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--chart-axis)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--chart-axis)" allowDecimals={false} />
              <Tooltip {...tooltipStyle} />
              <Bar
                dataKey="count"
                fill="#ec4899"
                radius={[6, 6, 0, 0]}
                cursor="pointer"
                onClick={(entry) => {
                  const date = entry?.payload?.date ?? entry?.date
                  if (date) setSelectedDate(date)
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Duration per contraction */}
      <ChartCard title={t('contractions.durationChart')}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={durationData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="label" tick={{ fontSize: 9 }} stroke="var(--chart-axis)" interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--chart-axis)" unit="s" />
            <Tooltip
              {...tooltipStyle}
              formatter={(v, _, p) => [p.payload.duration, t('contractions.durationLabel')]}
            />
            <Bar dataKey="seconds" fill="#f472b6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-center text-violet-400 dark:text-violet-600 mt-2">
          {t('contractions.durationFootnote')}
        </p>
      </ChartCard>

      {/* Interval between contractions */}
      {intervalData.length > 0 && (
        <ChartCard title={t('contractions.intervalChart')}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={intervalData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="label" tick={{ fontSize: 9 }} stroke="var(--chart-axis)" interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--chart-axis)" unit="m" />
              <Tooltip {...tooltipStyle} formatter={v => [t('contractions.minutesUnit', { value: v })]} />
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
