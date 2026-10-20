import AsyncStorage from '@react-native-async-storage/async-storage'
import { useSyncExternalStore } from 'react'
import { initialState } from '../../../core/state'
import { reviveCard } from '../../../core/srs'
import type { State } from '../../../core/types'

const KEY = 'chess-coach:v1'

let state: State = initialState
const listeners = new Set<() => void>()
let saveTimer: ReturnType<typeof setTimeout> | null = null

export async function hydrate() {
  try {
    const raw = await AsyncStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as State
      for (const m of Object.values(parsed.mistakes)) m.card = reviveCard(m.card)
      state = { ...initialState, ...parsed, settings: { ...initialState.settings, ...parsed.settings } }
    }
  } catch {
    state = initialState
  }
  listeners.forEach((l) => l())
}

export function getState(): State {
  return state
}

export function setState(update: (s: State) => State) {
  state = update(state)
  listeners.forEach((l) => l())
  // Batch writes: a drill session updates state on every answer.
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => void AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => undefined), 300)
}

/** Subscribe to a slice of state. The selector must return a stable reference (a slice, not a new object). */
export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => select(state),
  )
}

export function resetAll() {
  setState(() => initialState)
}
