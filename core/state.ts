import type { State } from './types'

export const initialState: State = {
  settings: { username: '', timeClass: 'rapid', safetyCheck: true, newPerDay: 10 },
  games: {},
  mistakes: {},
  newIntroduced: {},
  activity: {},
}

/** Local calendar day as yyyy-mm-dd. */
export function today(now = new Date()): string {
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${m}-${d}`
}

/** Consecutive days with training, counting today or yesterday as the latest. */
export function streak(activity: Record<string, number> = {}, now = new Date()): number {
  let count = 0
  const day = new Date(now)
  if (!activity[today(day)]) day.setDate(day.getDate() - 1)
  while (activity[today(day)]) {
    count++
    day.setDate(day.getDate() - 1)
  }
  return count
}
