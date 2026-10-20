import type { EvalResult, Score } from './types'

/** Accumulates UCI output lines for one search and produces the final result on "bestmove". */
export class SearchParser {
  private score: Score = { cp: 0 }
  private pv: string[] = []
  private multi = new Map<number, { score: Score; pv: string[] }>()

  /** Returns the result when the search has finished, otherwise null. */
  push(line: string): EvalResult | null {
    if (line.startsWith('info') && line.includes(' pv ')) {
      const parsed = parseInfo(line)
      if (parsed) {
        this.multi.set(parsed.multipv, { score: parsed.score, pv: parsed.pv })
        if (parsed.multipv === 1) {
          this.score = parsed.score
          this.pv = parsed.pv
        }
      }
      return null
    }
    if (line.startsWith('bestmove')) {
      const bestmove = line.split(/\s+/)[1] ?? '(none)'
      const pv = this.pv.length && this.pv[0] === bestmove ? this.pv : [bestmove]
      return { score: this.score, bestmove, pv }
    }
    return null
  }

  /** Lines from a MultiPV search, best first. */
  lines(): { score: Score; pv: string[] }[] {
    return [...this.multi.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v)
  }
}

export function parseInfo(line: string): { multipv: number; score: Score; pv: string[] } | null {
  const tokens = line.split(/\s+/)
  let multipv = 1
  let score: Score | null = null
  let pv: string[] = []
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    if (t === 'multipv') multipv = Number(tokens[i + 1])
    else if (t === 'score') {
      const kind = tokens[i + 1]
      const value = Number(tokens[i + 2])
      score = kind === 'mate' ? { mate: value } : { cp: value }
    } else if (t === 'pv') {
      pv = tokens.slice(i + 1)
      break
    }
  }
  if (!score || !pv.length) return null
  return { multipv, score, pv }
}
