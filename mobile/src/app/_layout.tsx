import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces'
import { IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold, useFonts } from '@expo-google-fonts/ibm-plex-sans'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { View, useColorScheme } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { EngineHost } from '../engine/EngineHost'
import { hydrate } from '../state/store'
import { usePalette } from '../ui/theme'

void SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const p = usePalette()
  const scheme = useColorScheme()
  const [fontsLoaded, fontError] = useFonts({ Fraunces_600SemiBold, IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold })
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    void hydrate().then(() => setHydrated(true))
  }, [])

  const ready = (fontsLoaded || !!fontError) && hydrated
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync()
  }, [ready])

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: p.paper }}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        {/* The engine starts loading while fonts and saved data load. */}
        <EngineHost />
        {ready && (
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: p.paper }, animation: 'fade_from_bottom' }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="drill" />
            <Stack.Screen name="quiz" />
            <Stack.Screen name="play" />
            <Stack.Screen name="game/[id]" />
            <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
          </Stack>
        )}
      </View>
    </SafeAreaProvider>
  )
}
