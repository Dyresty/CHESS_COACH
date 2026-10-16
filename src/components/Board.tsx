import { Chess, type Square } from 'chess.js'
import { useMemo, useState, type CSSProperties } from 'react'
import { Chessboard } from 'react-chessboard'
import type { Arrow } from 'react-chessboard'
import type { Color } from '../lib/types'

interface Props {
  fen: string
  orientation: Color
  /** Called with a legal move in UCI notation. Return false to reject it. */
  onMove?: (uci: string) => boolean | void
  disabled?: boolean
  arrows?: Arrow[]
  highlight?: string[]
}

const HIGHLIGHT: CSSProperties = { background: 'rgba(255, 206, 84, 0.55)' }
const SELECTED: CSSProperties = { background: 'rgba(98, 180, 255, 0.55)' }
const TARGET: CSSProperties = { background: 'radial-gradient(circle, rgba(0,0,0,.28) 22%, transparent 24%)' }

/** Board that supports both dragging and tap-to-move (tap a piece, then a square). */
export function Board({ fen, orientation, onMove, disabled, arrows = [], highlight = [] }: Props) {
  const [selected, setSelected] = useState<Square | null>(null)
  const chess = useMemo(() => new Chess(fen), [fen])
  const targets = useMemo(
    () => (selected ? chess.moves({ square: selected, verbose: true }).map((m) => m.to) : []),
    [chess, selected],
  )

  function tryMove(from: string, to: string): boolean {
    if (disabled || !onMove) return false
    const legal = chess.moves({ verbose: true }).find((m) => m.from === from && m.to === to)
    if (!legal) return false
    setSelected(null)
    const uci = legal.from + legal.to + (legal.promotion ? 'q' : '')
    return onMove(uci) !== false
  }

  function onSquareClick({ square }: { square: string }) {
    if (disabled) return
    const piece = chess.get(square as Square)
    if (selected && targets.includes(square as Square)) {
      tryMove(selected, square)
      return
    }
    setSelected(piece && piece.color === chess.turn() ? (square as Square) : null)
  }

  const squareStyles: Record<string, CSSProperties> = {}
  for (const sq of highlight) squareStyles[sq] = HIGHLIGHT
  for (const sq of targets) squareStyles[sq] = TARGET
  if (selected) squareStyles[selected] = SELECTED

  return (
    <div className="board">
      <Chessboard
        options={{
          position: fen,
          boardOrientation: orientation === 'w' ? 'white' : 'black',
          allowDragging: !disabled && !!onMove,
          canDragPiece: ({ piece }) => piece.pieceType[0] === chess.turn(),
          onPieceDrop: ({ sourceSquare, targetSquare }) => (targetSquare ? tryMove(sourceSquare, targetSquare) : false),
          onSquareClick,
          squareStyles,
          arrows,
          allowDrawingArrows: false,
          darkSquareStyle: { backgroundColor: '#7a9a5a' },
          lightSquareStyle: { backgroundColor: '#eeeed2' },
        }}
      />
    </div>
  )
}
