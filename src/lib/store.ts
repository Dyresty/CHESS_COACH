import { useSyncExternalStore } from 'react'
import { reviveCard } from './srs'
import type { GameSummary, Mistake } from './types'

const KEY = 'chess-coach:v1'

export interface Settings {
  username: string
  timeClass: string
  safetyCheck: boolean
  newPerDay: number
}

export interface State {
  settings: Settings
  games: Record<string, GameSummary>
  mistakes: Record<string, Mistake>
  /** yyyy-mm-dd -> number of new mistakes introduced that day */
  newIntroduced: Record<string, number>
}

const initial: State = {
  settings: { username: '', timeClass: 'rapid', safetyCheck: true, newPerDay: 10 },
  games: {},
  mistakes: {},
  newIntroduced: {},
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return initial
    const parsed = JSON.parse(raw) as State
    for (const m of Object.values(parsed.mistakes)) m.card = reviveCard(m.card)
    return { ...initial, ...parsed, settings: { ...initial.settings, ...parsed.settings } }
  } catch {
    return initial
  }
}

let state = load()
const listeners = new Set<() => void>()

export function getState(): State {
  return state
}

export function setState(update: (s: State) => State) {
  state = update(state)
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Storage full or blocked: keep working in memory.
  }
  listeners.forEach((l) => l())
}

export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => select(state),
  )
}

export function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function resetAll() {
  setState(() => initial)
}
