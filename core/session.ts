import { isDue } from './srs'
import { today } from './state'
import type { GameSummary, Mistake, PatternTag, SafetyItem, State } from './types'

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

export interface SafetyQuestion extends SafetyItem {
  id: string
  safe: boolean
  /** Set for unsafe moves: the mistake this came from. */
  mistake?: Mistake
}

const UNSAFE_TAGS = new Set<PatternTag>(['hung-piece', 'missed-threat', 'allowed-mate'])

/** A shuffled mix of your real blunders and your real good moves, about half each. */
export function buildSafetyQuiz(state: State, size = 10, random = Math.random): SafetyQuestion[] {
  const unsafe: SafetyQuestion[] = Object.values(state.mistakes)
    .filter((m) => UNSAFE_TAGS.has(m.tag))
    .map((m) => ({ id: `u:${m.id}`, fen: m.fen, uci: m.playedUci, san: m.played, moveNumber: m.moveNumber, safe: false, mistake: m }))
  const safe: SafetyQuestion[] = Object.values(state.games).flatMap((g) =>
    (g.safeMoves ?? []).map((s, i) => ({ ...s, id: `s:${g.id}:${i}`, safe: true })),
  )
  const pick = (list: SafetyQuestion[], n: number) => shuffle(list, random).slice(0, n)
  const half = Math.ceil(size / 2)
  const chosen = [...pick(unsafe, half), ...pick(safe, size - Math.min(half, unsafe.length))]
  return shuffle(chosen, random).slice(0, size)
}

function shuffle<T>(list: T[], random: () => number): T[] {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
