import type { Mistake } from '../../../core/types'

// Drill queues are passed between screens in memory; route params would have to serialise whole positions.
let queue: Mistake[] = []

export function setDrillQueue(next: Mistake[]) {
  queue = next
}

export function takeDrillQueue(): Mistake[] {
  return queue
}
