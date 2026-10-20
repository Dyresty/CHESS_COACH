import { useMemo } from 'react'
import { PATTERNS } from '../../core/patterns'
import { weaknessRanking } from '../../core/session'
import { isRetired } from '../../core/srs'
import { useStore } from '../lib/store'

function average(values: number[]) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
}

export function Progress() {
  const games = useStore((s) => s.games)
  const mistakes = useStore((s) => s.mistakes)
  const sorted = useMemo(() => Object.values(games).sort((a, b) => b.endTime - a.endTime), [games])
  const ranking = useMemo(() => weaknessRanking(sorted), [sorted])

  if (!sorted.length) {
    return (
      <div className="screen">
        <h1>Progress</h1>
        <p className="muted">Import a few games to see your progress.</p>
      </div>
    )
  }

  const recent = sorted.slice(0, 10)
  const previous = sorted.slice(10, 20)
  const recentRate = average(recent.map((g) => g.blunders))
  const previousRate = previous.length ? average(previous.map((g) => g.blunders)) : null
  const all = Object.values(mistakes)
  const fixed = all.filter(isRetired).length
  const rating = sorted.find((g) => g.userRating)?.userRating
  const chart = sorted.slice(0, 20).reverse()
  const maxBlunders = Math.max(3, ...chart.map((g) => g.blunders))

  return (
    <div className="screen">
      <h1>Progress</h1>
      <div className="stats">
        <div className="stat">
          <span className="big">{recentRate.toFixed(1)}</span>
          <span className="muted small">blunders per game, last {recent.length}</span>
          {previousRate !== null && (
            <span className={`small ${recentRate <= previousRate ? 'up' : 'down'}`}>was {previousRate.toFixed(1)} before</span>
          )}
        </div>
        <div className="stat">
          <span className="big">
            {fixed}/{all.length}
          </span>
          <span className="muted small">mistakes fixed</span>
        </div>
        {rating && (
          <div className="stat">
            <span className="big">{rating}</span>
            <span className="muted small">latest rating</span>
          </div>
        )}
      </div>

      <div className="card">
        <p className="tag">Blunders per game, oldest to newest</p>
        <div className="bars" role="img" aria-label="Blunders per game for recent games">
          {chart.map((g) => (
            <div key={g.id} className={`col ${g.result}`} title={`${g.blunders} blunders vs ${g.opponent}`}>
              <span style={{ height: `${(g.blunders / maxBlunders) * 100}%` }} />
              <small>{g.blunders}</small>
            </div>
          ))}
        </div>
        <p className="muted small">Lower is better. Bar colour shows win, loss or draw.</p>
      </div>

      <div className="card">
        <p className="tag">What costs you the most</p>
        <ul className="list">
          {ranking.map((r) => (
            <li key={r.tag} className="row between">
              <span>{PATTERNS[r.tag].label}</span>
              <span className="muted">{r.perGame.toFixed(1)} per game</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
