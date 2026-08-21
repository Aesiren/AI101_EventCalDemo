// Pure date-grouping helper for the calendar view (US-3.1, FR-10). Builds one entry per day of
// the reference date's month, each carrying the events that land on it. `referenceDate` is a
// parameter rather than read internally (new Date()) — same reasoning as store.ts's injectable
// clock: keeps this deterministic and directly testable.
//
// Grouping compares the first 10 characters of Event.dateTime ('YYYY-MM-DD') rather than parsing
// it into a Date and re-formatting — timezone handling is explicitly out of scope (see
// docs/05-spec.md's NFR), so no conversion should ever be applied to that string.

import type { Event } from '../types'

export interface CalendarDay {
  /** 'YYYY-MM-DD' */
  date: string
  dayOfMonth: number
  events: Event[]
}

export function groupEventsByDate(events: Event[], referenceDate: Date): CalendarDay[] {
  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth() // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`

  const days: CalendarDay[] = []
  for (let dayOfMonth = 1; dayOfMonth <= daysInMonth; dayOfMonth++) {
    const date = `${monthPrefix}-${String(dayOfMonth).padStart(2, '0')}`
    days.push({
      date,
      dayOfMonth,
      events: events.filter(e => e.dateTime.slice(0, 10) === date)
    })
  }
  return days
}
