import { useEffect } from 'react'
import { engine } from './engine'
import { ENGINE_HTML } from './engineHtml.generated'

/** Web build: the same engine page, in a hidden iframe instead of a WebView. */
export function EngineHost() {
  useEffect(() => {
    const frame = document.createElement('iframe')
    frame.style.display = 'none'
    frame.srcdoc = ENGINE_HTML
    const onMessage = (e: MessageEvent) => {
      if (e.source === frame.contentWindow && typeof e.data?.chessCoachEngine === 'string') engine.onMessage(e.data.chessCoachEngine)
    }
    window.addEventListener('message', onMessage)
    document.body.appendChild(frame)
    engine.attach((cmds) => (frame.contentWindow as unknown as { __send?: (c: string[]) => void })?.__send?.(cmds))
    return () => {
      window.removeEventListener('message', onMessage)
      frame.remove()
    }
  }, [])
  return null
}
