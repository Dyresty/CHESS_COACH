import { analyseGame } from '../../../core/analyse'
import { fetchRecentGames } from '../../../core/chesscom'
import type { ImportedGame } from '../../../core/types'
import { engine } from '../engine/engine'
import { getState, setState } from '../state/store'

export interface ImportProgress {
  game: number
  games: number
  fraction: number
}

/** Analyses games one at a time, saving each as soon as it's done. Returns how many were analysed. */
export async function analyseAndSave(games: ImportedGame[], onProgress: (p: ImportProgress) => void): Promise<number> {
  const fresh = games.filter((g) => !getState().games[g.id])
  let analysed = 0
  for (let i = 0; i < fresh.length; i++) {
    let result
    try {
      result = await analyseGame(fresh[i], engine.evaluate, {
        depth: 11,
        onProgress: (done, total) => onProgress({ game: i + 1, games: fresh.length, fraction: done / total }),
      })
    } catch (e) {
      // One unreadable game shouldn't stop the rest of the import.
      console.warn('Skipped game', fresh[i].url, e)
      continue
    }
    const { summary, mistakes } = result
    analysed++
    setState((s) => {
      const merged = { ...s.mistakes }
      for (const m of mistakes) merged[m.id] ??= m
      return { ...s, games: { ...s.games, [summary.id]: summary }, mistakes: merged }
    })
  }
  return analysed
}

export async function importFromChessCom(onProgress: (p: ImportProgress) => void, limit = 10): Promise<number> {
  const { username, timeClass } = getState().settings
  const games = await fetchRecentGames(username, { limit, timeClass: timeClass === 'all' ? undefined : timeClass })
  return analyseAndSave(games, onProgress)
}
