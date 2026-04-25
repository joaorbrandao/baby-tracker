import Papa from 'papaparse'

const VALID_TYPES = new Set(['baby-kick', 'contraction-start', 'contraction-end'])

/**
 * Parse a CSV file and return sorted events + any parse warnings.
 * @param {File} file
 * @returns {Promise<{ events: Array<{type: string, datetime: Date}>, warnings: string[] }>}
 */
export function parseCsv(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const warnings = []

        if (!results.meta.fields.includes('type') || !results.meta.fields.includes('date_time')) {
          reject(new Error('CSV must have columns: type, date_time'))
          return
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

          events.push({ type, datetime })
        })

        // Sort ascending
        events.sort((a, b) => a.datetime - b.datetime)

        resolve({ events, warnings })
      },
      error(err) {
        reject(new Error(`CSV parse error: ${err.message}`))
      }
    })
  })
}
