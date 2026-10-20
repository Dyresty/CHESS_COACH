import { View } from 'react-native'
import Svg, { Circle, Line, Path } from 'react-native-svg'
import { usePalette } from './theme'

/**
 * Your winning chances through a game (0 to 100 per ply), with your mistakes marked.
 * Tapping a point selects that ply.
 */
export function WinCurve({
  curve,
  width,
  height = 72,
  marks = [],
  cursor,
}: {
  curve: number[]
  width: number
  height?: number
  marks?: { ply: number; kind: 'blunder' | 'mistake' }[]
  cursor?: number
}) {
  const p = usePalette()
  if (curve.length < 2 || width <= 0) return <View style={{ height }} />
  const x = (i: number) => (i / (curve.length - 1)) * width
  const y = (v: number) => height - (v / 100) * height
  const line = curve.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  const area = `${line} L${width} ${height} L0 ${height} Z`
  return (
    <Svg width={width} height={height}>
      <Line x1={0} x2={width} y1={height / 2} y2={height / 2} stroke={p.rule} strokeWidth={1} />
      <Path d={area} fill={p.ink} opacity={0.08} />
      <Path d={line} stroke={p.ink} strokeWidth={1.5} fill="none" />
      {cursor !== undefined && <Line x1={x(cursor)} x2={x(cursor)} y1={0} y2={height} stroke={p.good} strokeWidth={1.5} />}
      {marks.map((m) => (
        <Circle key={m.ply} cx={x(m.ply)} cy={y(curve[m.ply] ?? 50)} r={4} fill={m.kind === 'blunder' ? p.blunder : p.mistake} />
      ))}
    </Svg>
  )
}
