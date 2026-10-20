import { router } from 'expo-router'
import { useMemo } from 'react'
import { Pressable, View } from 'react-native'
import { useStore } from '../../state/store'
import { Mark, Row, Rule, T, Title } from '../../ui/kit'
import { Screen } from '../../ui/Screen'
import { space } from '../../ui/theme'

const RESULT = { win: 'Won', loss: 'Lost', draw: 'Drew' } as const

function when(ms: number) {
  const d = new Date(ms)
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export default function Games() {
  const games = useStore((s) => s.games)
  const list = useMemo(() => Object.values(games).sort((a, b) => b.endTime - a.endTime), [games])
  return (
    <Screen>
      <Title kicker={list.length ? `${list.length} analysed` : undefined}>Games</Title>
      {!list.length && <T tone="soft">Your imported games show up here. Open one to replay it with every mistake marked.</T>}
      {list.map((g) => (
        <Pressable key={g.id} onPress={() => router.push({ pathname: '/game/[id]', params: { id: g.id } })} accessibilityRole="button">
          <Rule />
          <Row style={{ paddingVertical: space.m, justifyContent: 'space-between' }}>
            <View style={{ flex: 1, gap: 2 }}>
              <T weight="medium">
                {RESULT[g.result]} vs {g.opponent}
              </T>
              <T size={13} tone="soft">
                {when(g.endTime)} · {g.userColor === 'w' ? 'White' : 'Black'}
                {g.userRating ? ` · ${g.userRating}` : ''}
              </T>
            </View>
            <Row style={{ gap: space.m }}>
              {g.blunders > 0 && (
                <Row style={{ gap: 2 }}>
                  <T size={15}>{g.blunders}</T>
                  <Mark kind="blunder" size={15} />
                </Row>
              )}
              {g.mistakes > 0 && (
                <Row style={{ gap: 2 }}>
                  <T size={15}>{g.mistakes}</T>
                  <Mark kind="mistake" size={15} />
                </Row>
              )}
              {g.blunders + g.mistakes === 0 && (
                <T size={14} tone="good" weight="medium">
                  clean
                </T>
              )}
            </Row>
          </Row>
        </Pressable>
      ))}
    </Screen>
  )
}
