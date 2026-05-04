import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { parseCsv } from '../utils/csvParser'

const FILE_EXTENSIONS = ['.csv', '.txt', '.md']

export default function CsvUpload({ onData }) {
  const inputRef = useRef(null)
  const { t } = useTranslation()
  const [dragging, setDragging] = useState(false)
  const [status, setStatus] = useState(null) // { type: 'success'|'error'|'warning', message }
  const [warnings, setWarnings] = useState([])

  async function handleFile(file) {
    if (!file) return
    if (!FILE_EXTENSIONS.some(ext => file.name.endsWith(ext))) {
      setStatus({
        type: 'error',
        message: t('upload.errorBadExtension', { extensions: FILE_EXTENSIONS.join(', ') }),
      })
      return
    }
    setStatus(null)
    setWarnings([])
    try {
      const { events, warnings: w } = await parseCsv(file)
      setWarnings(w)
      if (events.length === 0) {
        setStatus({ type: 'error', message: t('upload.errorNoEvents') })
        return
      }
      const kickCount = events.filter(e => e.type === 'baby-kick').length
      const contractionCount = events.filter(e => e.type === 'contraction-start').length
      setStatus({
        type: w.length > 0 ? 'warning' : 'success',
        message: t('upload.loaded', {
          count: events.length,
          kicks: kickCount,
          contractions: contractionCount,
        }),
      })
      onData(events)
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    }
  }

  function onInputChange(e) {
    handleFile(e.target.files[0])
    e.target.value = '' // allow re-uploading same file
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const borderColor = dragging
    ? 'border-violet-500 dark:border-mauve-400'
    : 'border-dashed border-violet-300 dark:border-violet-700'

  return (
    <section className="w-full max-w-2xl mx-auto px-4">
      <div
        className={`relative rounded-2xl border-2 ${borderColor} bg-white/60 dark:bg-white/5 backdrop-blur-sm p-8 text-center transition-colors cursor-pointer`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        aria-label={t('upload.ariaLabel')}
      >
        <input
          ref={inputRef}
          type="file"
          accept={FILE_EXTENSIONS.join(',')}
          className="sr-only"
          onChange={onInputChange}
        />

        <div className="flex flex-col items-center gap-3">
          <span className="text-5xl select-none" aria-hidden>📋</span>
          <p className="font-serif text-lg font-semibold text-violet-900 dark:text-violet-200">
            {t('upload.title')}
          </p>
          <p className="text-sm text-violet-600 dark:text-violet-400">
            {t('upload.extensionsHint', { extensions: FILE_EXTENSIONS.join('/') })}
          </p>
          <div className="text-xs text-violet-400 dark:text-violet-600 font-mono">
            {t('upload.exampleLabel')}<br />
            <p className="mt-1 text-xs text-violet-400 dark:text-violet-600 font-mono">
              <span className="font-semibold">type,date_time</span><br />
              <span className="font-semibold">baby-kick,2026-04-27 14:30:00</span><br />
              <span className="font-semibold">contraction-start,2026-04-27 15:30:00</span><br />
              <span className="font-semibold">contraction-end,2026-04-27 15:30:00</span>
            </p>
          </div>
        </div>
      </div>

      {status && (
        <div className={`mt-3 rounded-xl px-4 py-3 text-sm ${
          status.type === 'error'
            ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
            : status.type === 'warning'
            ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
            : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
        }`}>
          {status.message}
        </div>
      )}

      {warnings.length > 0 && (
        <details className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          <summary className="cursor-pointer select-none">
            {t('upload.warningsToggle', { count: warnings.length })}
          </summary>
          <ul className="mt-1 space-y-1 pl-4 list-disc">
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </details>
      )}
    </section>
  )
}
