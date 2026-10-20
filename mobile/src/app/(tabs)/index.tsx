import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, TextInput, View } from 'react-native'
import { PATTERNS } from '../../../../core/patterns'
import { buildSafetyQuiz, buildSession, weaknessRanking } from '../../../../core/session'
import { streak } from '../../../../core/state'
import { ImportPanel } from '../../components/ImportPanel'
import { setDrillQueue } from '../../lib/handoff'
import { setState, useStore } from '../../state/store'
import { Board } from '../../ui/Board'
import { Button, Mark, Row, Rule, T, Title } from '../../ui/kit'
import { Screen } from '../../ui/Screen'
import { font, radius, space, usePalette } from '../../ui/theme'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function Today() {
  const p = usePalette()
  const state = useStore((s) => s)
  const { games, settings } = state
  const [name, setName] = useState('')
  const [opened] = useState(() => new Date())

  const session = useMemo(() => buildSession(state), [state])
  const focus = useMemo(() => weaknessRanking(Object.values(games))[0], [games])
  const quizSize = useMemo(() => buildSafetyQuiz(state).length, [state])
  const days = streak(state.activity)
  const gameCount = Object.keys(games).length
  const next = session[0]
  const kicker = `${DAYS[opened.getDay()]}${days ? ` · ${days} day streak` : ''}`

  if (!settings.username) {
    return (
      <Screen>
        <Title kicker="Chess Coach">Your games are the lessons.</Title>
        <T tone="soft">
          Every mistake you make on chess.com becomes a position you practise here, until you stop making it. Start with your username.
        </T>
        <View style={{ gap: space.s }}>
          <T size={14} weight="medium">
            chess.com username
          </T>
          <TextInput
            value={name}
            onChangeText={setName}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="e.g. magnuscarlsen"
            placeholderTextColor={p.inkSoft}
            style={{ borderWidth: 1.5, borderColor: p.ink, borderRadius: radius, padding: space.m, fontFamily: font.text, fontSize: 17, color: p.ink }}
          />
          <Button label="Continue" disabled={!name.trim()} onPress={() => setState((s) => ({ ...s, settings: { ...s.settings, username: name.trim() } }))} />
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Title kicker={kicker}>{session.length ? `${session.length} positions today` : gameCount ? 'All caught up' : 'Let’s read your games'}</Title>
        <Pressable onPress={() => router.push('/settings')} hitSlop={12} accessibilityRole="button">
          <T size={14} weight="medium" tone="soft">
            Settings
          </T>
        </Pressable>
      </Row>

      {next ? (
        <View style={{ gap: space.m }}>
          <Board fen={next.fen} orientation={next.userColor} disabled coordinates={false} highlight={next.lastMove ? [next.lastMove.slice(0, 2), next.lastMove.slice(2, 4)] : []} />
          <Row>
            <T size={15} tone="soft">
              First up: move {next.moveNumber}, where you played {next.played}
            </T>
            <Mark kind={next.severity} size={16} />
          </Row>
          <Button
            label={`Train ${session.length} position${session.length === 1 ? '' : 's'}`}
            onPress={() => {
              setDrillQueue(session)
              router.push('/drill')
            }}
          />
        </View>
      ) : (
        <View style={{ gap: space.m }}>
          <T tone="soft">
            {gameCount
              ? 'Nothing is due. Play a game on chess.com, then import it here and tomorrow’s positions will be waiting.'
              : `We’ll pull your last 10 ${settings.timeClass === 'all' ? '' : settings.timeClass + ' '}games and look at every move you made.`}
          </T>
          <ImportPanel kind={gameCount ? 'secondary' : 'primary'} />
        </View>
      )}

      {quizSize >= 4 && (
        <Pressable onPress={() => router.push('/quiz')} accessibilityRole="button" style={{ gap: 2 }}>
          <Rule style={{ marginBottom: space.m }} />
          <T weight="bold">Safe or not?</T>
          <T size={15} tone="soft">
            {quizSize} quick yes-or-no calls on real moves from your games. Trains the check you skip when you rush.
          </T>
        </Pressable>
      )}

      {focus && (
        <View style={{ gap: space.xs }}>
          <Rule style={{ marginBottom: space.m }} />
          <T size={13} weight="medium" tone="soft">
            This week’s focus
          </T>
          <T size={22} weight="display">
            {PATTERNS[focus.tag].label}
          </T>
          <T size={15} tone="soft">
            {focus.count === 1 ? 'Once' : `${focus.count} times`} in your last {Math.min(gameCount, 20)} games. {PATTERNS[focus.tag].habit}
          </T>
        </View>
      )}

      {next && gameCount > 0 && (
        <View style={{ gap: space.s }}>
          <Rule style={{ marginBottom: space.s }} />
          <ImportPanel />
        </View>
      )}
    </Screen>
  )
}
