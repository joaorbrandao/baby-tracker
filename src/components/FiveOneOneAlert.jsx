export default function FiveOneOneAlert({ result }) {
  if (result.triggered) {
    return (
      <div className="rounded-2xl p-5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700">
        <div className="flex items-start gap-4">
          <span className="text-3xl" aria-hidden>🚨</span>
          <div>
            <p className="font-serif font-semibold text-red-800 dark:text-red-200 text-lg">
              5-1-1 Rule Triggered
            </p>
            <p className="text-red-700 dark:text-red-300 text-sm mt-1">
              {result.count} contractions detected within a 1-hour window starting{' '}
              <strong>{result.label}</strong>, each lasting ≥45s with ≤5 min between them.
            </p>
            <p className="text-red-600 dark:text-red-400 text-sm mt-2 font-semibold">
              Consider contacting your healthcare provider.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-5 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700">
      <div className="flex items-start gap-4">
        <span className="text-3xl" aria-hidden>✅</span>
        <div>
          <p className="font-serif font-semibold text-green-800 dark:text-green-200 text-lg">
            5-1-1 Rule — Not Yet Triggered
          </p>
          <p className="text-green-700 dark:text-green-300 text-sm mt-1">
            No period detected with 5+ contractions/hour, each ≥45s, spaced ≤5 min apart.
          </p>
        </div>
      </div>
    </div>
  )
}
