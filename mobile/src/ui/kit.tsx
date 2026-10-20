import type { ReactNode } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native'
import { font, radius, space, usePalette } from './theme'

type Tone = 'ink' | 'soft' | 'good' | 'blunder' | 'mistake'

export function T({
  children,
  size = 16,
  weight = 'text',
  tone = 'ink',
  style,
  numberOfLines,
}: {
  children: ReactNode
  size?: number
  weight?: keyof typeof font
  tone?: Tone
  style?: StyleProp<TextStyle>
  numberOfLines?: number
}) {
  const p = usePalette()
  const color = { ink: p.ink, soft: p.inkSoft, good: p.good, blunder: p.blunder, mistake: p.mistake }[tone]
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{ fontFamily: font[weight], fontSize: size, lineHeight: Math.round(size * (weight === 'display' ? 1.15 : 1.42)), color }, style]}
    >
      {children}
    </Text>
  )
}

export function Title({ children, kicker }: { children: ReactNode; kicker?: string }) {
  return (
    <View style={{ gap: 2, marginBottom: space.s }}>
      {kicker && (
        <T size={13} weight="medium" tone="soft">
          {kicker}
        </T>
      )}
      <T size={32} weight="display">
        {children}
      </T>
    </View>
  )
}

export function Button({
  label,
  onPress,
  kind = 'primary',
  disabled,
  busy,
  danger,
  style,
}: {
  label: string
  onPress: () => void
  kind?: 'primary' | 'secondary' | 'quiet'
  danger?: boolean
  disabled?: boolean
  busy?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const p = usePalette()
  const bg = kind === 'primary' ? p.good : 'transparent'
  const fg = danger ? p.blunder : kind === 'primary' ? p.onGood : kind === 'secondary' ? p.ink : p.good
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy }}
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        styles.button,
        kind === 'quiet' && styles.quiet,
        { backgroundColor: bg, borderColor: kind === 'secondary' ? p.ink : 'transparent', opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
        style,
      ]}
    >
      {busy ? <ActivityIndicator color={fg} /> : <T weight="bold" style={{ color: fg }}>{label}</T>}
    </Pressable>
  )
}

export function Rule({ style }: { style?: StyleProp<ViewStyle> }) {
  const p = usePalette()
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: p.rule }, style]} />
}

/** A chess annotation glyph: ?? blunder, ? mistake, ! good. */
export function Mark({ kind, size = 18 }: { kind: 'blunder' | 'mistake' | 'good'; size?: number }) {
  const glyph = { blunder: '??', mistake: '?', good: '!' }[kind]
  return (
    <T size={size} weight="display" tone={kind}>
      {glyph}
    </T>
  )
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: space.s }, style]}>{children}</View>
}

export function Note({ children, tone }: { children: ReactNode; tone: 'good' | 'blunder' | 'mistake' }) {
  const p = usePalette()
  const bg = { good: p.goodWash, blunder: p.blunderWash, mistake: p.mistakeWash }[tone]
  return <View style={{ backgroundColor: bg, borderRadius: radius, padding: space.m, gap: space.s }}>{children}</View>
}

export function ProgressBar({ value }: { value: number }) {
  const p = usePalette()
  return (
    <View style={{ height: 4, backgroundColor: p.rule, borderRadius: 2, overflow: 'hidden' }}>
      <View style={{ width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%`, height: '100%', backgroundColor: p.good }} />
    </View>
  )
}

const styles = StyleSheet.create({
  button: { minHeight: 50, borderRadius: radius, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.l },
  quiet: { minHeight: 40, paddingHorizontal: 0, alignItems: 'flex-start' },
})
