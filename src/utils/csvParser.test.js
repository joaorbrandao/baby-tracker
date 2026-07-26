import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseCsv } from './csvParser.js'

function loadCsvText(name) {
  const path = resolve(process.cwd(), 'test', name)
  return readFileSync(path, 'utf8')
}

describe('parseCsv', () => {
  it('parses all new tracker event types and extracts the optional sides column', async () => {
    const csv = loadCsvText('new-trackers.csv')
    const { events, warnings } = await parseCsv(csv)

    expect(warnings).toHaveLength(0)
    expect(events).toHaveLength(19)

    expect(events.filter(e => e.type.startsWith('feed-'))).toHaveLength(5)
    expect(events.filter(e => e.type.startsWith('diaper-'))).toHaveLength(4)
    expect(events.filter(e => e.type.startsWith('sleep-'))).toHaveLength(4)

    const pumpStarts = events.filter(e => e.type === 'pump-start')
    expect(pumpStarts).toHaveLength(3)
    expect(pumpStarts.map(e => e.sides)).toEqual(['left', 'both', 'right'])

    // Events are sorted ascending by datetime
    for (let i = 1; i < events.length; i++) {
      expect(events[i].datetime.getTime()).toBeGreaterThanOrEqual(events[i - 1].datetime.getTime())
    }
  })
})
