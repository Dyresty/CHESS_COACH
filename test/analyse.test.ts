import { afterAll, describe, expect, it } from 'vitest'
import { analyseGame } from '../core/analyse'
import type { Color, ImportedGame } from '../core/types'
import { createNodeEngine } from './nodeEngine'

const engine = createNodeEngine()
afterAll(() => engine.quit())

function game(pgn: string, userColor: Color): ImportedGame {
  return { id: pgn, url: '', pgn, endTime: 0, timeClass: 'rapid', userColor, opponent: 'x', result: 'loss' }
}

async function tagsFor(pgn: string, color: Color) {
  const { mistakes } = await analyseGame(game(pgn, color), engine.evaluate, { depth: 10 })
  return mistakes.map((m) => [m.played, m.tag])
}

describe('analyseGame', () => {
  it('tags a queen moved onto an attacked square as a hung piece', async () => {
    expect(await tagsFor('1. e4 e5 2. Nf3 Qh4 3. Nxh4', 'b')).toContainEqual(['Qh4', 'hung-piece'])
  }, 60000)

  it('tags ignoring a free capture as a missed free piece', async () => {
    expect(await tagsFor('1. e4 e5 2. Nf3 Qh4 3. d3', 'w')).toContainEqual(['d3', 'missed-free-piece'])
  }, 60000)

  it('tags ignoring an attacked knight as a missed threat', async () => {
    expect(await tagsFor('1. e4 Nc6 2. d4 Nf6 3. d5 a6 4. dxc6', 'b')).toContainEqual(['a6', 'missed-threat'])
  }, 60000)

  it('tags a move that allows mate in one', async () => {
    expect(await tagsFor('1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7#', 'b')).toContainEqual(['Nf6', 'allowed-mate'])
  }, 60000)

  it('finds no mistakes in a clean opening', async () => {
    expect(await tagsFor('1. e4 e5 2. Nf3 Nc6 3. Bb5 a6', 'w')).toEqual([])
  }, 60000)
})
