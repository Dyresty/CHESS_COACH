import { Chess } from 'chess.js'
import { createEmptyCard } from 'ts-fsrs'
import { tagMistake, uciToMove } from './patterns'
import type { EvalResult, Evaluator, GameSummary, ImportedGame, Mistake, PatternTag } from './types'
import { negate, winChance } from './winprob'

export const MISTAKE_DROP = 0.12
export const BLUNDER_DROP = 0.2

export interface AnalysisResult {
  summary: GameSummary
  mistakes: Mistake[]
}

function terminalEval(chess: Chess): EvalResult | null {
  if (chess.isCheckmate()) return { score: { mate: 0 }, bestmove: '(none)', pv: [] }
  if (chess.isDraw() || chess.isStalemate()) return { score: { cp: 0 }, bestmove: '(none)', pv: [] }
  return null
}

function uciLineToSan(fen: string, line: string[], max = 6): string[] {
  const chess = new Chess(fen)
  const out: string[] = []
  for (const uci of line.slice(0, max)) {
    try {
      out.push(chess.move(uciToMove(uci)).san)
    } catch {
      break
    }
  }
  return out
}

export async function analyseGame(
  game: ImportedGame,
  evaluate: Evaluator,
  opts: { depth?: number; onProgress?: (done: number, total: number) => void } = {},
): Promise<AnalysisResult> {
  const depth = opts.depth ?? 11
  const chess = new Chess()
  chess.loadPgn(game.pgn)
  const history = chess.history({ verbose: true })
  const fens = history.length ? [history[0].before, ...history.map((m) => m.after)] : []

  const evals: EvalResult[] = []
  for (let i = 0; i < fens.length; i++) {
    const terminal = terminalEval(new Chess(fens[i]))
    evals.push(terminal ?? (await evaluate(fens[i], { depth })))
    opts.onProgress?.(i + 1, fens.length)
  }

  const mistakes: Mistake[] = []
  const tags: Partial<Record<PatternTag, number>> = {}
  let userMoves = 0
  let blunders = 0
  let mistakeCount = 0

  history.forEach((move, i) => {
    if (move.color !== game.userColor) return
    userMoves++
    const before = evals[i]
    const after = evals[i + 1]
    const playedUci = move.lan
    if (before.bestmove === playedUci) return
    const drop = winChance(before.score) - winChance(negate(after.score))
    if (drop < MISTAKE_DROP) return

    const severity = drop >= BLUNDER_DROP ? 'blunder' : 'mistake'
    if (severity === 'blunder') blunders++
    else mistakeCount++
    const tag = tagMistake(move.before, playedUci, before, after)
    tags[tag] = (tags[tag] ?? 0) + 1
    const bestLine = uciLineToSan(move.before, before.pv)
    mistakes.push({
      id: `${game.id}:${i}`,
      gameId: game.id,
      gameUrl: game.url,
      fen: move.before,
      userColor: game.userColor,
      moveNumber: Math.floor(i / 2) + 1,
      lastMove: i > 0 ? history[i - 1].lan : undefined,
      lastMoveSan: i > 0 ? history[i - 1].san : undefined,
      played: move.san,
      playedUci,
      best: bestLine[0] ?? before.bestmove,
      bestUci: before.bestmove,
      bestLine,
      severity,
      winDrop: Math.round(drop * 100) / 100,
      tag,
      card: createEmptyCard(new Date(game.endTime)),
      createdAt: game.endTime,
    })
  })

  return {
    summary: {
      id: game.id,
      url: game.url,
      endTime: game.endTime,
      opponent: game.opponent,
      result: game.result,
      userColor: game.userColor,
      userRating: game.userRating,
      userMoves,
      mistakes: mistakeCount,
      blunders,
      tags,
    },
    mistakes,
  }
}
