import { Router, Request, Response, NextFunction } from 'express'
import { findAllUsers } from '../repositories/user.repository'
import { requireAuth } from '../middlewares/auth.middleware'

const userRouter = Router()

userRouter.use(requireAuth)

// GET /users — liste tous les utilisateurs (nom, couleur, rôle) pour la sidebar et l'admin
userRouter.get('/', async (_request: Request, response: Response, next: NextFunction) => {
  try {
    const users = await findAllUsers()
    response.json(users)
  } catch (error) {
    next(error)
  }
})

export default userRouter
