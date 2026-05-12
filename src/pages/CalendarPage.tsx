import type { useAppData } from '../app/useAppData'

type CalendarPageProps = {
  appData: ReturnType<typeof useAppData>
}

export function CalendarPage({ appData }: CalendarPageProps) {
  return (
    <section className="page">
      <h1>Calendar</h1>
      <p>{appData.weights.length} weight records</p>
      <p>{appData.injections.length} injection records</p>
    </section>
  )
}
