import { Chess } from 'chess.js'
import * as Haptics from 'expo-haptics'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { BOT_LEVELS, GUARD_DROP, capturedPiece, chooseBotMove, guardWarning, sanOf, type BotLevel } from '../../../core/bot'
import type { Score } from '../../../core/types'
import { negate, winChance } from '../../../core/winprob'
import { BeforeYouMove } from '../components/BeforeYouMove'
import { engine } from '../engine/engine'
import { setState, useStore } from '../state/store'
import { Board } from '../ui/Board'
import { Button, Mark, Note, Row, T } from '../ui/kit'
import { Screen } from '../ui/Screen'
import { radius, space, usePalette } from '../ui/theme'

function apply(fen: string, moves: string[]) {
  const c = new Chess(fen)
  for (const uci of moves) c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
  return c
}

/** Second Chance: play on from a position from your game, against a bot you can beat. */
export default function Play() {
  const p = usePalette()
  const { id } = useLocalSearchParams<{ id: string }>()
  const mistake = useStore((s) => s.mistakes[id])
  const guardOn = useStore((s) => s.settings.safetyCheck)
  const level = useStore((s) => (s.settings.botLevel ?? 'easy') as BotLevel)
  const [moves, setMoves] = useState<string[]>([])
  /** Your move, shown on the board while the guard checks it. */
  const [pending, setPending] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [botNote, setBotNote] = useState<string | null>(null)
  const [before, setBefore] = useState<{ fen: string; score: Score } | null>(null)
  const [saves, setSaves] = useState(0)
  const fen = mistake?.fen

  const chess = useMemo(() => apply(fen ?? new Chess().fen(), moves), [fen, moves])
  const shown = useMemo(() => (pending ? apply(chess.fen(), [pending]) : chess), [chess, pending])
  const last = shown.history({ verbose: true }).at(-1)
  const userTurn = !!mistake && chess.turn() === mistake.userColor
  const over = shown.isGameOver()
  const you = mistake?.userColor === 'w' ? 'White' : 'Black'

  // While it's your turn, quietly work out how good the position is, so the guard can tell if your move throws it away.
  useEffect(() => {
    if (!mistake || !userTurn || over || !guardOn) return
    let live = true
    const position = chess.fen()
    void engine.evaluate(position, { depth: 10 }).then((r) => live && setBefore({ fen: position, score: r.score }))
    return () => {
      live = false
    }
  }, [chess, mistake, userTurn, over, guardOn])

  useEffect(() => {
    if (!mistake || over || userTurn) return
    let live = true
    const settings = BOT_LEVELS[level]
    const position = chess.fen()
    const started = Date.now()
    void engine.topMoves(position, settings.lines, { depth: settings.depth }).then((top) => {
      const uci = chooseBotMove(top, level) ?? chess.moves({ verbose: true })[0].lan
      const bestUci = top[0]?.move
      const missed = bestUci && uci !== bestUci ? capturedPiece(position, bestUci) : null
      setTimeout(() => {
        if (!live) return
        setBotNote(missed ? `The bot missed ${sanOf(position, bestUci)}, which takes your ${missed}. A real opponent might not miss it.` : null)
        setMoves((ms) => [...ms, uci])
      }, Math.max(0, 500 - (Date.now() - started)))
    })
    return () => {
      live = false
    }
  }, [chess, mistake, over, userTurn, level])

  if (!mistake) return null

  async function onMove(uci: string) {
    setBotNote(null)
    if (!guardOn) return setMoves((ms) => [...ms, uci])
    setPending(uci)
    const position = chess.fen()
    const after = apply(position, [uci])
    if (after.isGameOver()) {
      setPending(null)
      return setMoves((ms) => [...ms, uci])
    }
    const [start, reply] = await Promise.all([
      before?.fen === position ? before.score : engine.evaluate(position, { depth: 10 }).then((r) => r.score),
      engine.evaluate(after.fen(), { depth: 10 }),
    ])
    const drop = winChance(start) - winChance(negate(reply.score))
    if (drop >= GUARD_DROP && reply.bestmove) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
      setWarning(guardWarning(after.fen(), reply.bestmove, (reply.score.mate ?? 0) > 0))
    } else {
      setPending(null)
      setMoves((ms) => [...ms, uci])
    }
  }

  function takeBack() {
    setSaves((n) => n + 1)
    setPending(null)
    setWarning(null)
  }

  function playAnyway() {
    const uci = pending!
    setPending(null)
    setWarning(null)
    setMoves((ms) => [...ms, uci])
  }

  function restart() {
    setMoves([])
    setPending(null)
    setWarning(null)
    setBotNote(null)
    setSaves(0)
  }

  let status = userTurn ? (pending && !warning ? 'Checking your move…' : `Your move. You are ${you}.`) : 'Bot is thinking…'
  if (shown.isCheckmate()) status = shown.turn() === mistake.userColor ? 'Checkmated. Try it again.' : 'Checkmate. You won it this time.'
  else if (over) status = 'Draw.'
  const lastBy = last && (last.color === mistake.userColor ? 'You' : 'Bot')

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
          <T size={15} weight="medium" tone="soft">
            Back
          </T>
        </Pressable>
        <Row style={{ gap: space.xs }}>
          {(Object.keys(BOT_LEVELS) as BotLevel[]).map((k) => (
            <Pressable
              key={k}
              onPress={() => setState((s) => ({ ...s, settings: { ...s.settings, botLevel: k } }))}
              accessibilityRole="button"
              accessibilityState={{ selected: level === k }}
              style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: radius, borderWidth: 1, borderColor: level === k ? p.ink : p.rule }}
            >
              <T size={13} weight={level === k ? 'bold' : 'text'}>
                {BOT_LEVELS[k].label}
              </T>
            </Pressable>
          ))}
        </Row>
      </Row>
      <View style={{ gap: 2 }}>
        <T size={13} weight="medium" tone="soft">
          Second chance · your game, move {mistake.moveNumber}
        </T>
        <T size={22} weight="display">
          You played {mistake.played} here. Play it out again.
        </T>
        <T size={14} tone="soft">
          You are {you}, the bot plays your opponent. {BOT_LEVELS[level].label} bot. {BOT_LEVELS[level].blurb}
        </T>
      </View>
      <Board
        fen={shown.fen()}
        orientation={mistake.userColor}
        onMove={(uci) => void onMove(uci)}
        disabled={!userTurn || over || !!pending}
        highlight={last ? [last.from, last.to] : []}
      />
      <View style={{ gap: 2 }}>
        <T weight="bold">{status}</T>
        {last && !warning && (
          <T size={14} tone="soft">
            {lastBy} played {last.san}.
          </T>
        )}
      </View>
      {warning && (
        <Note tone="blunder">
          <Row>
            <Mark kind="blunder" />
            <T weight="bold">Wait.</T>
          </Row>
          <T>{warning}</T>
          <Button label="Take it back" onPress={takeBack} />
          <Button kind="quiet" label="Play it anyway" onPress={playAnyway} />
        </Note>
      )}
      {botNote && !warning && (
        <Note tone="mistake">
          <T>{botNote}</T>
        </Note>
      )}
      {!over && userTurn && !pending && guardOn && <BeforeYouMove lastMoveSan={last?.san ?? mistake.lastMoveSan} />}
      {over && (
        <View style={{ gap: space.s }}>
          {guardOn && saves > 0 && (
            <T tone="soft">
              The guard stopped {saves === 1 ? 'one slip' : `${saves} slips`} this game. In a real game nobody stops you, so those are the moves to watch.
            </T>
          )}
          <Button label="Try again" onPress={restart} />
          <Button kind="secondary" label="Done" onPress={() => router.back()} />
        </View>
      )}
    </Screen>
  )
}
