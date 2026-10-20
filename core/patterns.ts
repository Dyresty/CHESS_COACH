import { Chess, type Move } from 'chess.js'
import type { Color, EvalResult, PatternTag } from './types'

const VALUE: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

export const PATTERNS: Record<PatternTag, { label: string; why: string; habit: string }> = {
  'hung-piece': {
    label: 'Hung a piece',
    why: 'This move left a piece where your opponent could take it.',
    habit: 'Before you let go of a piece, ask: can it be taken on its new square, and is it defended?',
  },
  'missed-threat': {
    label: 'Missed their threat',
    why: 'Your opponent was already attacking something, and this move did not deal with it.',
    habit: 'After every opponent move, ask: what does that move attack?',
  },
  'missed-free-piece': {
    label: 'Missed a free piece',
    why: 'You could have won material here.',
    habit: 'Before every move, look at every capture you can make.',
  },
  'missed-mate': {
    label: 'Missed checkmate',
    why: 'You had a forced checkmate in this position.',
    habit: 'Always look at every check you have first.',
  },
  'allowed-mate': {
    label: 'Allowed checkmate',
    why: 'This move let your opponent force checkmate.',
    habit: 'Ask: which checks does my opponent have after my move?',
  },
  other: {
    label: 'Better move missed',
    why: 'There was a clearly stronger move here.',
    habit: 'Compare two or three candidate moves before choosing.',
  },
}

export function materialBalance(chess: Chess, color: Color): number {
  let total = 0
  for (const row of chess.board()) {
    for (const sq of row) {
      if (!sq) continue
      total += sq.color === color ? VALUE[sq.type] : -VALUE[sq.type]
    }
  }
  return total
}

/** Plays UCI moves from a position, stopping at the first illegal one. Returns the moves played. */
export function playLine(chess: Chess, uciMoves: string[]): Move[] {
  const played: Move[] = []
  for (const uci of uciMoves) {
    try {
      played.push(chess.move(uciToMove(uci)))
    } catch {
      break
    }
  }
  return played
}

export function uciToMove(uci: string) {
  return { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }
}

/** Material change for `color` after playing `line` from `fen`. */
function materialAfter(fen: string, line: string[], color: Color): { change: number; moves: Move[] } {
  const chess = new Chess(fen)
  const start = materialBalance(chess, color)
  const moves = playLine(chess, line)
  return { change: materialBalance(chess, color) - start, moves }
}

/** Could the side not to move capture on `square` right now (ignoring whose turn it is)? */
function wasAlreadyAttacked(fen: string, square: string, attacker: Color): boolean {
  const parts = fen.split(' ')
  parts[1] = attacker
  parts[3] = '-'
  try {
    const chess = new Chess(parts.join(' '))
    return chess.moves({ verbose: true }).some((m) => m.to === square && m.captured)
  } catch {
    return false
  }
}

const LOOKAHEAD = 4

/**
 * Names the most likely cause of a mistake, using the engine's lines.
 * `before` is the search from the position before the user's move (user to move),
 * `after` the search from the position after it (opponent to move).
 */
export function tagMistake(fen: string, playedUci: string, before: EvalResult, after: EvalResult): PatternTag {
  const user = fen.split(' ')[1] as Color
  const opponent: Color = user === 'w' ? 'b' : 'w'

  if (before.score.mate !== undefined && before.score.mate > 0 && !(after.score.mate !== undefined && after.score.mate < 0)) {
    return 'missed-mate'
  }
  if (after.score.mate !== undefined && after.score.mate > 0) return 'allowed-mate'

  const playedLine = materialAfter(fen, [playedUci, ...after.pv.slice(0, LOOKAHEAD - 1)], user)
  const bestLine = materialAfter(fen, before.pv.slice(0, LOOKAHEAD), user)

  if (playedLine.change <= -2) {
    const firstCapture = playedLine.moves.find((m, i) => i % 2 === 1 && m.captured)
    if (firstCapture) {
      const playedTo = playedUci.slice(2, 4)
      if (firstCapture.to === playedTo) return 'hung-piece'
      if (wasAlreadyAttacked(fen, firstCapture.to, opponent)) return 'missed-threat'
      return 'hung-piece'
    }
  }
  if (bestLine.change - playedLine.change >= 2 && bestLine.moves[0]?.captured) return 'missed-free-piece'
  return 'other'
}
