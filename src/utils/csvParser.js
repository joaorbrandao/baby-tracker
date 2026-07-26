import Papa from 'papaparse'

const VALID_TYPES = new Set([
  'baby-kick',
  'contraction-start', 'contraction-end',
  'feed-breastfeed', 'feed-bottle', 'feed-solids', 'feed-combo',
  'pump-start', 'pump-end',
  'diaper-wet', 'diaper-dirty', 'diaper-dry',
  'sleep-start', 'sleep-end',
])

const PARSER_OPTIONS = {
  header: true,
  skipEmptyLines: true,
}

function processResults(results) {
  const warnings = []

  if (!results.meta.fields.includes('type') || !results.meta.fields.includes('date_time')) {
    throw new Error('CSV must have columns: type, date_time')
  }

  const events = []
  results.data.forEach((row, i) => {
    const lineNum = i + 2 // 1-indexed + header row
    const type = row.type?.trim()
    const raw = row.date_time?.trim()

    if (!type || !raw) {
      warnings.push(`Row ${lineNum}: missing type or date_time — skipped`)
      return
    }

    if (!VALID_TYPES.has(type)) {
      warnings.push(`Row ${lineNum}: unknown type "${type}" — skipped`)
      return
    }

    // Parse as local time by replacing space with T (avoids UTC interpretation)
    const datetime = new Date(raw.replace(' ', 'T'))
    if (isNaN(datetime.getTime())) {
      warnings.push(`Row ${lineNum}: invalid date_time "${raw}" — skipped`)
      return
    }

    const extra = {}
    if (row.sides?.trim()) extra.sides = row.sides.trim()
    events.push({ type, datetime, ...extra })
  })

  // Sort ascending
  events.sort((a, b) => a.datetime - b.datetime)

  return { events, warnings }
}

/**
 * Parse a CSV file or string and return sorted events + any parse warnings.
 * @param {File | string} fileOrCsv
 * @returns {Promise<{ events: Array<{type: string, datetime: Date}>, warnings: string[] }>}
 */
export function parseCsv(fileOrCsv) {
  if (typeof fileOrCsv === 'string') {
    return Promise.resolve(processResults(Papa.parse(fileOrCsv, PARSER_OPTIONS)))
  }

  return new Promise((resolve, reject) => {
    Papa.parse(fileOrCsv, {
      ...PARSER_OPTIONS,
      complete(results) {
        try {
          resolve(processResults(results))
        } catch (err) {
          reject(err)
        }
      },
      error(err) {
        reject(new Error(`CSV parse error: ${err.message}`))
      }
    })
  })
}
