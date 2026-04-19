import { Router } from 'express'
import { authenticate } from '../middlewares/auth'
import {
    getBudget,
    upsertBudget,
    deleteBudget,
} from '../controllers/budget.controller'

const router = Router()

// All budget routes are protected
router.use(authenticate)

// GET    /api/budgets?month=4&year=2026
router.get('/', getBudget)

// POST   /api/budgets — create or update budget allocations
router.post('/', upsertBudget)

// DELETE /api/budgets?month=4&year=2026
router.delete('/', deleteBudget)

export default router
