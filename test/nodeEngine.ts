import { createRequire } from 'node:module'
import { SearchParser } from '../src/lib/uci'
import type { EvalResult, Evaluator } from '../src/lib/types'

const require = createRequire(import.meta.url)

/** Runs the same lite Stockfish build in Node, for tests. */
export function createNodeEngine(): { evaluate: Evaluator; quit: () => void } {
  type Pending = { parser: SearchParser; resolve: (r: EvalResult) => void }
  let pending: Pending | null = null
  const engine = require('stockfish')('lite-single', (line: string) => {
    if (!pending) return
    const result = pending.parser.push(line)
    if (result) {
      const done = pending
      pending = null
      done.resolve(result)
    }
  })
  engine.processCommand('uci')
  engine.processCommand('isready')
  let queue: Promise<unknown> = Promise.resolve()
  const evaluate: Evaluator = (fen, opts = {}) => {
    const run = () =>
      new Promise<EvalResult>((resolve) => {
        pending = { parser: new SearchParser(), resolve }
        engine.processCommand(`position fen ${fen}`)
        engine.processCommand(opts.movetime ? `go movetime ${opts.movetime}` : `go depth ${opts.depth ?? 11}`)
      })
    const next = queue.then(run)
    queue = next.catch(() => undefined)
    return next
  }
  return { evaluate, quit: () => engine.terminate?.() }
}
