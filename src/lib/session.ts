import { isDue } from './srs'
import type { State } from './store'
import { today } from './store'
import type { GameSummary, Mistake, PatternTag } from './types'

/** Pattern counts across the most recent games, biggest first, ignoring the catch-all tag. */
export function weaknessRanking(games: GameSummary[], recent = 20): { tag: PatternTag; count: number; perGame: number }[] {
  const latest = [...games].sort((a, b) => b.endTime - a.endTime).slice(0, recent)
  const counts = new Map<PatternTag, number>()
  for (const g of latest) {
    for (const [tag, n] of Object.entries(g.tags) as [PatternTag, number][]) {
      if (tag !== 'other') counts.set(tag, (counts.get(tag) ?? 0) + n)
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count, perGame: latest.length ? count / latest.length : 0 }))
    .sort((a, b) => b.count - a.count)
}

/** Today's drill queue: due reviews first, then new mistakes (your top weakness and blunders first). */
export function buildSession(state: State, now = new Date()): Mistake[] {
  const all = Object.values(state.mistakes)
  const reviews = all.filter((m) => m.card.reps > 0 && isDue(m, now)).sort((a, b) => +new Date(a.card.due) - +new Date(b.card.due))
  const focus = weaknessRanking(Object.values(state.games))[0]?.tag
  const newLeft = Math.max(0, state.settings.newPerDay - (state.newIntroduced[today()] ?? 0))
  const fresh = all
    .filter((m) => m.card.reps === 0)
    .sort((a, b) => score(b) - score(a))
    .slice(0, newLeft)
  return [...reviews, ...fresh]

  function score(m: Mistake) {
    return (m.tag === focus ? 2 : 0) + (m.severity === 'blunder' ? 1 : 0) + m.createdAt / 1e15
  }
}
