import type { useAppData } from '../app/useAppData'

type HomePageProps = {
  appData: ReturnType<typeof useAppData>
}

export function HomePage({ appData }: HomePageProps) {
  return (
    <section className="page">
      <h1>Home</h1>
      <p>{appData.weights.length} weight records</p>
      <p>{appData.injections.length} injection records</p>
    </section>
  )
}
