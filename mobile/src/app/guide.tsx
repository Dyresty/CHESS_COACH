import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { Board } from '../ui/Board'
import { Button, Mark, ProgressBar, Row, T } from '../ui/kit'
import { Screen } from '../ui/Screen'
import { space } from '../ui/theme'

type Page = { title: string; body: string[]; marks?: boolean; board?: { fen: string; highlight: string[] } }

// Black has just grabbed the pawn on e4. White to move: find the better reply.
const SAMPLE = 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4'

const PAGES: Page[] = [
  {
    title: 'Your games are the lessons.',
    body: [
      'Lessons teach you chess in general. This app teaches you the mistakes you personally keep making, because at your level those are what lose games.',
      'You give it your chess.com username. It downloads your recent games and checks every move you played.',
    ],
  },
  {
    title: 'How your moves get checked.',
    body: [
      'Stockfish, one of the strongest chess engines, runs inside the app on your phone. No AI chatbot and no internet needed for this part.',
      'For each of your moves it compares your chances of winning before and after. A big drop is a blunder, a smaller one is a mistake. It also works out what kind it was: a piece left hanging, a threat you missed, a free piece you didn’t take, a checkmate.',
    ],
    marks: true,
  },
  {
    title: 'Train: fix your own mistakes.',
    body: [
      'Each day Today gives you a few positions from your games, right before you went wrong. Find a better move than the one you played.',
      'Miss it and you get a hint. Miss it twice and you see the answer and why.',
    ],
    board: { fen: SAMPLE, highlight: ['f6', 'e4'] },
  },
  {
    title: 'They come back until they stick.',
    body: [
      'Solve a position and it returns in a few days, then weeks. Miss it and it’s back tomorrow. This is spaced repetition, the same method language apps use.',
      'That’s why Today has a set number. A position counts as fixed once you’ve solved it and it isn’t due for a week.',
    ],
  },
  {
    title: 'Safe or not?',
    body: [
      'Quick yes-or-no calls on real moves from your games: some were fine, some lost a piece. Decide before you’re told.',
      'It trains the one check that matters most at your level: before letting go of a piece, is it safe there?',
    ],
  },
  {
    title: 'Second Chance: play it out.',
    body: [
      'From any mistake, tap Play it out from here. You keep your side and a bot plays your opponent, starting from that exact position.',
      'Easy bot makes real mistakes and sometimes misses a free piece, and the app tells you when it does. Medium rarely misses. Hard plays the engine’s best move.',
      'Blunder guard warns you before a move that loses material, so you can take it back. Turn it off in Settings when you want it real.',
    ],
  },
  {
    title: 'Watch one number.',
    body: [
      'Progress shows your blunders per game. At your level, getting that number down moves your rating more than anything else.',
      'Mistakes groups everything by cause, so you can see which habit to fix. Replays in Games show where each game turned.',
      'Best routine: play on chess.com, import here after, then do Today’s positions.',
    ],
  },
]

export default function Guide() {
  const [index, setIndex] = useState(0)
  const page = PAGES[index]
  const last = index === PAGES.length - 1

  return (
    <Screen
      footer={
        <View style={{ gap: space.s }}>
          <Button label={last ? 'Start' : 'Next'} onPress={() => (last ? router.back() : setIndex(index + 1))} />
          {index > 0 && <Button kind="secondary" label="Back" onPress={() => setIndex(index - 1)} />}
        </View>
      }
    >
      <Row style={{ justifyContent: 'space-between' }}>
        <T size={13} weight="medium" tone="soft">
          How it works · {index + 1} of {PAGES.length}
        </T>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
          <T size={15} weight="medium" tone="soft">
            Skip
          </T>
        </Pressable>
      </Row>
      <ProgressBar value={(index + 1) / PAGES.length} />
      <T size={30} weight="display">
        {page.title}
      </T>
      {page.marks && (
        <View style={{ gap: space.xs }}>
          {(
            [
              ['blunder', 'Blunder. Throws away a lot, often a piece.'],
              ['mistake', 'Mistake. Makes things clearly worse.'],
              ['good', 'Good move. What you’re aiming for.'],
            ] as const
          ).map(([kind, text]) => (
            <Row key={kind}>
              <View style={{ width: 28 }}>
                <Mark kind={kind} size={20} />
              </View>
              <T size={15} style={{ flex: 1 }}>
                {text}
              </T>
            </Row>
          ))}
        </View>
      )}
      {page.board && <Board fen={page.board.fen} orientation="w" disabled coordinates={false} highlight={page.board.highlight} />}
      {page.body.map((para) => (
        <T key={para} tone="soft">
          {para}
        </T>
      ))}
    </Screen>
  )
}
