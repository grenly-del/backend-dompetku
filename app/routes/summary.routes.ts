import { Router } from 'express'
import { authenticate } from '../middlewares/auth'
import {
    getExpenseStats,
    getOverview,
    getSummary,
    getMonthlySummaries,
} from '../controllers/summary.controller'

const router = Router()

router.use(authenticate)

// GET /api/summary/overview - account-wide balance for active user
router.get('/overview', getOverview)

// GET /api/summary/expense-stats?date=2026-04-19 - expense totals for active user
router.get('/expense-stats', getExpenseStats)

// GET /api/summary?month=4&year=2026 - single month summary
router.get('/', getSummary)

// GET /api/summary/trend?year=2026 - monthly summaries for a year
router.get('/trend', getMonthlySummaries)

export default router
