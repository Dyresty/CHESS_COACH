import { useState } from 'react'
import type { Mistake } from '../core/types'
import { Bank } from './screens/Bank'
import { Drill } from './screens/Drill'
import { Play } from './screens/Play'
import { Progress } from './screens/Progress'
import { Settings } from './screens/Settings'
import { Today } from './screens/Today'

type Tab = 'today' | 'bank' | 'progress' | 'settings'
type Overlay = { kind: 'drill'; queue: Mistake[] } | { kind: 'play'; mistake: Mistake } | null

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: '♟' },
  { id: 'bank', label: 'Mistakes', icon: '♜' },
  { id: 'progress', label: 'Progress', icon: '♛' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('today')
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [returnTo, setReturnTo] = useState<Overlay>(null)

  if (overlay?.kind === 'drill') {
    return (
      <main className="app">
        <Drill
          queue={overlay.queue}
          onExit={() => setOverlay(null)}
          onSecondChance={(mistake) => {
            // Come back to the rest of the session, after the position just played.
            setReturnTo({ kind: 'drill', queue: overlay.queue.slice(overlay.queue.indexOf(mistake) + 1) })
            setOverlay({ kind: 'play', mistake })
          }}
        />
      </main>
    )
  }
  if (overlay?.kind === 'play') {
    const m = overlay.mistake
    return (
      <main className="app">
        <Play
          fen={m.fen}
          userColor={m.userColor}
          title={`Second chance from move ${m.moveNumber}. Play it out and win this time.`}
          onExit={() => {
            setOverlay(returnTo)
            setReturnTo(null)
          }}
        />
      </main>
    )
  }

  const startDrill = (queue: Mistake[]) => setOverlay({ kind: 'drill', queue })

  return (
    <main className="app">
      {tab === 'today' && <Today onStart={startDrill} onSetup={() => setTab('settings')} />}
      {tab === 'bank' && <Bank onDrill={startDrill} />}
      {tab === 'progress' && <Progress />}
      {tab === 'settings' && <Settings />}
      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            <span aria-hidden>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </main>
  )
}
