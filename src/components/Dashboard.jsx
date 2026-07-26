import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import KicksDashboard from './KicksDashboard'
import ContractionsDashboard from './ContractionsDashboard'
import FeedDashboard from './FeedDashboard'
import PumpDashboard from './PumpDashboard'
import DiaperDashboard from './DiaperDashboard'
import SleepDashboard from './SleepDashboard'

export default function Dashboard({ events }) {
  const [active, setActive] = useState('kicks')
  const { t } = useTranslation()

  const tabs = [
    { id: 'kicks', label: t('tabs.kicks') },
    { id: 'contractions', label: t('tabs.contractions') },
    { id: 'feed', label: t('tabs.feed') },
    { id: 'pump', label: t('tabs.pump') },
    { id: 'diaper', label: t('tabs.diaper') },
    { id: 'sleep', label: t('tabs.sleep') },
  ]

  return (
    <section className="w-full max-w-2xl mx-auto px-4 pb-12">
      {/* Tab bar */}
      <div className="flex rounded-2xl bg-violet-100 dark:bg-white/5 p-1 mb-6 gap-1 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              active === tab.id
                ? 'bg-white dark:bg-violet-700 text-violet-900 dark:text-white shadow-sm'
                : 'text-violet-500 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {active === 'kicks' && <KicksDashboard events={events} />}
      {active === 'contractions' && <ContractionsDashboard events={events} />}
      {active === 'feed' && <FeedDashboard events={events} />}
      {active === 'pump' && <PumpDashboard events={events} />}
      {active === 'diaper' && <DiaperDashboard events={events} />}
      {active === 'sleep' && <SleepDashboard events={events} />}
    </section>
  )
}
