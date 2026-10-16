import { Chess } from 'chess.js'
import { useState } from 'react'
import { ChessComError } from '../lib/chesscom'
import { analyseAndSave, importFromChessCom, type ImportProgress } from '../lib/importer'
import { useStore } from '../lib/store'
import type { Color } from '../lib/types'

export function Importer({ compact }: { compact?: boolean }) {
  const username = useStore((s) => s.settings.username)
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [pgn, setPgn] = useState('')
  const [color, setColor] = useState<Color>('w')

  async function run(task: () => Promise<number>) {
    setBusy(true)
    setMessage(null)
    try {
      const n = await task()
      setMessage(n ? `Analysed ${n} new game${n === 1 ? '' : 's'}.` : 'No new games to analyse.')
    } catch (e) {
      console.error(e)
      setMessage(e instanceof ChessComError ? e.message : `Something went wrong while analysing: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  function importPgn() {
    const chess = new Chess()
    try {
      chess.loadPgn(pgn)
    } catch {
      setMessage("That PGN couldn't be read.")
      return
    }
    const headers = chess.getHeaders()
    const id = `pgn:${headers.Date ?? ''}:${chess.history().join('').slice(0, 80)}`
    void run(() =>
      analyseAndSave(
        [
          {
            id,
            url: headers.Link ?? '',
            pgn,
            endTime: Date.now(),
            timeClass: 'pasted',
            userColor: color,
            opponent: (color === 'w' ? headers.Black : headers.White) ?? 'Opponent',
            result: 'loss',
          },
        ],
        setProgress,
      ),
    ).then(() => setPgn(''))
  }

  return (
    <div className="importer">
      <button className="primary" disabled={busy || !username} onClick={() => run(() => importFromChessCom(setProgress))}>
        {busy ? 'Analysing…' : 'Import my latest games'}
      </button>
      {progress && (
        <div className="progress" aria-live="polite">
          <div className="bar">
            <span style={{ width: `${Math.round(((progress.game - 1 + progress.fraction) / progress.games) * 100)}%` }} />
          </div>
          <p className="muted small">
            Analysing game {progress.game} of {progress.games}
          </p>
        </div>
      )}
      {message && <p className="small">{message}</p>}
      {!compact && (
        <details>
          <summary className="small">Or paste a game (PGN)</summary>
          <textarea value={pgn} onChange={(e) => setPgn(e.target.value)} rows={4} placeholder="1. e4 e5 2. Nf3 …" />
          <div className="row gap">
            <select value={color} onChange={(e) => setColor(e.target.value as Color)} aria-label="Your colour">
              <option value="w">I played White</option>
              <option value="b">I played Black</option>
            </select>
            <button disabled={busy || !pgn.trim()} onClick={importPgn}>
              Analyse
            </button>
          </div>
        </details>
      )}
    </div>
  )
}
