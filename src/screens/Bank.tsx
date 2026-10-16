import { useMemo } from 'react'
import { PATTERNS } from '../lib/patterns'
import { isRetired } from '../lib/srs'
import { useStore } from '../lib/store'
import type { Mistake, PatternTag } from '../lib/types'

export function Bank({ onDrill }: { onDrill: (queue: Mistake[]) => void }) {
  const mistakes = useStore((s) => s.mistakes)
  const groups = useMemo(() => {
    const map = new Map<PatternTag, Mistake[]>()
    for (const m of Object.values(mistakes)) map.set(m.tag, [...(map.get(m.tag) ?? []), m])
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [mistakes])

  if (!groups.length) {
    return (
      <div className="screen">
        <h1>Mistake Bank</h1>
        <p className="muted">Your mistakes will show up here after you import some games.</p>
      </div>
    )
  }

  return (
    <div className="screen">
      <h1>Mistake Bank</h1>
      {groups.map(([tag, list]) => {
        const fixed = list.filter(isRetired).length
        const sorted = [...list].sort((a, b) => b.createdAt - a.createdAt)
        return (
          <div className="card" key={tag}>
            <div className="row between">
              <p className="big">{PATTERNS[tag].label}</p>
              <button onClick={() => onDrill(sorted)}>Drill all</button>
            </div>
            <p className="muted small">
              {list.length} found · {fixed} fixed
            </p>
            <ul className="list">
              {sorted.slice(0, 8).map((m) => (
                <li key={m.id}>
                  <button className="link" onClick={() => onDrill([m])}>
                    Move {m.moveNumber}: you played {m.played}, better was {m.best}
                  </button>
                  {isRetired(m) && <span className="pill">fixed</span>}
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
