import { View } from 'react-native'
import { T } from '../ui/kit'

/** The checks to run before every move, as a quiet reminder. Nothing to tap: the habit is looking, not confirming. */
export function BeforeYouMove({ lastMoveSan }: { lastMoveSan?: string }) {
  const questions = [
    lastMoveSan ? `What does ${lastMoveSan} attack?` : 'What is your opponent attacking?',
    'Can you take something for free, or give check?',
    'Is the square you’re moving to safe?',
  ]
  return (
    <View style={{ gap: 2 }}>
      <T size={13} weight="medium" tone="soft">
        Before you move
      </T>
      {questions.map((q, i) => (
        <T key={q} size={14} tone="soft">
          {i + 1}. {q}
        </T>
      ))}
    </View>
  )
}
