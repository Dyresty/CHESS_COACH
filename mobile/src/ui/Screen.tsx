import type { ReactNode } from 'react'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { space, usePalette } from './theme'

/** Standard page: safe-area padding, 20pt side margins, scrolls when needed. */
export function Screen({ children, scroll = true, footer }: { children: ReactNode; scroll?: boolean; footer?: ReactNode }) {
  const p = usePalette()
  const insets = useSafeAreaInsets()
  const pad = { paddingTop: insets.top + space.m, paddingHorizontal: space.l, paddingBottom: space.xl, gap: space.l }
  return (
    <View style={{ flex: 1, backgroundColor: p.paper }}>
      {scroll ? (
        <ScrollView contentContainerStyle={pad} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, pad]}>{children}</View>
      )}
      {footer && <View style={{ paddingHorizontal: space.l, paddingBottom: insets.bottom + space.m, paddingTop: space.s }}>{footer}</View>}
    </View>
  )
}
