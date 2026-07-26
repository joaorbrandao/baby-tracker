export const VALID_EVENT_TYPES = [
  'baby-kick',
  'contraction-start',
  'contraction-end',
  'feed-breastfeed',
  'feed-bottle',
  'feed-solids',
  'feed-combo',
  'pump-start',
  'pump-end',
  'diaper-wet',
  'diaper-dirty',
  'diaper-dry',
  'sleep-start',
  'sleep-end',
] as const

export type EventType = (typeof VALID_EVENT_TYPES)[number]

export const VALID_PUMP_SIDES = ['left', 'right', 'both'] as const
