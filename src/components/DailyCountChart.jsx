import { useEffect, useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'

const tooltipStyle = {
  contentStyle: {
    background: 'var(--tooltip-bg)',
    border: 'none',
    borderRadius: '12px',
    fontSize: '13px',
    color: 'var(--tooltip-text)',
  }
}

/**
 * Daily count bar chart with month navigation and per-day drill-down.
 *
 * @param {Array<{date: string, count: number}>} dailyCounts — sorted ascending by date.
 * @param {Locale} [dateLocale] — date-fns locale.
 * @param {string} barColor — fill color for daily bars.
 * @param {string} i18nNamespace — translation namespace (e.g., 'kicks', 'contractions').
 *        Must expose: dailyChart, dailyChartHint, dailyChartForDay, drilldownHint,
 *        backToOverview, prevMonth, nextMonth.
 * @param {(selectedDate: string) => ReactNode} renderDrilldown — renders the per-day chart.
 */
export default function DailyCountChart({
  dailyCounts,
  dateLocale,
  barColor,
  i18nNamespace,
  renderDrilldown,
}) {
  const { t } = useTranslation()
  const tn = (key, opts) => t(`${i18nNamespace}.${key}`, opts)

  const [selectedDate, setSelectedDate] = useState(null)

  useEffect(() => {
    if (selectedDate && !dailyCounts.some(d => d.date === selectedDate)) {
      setSelectedDate(null)
    }
  }, [dailyCounts, selectedDate])

  const availableMonths = useMemo(() => {
    const set = new Set(dailyCounts.map(d => d.date.slice(0, 7)))
    return [...set].sort()
  }, [dailyCounts])

  const defaultMonth = useMemo(() => {
    if (availableMonths.length === 0) return null
    const currentMonth = format(new Date(), 'yyyy-MM')
    return availableMonths.includes(currentMonth)
      ? currentMonth
      : availableMonths[availableMonths.length - 1]
  }, [availableMonths])

  const [selectedMonth, setSelectedMonth] = useState(defaultMonth)

  useEffect(() => {
    if (!selectedMonth || !availableMonths.includes(selectedMonth)) {
      setSelectedMonth(defaultMonth)
    }
  }, [defaultMonth, availableMonths, selectedMonth])

  const monthDailyCounts = useMemo(() => {
    if (!selectedMonth) return []
    const monthStart = startOfMonth(parseISO(`${selectedMonth}-01`))
    const monthEnd = endOfMonth(monthStart)
    const counts = Object.fromEntries(dailyCounts.map(d => [d.date, d.count]))
    return eachDayOfInterval({ start: monthStart, end: monthEnd }).map(d => {
      const key = format(d, 'yyyy-MM-dd')
      return {
        date: key,
        label: format(d, 'd', dateLocale ? { locale: dateLocale } : undefined),
        count: counts[key] || 0,
      }
    })
  }, [selectedMonth, dailyCounts, dateLocale])

  const currentMonthIdx = selectedMonth ? availableMonths.indexOf(selectedMonth) : -1
  const canPrevMonth = currentMonthIdx > 0
  const canNextMonth = currentMonthIdx >= 0 && currentMonthIdx < availableMonths.length - 1
  const monthLabel = selectedMonth
    ? format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy', dateLocale ? { locale: dateLocale } : undefined)
    : ''

  const goToMonth = (idx) => {
    setSelectedDate(null)
    setSelectedMonth(availableMonths[idx])
  }

  const prettyDate = selectedDate
    ? format(parseISO(selectedDate), 'PPP', dateLocale ? { locale: dateLocale } : undefined)
    : ''

  return (
    <div className="rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-sm p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="font-serif font-semibold text-violet-900 dark:text-violet-200">
            {selectedDate ? tn('dailyChartForDay', { date: prettyDate }) : tn('dailyChart')}
          </h3>
          <p className="text-xs text-violet-500 dark:text-violet-400 mt-1">
            {selectedDate ? tn('drilldownHint') : tn('dailyChartHint')}
          </p>
          {!selectedDate && selectedMonth && (
            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                disabled={!canPrevMonth}
                onClick={() => goToMonth(currentMonthIdx - 1)}
                aria-label={tn('prevMonth')}
                className="rounded-full w-7 h-7 flex items-center justify-center text-sm font-medium bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-200 hover:bg-violet-200 dark:hover:bg-violet-900/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ‹
              </button>
              <span className="text-sm font-medium text-violet-700 dark:text-violet-300 min-w-[8rem] text-center capitalize">
                {monthLabel}
              </span>
              <button
                type="button"
                disabled={!canNextMonth}
                onClick={() => goToMonth(currentMonthIdx + 1)}
                aria-label={tn('nextMonth')}
                className="rounded-full w-7 h-7 flex items-center justify-center text-sm font-medium bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-200 hover:bg-violet-200 dark:hover:bg-violet-900/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ›
              </button>
            </div>
          )}
        </div>
        {selectedDate && (
          <button
            type="button"
            onClick={() => setSelectedDate(null)}
            className="shrink-0 rounded-full px-3 py-1 text-xs font-medium bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-200 hover:bg-violet-200 dark:hover:bg-violet-900/60 transition-colors"
          >
            {tn('backToOverview')}
          </button>
        )}
      </div>
      {selectedDate ? (
        renderDrilldown(selectedDate)
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthDailyCounts} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--chart-axis)" interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--chart-axis)" allowDecimals={false} />
            <Tooltip {...tooltipStyle} labelFormatter={(_, payload) => {
              const iso = payload?.[0]?.payload?.date
              return iso
                ? format(parseISO(iso), 'PPP', dateLocale ? { locale: dateLocale } : undefined)
                : ''
            }} />
            <Bar
              dataKey="count"
              fill={barColor}
              radius={[6, 6, 0, 0]}
              cursor="pointer"
              onClick={(entry) => {
                const date = entry?.payload?.date ?? entry?.date
                if (date && (entry?.payload?.count ?? entry?.count) > 0) {
                  setSelectedDate(date)
                }
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
