import { useState } from 'react'
import { Importer } from '../components/Importer'
import { resetAll, setState, useStore } from '../lib/store'

export function Settings() {
  const settings = useStore((s) => s.settings)
  const [name, setName] = useState(settings.username)

  function update(patch: Partial<typeof settings>) {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
  }

  return (
    <div className="screen">
      <h1>Settings</h1>
      <div className="card">
        <label className="field">
          <span>chess.com username</span>
          <div className="row gap">
            <input value={name} onChange={(e) => setName(e.target.value)} autoCapitalize="off" autoCorrect="off" placeholder="your username" />
            <button onClick={() => update({ username: name.trim() })} disabled={name.trim() === settings.username}>
              Save
            </button>
          </div>
        </label>
        <label className="field">
          <span>Games to import</span>
          <select value={settings.timeClass} onChange={(e) => update({ timeClass: e.target.value })}>
            <option value="rapid">Rapid (10 to 30 min)</option>
            <option value="blitz">Blitz</option>
            <option value="bullet">Bullet</option>
            <option value="daily">Daily</option>
            <option value="all">All</option>
          </select>
        </label>
        <Importer />
      </div>

      <div className="card">
        <label className="field row between">
          <span>Safety check before each move</span>
          <input type="checkbox" checked={settings.safetyCheck} onChange={(e) => update({ safetyCheck: e.target.checked })} />
        </label>
        <label className="field">
          <span>New mistakes per day</span>
          <input type="number" min={1} max={50} value={settings.newPerDay} onChange={(e) => update({ newPerDay: Math.max(1, Number(e.target.value) || 1) })} />
        </label>
      </div>

      <button
        className="danger"
        onClick={() => {
          if (confirm('Delete all imported games and progress on this device?')) resetAll()
        }}
      >
        Reset all data
      </button>
    </div>
  )
}
