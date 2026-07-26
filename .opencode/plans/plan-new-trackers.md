# Plan: Add Feed, Pump, Diaper, and Sleep Tracking

## 1. CSV Event Types

| Feature | Event type(s) | Extra column |
|---|---|---|
| Feed | `feed-breastfeed`, `feed-bottle`, `feed-solids`, `feed-combo` | none |
| Pump | `pump-start`, `pump-end` (paired) | `sides` (`left`/`right`/`both`) |
| Diaper | `diaper-wet`, `diaper-dirty`, `diaper-dry` | none |
| Sleep | `sleep-start`, `sleep-end` (paired) | none |

## 2. Files to modify

### `src/utils/csvParser.js`
- Expand `VALID_TYPES` set with all 11 new type strings
- Extract optional `sides` column from CSV rows and attach to event objects (backward compatible — existing CSVs without it still work)

### `src/utils/dataProcessors.js`
- Export the existing `formatDuration` helper
- Add 4 new processor functions:
  - `processFeed(events, locale)` — groups `feed-*` types, returns `{ feeds, dailyCounts, byType, byHour }`
  - `processPump(events, locale)` — pairs `pump-start`/`pump-end` (same algorithm as contractions), returns `{ sessions, dailyCounts, bySide }`
  - `processDiaper(events, locale)` — groups `diaper-*` types, returns `{ diapers, dailyCounts, byType, byHour }`
  - `processSleep(events, locale)` — pairs `sleep-start`/`sleep-end`, returns `{ sessions, dailyCounts, dailyHours }`

### `src/components/Dashboard.jsx`
- Add 4 new tabs: feed, pump, diaper, sleep
- Import and conditionally render the 4 new dashboard components

### `src/components/CsvUpload.jsx`
- Update `handleFile` to count new event types and include them in the summary message
- Update example CSV content in the upload area

### `src/locales/en.json` and `src/locales/pt.json`
- Add full translation blocks for each new feature (same structure as `kicks`/`contractions`)
- Update `app.subtitle` to reflect broader scope
- Update `tabs` with new tab labels (+ emojis)

## 3. New files to create

### `src/components/FeedDashboard.jsx`
- **Summary strip** (3 cards): Total feeds, count by day, most common type
- **DailyCountChart** (reused, color: amber `#f59e0b`)
- **By feed type chart** (BarChart — breastfeed/bottle/solids/combo)
- Drilldown: feed events by hour for a selected day
- Empty state when no feed data

### `src/components/PumpDashboard.jsx`
- **Summary strip** (3 cards): Total sessions, avg duration, side distribution
- **DailyCountChart** (reused, color: cyan `#06b6d4`)
- **Duration per session** (BarChart, like contractions)
- Drilldown: pump sessions by hour for a selected day
- Empty state when no pump data

### `src/components/DiaperDashboard.jsx`
- **Summary strip** (3 cards): Total changes, wet count, dirty+dry count
- **DailyCountChart** (reused, color: emerald `#10b981`)
- **By type chart** (BarChart — wet/dirty/dry)
- **By hour** (BarChart)
- Drilldown: diaper events by hour for a selected day
- Empty state when no diaper data

### `src/components/SleepDashboard.jsx`
- **Summary strip** (3 cards): Total sessions, avg duration, total hours today
- **DailyCountChart** (reused, color: indigo `#6366f1`)
- **Duration per session** (BarChart)
- **Daily total hours** (BarChart — total sleep per day)
- Drilldown: sleep sessions by hour for a selected day
- Empty state when no sleep data

## 4. Design consistency

All new dashboards follow the exact same patterns as existing ones:
- Same card styling: `rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-sm p-5 shadow-sm`
- Same chart setup: `ResponsiveContainer width="100%" height={200}`, same margins
- Same tooltip style object
- Same `ChartCard` wrapper (duplicated per file, matching existing pattern)
- Same summary strip: `grid grid-cols-3 gap-3` with stat cards
- Same translation patterns via `useTranslation`
- Same drilldown behavior via `DailyCountChart`
- Empty state message when a feature has no data

## 5. Per-feature accent colors

| Feature | Color | Hex |
|---|---|---|
| Kicks | Violet | `#7c3aed` |
| Contractions | Pink | `#ec4899` |
| Feed | Amber | `#f59e0b` |
| Pump | Cyan | `#06b6d4` |
| Diaper | Emerald | `#10b981` |
| Sleep | Indigo | `#6366f1` |

These are used for summary stat numbers, DailyCountChart bars, chart lines, and dots.
