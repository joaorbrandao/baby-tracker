import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { processFeed, processPump, processDiaper, processSleep } from './dataProcessors.js'

const fixture = JSON.parse(
  readFileSync(new URL('../../test/new-trackers.json', import.meta.url), 'utf8')
)

function toDateEvent(e) {
  return {
    ...e,
    datetime: new Date(e.datetime.replace(' ', 'T')),
  }
}

describe('new tracker processors', () => {
  const events = fixture.events.map(toDateEvent)

  it('processFeed counts daily, by type, and by hour', () => {
    const result = processFeed(events)

    expect(result.feeds).toHaveLength(fixture.expected.feed.totalFeeds)
    expect(result.dailyCounts).toEqual(fixture.expected.feed.dailyCounts)
    expect(result.byType).toEqual([
      { type: 'breastfeed', count: 2 },
      { type: 'bottle', count: 1 },
      { type: 'solids', count: 1 },
      { type: 'combo', count: 1 },
    ])
    Object.entries(fixture.expected.feed.byHour).forEach(([hour, count]) => {
      expect(result.byHour[Number(hour)].count).toBe(count)
    })
  })

  it('processPump pairs sessions, captures sides, and counts daily', () => {
    const result = processPump(events)

    expect(result.sessions).toHaveLength(fixture.expected.pump.totalSessions)
    expect(result.dailyCounts).toEqual(fixture.expected.pump.dailyCounts)
    expect(result.bySide).toEqual(fixture.expected.pump.bySide)

    const actualDurations = result.sessions.map(s => s.durationSec).sort((a, b) => a - b)
    const expectedDurations = [...fixture.expected.pump.durations].sort((a, b) => a - b)
    expect(actualDurations).toEqual(expectedDurations)
  })

  it('processDiaper counts daily, by type, and by hour', () => {
    const result = processDiaper(events)

    expect(result.diapers).toHaveLength(fixture.expected.diaper.totalChanges)
    expect(result.dailyCounts).toEqual(fixture.expected.diaper.dailyCounts)
    expect(result.byType).toEqual([
      { type: 'wet', count: 2 },
      { type: 'dirty', count: 1 },
      { type: 'dry', count: 1 },
    ])
    Object.entries(fixture.expected.diaper.byHour).forEach(([hour, count]) => {
      expect(result.byHour[Number(hour)].count).toBe(count)
    })
  })

  it('processSleep pairs sessions, counts daily, and sums daily hours', () => {
    const result = processSleep(events)

    expect(result.sessions).toHaveLength(fixture.expected.sleep.totalSessions)
    expect(result.dailyCounts).toEqual(fixture.expected.sleep.dailyCounts)

    const actualDurations = result.sessions.map(s => s.durationSec).sort((a, b) => a - b)
    const expectedDurations = [...fixture.expected.sleep.durations].sort((a, b) => a - b)
    expect(actualDurations).toEqual(expectedDurations)

    Object.entries(fixture.expected.sleep.dailyHours).forEach(([date, hours]) => {
      expect(result.dailyHours.find(d => d.date === date).hours).toBe(hours)
    })
  })
})
