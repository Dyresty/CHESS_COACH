import { createEmptyCard } from 'ts-fsrs'
import { describe, expect, it } from 'vitest'
import { buildSafetyQuiz } from '../core/session'
import { initialState, streak, today } from '../core/state'
import type { Mistake, State } from '../core/types'

function mistake(id: string, tag: Mistake['tag']): Mistake {
  return {
    id, gameId: 'g', gameUrl: '', fen: '8/8/8/8/8/8/8/K6k w - - 0 1', userColor: 'w', moveNumber: 1,
    played: 'Ka2', playedUci: 'a1a2', best: 'Kb1', bestUci: 'a1b1', bestLine: [], severity: 'blunder',
    winDrop: 0.3, tag, card: createEmptyCard(new Date(0)), createdAt: 0,
  }
}

describe('streak', () => {
  const day = (offset: number) => {
    const d = new Date(2026, 9, 20)
    d.setDate(d.getDate() + offset)
    return today(d)
  }
  const now = new Date(2026, 9, 20, 12)

  it('counts consecutive days ending today', () => {
    expect(streak({ [day(0)]: 3, [day(-1)]: 1, [day(-2)]: 5, [day(-4)]: 1 }, now)).toBe(3)
  })

  it('still counts a streak that ended yesterday', () => {
    expect(streak({ [day(-1)]: 1, [day(-2)]: 1 }, now)).toBe(2)
  })

  it('is zero with no recent training', () => {
    expect(streak({ [day(-3)]: 1 }, now)).toBe(0)
  })
})

describe('buildSafetyQuiz', () => {
  it('mixes real blunders with good moves and skips non-safety mistakes', () => {
    const state: State = {
      ...initialState,
      mistakes: {
        a: mistake('a', 'hung-piece'),
        b: mistake('b', 'missed-threat'),
        c: mistake('c', 'missed-free-piece'),
      },
      games: {
        g: {
          id: 'g', url: '', endTime: 0, opponent: 'x', result: 'loss', userColor: 'w', userMoves: 10, mistakes: 0, blunders: 3, tags: {},
          safeMoves: [1, 2, 3].map((n) => ({ fen: '8/8/8/8/8/8/8/K6k w - - 0 1', uci: 'a1b1', san: 'Kb1', moveNumber: n })),
        },
      },
    }
    const quiz = buildSafetyQuiz(state, 4, () => 0.5)
    expect(quiz).toHaveLength(4)
    expect(quiz.filter((q) => !q.safe).map((q) => q.mistake?.tag).sort()).toEqual(['hung-piece', 'missed-threat'])
    expect(quiz.filter((q) => q.safe)).toHaveLength(2)
  })
})
