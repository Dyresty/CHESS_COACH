import { Chess } from 'chess.js'
import { router, useLocalSearchParams } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { PATTERNS } from '../../../../core/patterns'
import type { Mistake } from '../../../../core/types'
import { setDrillQueue } from '../../lib/handoff'
import { useStore } from '../../state/store'
import { Board } from '../../ui/Board'
import { Button, Mark, Note, Row, T } from '../../ui/kit'
import { Screen } from '../../ui/Screen'
import { WinCurve } from '../../ui/WinCurve'
import { space } from '../../ui/theme'

/** Replay a game move by move, with your mistakes marked on the moves and on the graph. */
export default function GameReplay() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const game = useStore((s) => s.games[id])
  const allMistakes = useStore((s) => s.mistakes)
  const [ply, setPly] = useState(0)
  const [graphWidth, setGraphWidth] = useState(0)

  const pgn = game?.pgn
  const history = useMemo(() => {
    if (!pgn) return []
    const c = new Chess()
    c.loadPgn(pgn)
    return c.history({ verbose: true })
  }, [pgn])

  const byPly = useMemo(() => {
    const map = new Map<number, Mistake>()
    for (const m of Object.values(allMistakes)) if (m.gameId === id) map.set(Number(m.id.slice(id.length + 1)), m)
    return map
  }, [allMistakes, id])

  if (!game) return null
  if (!history.length) {
    return (
      <Screen>
        <T tone="soft">This game was imported before replays were added. Re-import it to replay it here.</T>
        <Button kind="secondary" label="Back" onPress={() => router.back()} />
      </Screen>
    )
  }

  const fen = ply === 0 ? history[0].before : history[ply - 1].after
  const lastMove = ply > 0 ? history[ply - 1] : null
  // The mistake shown is the one made on the move just played.
  const mistake = ply > 0 ? byPly.get(ply - 1) : undefined
  const marks = [...byPly.entries()].map(([i, m]) => ({ ply: i + 1, kind: m.severity }))

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
          <T size={15} weight="medium" tone="soft">
            Back
          </T>
        </Pressable>
        <T size={15} tone="soft">
          vs {game.opponent}
        </T>
      </Row>

      <Board
        fen={fen}
        orientation={game.userColor}
        disabled
        highlight={lastMove ? [lastMove.from, lastMove.to] : []}
      />

      <View onLayout={(e) => setGraphWidth(e.nativeEvent.layout.width)} style={{ gap: space.xs }}>
        <WinCurve curve={game.curve ?? []} width={graphWidth} marks={marks} cursor={ply} />
        <T size={12} tone="soft">
          Your winning chances through the game. Dots are your mistakes.
        </T>
      </View>

      <Row style={{ gap: space.s }}>
        <Button kind="secondary" label="‹" onPress={() => setPly((v) => Math.max(0, v - 1))} style={{ flex: 1 }} disabled={ply === 0} />
        <Button
          kind="secondary"
          label="Next mistake"
          style={{ flex: 2 }}
          disabled={!marks.some((m) => m.ply > ply)}
          onPress={() => setPly(marks.filter((m) => m.ply > ply).sort((a, b) => a.ply - b.ply)[0]?.ply ?? ply)}
        />
        <Button kind="secondary" label="›" onPress={() => setPly((v) => Math.min(history.length, v + 1))} style={{ flex: 1 }} disabled={ply === history.length} />
      </Row>

      {mistake && (
        <Note tone={mistake.severity}>
          <Row>
            <T weight="bold">
              {mistake.moveNumber}. {mistake.played}
            </T>
            <Mark kind={mistake.severity} />
            <T weight="bold">{PATTERNS[mistake.tag].label}</T>
          </Row>
          <T>
            {PATTERNS[mistake.tag].why} Better was {mistake.best}.
          </T>
          <Button
            kind="quiet"
            label="Train this position"
            onPress={() => {
              setDrillQueue([mistake])
              router.push('/drill')
            }}
          />
        </Note>
      )}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {history.map((m, i) => {
          const mk = byPly.get(i)
          const active = ply === i + 1
          return (
            <Pressable key={i} onPress={() => setPly(i + 1)} style={{ width: '50%', paddingVertical: 4, flexDirection: 'row', gap: 4 }}>
              {i % 2 === 0 && (
                <T size={14} tone="soft" style={{ width: 30, fontVariant: ['tabular-nums'] }}>
                  {i / 2 + 1}.
                </T>
              )}
              {i % 2 === 1 && <View style={{ width: 30 }} />}
              <T size={15} weight={active ? 'bold' : 'text'} tone={active ? 'good' : 'ink'}>
                {m.san}
              </T>
              {mk && <Mark kind={mk.severity} size={15} />}
            </Pressable>
          )
        })}
      </View>
    </Screen>
  )
}
