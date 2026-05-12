import type { useAppData } from '../app/useAppData'

type SettingsPageProps = {
  appData: ReturnType<typeof useAppData>
}

export function SettingsPage({ appData }: SettingsPageProps) {
  return (
    <section className="page">
      <h1>Settings</h1>
      <p>{appData.weights.length} weight records</p>
      <p>{appData.injections.length} injection records</p>
    </section>
  )
}
