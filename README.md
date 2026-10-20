# Chess Coach

An Android app (Expo / React Native, in `mobile/`) and a web app that help you get better at chess by training on **your own mistakes**.

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

**Android:** download [chess-coach.apk](https://github.com/Dyresty/CHESS_COACH/releases/latest/download/chess-coach.apk)
on your phone and open it (allow installs from your browser when asked). Every push to `main` that touches the app
builds a new APK in GitHub Actions and publishes it as the latest release; new versions install over old ones and keep your data.

**Web:** open the deployed site and use **Add to Home Screen**.

No AI service is involved. Analysis is done by Stockfish, a chess engine that runs on the device, offline.

## Mobile app (`mobile/`)

Expo SDK 58 with Expo Router. Stockfish runs in a hidden WebView (`src/engine/`), fed by an HTML page with the
WebAssembly engine inlined (`scripts/build-engine.mjs`, run on install). Screens live in `src/app/`, the design
rules in [`mobile/DESIGN.md`](mobile/DESIGN.md). Chess logic shared with the web app lives in `core/`.

```bash
cd mobile
npm install
npx expo start          # needs a development build because of the WebView engine
npx expo export -p web  # the same app as a website, handy for checking screens
```

Extra in the app: **Safe or not?** (judge real moves from your games as safe or unsafe), **game replay** with every
mistake marked on the moves and on a winning-chances graph, a training streak, and dark mode.

## Development

```bash
npm install      # also copies the Stockfish engine into public/engine
npm run dev      # http://localhost:5173
npm test         # analysis tests, run against the real engine in Node
npm run build
```

Code layout:

- `core/analyse.ts` turns a PGN into mistakes using engine evaluations and lichess-style winning chances.
- `core/patterns.ts` names the cause of each mistake from the engine's lines.
- `src/lib/engine.ts` wraps Stockfish in a Web Worker; `test/nodeEngine.ts` runs the same build in Node for tests.
- `core/srs.ts` and `core/session.ts` schedule drills and build the daily session.
- `src/screens/` holds the Today, Drill, Play, Mistakes, Progress and Settings screens.

Pushes to `main` run lint, tests and build, then deploy to GitHub Pages.

## Credits

Uses [Stockfish](https://stockfishchess.org/) via [stockfish.js](https://github.com/nmrugg/stockfish.js) (GPL-3.0),
[chess.js](https://github.com/jhlywa/chess.js), [react-chessboard](https://github.com/Clariity/react-chessboard)
and [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs). Because Stockfish is GPL-3.0, distributing this app
with the engine means following that licence.
