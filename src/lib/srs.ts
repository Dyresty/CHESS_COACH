import { fsrs, generatorParameters, Rating, type Card, type Grade } from 'ts-fsrs'
import type { Mistake } from './types'

const scheduler = fsrs(generatorParameters({ enable_fuzz: true }))

export { Rating }

export function review(card: Card, grade: Grade, now = new Date()): Card {
  return scheduler.next(card, now, grade).card
}

export function isDue(m: Mistake, now = new Date()): boolean {
  return new Date(m.card.due).getTime() <= now.getTime()
}

/** A mistake counts as fixed once you've solved it and it isn't due again for a week or more. */
export function isRetired(m: Mistake): boolean {
  return m.card.reps > 0 && m.card.scheduled_days >= 7
}

/** Revives Date fields after a JSON round trip. */
export function reviveCard(card: Card): Card {
  return { ...card, due: new Date(card.due), last_review: card.last_review ? new Date(card.last_review) : undefined }
}
