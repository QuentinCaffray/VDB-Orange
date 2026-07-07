import { EventEmitter } from 'events'
import { TaskResponse } from '../types/task.types'
import { DailySaleEntry } from '../types/sales.types'
import { ActiveGameResponse } from '../types/game.types'

export type AppEvent =
  | { type: 'task.created'; task: TaskResponse }
  | { type: 'task.taken'; task: TaskResponse }
  | { type: 'task.completed'; task: TaskResponse }
  | { type: 'task.released'; task: TaskResponse }
  // Titre ou ordre resynchronisés en direct avec le template récurrent (admin) sans
  // changement de statut — voir syncTaskInstancesWithRecurringTemplates
  | { type: 'task.updated'; task: TaskResponse }
  | { type: 'task.deleted'; taskId: string }
  | { type: 'sale.updated'; sale: DailySaleEntry }
  | { type: 'sale.monthly.corrected'; userId: string; month: number; year: number }
  | { type: 'monthly.target.updated'; userId: string; month: number; year: number }
  | { type: 'game.started'; payload: ActiveGameResponse }
  | { type: 'game.status.changed'; payload: { gameId: string; status: string } }
  | { type: 'game.reset'; payload: { gameId: string } }
  | { type: 'game.pawn.moved'; payload: { gameId: string; userId: string; userName: string; userColor: string; newFloor: number } }
  | { type: 'game.finished'; payload: { gameId: string; winnerId: string; winnerName: string; winnerColor: string } }
  | { type: 'game.move_request.created'; payload: { gameId: string; requestId: string } }
  | { type: 'user.deleted'; userId: string }

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
