import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/adapterDB'
import { SECRET } from '../config'
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } from '../validations/auth'
import { AuthRequest } from '../middlewares/auth'

const PASSWORD_SALT_ROUNDS = 10

const publicUserSelect = {
    id: true,
    username: true,
    email: true,
    provider: true,
    createdAt: true,
}

async function findAuthenticatedUser(userId: string) {
    return prisma.user.findUnique({
        where: { id: userId },
        select: publicUserSelect,
    })
}

async function buildAccountSummary(userId: string) {
    const [user, transactionCount, categoryCount, budgetCount] = await Promise.all([
        findAuthenticatedUser(userId),
        prisma.transaction.count({ where: { userId } }),
        prisma.category.count({ where: { userId, isActive: true } }),
        prisma.budget.count({ where: { userId } }),
    ])

    return {
        user,
        stats: {
            transactionCount,
            categoryCount,
            budgetCount,
        },
    }
}

function isBcryptHash(value: string) {
    return value.startsWith('$2a$') || value.startsWith('$2b$') || value.startsWith('$2y$')
}

async function hashPassword(password: string) {
    return bcrypt.hash(password, PASSWORD_SALT_ROUNDS)
}

async function verifyPassword(input: string, stored: string) {
    if (isBcryptHash(stored)) {
        return bcrypt.compare(input, stored)
    }

    return input === stored
}

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const parsed = registerSchema.safeParse(req.body)
        if (!parsed.success) {
            res.status(400).json({ message: 'Validasi gagal', errors: parsed.error.flatten().fieldErrors })
            return
        }

        const { username, email, password } = parsed.data

        // Check if user already exists
        const existing = await prisma.user.findFirst({
            where: { OR: [{ email }, { username }] }
        })
        if (existing) {
            res.status(409).json({ message: 'Email atau username sudah terdaftar' })
            return
        }

        const user = await prisma.user.create({
            data: { username, email, password: await hashPassword(password) },
            select: publicUserSelect
        })

        const token = jwt.sign({ userId: user.id }, SECRET.JWT_SECRET, { expiresIn: '1d' })

        res.status(201).json({ message: 'Registrasi berhasil', user, token })
    } catch (err) {
        console.error('Register error:', err)
        res.status(500).json({ message: 'Terjadi kesalahan server' })
    }
}

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const parsed = loginSchema.safeParse(req.body)
        if (!parsed.success) {
            res.status(400).json({ message: 'Validasi gagal', errors: parsed.error.flatten().fieldErrors })
            return
        }

        const { email, password } = parsed.data

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || !user.password) {
            res.status(401).json({ message: 'Email atau password salah' })
            return
        }

        if (!await verifyPassword(password, user.password)) {
            res.status(401).json({ message: 'Email atau password salah' })
            return
        }

        const token = jwt.sign({ userId: user.id }, SECRET.JWT_SECRET, { expiresIn: '1d' })

        res.status(200).json({
            message: 'Login berhasil',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                provider: user.provider,
                createdAt: user.createdAt,
            },
            token,
        })
    } catch (err) {
        console.error('Login error:', err)
        res.status(500).json({ message: 'Terjadi kesalahan server' })
    }
}

// GET /api/auth/profile
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await findAuthenticatedUser(req.userId!)

        if (!user) {
            res.status(404).json({ message: 'User tidak ditemukan' })
            return
        }

        res.status(200).json({ user })
    } catch (err) {
        console.error('Profile error:', err)
        res.status(500).json({ message: 'Terjadi kesalahan server' })
    }
}

// GET /api/auth/me
export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
    return getProfile(req, res)
}

// GET /api/auth/account-summary
export const getAccountSummary = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const summary = await buildAccountSummary(req.userId!)

        if (!summary.user) {
            res.status(404).json({ message: 'User tidak ditemukan' })
            return
        }

        res.status(200).json(summary)
    } catch (err) {
        console.error('Account summary error:', err)
        res.status(500).json({ message: 'Terjadi kesalahan server' })
    }
}

// PUT /api/auth/profile
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.userId) {
            res.status(401).json({ message: 'Unauthorized' })
            return
        }

        const parsed = updateProfileSchema.safeParse(req.body)
        if (!parsed.success) {
            res.status(400).json({ message: 'Validasi gagal', errors: parsed.error.flatten().fieldErrors })
            return
        }

        const { username, email } = parsed.data

        const conflict = await prisma.user.findFirst({
            where: {
                id: { not: req.userId },
                OR: [{ username }, { email }],
            },
            select: { id: true },
        })

        if (conflict) {
            res.status(409).json({ message: 'Email atau username sudah terdaftar' })
            return
        }

        const user = await prisma.user.update({
            where: { id: req.userId },
            data: { username, email },
            select: publicUserSelect,
        })

        res.status(200).json({ message: 'Profil berhasil diperbarui', user })
    } catch (err: any) {
        if (err?.code === 'P2002') {
            res.status(409).json({ message: 'Email atau username sudah terdaftar' })
            return
        }

        console.error('Update profile error:', err)
        res.status(500).json({ message: 'Terjadi kesalahan server' })
    }
}

// PUT /api/auth/password
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.userId) {
            res.status(401).json({ message: 'Unauthorized' })
            return
        }

        const parsed = changePasswordSchema.safeParse(req.body)
        if (!parsed.success) {
            res.status(400).json({ message: 'Validasi gagal', errors: parsed.error.flatten().fieldErrors })
            return
        }

        const { currentPassword, newPassword } = parsed.data

        if (currentPassword === newPassword) {
            res.status(400).json({ message: 'Password baru harus berbeda dari password saat ini' })
            return
        }

        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { id: true, password: true },
        })

        if (!user) {
            res.status(404).json({ message: 'User tidak ditemukan' })
            return
        }

        if (!user.password) {
            res.status(400).json({ message: 'Akun ini tidak memiliki password lokal' })
            return
        }

        const isValid = await verifyPassword(currentPassword, user.password)
        if (!isValid) {
            res.status(401).json({ message: 'Password saat ini salah' })
            return
        }

        await prisma.user.update({
            where: { id: req.userId },
            data: { password: await hashPassword(newPassword) },
        })

        res.status(200).json({ message: 'Password berhasil diubah' })
    } catch (err) {
        console.error('Change password error:', err)
        res.status(500).json({ message: 'Terjadi kesalahan server' })
    }
}

// DELETE /api/auth/account
export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.userId) {
            res.status(401).json({ message: 'Unauthorized' })
            return
        }

        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { id: true },
        })

        if (!user) {
            res.status(404).json({ message: 'User tidak ditemukan' })
            return
        }

        await prisma.user.delete({
            where: { id: req.userId },
        })

        res.status(200).json({ message: 'Akun berhasil dihapus' })
    } catch (err) {
        console.error('Delete account error:', err)
        res.status(500).json({ message: 'Terjadi kesalahan server' })
    }
}
