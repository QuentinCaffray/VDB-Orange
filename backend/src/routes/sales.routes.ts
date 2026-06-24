import { Router } from 'express'
import {
  getDailySalesHandler,
  recordSaleDeltaHandler,
  setDailySaleCountHandler,
  setMonthlyAbsoluteTotalHandler,
  getMonthlyProgressHandler,
  getTeamMonthlyProgressHandler,
  setMonthlyTargetHandler,
  setTargetForAllVendorsHandler,
} from '../controllers/sales.controller'
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware'
import { validateBody } from '../middlewares/validate.middleware'
import {
  recordSaleDeltaSchema,
  setDailyCountSchema,
  setMonthlyAbsoluteTotalSchema,
  setMonthlyTargetSchema,
  setTargetForAllVendorsSchema,
} from '../types/sales.types'

const salesRouter = Router()

salesRouter.use(requireAuth)

// GET /sales/daily?date=YYYY-MM-DD — ventes du jour pour tous les vendeurs
salesRouter.get('/daily', getDailySalesHandler)

// PATCH /sales/daily — pointer ou corriger sa propre vente (delta +1 ou -1)
salesRouter.patch('/daily', validateBody(recordSaleDeltaSchema), recordSaleDeltaHandler)

// PUT /sales/daily — corriger le total du jour en valeur absolue (correction d'oubli)
salesRouter.put('/daily', validateBody(setDailyCountSchema), setDailySaleCountHandler)

// PUT /sales/monthly-total — remplace le total mensuel d'un indicateur mensuel (valeur absolue)
salesRouter.put('/monthly-total', validateBody(setMonthlyAbsoluteTotalSchema), setMonthlyAbsoluteTotalHandler)

// GET /sales/monthly/team?month=N&year=N — progression mensuelle agrégée boutique (admin)
salesRouter.get('/monthly/team', requireAdmin, getTeamMonthlyProgressHandler)

// GET /sales/monthly?userId=ID&month=N&year=N — progression mensuelle d'un vendeur
salesRouter.get('/monthly', getMonthlyProgressHandler)

// PUT /sales/targets — définir ou modifier l'objectif mensuel d'un vendeur spécifique (admin)
salesRouter.put('/targets', requireAdmin, validateBody(setMonthlyTargetSchema), setMonthlyTargetHandler)

// PUT /sales/targets/all-vendors — définir le même objectif pour tous les vendeurs (admin)
salesRouter.put('/targets/all-vendors', requireAdmin, validateBody(setTargetForAllVendorsSchema), setTargetForAllVendorsHandler)

export default salesRouter
