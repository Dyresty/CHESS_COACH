import { Chess } from 'chess.js'
import { useEffect, useMemo, useState } from 'react'
import { Board } from '../components/Board'
import { SafetyCheck } from '../components/SafetyCheck'
import { getEngine } from '../lib/engine'
import { useStore } from '../lib/store'
import type { Color } from '../../core/types'

export type BotLevel = 'beginner' | 'casual' | 'strong'

const LEVELS: Record<BotLevel, { random: number; top: number; label: string }> = {
  beginner: { random: 0.3, top: 3, label: 'Beginner' },
  casual: { random: 0.12, top: 2, label: 'Casual' },
  strong: { random: 0, top: 1, label: 'Strong' },
}

interface Props {
  fen: string
  userColor: Color
  title: string
  onExit: () => void
}

/** Second Chance: play on from a position against a bot you can actually beat. */
export function Play({ fen, userColor, title, onExit }: Props) {
  const safetyCheck = useStore((s) => s.settings.safetyCheck)
  const [moves, setMoves] = useState<string[]>([])
  const [level, setLevel] = useState<BotLevel>('beginner')
  /** Number of moves played when the user last confirmed the safety check. */
  const [checkedAt, setCheckedAt] = useState(-1)

  // Replaying keeps the move history, so repetition and 50-move draws are detected.
  const chess = useMemo(() => {
    const c = new Chess(fen)
    for (const uci of moves) c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
    return c
  }, [fen, moves])
  const history = chess.history({ verbose: true })
  const last = history.at(-1)
  const userTurn = chess.turn() === userColor
  const over = chess.isGameOver()
  const checked = !safetyCheck || checkedAt === moves.length

  useEffect(() => {
    if (over || userTurn) return
    let live = true
    const settings = LEVELS[level]
    const position = chess.fen()
    const legal = chess.moves({ verbose: true })
    const pick = async () => {
      if (Math.random() < settings.random) return legal[Math.floor(Math.random() * legal.length)].lan
      const top = await getEngine().topMoves(position, settings.top, { depth: 8 })
      return top[Math.floor(Math.random() * top.length)]?.move ?? legal[0].lan
    }
    const started = Date.now()
    void pick().then((uci) => {
      setTimeout(() => live && setMoves((ms) => [...ms, uci]), Math.max(0, 500 - (Date.now() - started)))
    })
    return () => {
      live = false
    }
  }, [chess, userTurn, over, level])

  function onMove(uci: string) {
    if (!userTurn || over) return false
    setMoves((ms) => [...ms, uci])
    return true
  }

  function restart() {
    setMoves([])
    setCheckedAt(-1)
  }

  let status = userTurn ? 'Your move' : 'Bot is thinking…'
  if (chess.isCheckmate()) status = userTurn ? 'Checkmate. The bot won this time.' : 'Checkmate! You won.'
  else if (over) status = 'Draw.'

  return (
    <div className="screen">
      <div className="row between">
        <button className="link" onClick={onExit}>
          ← Back
        </button>
        <select value={level} onChange={(e) => setLevel(e.target.value as BotLevel)} aria-label="Bot level">
          {Object.entries(LEVELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label} bot
            </option>
          ))}
        </select>
      </div>
      <p className="prompt">{title}</p>
      <Board fen={chess.fen()} orientation={userColor} onMove={onMove} disabled={!userTurn || over || !checked} highlight={last ? [last.from, last.to] : []} />
      <p className="status">{status}</p>
      {!over && userTurn && !checked && <SafetyCheck lastMoveSan={last?.san} onDone={() => setCheckedAt(moves.length)} />}
      {over && (
        <div className="row gap">
          <button className="primary" onClick={restart}>
            Try again
          </button>
          <button onClick={onExit}>Done</button>
        </div>
      )}
    </div>
  )
}
