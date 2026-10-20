import { Chess } from 'chess.js'
import { useEffect, useState } from 'react'
import { Board } from '../components/Board'
import { SafetyCheck } from '../components/SafetyCheck'
import { getEngine } from '../lib/engine'
import { PATTERNS } from '../../core/patterns'
import { Rating, review } from '../../core/srs'
import { setState, today, useStore } from '../lib/store'
import type { Mistake, Score } from '../../core/types'
import { negate, winChance } from '../../core/winprob'

type Phase = 'check' | 'solve' | 'checking' | 'hint' | 'solved' | 'revealed'

interface Props {
  queue: Mistake[]
  onExit: () => void
  onSecondChance: (m: Mistake) => void
}

/** Accept any move that keeps nearly all of the best move's winning chances. */
const TOLERANCE = 0.05

export function Drill({ queue, onExit, onSecondChance }: Props) {
  const safetyCheck = useStore((s) => s.settings.safetyCheck)
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>(safetyCheck ? 'check' : 'solve')
  const [best, setBest] = useState<{ fen: string; score: Score } | null>(null)
  const [tried, setTried] = useState<string | null>(null)
  const [solvedWith, setSolvedWith] = useState<string | null>(null)

  const m = queue[index]
  const bestScore = m && best?.fen === m.fen ? best.score : null

  useEffect(() => {
    if (!m) return
    let live = true
    getEngine()
      .evaluate(m.fen, { depth: 11 })
      .then((r) => live && setBest({ fen: m.fen, score: r.score }))
    return () => {
      live = false
    }
  }, [m])

  if (!m) {
    return (
      <div className="screen center">
        <h2>Session done</h2>
        <p className="muted">You worked through {queue.length} of your own mistakes. Play a game and come back tomorrow.</p>
        <button className="primary" onClick={onExit}>
          Back to today
        </button>
      </div>
    )
  }

  const pattern = PATTERNS[m.tag]
  const hadHint = phase === 'hint' || tried !== null

  function grade(rating: Rating.Again | Rating.Hard | Rating.Good) {
    setState((s) => {
      const current = s.mistakes[m.id]
      const isNew = current.card.reps === 0
      return {
        ...s,
        mistakes: { ...s.mistakes, [m.id]: { ...current, card: review(current.card, rating) } },
        newIntroduced: isNew ? { ...s.newIntroduced, [today()]: (s.newIntroduced[today()] ?? 0) + 1 } : s.newIntroduced,
      }
    })
  }

  async function onMove(uci: string) {
    setPhase('checking')
    let good = uci === m.bestUci
    if (!good) {
      const chess = new Chess(m.fen)
      chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
      const after = chess.isCheckmate() ? { mate: 0 } : (await getEngine().evaluate(chess.fen(), { depth: 11 })).score
      const best = bestScore ?? (await getEngine().evaluate(m.fen, { depth: 11 })).score
      good = winChance(negate(after)) >= winChance(best) - TOLERANCE
    }
    const san = new Chess(m.fen).move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }).san
    if (good) {
      setSolvedWith(san)
      grade(hadHint ? Rating.Hard : Rating.Good)
      setPhase('solved')
    } else if (tried === null) {
      setTried(san)
      setPhase('hint')
    } else {
      grade(Rating.Again)
      setPhase('revealed')
    }
    return true
  }

  function giveUp() {
    grade(Rating.Again)
    setPhase('revealed')
  }

  function next() {
    setIndex((i) => i + 1)
    setTried(null)
    setSolvedWith(null)
    setPhase(safetyCheck ? 'check' : 'solve')
  }

  const lastMoveSquares = m.lastMove ? [m.lastMove.slice(0, 2), m.lastMove.slice(2, 4)] : []
  const showAnswer = phase === 'revealed' || phase === 'solved'
  const arrows = showAnswer ? [{ startSquare: m.bestUci.slice(0, 2), endSquare: m.bestUci.slice(2, 4), color: '#2e9e5b' }] : []

  return (
    <div className="screen">
      <div className="row between">
        <button className="link" onClick={onExit}>
          ← Exit
        </button>
        <span className="muted">
          {index + 1} / {queue.length}
        </span>
      </div>

      <p className="prompt">
        {m.userColor === 'w' ? 'White' : 'Black'} to move. In your game you played <b>{m.played}</b> here, a {m.severity}. Find a better move.
      </p>

      <Board
        fen={m.fen}
        orientation={m.userColor}
        onMove={(uci) => void onMove(uci)}
        disabled={phase !== 'solve' && phase !== 'hint'}
        arrows={arrows}
        highlight={phase === 'hint' || phase === 'check' ? lastMoveSquares : []}
      />

      {phase === 'check' && <SafetyCheck lastMoveSan={m.lastMoveSan} onDone={() => setPhase('solve')} />}
      {phase === 'checking' && <p className="muted">Checking your move…</p>}
      {phase === 'hint' && (
        <div className="card warn">
          <p>
            <b>{tried}</b> isn't it. Hint: {pattern.habit}
          </p>
          <button className="link" onClick={giveUp}>
            Show me the answer
          </button>
        </div>
      )}
      {showAnswer && (
        <div className={`card ${phase === 'solved' ? 'good' : 'bad'}`}>
          <p className="tag">{pattern.label}</p>
          {phase === 'solved' ? (
            <p>
              <b>{solvedWith}</b> works. {solvedWith !== m.best && <>The engine's top move is <b>{m.best}</b>. </>}
            </p>
          ) : (
            <p>
              The move was <b>{m.best}</b>. {pattern.why}
            </p>
          )}
          <p className="muted small">Best line: {m.bestLine.join(' ')}</p>
          <p className="small">
            <b>Habit:</b> {pattern.habit}
          </p>
          <div className="row gap">
            <button className="primary" onClick={next}>
              Next
            </button>
            <button onClick={() => onSecondChance(m)}>Play it out</button>
          </div>
          {m.gameUrl && (
            <a className="small" href={m.gameUrl} target="_blank" rel="noreferrer">
              Open the game on chess.com
            </a>
          )}
        </div>
      )}
    </div>
  )
}
