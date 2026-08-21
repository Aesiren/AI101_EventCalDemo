// Pure date helpers for the calendar view (US-3.1, FR-10). `referenceDate`/`date` are always
// parameters rather than read internally (new Date()) — same reasoning as store.ts's injectable
// clock: keeps these deterministic and directly testable. calendar.vue is the one place in the
// app that actually reads the system clock, for both the navigable month grid and the
// independent "today" panel (Milestone 7) — tests control it via Vitest's fake timers.
//
// Date comparisons compare 'YYYY-MM-DD' keys rather than parsing Event.dateTime into a Date and
// re-formatting — timezone handling is explicitly out of scope (see docs/05-spec.md's NFR), so no
// conversion should ever be applied to that string.

import type { Event } from '../types'

export interface CalendarDay {
  /** 'YYYY-MM-DD' */
  date: string
  dayOfMonth: number
  events: Event[]
}

/** Formats a Date as 'YYYY-MM-DD' using local date components (no UTC conversion). */
export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function groupEventsByDate(events: Event[], referenceDate: Date): CalendarDay[] {
  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth() // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const days: CalendarDay[] = []
  for (let dayOfMonth = 1; dayOfMonth <= daysInMonth; dayOfMonth++) {
    const date = toDateKey(new Date(year, month, dayOfMonth))
    days.push({
      date,
      dayOfMonth,
      events: events.filter(e => e.dateTime.slice(0, 10) === date)
    })
  }
  return days
}

/** Events landing on exactly the given date — used by calendar.vue's "today" panel, independent
 * of whichever month the grid itself is currently browsing to (TC-3.1-06/07). */
export function filterEventsOnDate(events: Event[], date: Date): Event[] {
  const key = toDateKey(date)
  return events.filter(e => e.dateTime.slice(0, 10) === key)
}
