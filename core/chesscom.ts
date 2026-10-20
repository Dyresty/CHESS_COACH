import type { Color, ImportedGame } from './types'

const API = 'https://api.chess.com/pub/player'
const DRAW_RESULTS = new Set(['agreed', 'repetition', 'stalemate', 'insufficient', '50move', 'timevsinsufficient'])

interface ApiPlayer {
  username: string
  rating: number
  result: string
}

interface ApiGame {
  url: string
  pgn?: string
  uuid?: string
  end_time: number
  time_class: string
  rules: string
  white: ApiPlayer
  black: ApiPlayer
}

export class ChessComError extends Error {}

async function getJson<T>(url: string): Promise<T> {
  let res: Response
  try {
    res = await fetch(url)
  } catch {
    throw new ChessComError("Couldn't reach chess.com. Check your connection and try again.")
  }
  if (res.status === 404) throw new ChessComError('That chess.com username was not found.')
  if (!res.ok) throw new ChessComError(`chess.com returned an error (${res.status}). Try again in a minute.`)
  return res.json() as Promise<T>
}

export function toImportedGame(g: ApiGame, username: string): ImportedGame | null {
  if (g.rules !== 'chess' || !g.pgn) return null
  const name = username.toLowerCase()
  const userColor: Color | null = g.white.username.toLowerCase() === name ? 'w' : g.black.username.toLowerCase() === name ? 'b' : null
  if (!userColor) return null
  const me = userColor === 'w' ? g.white : g.black
  const them = userColor === 'w' ? g.black : g.white
  const result = me.result === 'win' ? 'win' : DRAW_RESULTS.has(me.result) ? 'draw' : 'loss'
  return {
    id: g.uuid ?? g.url,
    url: g.url,
    pgn: g.pgn,
    endTime: g.end_time * 1000,
    timeClass: g.time_class,
    userColor,
    opponent: them.username,
    result,
    userRating: me.rating,
  }
}

/** Most recent games first, newest month first, up to `limit`. */
export async function fetchRecentGames(username: string, opts: { limit: number; timeClass?: string }): Promise<ImportedGame[]> {
  const user = encodeURIComponent(username.trim().toLowerCase())
  const { archives } = await getJson<{ archives: string[] }>(`${API}/${user}/games/archives`)
  const games: ImportedGame[] = []
  for (const archive of [...archives].reverse().slice(0, 6)) {
    const { games: month } = await getJson<{ games: ApiGame[] }>(archive)
    for (const g of [...month].reverse()) {
      if (opts.timeClass && g.time_class !== opts.timeClass) continue
      const game = toImportedGame(g, username)
      if (game) games.push(game)
      if (games.length >= opts.limit) return games
    }
  }
  return games
}
