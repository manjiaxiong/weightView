import { getCalendarMonth } from '../domain/date'
import type { InjectionRecord, WeightRecord } from '../domain/types'

type MonthCalendarProps = {
  anchorDate: string
  weights: WeightRecord[]
  injections: InjectionRecord[]
  onSelectDate: (date: string) => void
}

const weekdayLabels = ['日', '一', '二', '三', '四', '五', '六']

export function MonthCalendar({ anchorDate, weights, injections, onSelectDate }: MonthCalendarProps) {
  const days = getCalendarMonth(anchorDate)
  const weightByDate = new Map(weights.map((record) => [record.date, record]))
  const injectionByDate = new Map(injections.map((record) => [record.date, record]))

  return (
    <section className="month-calendar">
      {weekdayLabels.map((label) => (
        <div className="weekday" key={label}>
          {label}
        </div>
      ))}
      {days.map((day) => {
        const weight = weightByDate.get(day.date)
        const injection = injectionByDate.get(day.date)

        return (
          <button
            key={day.date}
            className={`calendar-day ${day.inCurrentMonth ? '' : 'muted'}`}
            type="button"
            onClick={() => onSelectDate(day.date)}
          >
            <span className="calendar-day-number">{Number(day.date.slice(-2))}</span>
            {(weight || injection) && (
              <span className="calendar-day-markers">
                {weight && <strong className="calendar-marker weight-marker">{weight.weight.toFixed(1)}</strong>}
                {injection && <small className="calendar-marker injection-marker">已注射</small>}
              </span>
            )}
          </button>
        )
      })}
    </section>
  )
}
