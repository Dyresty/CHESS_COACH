import type { Score } from './types'

/** Winning chances (0 to 1) for the side the score belongs to, using lichess's curve. */
export function winChance(score: Score): number {
  if (score.mate !== undefined) {
    if (score.mate === 0) return 0
    return score.mate > 0 ? 1 : 0
  }
  const cp = Math.max(-1000, Math.min(1000, score.cp ?? 0))
  return 1 / (1 + Math.exp(-0.00368208 * cp))
}

export function negate(score: Score): Score {
  if (score.mate !== undefined) return { mate: -score.mate }
  return { cp: -(score.cp ?? 0) }
}
