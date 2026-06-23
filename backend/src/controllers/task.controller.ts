import { Request, Response, NextFunction } from 'express'
import { CreateTaskInput } from '../types/task.types'
import * as taskService from '../services/task.service'

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
    const { title, description } = request.body
    const createdById = request.authenticatedUser!.userId

    const newTask = await taskService.createTask(title, description, createdById)
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
    response.json(updatedTask)
  } catch (error) {
    next(error)
  }
}

export async function getTaskHistoryForDateHandler(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const date = request.query.date as string
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
    response.status(204).send()
  } catch (error) {
    next(error)
  }
}
