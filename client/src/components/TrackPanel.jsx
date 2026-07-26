import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'

const FEED_TYPES = ['feed-breastfeed', 'feed-bottle', 'feed-solids', 'feed-combo']
const DIAPER_TYPES = ['diaper-wet', 'diaper-dirty', 'diaper-dry']
const PUMP_SIDES = ['left', 'right', 'both']

function buttonClass(disabled, colorClass) {
  return `rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
    disabled ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110'
  } ${colorClass}`
}

export default function TrackPanel({ events, setEvents }) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null)
  const [pumpSide, setPumpSide] = useState('both')

  const lastEvent = events.length > 0 ? events[events.length - 1] : null

  const nextType = (start, end) => (lastEvent?.type === start ? end : start)
  const contractionNext = nextType('contraction-start', 'contraction-end')
  const sleepNext = nextType('sleep-start', 'sleep-end')
  const pumpNext = nextType('pump-start', 'pump-end')

  async function track(type, extra = {}) {
    setSaving(true)
    setStatus(null)
    try {
      const body = { type, datetime: new Date().toISOString(), ...extra }
      const created = await api.post('/events', body)
      const event = { ...created, datetime: new Date(created.datetime) }
      setEvents((prev) => [...prev, event].sort((a, b) => a.datetime - b.datetime))
      setStatus({ type: 'success', message: t('track.saved', { type: t(`track.${type}`) }) })
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  async function undoLast() {
    if (!lastEvent) return
    setSaving(true)
    setStatus(null)
    try {
      await api.del(`/events/${lastEvent.id}`)
      setEvents((prev) => prev.filter((e) => e.id !== lastEvent.id))
      setStatus({ type: 'success', message: t('track.undone') })
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  function TypeButton({ type, color, icon, label }) {
    return (
      <button
        disabled={saving}
        onClick={() => track(type)}
        className={buttonClass(saving, color)}
      >
        {icon} {label || t(`track.${type}`)}
      </button>
    )
  }

  return (
    <section className="w-full max-w-2xl mx-auto px-4">
      <div className="rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-sm p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg font-semibold text-violet-900 dark:text-violet-200">
            {t('track.title')}
          </h2>
          {lastEvent && (
            <button
              disabled={saving}
              onClick={undoLast}
              className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-200 underline disabled:no-underline disabled:opacity-50"
            >
              {t('track.undo')} {t(`track.${lastEvent.type}`)}
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <TypeButton
              type="baby-kick"
              icon="👶"
              color="bg-violet-100 dark:bg-violet-800 text-violet-800 dark:text-violet-100"
            />
            <TypeButton
              type={contractionNext}
              icon="🤰"
              color="bg-pink-100 dark:bg-pink-800 text-pink-800 dark:text-pink-100"
            />
            <TypeButton
              type={sleepNext}
              icon="😴"
              color="bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-100"
            />
          </div>

          <div>
            <p className="text-xs font-medium text-violet-600 dark:text-violet-400 mb-2">
              {t('track.feedTitle')}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {FEED_TYPES.map((type) => (
                <TypeButton
                  key={type}
                  type={type}
                  color="bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-100"
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-violet-600 dark:text-violet-400 mb-2">
              {t('track.pumpTitle')}
            </p>
            {pumpNext === 'pump-start' ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={pumpSide}
                  onChange={(e) => setPumpSide(e.target.value)}
                  disabled={saving}
                  className="rounded-xl border border-violet-200 dark:border-violet-700 bg-white dark:bg-white/10 px-3 py-2.5 text-sm text-violet-900 dark:text-violet-100"
                >
                  {PUMP_SIDES.map((side) => (
                    <option key={side} value={side}>
                      {t(`track.pump.${side}`)}
                    </option>
                  ))}
                </select>
                <button
                  disabled={saving}
                  onClick={() => track('pump-start', { sides: pumpSide })}
                  className={buttonClass(
                    saving,
                    'bg-cyan-100 dark:bg-cyan-800 text-cyan-800 dark:text-cyan-100 flex-1',
                  )}
                >
                  ⚡ {t('track.pump.start')}
                </button>
              </div>
            ) : (
              <button
                disabled={saving}
                onClick={() => track('pump-end')}
                className={buttonClass(
                  saving,
                  'bg-cyan-100 dark:bg-cyan-800 text-cyan-800 dark:text-cyan-100 w-full',
                )}
              >
                ⚡ {t('track.pump.end')}
              </button>
            )}
          </div>

          <div>
            <p className="text-xs font-medium text-violet-600 dark:text-violet-400 mb-2">
              {t('track.diaperTitle')}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {DIAPER_TYPES.map((type) => (
                <TypeButton
                  key={type}
                  type={type}
                  color="bg-emerald-100 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100"
                />
              ))}
            </div>
          </div>
        </div>

        {status && (
          <div
            className={`mt-4 rounded-xl px-4 py-3 text-sm ${
              status.type === 'error'
                ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
            }`}
          >
            {status.message}
          </div>
        )}
      </div>
    </section>
  )
}
