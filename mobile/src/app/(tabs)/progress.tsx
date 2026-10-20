import { useMemo, useState } from 'react'
import { View } from 'react-native'
import Svg, { Rect } from 'react-native-svg'
import { PATTERNS } from '../../../../core/patterns'
import { weaknessRanking } from '../../../../core/session'
import { isRetired } from '../../../../core/srs'
import { streak } from '../../../../core/state'
import { useStore } from '../../state/store'
import { Row, Rule, T, Title } from '../../ui/kit'
import { Screen } from '../../ui/Screen'
import { space, usePalette } from '../../ui/theme'

const average = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0)

export default function Progress() {
  const p = usePalette()
  const games = useStore((s) => s.games)
  const mistakes = useStore((s) => s.mistakes)
  const activity = useStore((s) => s.activity)
  const [chartWidth, setChartWidth] = useState(0)
  const sorted = useMemo(() => Object.values(games).sort((a, b) => b.endTime - a.endTime), [games])
  const ranking = useMemo(() => weaknessRanking(sorted), [sorted])

  if (!sorted.length) {
    return (
      <Screen>
        <Title>Progress</Title>
        <T tone="soft">Once a few games are imported, this page tracks the one number that moves your rating at this level: blunders per game.</T>
      </Screen>
    )
  }

  const recent = sorted.slice(0, 10)
  const previous = sorted.slice(10, 20)
  const rate = average(recent.map((g) => g.blunders))
  const before = previous.length ? average(previous.map((g) => g.blunders)) : null
  const all = Object.values(mistakes)
  const fixed = all.filter(isRetired).length
  const rating = sorted.find((g) => g.userRating)?.userRating
  const chart = sorted.slice(0, 20).reverse()
  const max = Math.max(3, ...chart.map((g) => g.blunders))
  const days = streak(activity)
  const barGap = 4
  const barW = chart.length ? (chartWidth - barGap * (chart.length - 1)) / chart.length : 0
  const H = 96

  return (
    <Screen>
      <Title kicker={`Last ${recent.length} games`}>Progress</Title>

      <View style={{ gap: 2 }}>
        <Row style={{ alignItems: 'flex-end' }}>
          <T size={56} weight="display">
            {rate.toFixed(1)}
          </T>
          <T tone="soft" style={{ marginBottom: 10 }}>
            blunders per game
          </T>
        </Row>
        {before !== null && (
          <T size={15} tone={rate <= before ? 'good' : 'blunder'} weight="medium">
            {rate < before ? `Down from ${before.toFixed(1)}` : rate > before ? `Up from ${before.toFixed(1)}` : 'Same as'} in the 10 games before
          </T>
        )}
      </View>

      <View onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)} style={{ gap: space.xs }}>
        <Svg width={chartWidth} height={H}>
          {chart.map((g, i) => {
            const h = Math.max(2, (g.blunders / max) * H)
            const color = g.result === 'win' ? p.good : g.result === 'loss' ? p.blunder : p.inkSoft
            return <Rect key={g.id} x={i * (barW + barGap)} y={H - h} width={Math.max(1, barW)} height={h} rx={2} fill={color} />
          })}
        </Svg>
        <T size={12} tone="soft">
          Blunders in each game, oldest to newest. Green won, red lost.
        </T>
      </View>

      <Rule />
      <Row style={{ justifyContent: 'space-between' }}>
        <Stat value={`${fixed}/${all.length}`} label="mistakes fixed" />
        <Stat value={String(days)} label={days === 1 ? 'day streak' : 'day streak'} />
        {rating ? <Stat value={String(rating)} label="rating" /> : null}
      </Row>

      {ranking.length > 0 && (
        <View style={{ gap: space.s }}>
          <Rule style={{ marginBottom: space.s }} />
          <T size={13} weight="medium" tone="soft">
            What costs you the most
          </T>
          {ranking.map((r) => (
            <Row key={r.tag} style={{ justifyContent: 'space-between' }}>
              <T>{PATTERNS[r.tag].label}</T>
              <T tone="soft" style={{ fontVariant: ['tabular-nums'] }}>
                {r.perGame.toFixed(1)} per game
              </T>
            </Row>
          ))}
        </View>
      )}
    </Screen>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View>
      <T size={26} weight="display">
        {value}
      </T>
      <T size={13} tone="soft">
        {label}
      </T>
    </View>
  )
}
