import { router } from 'expo-router'
import { useMemo } from 'react'
import { Pressable, View } from 'react-native'
import { PATTERNS } from '../../../../core/patterns'
import { isRetired } from '../../../../core/srs'
import type { Mistake, PatternTag } from '../../../../core/types'
import { setDrillQueue } from '../../lib/handoff'
import { useStore } from '../../state/store'
import { Button, Mark, Row, Rule, T, Title } from '../../ui/kit'
import { Screen } from '../../ui/Screen'
import { space } from '../../ui/theme'

function drill(queue: Mistake[]) {
  setDrillQueue(queue)
  router.push('/drill')
}

export default function Mistakes() {
  const mistakes = useStore((s) => s.mistakes)
  const groups = useMemo(() => {
    const map = new Map<PatternTag, Mistake[]>()
    for (const m of Object.values(mistakes)) map.set(m.tag, [...(map.get(m.tag) ?? []), m])
    return [...map.entries()].map(([tag, list]) => [tag, list.sort((a, b) => b.createdAt - a.createdAt)] as const).sort((a, b) => b[1].length - a[1].length)
  }, [mistakes])
  const total = Object.keys(mistakes).length
  const fixed = Object.values(mistakes).filter(isRetired).length

  return (
    <Screen>
      <Title kicker={total ? `${fixed} of ${total} fixed` : undefined}>Mistakes</Title>
      {!total && <T tone="soft">Nothing here yet. Import your games from Today and every mistake you made will be sorted here by cause.</T>}
      {groups.map(([tag, list]) => (
        <View key={tag} style={{ gap: space.s }}>
          <Rule />
          <Row style={{ justifyContent: 'space-between', marginTop: space.s }}>
            <View style={{ flex: 1 }}>
              <T size={22} weight="display">
                {PATTERNS[tag].label}
              </T>
              <T size={14} tone="soft">
                {list.length} found · {list.filter(isRetired).length} fixed
              </T>
            </View>
            <Button kind="secondary" label="Drill these" onPress={() => drill(list)} style={{ minHeight: 40 }} />
          </Row>
          {list.slice(0, 6).map((m) => (
            <Pressable key={m.id} onPress={() => drill([m])} accessibilityRole="button" style={{ paddingVertical: space.s }}>
              <Row>
                <T size={15} tone="soft" style={{ width: 36, fontVariant: ['tabular-nums'] }}>
                  {m.moveNumber}.
                </T>
                <T size={16} weight="medium">
                  {m.played}
                </T>
                <Mark kind={m.severity} size={15} />
                <T size={15} tone="soft" style={{ flex: 1 }}>
                  {' '}
                  better was {m.best}
                </T>
                {isRetired(m) && (
                  <T size={13} tone="good" weight="medium">
                    fixed
                  </T>
                )}
              </Row>
            </Pressable>
          ))}
          {list.length > 6 && (
            <T size={14} tone="soft">
              and {list.length - 6} more
            </T>
          )}
        </View>
      ))}
    </Screen>
  )
}
