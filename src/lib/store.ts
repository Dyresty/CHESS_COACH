import { useSyncExternalStore } from 'react'
import { reviveCard } from '../../core/srs'
import { initialState as initial } from '../../core/state'
import type { State } from '../../core/types'

const KEY = 'chess-coach:v1'

export type { Settings, State } from '../../core/types'

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

export { today } from '../../core/state'

export function resetAll() {
  setState(() => initial)
}
