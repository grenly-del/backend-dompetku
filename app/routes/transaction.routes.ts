import { Router } from 'express'
import { authenticate } from '../middlewares/auth'
import {
    getTransactions,
    getTransactionById,
    createTransaction,
    updateTransaction,
    deleteTransaction,
} from '../controllers/transaction.controller'

const router = Router()

// All transaction routes are protected
router.use(authenticate)

// GET    /api/transactions?type=&categoryId=&month=&year=&startDate=&endDate=&page=&limit=
router.get('/', getTransactions)

// GET    /api/transactions/:id
router.get('/:id', getTransactionById)

// POST   /api/transactions
router.post('/', createTransaction)

// PUT    /api/transactions/:id
router.put('/:id', updateTransaction)

// DELETE /api/transactions/:id
router.delete('/:id', deleteTransaction)

export default router
