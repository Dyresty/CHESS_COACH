import { Chess, type Square } from 'chess.js'
import * as Haptics from 'expo-haptics'
import { memo, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native'
import Svg, { Line, Polygon } from 'react-native-svg'
import type { Color } from '../../../core/types'
import { Piece } from './Piece'
import { font, radius, usePalette } from './theme'

export interface BoardArrow {
  from: string
  to: string
  color: string
}

interface Props {
  fen: string
  orientation: Color
  onMove?: (uci: string) => void
  disabled?: boolean
  highlight?: string[]
  arrows?: BoardArrow[]
  /** Fixed size; otherwise the board fills the width it's given. */
  size?: number
  coordinates?: boolean
}

const FILES = 'abcdefgh'

function squareAt(row: number, col: number, orientation: Color): string {
  const file = orientation === 'w' ? col : 7 - col
  const rank = orientation === 'w' ? 8 - row : row + 1
  return FILES[file] + rank
}

function centre(square: string, orientation: Color, cell: number) {
  const file = FILES.indexOf(square[0])
  const rank = Number(square[1])
  const col = orientation === 'w' ? file : 7 - file
  const row = orientation === 'w' ? 8 - rank : rank - 1
  return { x: col * cell + cell / 2, y: row * cell + cell / 2 }
}

/** Tap a piece, then tap where it goes. */
export const Board = memo(function Board({ fen, orientation, onMove, disabled, highlight = [], arrows = [], size, coordinates = true }: Props) {
  const p = usePalette()
  const [measured, setMeasured] = useState(0)
  const [selected, setSelected] = useState<Square | null>(null)
  const chess = useMemo(() => new Chess(fen), [fen])
  const [selectedFen, setSelectedFen] = useState(fen)
  // A new position clears any selection from the old one.
  const activeSelection = selectedFen === fen ? selected : null
  const targets = useMemo(
    () => (activeSelection ? chess.moves({ square: activeSelection, verbose: true }).map((m) => m.to as string) : []),
    [chess, activeSelection],
  )
  const width = size ?? measured
  const cell = width / 8
  const board = chess.board()
  const interactive = !disabled && !!onMove

  function press(square: string) {
    if (!interactive) return
    if (activeSelection && targets.includes(square)) {
      const move = chess.moves({ square: activeSelection, verbose: true }).find((m) => m.to === square)!
      setSelected(null)
      void Haptics.selectionAsync()
      onMove!(move.from + move.to + (move.promotion ? 'q' : ''))
      return
    }
    const piece = chess.get(square as Square)
    setSelectedFen(fen)
    setSelected(piece && piece.color === chess.turn() && square !== activeSelection ? (square as Square) : null)
  }

  return (
    <View
      onLayout={size ? undefined : (e: LayoutChangeEvent) => setMeasured(e.nativeEvent.layout.width)}
      style={[styles.frame, { width: size ?? '100%', height: width || undefined, aspectRatio: size ? undefined : 1 }]}
      accessibilityLabel={`Chess board, ${chess.turn() === 'w' ? 'white' : 'black'} to move`}
    >
      {width > 0 &&
        Array.from({ length: 8 }, (_, row) => (
          <View key={row} style={{ flexDirection: 'row' }}>
            {Array.from({ length: 8 }, (_, col) => {
              const square = squareAt(row, col, orientation)
              const file = FILES.indexOf(square[0])
              const rank = Number(square[1])
              const dark = (file + rank) % 2 === 0
              const piece = board[8 - rank][file]
              const isTarget = targets.includes(square)
              const tint = square === activeSelection ? p.selected : highlight.includes(square) ? p.lastMove : null
              const coordColor = dark ? p.walnutLight : p.walnutDark
              return (
                <Pressable
                  key={square}
                  onPress={() => press(square)}
                  accessibilityLabel={piece ? `${square} ${piece.color === 'w' ? 'white' : 'black'} ${piece.type}` : square}
                  testID={`sq-${square}`}
                  style={{ width: cell, height: cell, backgroundColor: dark ? p.walnutDark : p.walnutLight }}
                >
                  {tint && <View style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} />}
                  {piece && <Piece code={piece.color + piece.type} size={cell} />}
                  {isTarget && (
                    <View style={[StyleSheet.absoluteFill, styles.centre]}>
                      <View
                        style={
                          piece
                            ? { width: cell, height: cell, borderRadius: cell / 2, borderWidth: cell * 0.08, borderColor: 'rgba(20,16,12,0.35)' }
                            : { width: cell * 0.3, height: cell * 0.3, borderRadius: cell, backgroundColor: 'rgba(20,16,12,0.3)' }
                        }
                      />
                    </View>
                  )}
                  {coordinates && col === 0 && <Text style={[styles.rank, { color: coordColor, fontSize: cell * 0.2 }]}>{rank}</Text>}
                  {coordinates && row === 7 && <Text style={[styles.file, { color: coordColor, fontSize: cell * 0.2 }]}>{square[0]}</Text>}
                </Pressable>
              )
            })}
          </View>
        ))}
      {width > 0 && arrows.length > 0 && (
        <Svg width={width} height={width} style={StyleSheet.absoluteFill} pointerEvents="none">
          {arrows.map((a) => {
            const s = centre(a.from, orientation, cell)
            const e = centre(a.to, orientation, cell)
            const angle = Math.atan2(e.y - s.y, e.x - s.x)
            const head = cell * 0.42
            const tip = { x: e.x - Math.cos(angle) * cell * 0.15, y: e.y - Math.sin(angle) * cell * 0.15 }
            const base = { x: tip.x - Math.cos(angle) * head, y: tip.y - Math.sin(angle) * head }
            const side = (sign: number) => `${base.x + Math.cos(angle + (sign * Math.PI) / 2) * head * 0.6},${base.y + Math.sin(angle + (sign * Math.PI) / 2) * head * 0.6}`
            return [
              <Line key={`${a.from}${a.to}l`} x1={s.x} y1={s.y} x2={base.x} y2={base.y} stroke={a.color} strokeWidth={cell * 0.16} strokeLinecap="round" opacity={0.85} />,
              <Polygon key={`${a.from}${a.to}h`} points={`${tip.x},${tip.y} ${side(1)} ${side(-1)}`} fill={a.color} opacity={0.85} />,
            ]
          })}
        </Svg>
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  frame: { borderRadius: radius, overflow: 'hidden' },
  centre: { alignItems: 'center', justifyContent: 'center' },
  rank: { position: 'absolute', top: 2, left: 3, fontFamily: font.bold },
  file: { position: 'absolute', bottom: 1, right: 3, fontFamily: font.bold },
})
