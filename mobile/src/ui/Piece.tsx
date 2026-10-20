import { memo } from 'react'
import { SvgXml } from 'react-native-svg'
import { PIECE_SVGS } from './pieceSvgs'

/** `code` is colour + type, e.g. "wN" or "bq" (case of the type is ignored). */
export const Piece = memo(function Piece({ code, size }: { code: string; size: number }) {
  const key = code[0] + code[1].toUpperCase()
  return <SvgXml xml={PIECE_SVGS[key]} width={size} height={size} />
})
