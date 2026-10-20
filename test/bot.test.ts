import { describe, expect, it } from 'vitest'
import { capturedPiece, chooseBotMove, guardWarning } from '../core/bot'

const top = [
  { move: 'e2e4', score: { cp: 50 } },
  { move: 'd2d4', score: { cp: 40 } },
  { move: 'a2a3', score: { cp: -400 } },
]

describe('bot', () => {
  it('hard always plays the best move', () => {
    for (const r of [0, 0.5, 0.99]) expect(chooseBotMove(top, 'hard', () => r)).toBe('e2e4')
  })
  it('easy never plays a move outside its window', () => {
    for (let r = 0; r < 1; r += 0.05) expect(chooseBotMove(top, 'easy', () => r)).not.toBe('a2a3')
  })
  it('names the captured piece', () => {
    // After 1.e4 d5, exd5 takes the pawn on d5.
    expect(capturedPiece('rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2', 'e4d5')).toBe('pawn on d5')
  })
  it('explains a hung piece', () => {
    // White's knight on e5 can be taken by the knight on c6.
    const fen = 'r1bqkbnr/pppp1ppp/2n5/4N3/4P3/8/PPPP1PPP/RNBQKB1R b KQkq - 0 3'
    expect(guardWarning(fen, 'c6e5', false)).toBe('That leaves your knight on e5 to be taken with Nxe5.')
  })
})
