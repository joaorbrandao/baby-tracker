import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { processDiaper } from '../utils/dataProcessors'
import { DATE_FNS_LOCALES } from '../i18n'
import DailyCountChart from './DailyCountChart'

const DIAPER_TYPE_COLORS = {
  wet: '#60a5fa',
  dirty: '#a78bfa',
  dry: '#34d399',
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

export default function DiaperDashboard({ events }) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage || 'en').split('-')[0]
  const dateLocale = DATE_FNS_LOCALES[lang]

  const { diapers, dailyCounts, byType, byHour } = processDiaper(events, dateLocale)

  if (diapers.length === 0) {
    return (
      <div className="text-center py-12 text-violet-400 dark:text-violet-600">
        <p className="text-4xl mb-3">🧷</p>
        <p>{t('diaper.empty')}</p>
      </div>
    )
  }

  const totalChanges = diapers.length
  const wetCount = byType.find(t => t.type === 'wet')?.count ?? 0
  const dirtyCount = byType.find(t => t.type === 'dirty')?.count ?? 0
  const dryCount = byType.find(t => t.type === 'dry')?.count ?? 0

  const renderDrilldown = (selectedDate) => {
    const dayEvents = events.filter(
      e => e.type.startsWith('diaper-') && format(e.datetime, 'yyyy-MM-dd') === selectedDate
    )
    const dayByHour = processDiaper(dayEvents, dateLocale).byHour
    return (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={dayByHour} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis dataKey="label" tick={{ fontSize: 9 }} stroke="var(--chart-axis)" interval={3} />
          <YAxis tick={{ fontSize: 11 }} stroke="var(--chart-axis)" allowDecimals={false} />
          <Tooltip {...tooltipStyle} formatter={(v, _, p) => [v, t('diaper.minutesUnit', { value: v })]} />
          <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t('diaper.total'), value: totalChanges },
          { label: t('diaper.wetCount'), value: wetCount },
          { label: t('diaper.dirtyCount'), value: dirtyCount },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-sm p-4 text-center shadow-sm">
            <p className="text-2xl font-serif font-bold text-emerald-600 dark:text-emerald-300">{value}</p>
            <p className="text-xs text-violet-500 dark:text-violet-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <DailyCountChart
        dailyCounts={dailyCounts}
        dateLocale={dateLocale}
        barColor="#10b981"
        i18nNamespace="diaper"
        renderDrilldown={renderDrilldown}
      />

      <ChartCard title={t('diaper.byTypeChart')}>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={byType.map(p => ({ ...p, typeLabel: t(`diaper.${p.type}`) }))}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="typeLabel" tick={{ fontSize: 12 }} stroke="var(--chart-axis)" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--chart-axis)" />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {byType.map((entry, i) => (
                <Cell key={i} fill={DIAPER_TYPE_COLORS[entry.type]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 mt-3 justify-center">
          {byType.map(({ type }) => (
            <div key={type} className="flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400">
              <span className="w-3 h-3 rounded-full inline-block" style={{ background: DIAPER_TYPE_COLORS[type] }} />
              {t(`diaper.${type}`)}
            </div>
          ))}
        </div>
      </ChartCard>

      {byHour.some(h => h.count > 0) && (
        <ChartCard title={t('diaper.byHourChart')}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byHour} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="label" tick={{ fontSize: 9 }} stroke="var(--chart-axis)" interval={3} />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--chart-axis)" />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  )
}
