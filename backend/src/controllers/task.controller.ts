import { Request, Response, NextFunction } from 'express'
import { CreateTaskInput } from '../types/task.types'
import * as taskService from '../services/task.service'
import { eventBus } from '../lib/event-bus'

export async function getAllTasksHandler(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tasks = await taskService.getAllTasks()
    response.json(tasks)
  } catch (error) {
    next(error)
  }
}

export async function createTaskHandler(
  request: Request<{}, {}, CreateTaskInput>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { title, description, dueDate } = request.body
    const createdById = request.authenticatedUser!.userId

    const newTask = await taskService.createTask(title, description, createdById, dueDate)
    eventBus.publishEvent({ type: 'task.created', task: newTask })
    response.status(201).json(newTask)
  } catch (error) {
    next(error)
  }
}

export async function takeTaskHandler(
  request: Request<{ id: string }>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const taskId = request.params.id
    const currentUserId = request.authenticatedUser!.userId

    const updatedTask = await taskService.takeTask(taskId, currentUserId)
    eventBus.publishEvent({ type: 'task.taken', task: updatedTask })
    response.json(updatedTask)
  } catch (error) {
    next(error)
  }
}

export async function completeTaskHandler(
  request: Request<{ id: string }>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const taskId = request.params.id
    const { userId, role } = request.authenticatedUser!

    const updatedTask = await taskService.completeTask(taskId, userId, role)
    eventBus.publishEvent({ type: 'task.completed', task: updatedTask })
    response.json(updatedTask)
  } catch (error) {
    next(error)
  }
}

export async function releaseTaskHandler(
  request: Request<{ id: string }>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const taskId = request.params.id
    const { userId, role } = request.authenticatedUser!

    const updatedTask = await taskService.releaseTask(taskId, userId, role)
    eventBus.publishEvent({ type: 'task.released', task: updatedTask })
    response.json(updatedTask)
  } catch (error) {
    next(error)
  }
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

export async function getTaskHistoryForDateHandler(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const date = request.query.date as string
    if (!date || !DATE_REGEX.test(date)) {
      response.status(400).json({ error: 'Paramètre date invalide — format attendu : YYYY-MM-DD' })
      return
    }
    const tasks = await taskService.getTaskHistoryForDate(date)
    response.json(tasks)
  } catch (error) {
    next(error)
  }
}

export async function getActiveDatesHandler(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const month = parseInt(request.query.month as string)
    const year = parseInt(request.query.year as string)
    if (isNaN(month) || isNaN(year) || month < 1 || month > 12 || year < 2000) {
      response.status(400).json({ error: 'Paramètres month (1-12) et year requis' })
      return
    }
    const dates = await taskService.getActiveDatesForMonth(month, year)
    response.json(dates)
  } catch (error) {
    next(error)
  }
}

export async function deleteTaskHandler(
  request: Request<{ id: string }>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const taskId = request.params.id
    await taskService.deleteTask(taskId)
    eventBus.publishEvent({ type: 'task.deleted', taskId })
    response.status(204).send()
  } catch (error) {
    next(error)
  }
}
