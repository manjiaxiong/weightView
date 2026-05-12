export type AppTab = 'home' | 'calendar' | 'records' | 'settings'

type BottomNavProps = {
  activeTab: AppTab
  onChange: (tab: AppTab) => void
}

const tabs: Array<{ id: AppTab; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'records', label: 'Records' },
  { id: 'settings', label: 'Settings' }
]

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {tabs.map((tab) => (
        <button
          className={tab.id === activeTab ? 'active' : undefined}
          key={tab.id}
          type="button"
          aria-current={tab.id === activeTab ? 'page' : undefined}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
