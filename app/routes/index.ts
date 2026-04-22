import { Router } from 'express'
import authRoutes from './auth.routes'
import categoryRoutes from './category.routes'
import transactionRoutes from './transaction.routes'
import budgetRoutes from './budget.routes'
import summaryRoutes from './summary.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/categories', categoryRoutes)
router.use('/transactions', transactionRoutes)
router.use('/budgets', budgetRoutes)
router.use('/summary', summaryRoutes)

export default router
