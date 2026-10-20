import { Tabs } from 'expo-router'
import { View, useColorScheme } from 'react-native'
import { Piece } from '../../ui/Piece'
import { font, usePalette } from '../../ui/theme'

/** Tab icons are piece silhouettes: dark pieces on paper, light pieces at night. */
function PieceIcon({ code, focused }: { code: string; focused: boolean }) {
  const colour = useColorScheme() === 'dark' ? 'w' : 'b'
  return (
    <View style={{ opacity: focused ? 1 : 0.45 }}>
      <Piece code={colour + code[1]} size={22} />
    </View>
  )
}

export default function TabsLayout() {
  const p = usePalette()
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: p.paper },
        tabBarStyle: { backgroundColor: p.paper, borderTopColor: p.rule },
        tabBarActiveTintColor: p.ink,
        tabBarInactiveTintColor: p.inkSoft,
        tabBarLabelStyle: { fontFamily: font.medium, fontSize: 12, lineHeight: 16 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: ({ focused }) => <PieceIcon code="bP" focused={focused} /> }} />
      <Tabs.Screen name="mistakes" options={{ title: 'Mistakes', tabBarIcon: ({ focused }) => <PieceIcon code="bN" focused={focused} /> }} />
      <Tabs.Screen name="games" options={{ title: 'Games', tabBarIcon: ({ focused }) => <PieceIcon code="bR" focused={focused} /> }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress', tabBarIcon: ({ focused }) => <PieceIcon code="bK" focused={focused} /> }} />
    </Tabs>
  )
}
