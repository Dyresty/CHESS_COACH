import type { Grade } from 'ts-fsrs'
import { today } from '../../../core/state'
import { review } from '../../../core/srs'
import { setState } from '../state/store'

/** Records a drill answer: reschedules the card and counts today's activity. */
export function gradeMistake(id: string, grade: Grade) {
  setState((s) => {
    const current = s.mistakes[id]
    if (!current) return s
    const day = today()
    const isNew = current.card.reps === 0
    return {
      ...s,
      mistakes: { ...s.mistakes, [id]: { ...current, card: review(current.card, grade) } },
      newIntroduced: isNew ? { ...s.newIntroduced, [day]: (s.newIntroduced[day] ?? 0) + 1 } : s.newIntroduced,
      activity: { ...s.activity, [day]: (s.activity?.[day] ?? 0) + 1 },
    }
  })
}

export function countActivity() {
  const day = today()
  setState((s) => ({ ...s, activity: { ...s.activity, [day]: (s.activity?.[day] ?? 0) + 1 } }))
}
