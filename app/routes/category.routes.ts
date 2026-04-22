import { Router } from 'express'
import { authenticate } from '../middlewares/auth'
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
} from '../controllers/category.controller'

const router = Router()

// All category routes are protected
router.use(authenticate)

// GET    /api/categories?type=INCOME|EXPENSE
router.get('/', getCategories)

// POST   /api/categories
router.post('/', createCategory)

// PUT    /api/categories/:id
router.put('/:id', updateCategory)

// DELETE /api/categories/:id
router.delete('/:id', deleteCategory)

export default router
