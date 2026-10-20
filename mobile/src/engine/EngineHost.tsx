import { StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { engine } from './engine'
import { ENGINE_HTML } from './engineHtml.generated'

/** Mounts the invisible WebView that runs Stockfish. Render once, near the app root. */
export function EngineHost() {
  return (
    <View style={styles.host} pointerEvents="none">
      <WebView
        ref={(view) => {
          if (view) engine.attach((cmds) => view.injectJavaScript(`window.__send(${JSON.stringify(cmds)});true;`))
        }}
        source={{ html: ENGINE_HTML, baseUrl: 'https://chesscoach.local/' }}
        originWhitelist={['*']}
        onMessage={(e) => engine.onMessage(e.nativeEvent.data)}
        javaScriptEnabled
      />
    </View>
  )
}

const styles = StyleSheet.create({
  host: { position: 'absolute', width: 1, height: 1, opacity: 0, left: -10, top: -10 },
})
