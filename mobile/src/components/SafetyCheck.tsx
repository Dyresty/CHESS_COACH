import { View } from 'react-native'
import { Button, T } from '../ui/kit'
import { radius, space, usePalette } from '../ui/theme'

/** The three questions to ask before every move. Tapping through them is the habit being trained. */
export function SafetyCheck({ lastMoveSan, onDone }: { lastMoveSan?: string; onDone: () => void }) {
  const p = usePalette()
  const questions = [
    lastMoveSan ? `What does ${lastMoveSan} attack?` : 'What is your opponent attacking?',
    'Can you take anything for free, or give check?',
    'Is the piece you move safe on its new square?',
  ]
  return (
    <View style={{ backgroundColor: p.mistakeWash, borderRadius: radius, padding: space.m, gap: space.s }}>
      <T size={13} weight="medium" tone="soft">
        Before you move
      </T>
      {questions.map((q, i) => (
        <View key={q} style={{ flexDirection: 'row', gap: space.s, alignItems: 'baseline' }}>
          <T size={15} weight="display" tone="mistake" style={{ width: 12 }}>
            {i + 1}
          </T>
          <T size={15} style={{ flex: 1 }}>
            {q}
          </T>
        </View>
      ))}
      <Button label="Checked. Let me move" onPress={onDone} />
    </View>
  )
}
