import { Chess } from 'chess.js'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Linking, Pressable, View } from 'react-native'
import { PATTERNS } from '../../../core/patterns'
import { Rating } from '../../../core/srs'
import type { Score } from '../../../core/types'
import { negate, winChance } from '../../../core/winprob'
import { BeforeYouMove } from '../components/BeforeYouMove'
import { engine } from '../engine/engine'
import { gradeMistake } from '../lib/grade'
import { takeDrillQueue } from '../lib/handoff'
import { useStore } from '../state/store'
import { Board } from '../ui/Board'
import { Button, Mark, Note, Row, T } from '../ui/kit'
import { Screen } from '../ui/Screen'
import { space, usePalette } from '../ui/theme'

type Phase = 'solve' | 'checking' | 'hint' | 'solved' | 'revealed'

/** Accept any move that keeps nearly all of the best move's winning chances. */
const TOLERANCE = 0.05

function sanOf(fen: string, uci: string) {
  return new Chess(fen).move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }).san
}

export default function Drill() {
  const p = usePalette()
  const [queue] = useState(takeDrillQueue)
  const safetyCheck = useStore((s) => s.settings.safetyCheck)
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('solve')
  const [best, setBest] = useState<{ fen: string; score: Score } | null>(null)
  const [tried, setTried] = useState<string | null>(null)
  const [solvedWith, setSolvedWith] = useState<string | null>(null)
  const [results, setResults] = useState<boolean[]>([])
  const m = queue[index]

  useEffect(() => {
    if (!m) return
    let live = true
    void engine.evaluate(m.fen, { depth: 11 }).then((r) => live && setBest({ fen: m.fen, score: r.score }))
    return () => {
      live = false
    }
  }, [m])

  if (!m) {
    const right = results.filter(Boolean).length
    return (
      <Screen footer={<Button label="Done" onPress={() => router.back()} />}>
        <T size={13} weight="medium" tone="soft">
          Session complete
        </T>
        <T size={40} weight="display">
          {right} of {queue.length}
        </T>
        <T tone="soft">
          {right === queue.length
            ? 'Clean. These come back later to make sure they stuck.'
            : 'The ones you missed come back sooner. That’s the point: you see them until they’re automatic.'}
        </T>
      </Screen>
    )
  }

  const pattern = PATTERNS[m.tag]

  async function onMove(uci: string) {
    setPhase('checking')
    let good = uci === m.bestUci
    if (!good) {
      const chess = new Chess(m.fen)
      chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
      const after = chess.isCheckmate() ? { mate: 0 } : (await engine.evaluate(chess.fen(), { depth: 11 })).score
      const bestScore = best?.fen === m.fen ? best.score : (await engine.evaluate(m.fen, { depth: 11 })).score
      good = winChance(negate(after)) >= winChance(bestScore) - TOLERANCE
    }
    const san = sanOf(m.fen, uci)
    if (good) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setSolvedWith(san)
      gradeMistake(m.id, tried ? Rating.Hard : Rating.Good)
      setResults((r) => [...r, true])
      setPhase('solved')
    } else if (!tried) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
      setTried(san)
      setPhase('hint')
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      reveal()
    }
  }

  function reveal() {
    gradeMistake(m.id, Rating.Again)
    setResults((r) => [...r, false])
    setPhase('revealed')
  }

  function next() {
    setIndex((i) => i + 1)
    setTried(null)
    setSolvedWith(null)
    setPhase('solve')
  }

  const lastMove = m.lastMove ? [m.lastMove.slice(0, 2), m.lastMove.slice(2, 4)] : []
  const done = phase === 'solved' || phase === 'revealed'

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
          <T size={15} weight="medium" tone="soft">
            Close
          </T>
        </Pressable>
        <T size={15} tone="soft">
          {index + 1} of {queue.length}
        </T>
      </Row>

      <View style={{ gap: 2 }}>
        <T size={13} weight="medium" tone="soft">
          {m.userColor === 'w' ? 'White' : 'Black'} to move · from your game, move {m.moveNumber}
        </T>
        <Row>
          <T size={22} weight="display">
            You played {m.played}
          </T>
          <Mark kind={m.severity} size={22} />
          <T size={22} weight="display">
            Find better.
          </T>
        </Row>
      </View>

      <Board
        fen={m.fen}
        orientation={m.userColor}
        onMove={(uci) => void onMove(uci)}
        disabled={phase !== 'solve' && phase !== 'hint'}
        highlight={phase === 'solve' || phase === 'hint' ? lastMove : []}
        arrows={done ? [{ from: m.bestUci.slice(0, 2), to: m.bestUci.slice(2, 4), color: p.good }] : []}
      />

      {phase === 'solve' && safetyCheck && <BeforeYouMove lastMoveSan={m.lastMoveSan} />}
      {phase === 'checking' && <T tone="soft">Checking your move…</T>}
      {phase === 'hint' && (
        <Note tone="mistake">
          <T>
            {tried} isn’t it. {pattern.habit}
          </T>
          <Button kind="quiet" label="Show me the answer" onPress={reveal} />
        </Note>
      )}
      {done && (
        <View style={{ gap: space.m }}>
          <Note tone={phase === 'solved' ? 'good' : 'blunder'}>
            <Row>
              <Mark kind={phase === 'solved' ? 'good' : 'blunder'} />
              <T weight="bold">{phase === 'solved' ? `${solvedWith} works.` : `The move was ${m.best}.`}</T>
            </Row>
            <T>
              {pattern.label}. {pattern.why}
              {phase === 'solved' && solvedWith !== m.best ? ` The engine’s first choice was ${m.best}.` : ''}
            </T>
            <T size={14} tone="soft">
              Line: {m.bestLine.join('  ')}
            </T>
          </Note>
          <T size={15}>
            <T size={15} weight="bold">
              Next game:{' '}
            </T>
            {pattern.habit}
          </T>
          <Button label={index + 1 < queue.length ? 'Next position' : 'Finish'} onPress={next} />
          <Row style={{ gap: space.l }}>
            <Button kind="quiet" label="Play it out from here" onPress={() => router.push({ pathname: '/play', params: { id: m.id } })} />
            {m.gameUrl ? <Button kind="quiet" label="Open game" onPress={() => void Linking.openURL(m.gameUrl)} /> : null}
          </Row>
        </View>
      )}
    </Screen>
  )
}
