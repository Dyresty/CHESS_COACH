import { router } from 'expo-router'
import { useState } from 'react'
import { Alert, Pressable, Switch, TextInput, View } from 'react-native'
import { resetAll, setState, useStore } from '../state/store'
import { Button, Row, Rule, T, Title } from '../ui/kit'
import { Screen } from '../ui/Screen'
import { font, radius, space, usePalette } from '../ui/theme'

const TIME_CLASSES = [
  ['rapid', 'Rapid'],
  ['blitz', 'Blitz'],
  ['bullet', 'Bullet'],
  ['daily', 'Daily'],
  ['all', 'All'],
] as const

export default function Settings() {
  const p = usePalette()
  const settings = useStore((s) => s.settings)
  const [name, setName] = useState(settings.username)
  const update = (patch: Partial<typeof settings>) => setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }))

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Title>Settings</Title>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
          <T size={15} weight="medium" tone="soft">
            Done
          </T>
        </Pressable>
      </Row>

      <View style={{ gap: space.s }}>
        <T size={14} weight="medium">
          chess.com username
        </T>
        <TextInput
          value={name}
          onChangeText={setName}
          onEndEditing={() => name.trim() && update({ username: name.trim() })}
          autoCapitalize="none"
          autoCorrect={false}
          style={{ borderWidth: 1.5, borderColor: p.ink, borderRadius: radius, padding: space.m, fontFamily: font.text, fontSize: 17, color: p.ink }}
        />
      </View>

      <View style={{ gap: space.s }}>
        <T size={14} weight="medium">
          Games to import
        </T>
        <Row style={{ flexWrap: 'wrap' }}>
          {TIME_CLASSES.map(([value, label]) => {
            const on = settings.timeClass === value
            return (
              <Pressable
                key={value}
                onPress={() => update({ timeClass: value })}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius, borderWidth: 1.5, borderColor: on ? p.ink : p.rule }}
              >
                <T size={15} weight={on ? 'bold' : 'text'}>
                  {label}
                </T>
              </Pressable>
            )
          })}
        </Row>
      </View>

      <Rule />
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <T weight="medium">Blunder guard</T>
          <T size={14} tone="soft">
            In Second Chance games, warns you before a move that loses material and lets you take it back. Also shows the before-you-move checks.
          </T>
        </View>
        <Switch value={settings.safetyCheck} onValueChange={(v) => update({ safetyCheck: v })} trackColor={{ true: p.good, false: p.rule }} thumbColor={p.sheet} />
      </Row>

      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <T weight="medium">New positions per day</T>
          <T size={14} tone="soft">
            Reviews of older ones always come first.
          </T>
        </View>
        <Row>
          <Button kind="secondary" label="−" style={{ minHeight: 40, paddingHorizontal: 14 }} onPress={() => update({ newPerDay: Math.max(1, settings.newPerDay - 1) })} />
          <T size={20} weight="display" style={{ width: 32, textAlign: 'center' }}>
            {settings.newPerDay}
          </T>
          <Button kind="secondary" label="+" style={{ minHeight: 40, paddingHorizontal: 14 }} onPress={() => update({ newPerDay: Math.min(50, settings.newPerDay + 1) })} />
        </Row>
      </Row>

      <Rule />
      <Button kind="secondary" label="How the app works" onPress={() => router.push('/guide')} />
      <Button
        kind="quiet"
        danger
        label="Delete all games and progress"
        onPress={() =>
          Alert.alert('Delete everything?', 'Your imported games and drill history on this phone will be removed.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: resetAll },
          ])
        }
      />
      <T size={13} tone="soft">
        Chess Coach runs Stockfish on your phone. Your games stay on this device. Pieces: cburnett set.
      </T>
    </Screen>
  )
}
