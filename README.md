# Chess Coach

A phone-first web app that helps you get better at chess by training on **your own mistakes**.

Lessons teach chess in general. Your rating drops because of the same few mistakes you make again and again.
Chess Coach imports your chess.com games, finds the moves that cost you, and drills them with spaced repetition
until you stop making them.

## What it does

- **Import from chess.com.** Enter your username and it pulls your latest games (rapid by default) from the public chess.com API.
- **Finds and names your mistakes.** Stockfish runs in your browser and flags every mistake and blunder, tagged by cause:
  hung a piece, missed their threat, missed a free piece, missed checkmate, allowed checkmate.
- **Mistake Bank drills.** Each mistake becomes a puzzle from your own game. Get it wrong once and you get a hint;
  the FSRS scheduler brings it back until you solve it reliably.
- **Safety check habit.** Before each move in drills and games, three quick questions: what does their last move attack,
  can I take anything for free, is my piece safe on its new square? (Can be turned off in Settings.)
- **Second Chance.** Play on from the position where you went wrong, against a bot you can beat.
- **Progress.** Blunders per game over time, mistakes fixed, and which mistake type costs you the most.

Everything runs on your device. Games and progress are stored in the browser's local storage; there is no server.

## Install on your phone

Open the deployed site in your phone's browser, then use **Add to Home Screen** (Safari share menu on iPhone,
the menu on Chrome for Android). It opens full screen like a normal app and works offline after the first load.

## Development

```bash
npm install      # also copies the Stockfish engine into public/engine
npm run dev      # http://localhost:5173
npm test         # analysis tests, run against the real engine in Node
npm run build
```

Code layout:

- `src/lib/analyse.ts` turns a PGN into mistakes using engine evaluations and lichess-style winning chances.
- `src/lib/patterns.ts` names the cause of each mistake from the engine's lines.
- `src/lib/engine.ts` wraps Stockfish in a Web Worker; `test/nodeEngine.ts` runs the same build in Node for tests.
- `src/lib/srs.ts` and `src/lib/session.ts` schedule drills and build the daily session.
- `src/screens/` holds the Today, Drill, Play, Mistakes, Progress and Settings screens.

Pushes to `main` run lint, tests and build, then deploy to GitHub Pages.

## Credits

Uses [Stockfish](https://stockfishchess.org/) via [stockfish.js](https://github.com/nmrugg/stockfish.js) (GPL-3.0),
[chess.js](https://github.com/jhlywa/chess.js), [react-chessboard](https://github.com/Clariity/react-chessboard)
and [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs). Because Stockfish is GPL-3.0, distributing this app
with the engine means following that licence.
