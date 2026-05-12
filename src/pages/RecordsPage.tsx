import type { useAppData } from '../app/useAppData'

type RecordsPageProps = {
  appData: ReturnType<typeof useAppData>
}

export function RecordsPage({ appData }: RecordsPageProps) {
  return (
    <section className="page">
      <h1>Records</h1>
      <p>{appData.weights.length} weight records</p>
      <p>{appData.injections.length} injection records</p>
    </section>
  )
}
