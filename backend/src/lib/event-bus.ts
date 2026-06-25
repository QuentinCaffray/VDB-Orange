import { EventEmitter } from 'events'
import { TaskResponse } from '../types/task.types'
import { DailySaleEntry } from '../types/sales.types'

export type AppEvent =
  | { type: 'task.created'; task: TaskResponse }
  | { type: 'task.taken'; task: TaskResponse }
  | { type: 'task.completed'; task: TaskResponse }
  | { type: 'task.released'; task: TaskResponse }
  | { type: 'task.deleted'; taskId: string }
  | { type: 'sale.updated'; sale: DailySaleEntry }
  | { type: 'sale.monthly.corrected'; userId: string; month: number; year: number }
  | { type: 'monthly.target.updated'; userId: string; month: number; year: number }

class AppEventBus extends EventEmitter {
  publishEvent(payload: AppEvent): void {
    super.emit('app:event', payload)
  }

  subscribeToEvents(listener: (payload: AppEvent) => void): void {
    super.on('app:event', listener)
  }

  unsubscribeFromEvents(listener: (payload: AppEvent) => void): void {
    super.off('app:event', listener)
  }
}

export const eventBus = new AppEventBus()
eventBus.setMaxListeners(0)
