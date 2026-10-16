import { useMemo } from 'react'
import { Importer } from '../components/Importer'
import { PATTERNS } from '../lib/patterns'
import { buildSession, weaknessRanking } from '../lib/session'
import { useStore } from '../lib/store'
import type { Mistake } from '../lib/types'

export function Today({ onStart, onSetup }: { onStart: (queue: Mistake[]) => void; onSetup: () => void }) {
  const state = useStore((s) => s)
  const session = useMemo(() => buildSession(state), [state])
  const focus = useMemo(() => weaknessRanking(Object.values(state.games))[0], [state.games])
  const gameCount = Object.keys(state.games).length

  if (!state.settings.username && !gameCount) {
    return (
      <div className="screen">
        <h1>Get better from your own games</h1>
        <p className="muted">
          Chess Coach reads your chess.com games, finds the moves that cost you, and turns them into short daily drills until you stop making them.
        </p>
        <button className="primary" onClick={onSetup}>
          Connect my chess.com username
        </button>
      </div>
    )
  }

  return (
    <div className="screen">
      <h1>Today</h1>
      <div className="card">
        <p className="big">{session.length ? `${session.length} positions to train` : 'Nothing due right now'}</p>
        <p className="muted small">
          {session.length ? 'About 1 minute each. All from your own games.' : gameCount ? 'Play a game, then import it here.' : 'Import your games to start.'}
        </p>
        <button className="primary" disabled={!session.length} onClick={() => onStart(session)}>
          Start session
        </button>
      </div>

      {focus && (
        <div className="card accent">
          <p className="tag">This week's focus</p>
          <p className="big">{PATTERNS[focus.tag].label}</p>
          <p className="small">
            Happened {focus.count} times in your last {Math.min(gameCount, 20)} games.
          </p>
          <p className="small">
            <b>In every game:</b> {PATTERNS[focus.tag].habit}
          </p>
        </div>
      )}

      <div className="card">
        <p className="tag">New games</p>
        <Importer compact />
      </div>
    </div>
  )
}
