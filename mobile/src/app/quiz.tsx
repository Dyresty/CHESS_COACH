import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { PATTERNS } from '../../../core/patterns'
import { buildSafetyQuiz } from '../../../core/session'
import { countActivity } from '../lib/grade'
import { getState } from '../state/store'
import { Board } from '../ui/Board'
import { Button, Mark, Note, Row, T } from '../ui/kit'
import { Screen } from '../ui/Screen'
import { space, usePalette } from '../ui/theme'

/** "Safe or not?": judge a real move from your games before seeing what happened. */
export default function Quiz() {
  const p = usePalette()
  const [questions] = useState(() => buildSafetyQuiz(getState()))
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const q = questions[index]

  if (!q) {
    return (
      <Screen footer={<Button label="Done" onPress={() => router.back()} />}>
        <T size={13} weight="medium" tone="soft">
          Safe or not?
        </T>
        <T size={40} weight="display">
          {score} of {questions.length}
        </T>
        <T tone="soft">
          {score === questions.length
            ? 'Every call right. Now do the same check in your next game, on every move.'
            : 'The moves you called wrong are exactly the ones that cost you games. Slow down on those.'}
        </T>
      </Screen>
    )
  }

  function choose(safe: boolean) {
    const right = safe === q.safe
    void Haptics.notificationAsync(right ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error)
    if (right) setScore((s) => s + 1)
    countActivity()
    setAnswer(safe)
  }

  const right = answer === q.safe
  const userColor = q.fen.split(' ')[1] as 'w' | 'b'
  const explanation = q.safe
    ? `${q.san} was a good move in your game. Nothing hangs and nothing is left undefended.`
    : `${PATTERNS[q.mistake!.tag].why} The better move was ${q.mistake!.best}.`

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
          <T size={15} weight="medium" tone="soft">
            Close
          </T>
        </Pressable>
        <T size={15} tone="soft">
          {index + 1} of {questions.length}
        </T>
      </Row>
      <View style={{ gap: 2 }}>
        <T size={13} weight="medium" tone="soft">
          Move {q.moveNumber} · {userColor === 'w' ? 'White' : 'Black'} to move
        </T>
        <T size={22} weight="display">
          Is {q.san} safe here?
        </T>
      </View>
      <Board
        fen={q.fen}
        orientation={userColor}
        disabled
        arrows={[{ from: q.uci.slice(0, 2), to: q.uci.slice(2, 4), color: answer === null ? p.ink : q.safe ? p.good : p.blunder }]}
      />
      {answer === null ? (
        <Row style={{ gap: space.m }}>
          <Button label="Safe" style={{ flex: 1 }} onPress={() => choose(true)} />
          <Button label="Not safe" kind="secondary" style={{ flex: 1 }} onPress={() => choose(false)} />
        </Row>
      ) : (
        <View style={{ gap: space.m }}>
          <Note tone={right ? 'good' : 'mistake'}>
            <Row>
              <Mark kind={right ? 'good' : 'mistake'} />
              <T weight="bold">{right ? 'Right call.' : q.safe ? 'It was safe.' : 'It wasn’t safe.'}</T>
            </Row>
            <T>{explanation}</T>
          </Note>
          <Button
            label={index + 1 < questions.length ? 'Next move' : 'See score'}
            onPress={() => {
              setIndex((i) => i + 1)
              setAnswer(null)
            }}
          />
        </View>
      )}
    </Screen>
  )
}
