import { useState } from 'react'

import { BottomNav, type AppTab } from '../components/BottomNav'
import { CalendarPage } from '../pages/CalendarPage'
import { HomePage } from '../pages/HomePage'
import { RecordsPage } from '../pages/RecordsPage'
import { SettingsPage } from '../pages/SettingsPage'
import { useAppData } from './useAppData'

export function App() {
  const appData = useAppData()
  const [tab, setTab] = useState<AppTab>('home')

  if (appData.loadState === 'loading') {
    return <main className="app-shell centered">Loading...</main>
  }

  if (appData.loadState === 'error') {
    return <main className="app-shell centered">{appData.error}</main>
  }

  return (
    <main className="app-shell">
      <div className="app-content">
        {appData.saveError && (
          <p className="app-save-error" role="alert">
            {appData.saveError}
          </p>
        )}
        {tab === 'home' && <HomePage appData={appData} />}
        {tab === 'calendar' && <CalendarPage appData={appData} />}
        {tab === 'records' && <RecordsPage appData={appData} />}
        {tab === 'settings' && <SettingsPage appData={appData} />}
      </div>
      <BottomNav activeTab={tab} onChange={setTab} />
    </main>
  )
}
