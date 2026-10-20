import type { Card } from 'ts-fsrs'

export type Color = 'w' | 'b'

export type PatternTag =
  | 'hung-piece'
  | 'missed-threat'
  | 'missed-free-piece'
  | 'missed-mate'
  | 'allowed-mate'
  | 'other'

/** Engine score from the side to move's point of view. */
export interface Score {
  cp?: number
  mate?: number
}

export interface EvalResult {
  score: Score
  bestmove: string
  /** Principal variation in UCI notation, starting with bestmove. */
  pv: string[]
}

export interface EvalOptions {
  depth?: number
  movetime?: number
}

export type Evaluator = (fen: string, opts?: EvalOptions) => Promise<EvalResult>

export interface ImportedGame {
  id: string
  url: string
  pgn: string
  endTime: number
  timeClass: string
  userColor: Color
  opponent: string
  result: 'win' | 'loss' | 'draw'
  userRating?: number
}

/** A move from your own games, for the "Safe or not?" drill. */
export interface SafetyItem {
  fen: string
  uci: string
  san: string
  moveNumber: number
}

export interface GameSummary {
  id: string
  url: string
  pgn?: string
  /** Your winning chances after each ply, 0 to 100, for the game graph. */
  curve?: number[]
  /** A few of your good moves from this game, used as the "safe" answers. */
  safeMoves?: SafetyItem[]
  endTime: number
  opponent: string
  result: 'win' | 'loss' | 'draw'
  userColor: Color
  userRating?: number
  userMoves: number
  mistakes: number
  blunders: number
  tags: Partial<Record<PatternTag, number>>
}

export interface Mistake {
  id: string
  gameId: string
  gameUrl: string
  /** Position before the user's move; the user is to move. */
  fen: string
  userColor: Color
  moveNumber: number
  /** The opponent's previous move (UCI), shown as a hint. */
  lastMove?: string
  lastMoveSan?: string
  played: string
  playedUci: string
  best: string
  bestUci: string
  bestLine: string[]
  severity: 'mistake' | 'blunder'
  /** Drop in the user's winning chances, 0 to 1. */
  winDrop: number
  tag: PatternTag
  card: Card
  createdAt: number
}

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
  /** yyyy-mm-dd -> positions trained that day */
  activity?: Record<string, number>
}
