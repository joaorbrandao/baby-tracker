import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { processFeed } from '../utils/dataProcessors'
import { DATE_FNS_LOCALES } from '../i18n'
import DailyCountChart from './DailyCountChart'

const FEED_TYPE_COLORS = {
  breastfeed: '#a78bfa',
  bottle: '#60a5fa',
  solids: '#fbbf24',
  combo: '#34d399',
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

export default function FeedDashboard({ events }) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage || 'en').split('-')[0]
  const dateLocale = DATE_FNS_LOCALES[lang]

  const { feeds, dailyCounts, byType, byHour } = processFeed(events, dateLocale)

  if (feeds.length === 0) {
    return (
      <div className="text-center py-12 text-violet-400 dark:text-violet-600">
        <p className="text-4xl mb-3">🍼</p>
        <p>{t('feed.empty')}</p>
      </div>
    )
  }

  const totalFeeds = feeds.length
  const today = format(new Date(), 'yyyy-MM-dd')
  const todayCount = feeds.filter(e => format(e.datetime, 'yyyy-MM-dd') === today).length
  const mostCommon = byType.reduce((a, b) => (b.count > a.count ? b : a), byType[0])

  const renderDrilldown = (selectedDate) => {
    const dayEvents = events.filter(
      e => e.type.startsWith('feed-') && format(e.datetime, 'yyyy-MM-dd') === selectedDate
    )
    const dayByHour = processFeed(dayEvents, dateLocale).byHour
    return (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={dayByHour} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis dataKey="label" tick={{ fontSize: 9 }} stroke="var(--chart-axis)" interval={3} />
          <YAxis tick={{ fontSize: 11 }} stroke="var(--chart-axis)" allowDecimals={false} />
          <Tooltip {...tooltipStyle} formatter={(v, _, p) => [v, t('feed.minutesUnit', { value: v })]} />
          <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t('feed.total'), value: totalFeeds },
          { label: t('feed.totalToday'), value: todayCount },
          { label: t('feed.mostCommon'), value: mostCommon.count > 0 ? t(`feed.${mostCommon.type}`) : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-sm p-4 text-center shadow-sm">
            <p className="text-2xl font-serif font-bold text-amber-600 dark:text-amber-300">{value}</p>
            <p className="text-xs text-violet-500 dark:text-violet-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <DailyCountChart
        dailyCounts={dailyCounts}
        dateLocale={dateLocale}
        barColor="#f59e0b"
        i18nNamespace="feed"
        renderDrilldown={renderDrilldown}
      />

      <ChartCard title={t('feed.byTypeChart')}>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={byType.map(p => ({ ...p, typeLabel: t(`feed.${p.type}`) }))}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="typeLabel" tick={{ fontSize: 12 }} stroke="var(--chart-axis)" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--chart-axis)" />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {byType.map((entry, i) => (
                <Cell key={i} fill={FEED_TYPE_COLORS[entry.type]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 mt-3 justify-center">
          {byType.map(({ type }) => (
            <div key={type} className="flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400">
              <span className="w-3 h-3 rounded-full inline-block" style={{ background: FEED_TYPE_COLORS[type] }} />
              {t(`feed.${type}`)}
            </div>
          ))}
        </div>
      </ChartCard>

      {byHour.some(h => h.count > 0) && (
        <ChartCard title={t('feed.byHourChart')}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byHour} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="label" tick={{ fontSize: 9 }} stroke="var(--chart-axis)" interval={3} />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--chart-axis)" />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  )
}
