import { Chess } from 'chess.js'
import type { Score } from './types'
import { winChance } from './winprob'

export type BotLevel = 'easy' | 'medium' | 'hard'

/**
 * The bot never plays a random move. It asks the engine for its best few moves and picks
 * one that costs at most `window` of its winning chances, leaning towards the best one.
 */
export const BOT_LEVELS: Record<BotLevel, { label: string; blurb: string; window: number; lines: number; depth: number }> = {
  easy: {
    label: 'Easy',
    blurb: 'Plays sensible moves but makes real mistakes, and now and then misses a free piece. When it does, you’ll be told.',
    window: 0.3,
    lines: 5,
    depth: 8,
  },
  medium: {
    label: 'Medium',
    blurb: 'Rarely misses a loose piece. Small mistakes only.',
    window: 0.08,
    lines: 3,
    depth: 10,
  },
  hard: {
    label: 'Hard',
    blurb: 'Plays the engine’s best move every time. Every loose piece gets taken.',
    window: 0,
    lines: 1,
    depth: 12,
  },
}

export interface Candidate {
  move: string
  /** From the bot's point of view (it is to move). */
  score: Score
}

export function chooseBotMove(candidates: Candidate[], level: BotLevel, random = Math.random): string | undefined {
  if (!candidates.length) return undefined
  const { window } = BOT_LEVELS[level]
  const best = winChance(candidates[0].score)
  const options = candidates
    .map((c) => ({ move: c.move, drop: best - winChance(c.score) }))
    .filter((c) => c.drop <= window)
  // Weight 1 for the best move, falling off with how much a move gives away.
  const weights = options.map((o) => 1 / (1 + o.drop * 25))
  let roll = random() * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < options.length; i++) {
    roll -= weights[i]
    if (roll <= 0) return options[i].move
  }
  return options[0].move
}

const NAMES: Record<string, string> = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' }

/** "your knight on f3", or null if the move captures nothing. */
export function capturedPiece(fen: string, uci: string): string | null {
  const chess = new Chess(fen)
  try {
    const move = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
    if (!move.captured) return null
    const square = move.isEnPassant() ? move.to[0] + move.from[1] : move.to
    return `${NAMES[move.captured]} on ${square}`
  } catch {
    return null
  }
}

export function sanOf(fen: string, uci: string): string {
  return new Chess(fen).move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }).san
}

/** A drop in your winning chances this big earns a blunder warning. */
export const GUARD_DROP = 0.15

/**
 * What to say when your move hands the opponent something. `fenAfter` is the position after
 * your move, `reply` is the opponent's best answer to it, and `mateAgainst` is whether that
 * answer leads to checkmate.
 */
export function guardWarning(fenAfter: string, reply: string, mateAgainst: boolean): string {
  const san = sanOf(fenAfter, reply)
  if (mateAgainst) return `That lets your opponent force checkmate, starting with ${san}.`
  const piece = capturedPiece(fenAfter, reply)
  if (piece) return `That leaves your ${piece} to be taken with ${san}.`
  return `That lets your opponent play ${san}, and your position gets much worse. Look at what it attacks.`
}
