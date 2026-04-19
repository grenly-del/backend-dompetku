import { Router } from 'express'
import {
    register,
    login,
    getCurrentUser,
    getProfile,
    getAccountSummary,
    updateProfile,
    changePassword,
    deleteAccount,
} from '../controllers/auth.controller'
import { authenticate } from '../middlewares/auth'

const router = Router()

// POST /api/auth/register
router.post('/register', register)

// POST /api/auth/login
router.post('/login', login)

// GET /api/auth/profile — protected
router.get('/me', authenticate, getCurrentUser)
router.get('/profile', authenticate, getProfile)
router.get('/account-summary', authenticate, getAccountSummary)

// PUT /api/auth/profile — protected
router.put('/profile', authenticate, updateProfile)

// PUT /api/auth/password — protected
router.put('/password', authenticate, changePassword)
router.delete('/account', authenticate, deleteAccount)

export default router
