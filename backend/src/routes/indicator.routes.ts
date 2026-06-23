import { Router } from 'express'
import {
  getAllIndicatorsHandler,
  createIndicatorHandler,
  updateIndicatorHandler,
} from '../controllers/indicator.controller'
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware'
import { validateBody } from '../middlewares/validate.middleware'
import { createIndicatorSchema, updateIndicatorSchema } from '../types/indicator.types'

const indicatorRouter = Router()

indicatorRouter.use(requireAuth)

// GET /indicators — liste des indicateurs actifs (tous les utilisateurs)
indicatorRouter.get('/', getAllIndicatorsHandler)

// POST /indicators — créer un indicateur (admin)
indicatorRouter.post('/', requireAdmin, validateBody(createIndicatorSchema), createIndicatorHandler)

// PATCH /indicators/:id — modifier nom / ordre / visibilité (admin)
indicatorRouter.patch('/:id', requireAdmin, validateBody(updateIndicatorSchema), updateIndicatorHandler)

export default indicatorRouter
