import { SearchParser } from '../../../core/uci'
import type { EvalOptions, EvalResult, Score } from '../../../core/types'

type Inject = (commands: string[]) => void
type Message = { type: 'ready' } | { type: 'error'; message: string } | { type: 'result'; lines: string[]; bestmove: string }

/**
 * Stockfish running inside a hidden WebView (see EngineHost).
 * Searches run one at a time, in the order they were asked for.
 */
class WebViewEngine {
  private inject: Inject | null = null
  private markReady!: () => void
  private ready = new Promise<void>((resolve) => (this.markReady = resolve))
  private pending: ((parser: SearchParser, result: EvalResult) => void) | null = null
  private queue: Promise<unknown> = Promise.resolve()
  private multiPv = 1
  lastError: string | null = null

  attach(inject: Inject) {
    this.inject = inject
  }

  onMessage(raw: string) {
    let msg: Message
    try {
      msg = JSON.parse(raw) as Message
    } catch {
      return
    }
    if (msg.type === 'ready') this.markReady()
    else if (msg.type === 'error') this.lastError = msg.message
    else if (msg.type === 'result' && this.pending) {
      const parser = new SearchParser()
      for (const line of msg.lines) parser.push(line)
      const result = parser.push(msg.bestmove)!
      const done = this.pending
      this.pending = null
      done(parser, result)
    }
  }

  evaluate = (fen: string, opts: EvalOptions = {}): Promise<EvalResult> =>
    this.enqueue(async () => (await this.search(fen, opts, 1)).result)

  /** The top `count` moves with their scores (from the side to move's view), best first. */
  topMoves(fen: string, count: number, opts: EvalOptions = {}): Promise<{ move: string; score: Score }[]> {
    return this.enqueue(async () => {
      const { parser } = await this.search(fen, opts, count)
      return parser.lines().map((l) => ({ move: l.pv[0], score: l.score }))
    })
  }

  private async search(fen: string, opts: EvalOptions, multiPv: number) {
    await this.ready
    return new Promise<{ parser: SearchParser; result: EvalResult }>((resolve) => {
      this.pending = (parser, result) => resolve({ parser, result })
      const commands: string[] = []
      if (multiPv !== this.multiPv) {
        commands.push(`setoption name MultiPV value ${multiPv}`)
        this.multiPv = multiPv
      }
      commands.push(`position fen ${fen}`, opts.movetime ? `go movetime ${opts.movetime}` : `go depth ${opts.depth ?? 11}`)
      this.inject?.(commands)
    })
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const next = this.queue.then(task)
    this.queue = next.catch(() => undefined)
    return next
  }
}

export const engine = new WebViewEngine()
