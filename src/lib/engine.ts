import { SearchParser } from '../../core/uci'
import type { EvalOptions, EvalResult, Score } from '../../core/types'

const ENGINE_URL = `${import.meta.env.BASE_URL}engine/stockfish-19-lite-single.js`

/** Stockfish running in a Web Worker. Searches run one at a time, in order. */
export class Engine {
  private worker = new Worker(ENGINE_URL)
  private listener: ((line: string) => void) | null = null
  private queue: Promise<unknown> = Promise.resolve()
  private multiPv = 1

  constructor() {
    this.worker.onmessage = (e: MessageEvent<string>) => this.listener?.(String(e.data))
    this.worker.postMessage('uci')
    this.worker.postMessage('isready')
  }

  evaluate = (fen: string, opts: EvalOptions = {}): Promise<EvalResult> =>
    this.enqueue(async () => {
      this.setMultiPv(1)
      return (await this.search(fen, opts)).result
    })

  /** Top `count` moves with their scores (side to move's view), best first. */
  topMoves(fen: string, count: number, opts: EvalOptions = {}): Promise<{ move: string; score: Score }[]> {
    return this.enqueue(async () => {
      this.setMultiPv(count)
      const { parser } = await this.search(fen, opts)
      return parser.lines().map((l) => ({ move: l.pv[0], score: l.score }))
    })
  }

  terminate() {
    this.worker.terminate()
  }

  private setMultiPv(n: number) {
    if (n === this.multiPv) return
    this.worker.postMessage(`setoption name MultiPV value ${n}`)
    this.multiPv = n
  }

  private search(fen: string, opts: EvalOptions) {
    return new Promise<{ result: EvalResult; parser: SearchParser }>((resolve) => {
      const parser = new SearchParser()
      this.listener = (line) => {
        const result = parser.push(line)
        if (result) {
          this.listener = null
          resolve({ result, parser })
        }
      }
      this.worker.postMessage(`position fen ${fen}`)
      this.worker.postMessage(opts.movetime ? `go movetime ${opts.movetime}` : `go depth ${opts.depth ?? 11}`)
    })
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const next = this.queue.then(task)
    this.queue = next.catch(() => undefined)
    return next
  }
}

let shared: Engine | null = null
export function getEngine(): Engine {
  shared ??= new Engine()
  return shared
}
