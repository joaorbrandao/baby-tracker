import { format, differenceInSeconds, differenceInMinutes } from 'date-fns'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function dateKey(dt) {
  return format(dt, 'yyyy-MM-dd')
}

function hourOf(dt) {
  return dt.getHours()
}

function periodOf(hour) {
  if (hour < 6) return 'Night'
  if (hour < 12) return 'Morning'
  if (hour < 18) return 'Afternoon'
  return 'Evening'
}

// ─── Baby Kicks ───────────────────────────────────────────────────────────────

/**
 * @param {Array<{type: string, datetime: Date}>} events
 */
export function processKicks(events, locale = undefined) {
  const fmtOpts = locale ? { locale } : undefined
  const kicks = events.filter(e => e.type === 'baby-kick')

  // Daily counts
  const dailyMap = {}
  kicks.forEach(e => {
    const key = dateKey(e.datetime)
    dailyMap[key] = (dailyMap[key] || 0) + 1
  })
  const dailyCounts = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))

  // By hour (0–23)
  const hourMap = {}
  kicks.forEach(e => {
    const h = hourOf(e.datetime)
    hourMap[h] = (hourMap[h] || 0) + 1
  })
  const byHour = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    label: `${String(h).padStart(2, '0')}:00`,
    count: hourMap[h] || 0,
    period: periodOf(h),
  }))

  // By period
  const periodOrder = ['Night', 'Morning', 'Afternoon', 'Evening']
  const periodMap = {}
  kicks.forEach(e => {
    const p = periodOf(hourOf(e.datetime))
    periodMap[p] = (periodMap[p] || 0) + 1
  })
  const byPeriod = periodOrder.map(period => ({
    period,
    count: periodMap[period] || 0,
  }))

  // Average interval between kicks (minutes)
  const intervals = []
  for (let i = 1; i < kicks.length; i++) {
    const mins = differenceInMinutes(kicks[i].datetime, kicks[i - 1].datetime)
    if (mins < 1440) { // ignore gaps > 24h (different sessions)
      intervals.push({
        index: i,
        label: format(kicks[i].datetime, 'MMM d HH:mm', fmtOpts),
        minutes: mins,
      })
    }
  }

  return { kicks, dailyCounts, byHour, byPeriod, intervals }
}

// ─── Contractions ─────────────────────────────────────────────────────────────

/**
 * Pairs contraction-start with the next contraction-end.
 * Returns paired contractions with duration + interval.
 */
export function processContractions(events, locale = undefined) {
  const fmtOpts = locale ? { locale } : undefined
  const starts = events.filter(e => e.type === 'contraction-start')
  const ends = events.filter(e => e.type === 'contraction-end')

  // Pair each start with the first end that comes after it
  const paired = []
  let endIdx = 0
  starts.forEach(start => {
    while (endIdx < ends.length && ends[endIdx].datetime <= start.datetime) {
      endIdx++
    }
    const end = ends[endIdx] ?? null
    if (end) {
      const durationSec = differenceInSeconds(end.datetime, start.datetime)
      paired.push({
        start: start.datetime,
        end: end.datetime,
        durationSec,
      })
      endIdx++ // consume this end
    }
  })

  // Compute interval between consecutive starts (minutes)
  paired.forEach((c, i) => {
    if (i === 0) {
      c.intervalMin = null
    } else {
      c.intervalMin = differenceInMinutes(c.start, paired[i - 1].start)
    }
    c.label = format(c.start, 'MMM d HH:mm', fmtOpts)
    c.date = dateKey(c.start)
    c.durationLabel = formatDuration(c.durationSec)
  })

  // Daily counts
  const dailyMap = {}
  paired.forEach(c => {
    dailyMap[c.date] = (dailyMap[c.date] || 0) + 1
  })
  const dailyCounts = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))

  // 5-1-1 rule: contractions ≤5 min apart, each ≥1 min long, pattern sustained ≥1 hour
  const fiveOneOne = detect511(paired, fmtOpts)

  return { contractions: paired, dailyCounts, fiveOneOne }
}

function formatDuration(sec) {
  if (sec < 60) return `${sec}s`
  return `${Math.floor(sec / 60)}m ${sec % 60}s`
}

/**
 * Detect 5-1-1 rule: a run of consecutive contractions where each lasts ≥1 min,
 * each is ≤5 min apart (start-to-start), and the run spans ≥1 hour.
 */
function detect511(contractions, fmtOpts = undefined) {
  let i = 0
  while (i < contractions.length) {
    if (contractions[i].durationSec < 60) {
      i++
      continue
    }

    let j = i + 1
    while (
      j < contractions.length &&
      contractions[j].durationSec >= 60 &&
      contractions[j].intervalMin !== null &&
      contractions[j].intervalMin <= 5
    ) {
      j++
    }

    const runLength = j - i
    if (runLength >= 2) {
      const spanMin = differenceInMinutes(contractions[j - 1].start, contractions[i].start)
      if (spanMin >= 60) {
        return {
          triggered: true,
          at: contractions[i].start,
          label: format(contractions[i].start, 'MMM d, yyyy HH:mm', fmtOpts),
          count: runLength,
        }
      }
    }

    // Skip forward: the contraction that broke the run may itself start a new run.
    i = Math.max(j, i + 1)
  }

  return { triggered: false }
}
