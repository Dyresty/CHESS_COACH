import { Chess } from 'chess.js'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { SafetyCheck } from '../components/SafetyCheck'
import { engine } from '../engine/engine'
import { useStore } from '../state/store'
import { Board } from '../ui/Board'
import { Button, Row, T } from '../ui/kit'
import { Screen } from '../ui/Screen'
import { radius, space, usePalette } from '../ui/theme'

type Level = 'beginner' | 'casual' | 'strong'

// The bot plays a random move some of the time, otherwise one of the engine's top choices.
const LEVELS: Record<Level, { random: number; top: number; label: string }> = {
  beginner: { random: 0.3, top: 3, label: 'Beginner' },
  casual: { random: 0.12, top: 2, label: 'Club' },
  strong: { random: 0, top: 1, label: 'Strong' },
}

/** Second Chance: play on from a position from your game, against a bot you can beat. */
export default function Play() {
  const p = usePalette()
  const { id } = useLocalSearchParams<{ id: string }>()
  const mistake = useStore((s) => s.mistakes[id])
  const safetyCheck = useStore((s) => s.settings.safetyCheck)
  const [moves, setMoves] = useState<string[]>([])
  const [level, setLevel] = useState<Level>('beginner')
  const [checkedAt, setCheckedAt] = useState(-1)
  const fen = mistake?.fen

  const chess = useMemo(() => {
    const c = new Chess(fen)
    for (const uci of moves) c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
    return c
  }, [fen, moves])
  const last = chess.history({ verbose: true }).at(-1)
  const userTurn = !!mistake && chess.turn() === mistake.userColor
  const over = chess.isGameOver()
  const checked = !safetyCheck || checkedAt === moves.length

  useEffect(() => {
    if (!mistake || over || userTurn) return
    let live = true
    const settings = LEVELS[level]
    const position = chess.fen()
    const legal = chess.moves({ verbose: true })
    const started = Date.now()
    const pick = async () => {
      if (Math.random() < settings.random) return legal[Math.floor(Math.random() * legal.length)].lan
      const top = await engine.topMoves(position, settings.top, { depth: 8 })
      return top[Math.floor(Math.random() * top.length)]?.move ?? legal[0].lan
    }
    void pick().then((uci) => setTimeout(() => live && setMoves((ms) => [...ms, uci]), Math.max(0, 450 - (Date.now() - started))))
    return () => {
      live = false
    }
  }, [chess, mistake, over, userTurn, level])

  if (!mistake) return null

  let status = userTurn ? 'Your move' : 'Bot is thinking…'
  if (chess.isCheckmate()) status = userTurn ? 'Checkmated. Try it again.' : 'Checkmate. You won it this time.'
  else if (over) status = 'Draw.'

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
          <T size={15} weight="medium" tone="soft">
            Back
          </T>
        </Pressable>
        <Row style={{ gap: space.xs }}>
          {(Object.keys(LEVELS) as Level[]).map((k) => (
            <Pressable
              key={k}
              onPress={() => setLevel(k)}
              accessibilityRole="button"
              accessibilityState={{ selected: level === k }}
              style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: radius, borderWidth: 1, borderColor: level === k ? p.ink : p.rule }}
            >
              <T size={13} weight={level === k ? 'bold' : 'text'}>
                {LEVELS[k].label}
              </T>
            </Pressable>
          ))}
        </Row>
      </Row>
      <View style={{ gap: 2 }}>
        <T size={13} weight="medium" tone="soft">
          Second chance · move {mistake.moveNumber}
        </T>
        <T size={22} weight="display">
          Play it out, and win it this time.
        </T>
      </View>
      <Board fen={chess.fen()} orientation={mistake.userColor} onMove={(uci) => setMoves((ms) => [...ms, uci])} disabled={!userTurn || over || !checked} highlight={last ? [last.from, last.to] : []} />
      <T weight="bold">{status}</T>
      {!over && userTurn && !checked && <SafetyCheck lastMoveSan={last?.san ?? mistake.lastMoveSan} onDone={() => setCheckedAt(moves.length)} />}
      {over && (
        <View style={{ gap: space.s }}>
          <Button
            label="Try again"
            onPress={() => {
              setMoves([])
              setCheckedAt(-1)
            }}
          />
          <Button kind="secondary" label="Done" onPress={() => router.back()} />
        </View>
      )}
    </Screen>
  )
}
