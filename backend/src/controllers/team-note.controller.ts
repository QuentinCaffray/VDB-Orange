import { Request, Response, NextFunction } from 'express'
import { UpsertTeamNoteInput, UpdateChallengeCurrentInput } from '../types/team-note.types'
import * as teamNoteService from '../services/team-note.service'

export async function getAllTeamNotesHandler(
  _request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const notes = await teamNoteService.getAllTeamNotes()
    response.json(notes)
  } catch (error) {
    next(error)
  }
}

export async function getOwnTeamNoteHandler(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const currentUserId = request.authenticatedUser!.userId
    const note = await teamNoteService.getOwnTeamNote(currentUserId)
    response.json(note)
  } catch (error) {
    next(error)
  }
}

export async function updateOwnChallengeHandler(
  request: Request<{ challengeId: string }, {}, UpdateChallengeCurrentInput>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const currentUserId = request.authenticatedUser!.userId
    const { challengeId } = request.params
    await teamNoteService.updateOwnChallengeCurrent(currentUserId, challengeId, request.body.current)
    response.status(204).send()
  } catch (error) {
    next(error)
  }
}

export async function upsertTeamNoteHandler(
  request: Request<{ userId: string }, {}, UpsertTeamNoteInput>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId } = request.params
    await teamNoteService.saveTeamNote(userId, request.body)
    response.status(204).send()
  } catch (error) {
    next(error)
  }
}
