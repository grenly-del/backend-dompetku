import { Response } from 'express'
import { prisma } from '../config/adapterDB'
import { AuthRequest } from '../middlewares/auth'
import { createTransactionSchema, updateTransactionSchema, transactionQuerySchema } from '../validations/transaction'
import { findOwnedCategory } from '../utils/category-ownership'

function parseDateBoundary(value: string, boundary: 'start' | 'end'): Date {
    const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T00:00:00`)
        : new Date(value)

    if (boundary === 'start') {
        date.setHours(0, 0, 0, 0)
    } else {
        date.setHours(23, 59, 59, 999)
    }

    return date
}

// GET /api/transactions?type=&categoryId=&month=&year=&startDate=&endDate=&page=&limit=
export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const parsed = transactionQuerySchema.safeParse(req.query)
        if (!parsed.success) {
            res.status(400).json({ message: 'Query tidak valid', errors: parsed.error.flatten().fieldErrors })
            return
        }

        const { type, categoryId, month, year, startDate, endDate, page, limit } = parsed.data
        const skip = (page - 1) * limit

        // Build date filter
        let dateFilter = {}
        if (startDate || endDate) {
            const date: { gte?: Date; lte?: Date } = {}

            if (startDate) {
                date.gte = parseDateBoundary(startDate, 'start')
            }

            if (endDate) {
                date.lte = parseDateBoundary(endDate, 'end')
            }

            if (date.gte && date.lte && date.gte > date.lte) {
                res.status(400).json({ message: 'startDate tidak boleh lebih besar dari endDate' })
                return
            }

            dateFilter = { date }
        } else if (month && year) {
            const startDate = new Date(year, month - 1, 1)
            const endDate = new Date(year, month, 0, 23, 59, 59, 999)
            dateFilter = { date: { gte: startDate, lte: endDate } }
        } else if (year) {
            const startDate = new Date(year, 0, 1)
            const endDate = new Date(year, 11, 31, 23, 59, 59, 999)
            dateFilter = { date: { gte: startDate, lte: endDate } }
        }

        const where = {
            userId: req.userId!,
            ...(type && { type }),
            ...(categoryId && { categoryId }),
            ...dateFilter,
        }

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                orderBy: { date: 'desc' },
                skip,
                take: limit,
                include: { category: { select: { id: true, name: true, icon: true, type: true } } },
            }),
            prisma.transaction.count({ where }),
        ])

        res.status(200).json({
            transactions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (err) {
        console.error('Get transactions error:', err)
        res.status(500).json({ message: 'Terjadi kesalahan server' })
    }
}

// GET /api/transactions/:id
export const getTransactionById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const transaction = await prisma.transaction.findFirst({
            where: { id: req.params.id, userId: req.userId! },
            include: { category: { select: { id: true, name: true, icon: true, type: true } } },
        })

        if (!transaction) {
            res.status(404).json({ message: 'Transaksi tidak ditemukan' })
            return
        }

        res.status(200).json({ transaction })
    } catch (err) {
        console.error('Get transaction error:', err)
        res.status(500).json({ message: 'Terjadi kesalahan server' })
    }
}

// POST /api/transactions
export const createTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const parsed = createTransactionSchema.safeParse(req.body)
        if (!parsed.success) {
            res.status(400).json({ message: 'Validasi gagal', errors: parsed.error.flatten().fieldErrors })
            return
        }

        const { date, ...rest } = parsed.data
        const category = await findOwnedCategory({
            userId: req.userId!,
            categoryId: rest.categoryId,
            type: rest.type,
        })

        if (!category) {
            res.status(400).json({ message: 'Kategori tidak valid atau bukan milik user' })
            return
        }

        const transaction = await prisma.transaction.create({
            data: {
                ...rest,
                date: new Date(date),
                userId: req.userId!,
            },
            include: { category: { select: { id: true, name: true, icon: true, type: true } } },
        })

        res.status(201).json({ message: 'Transaksi berhasil ditambahkan', transaction })
    } catch (err) {
        console.error('Create transaction error:', err)
        res.status(500).json({ message: 'Terjadi kesalahan server' })
    }
}

// PUT /api/transactions/:id
export const updateTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const parsed = updateTransactionSchema.safeParse(req.body)
        if (!parsed.success) {
            res.status(400).json({ message: 'Validasi gagal', errors: parsed.error.flatten().fieldErrors })
            return
        }

        const { date, ...rest } = parsed.data
        const existingTransaction = await prisma.transaction.findFirst({
            where: { id: req.params.id, userId: req.userId! },
            select: { id: true, type: true },
        })

        if (!existingTransaction) {
            res.status(404).json({ message: 'Transaksi tidak ditemukan' })
            return
        }

        if (rest.categoryId) {
            const category = await findOwnedCategory({
                userId: req.userId!,
                categoryId: rest.categoryId,
                type: existingTransaction.type,
            })

            if (!category) {
                res.status(400).json({ message: 'Kategori tidak valid atau bukan milik user' })
                return
            }
        }

        const result = await prisma.transaction.updateMany({
            where: { id: req.params.id, userId: req.userId! },
            data: {
                ...rest,
                ...(date && { date: new Date(date) }),
            },
        })

        if (result.count === 0) {
            res.status(404).json({ message: 'Transaksi tidak ditemukan' })
            return
        }

        res.status(200).json({ message: 'Transaksi berhasil diupdate' })
    } catch (err) {
        console.error('Update transaction error:', err)
        res.status(500).json({ message: 'Terjadi kesalahan server' })
    }
}

// DELETE /api/transactions/:id
export const deleteTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const result = await prisma.transaction.deleteMany({
            where: { id: req.params.id, userId: req.userId! },
        })

        if (result.count === 0) {
            res.status(404).json({ message: 'Transaksi tidak ditemukan' })
            return
        }

        res.status(200).json({ message: 'Transaksi berhasil dihapus' })
    } catch (err) {
        console.error('Delete transaction error:', err)
        res.status(500).json({ message: 'Terjadi kesalahan server' })
    }
}
