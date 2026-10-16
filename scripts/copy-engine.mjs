// Copies the single-threaded lite Stockfish build into public/ so the browser can load it as a worker.
import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const binDir = join(dirname(require.resolve('stockfish/package.json')), 'bin')
const outDir = new URL('../public/engine/', import.meta.url)
mkdirSync(outDir, { recursive: true })
for (const file of ['stockfish-19-lite-single.js', 'stockfish-19-lite-single.wasm']) {
  copyFileSync(join(binDir, file), new URL(file, outDir))
}
console.log('Copied Stockfish engine to public/engine')
