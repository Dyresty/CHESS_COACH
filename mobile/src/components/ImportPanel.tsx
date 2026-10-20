import { useState } from 'react'
import { View } from 'react-native'
import { ChessComError } from '../../../core/chesscom'
import { importFromChessCom, type ImportProgress } from '../lib/importer'
import { useStore } from '../state/store'
import { Button, ProgressBar, T } from '../ui/kit'
import { space } from '../ui/theme'

export function ImportPanel({ kind = 'secondary' }: { kind?: 'primary' | 'secondary' }) {
  const username = useStore((s) => s.settings.username)
  const timeClass = useStore((s) => s.settings.timeClass)
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function run() {
    setBusy(true)
    setMessage(null)
    try {
      const n = await importFromChessCom(setProgress)
      setMessage(n ? `Analysed ${n} new game${n === 1 ? '' : 's'}.` : `No new ${timeClass === 'all' ? '' : timeClass + ' '}games since your last import.`)
    } catch (e) {
      setMessage(e instanceof ChessComError ? e.message : `Something went wrong while analysing: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  const label = timeClass === 'all' ? 'Import my latest games' : `Import my latest ${timeClass} games`
  return (
    <View style={{ gap: space.s }}>
      <Button label={busy ? 'Analysing…' : label} kind={kind} onPress={run} disabled={!username || busy} />
      {progress && (
        <View style={{ gap: space.xs }}>
          <ProgressBar value={(progress.game - 1 + progress.fraction) / progress.games} />
          <T size={13} tone="soft">
            Reading game {progress.game} of {progress.games} move by move
          </T>
        </View>
      )}
      {message && <T size={14}>{message}</T>}
    </View>
  )
}
