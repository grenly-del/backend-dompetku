import { Response } from 'express'
import { prisma } from '../config/adapterDB'
import { AuthRequest } from '../middlewares/auth'
import { upsertBudgetSchema, budgetQuerySchema } from '../validations/budget'
import { findOwnedCategories } from '../utils/category-ownership'

// GET /api/budgets?month=4&year=2026
export const getBudget = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const parsed = budgetQuerySchema.safeParse(req.query)
        if (!parsed.success) {
            res.status(400).json({ message: 'Query tidak valid', errors: parsed.error.flatten().fieldErrors })
            return
        }

        const { month, year } = parsed.data

        const budgets = await prisma.budget.findMany({
            where: { userId: req.userId!, month, year },
            include: { category: { select: { id: true, name: true, icon: true, type: true } } },
            orderBy: { category: { name: 'asc' } },
        })

        const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0)

        res.status(200).json({ month, year, totalBudget, budgets })
    } catch (err) {
        console.error('Get budget error:', err)
        res.status(500).json({ message: 'Terjadi kesalahan server' })
    }
}

// POST /api/budgets — upsert budget allocations for a month
export const upsertBudget = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const parsed = upsertBudgetSchema.safeParse(req.body)
        if (!parsed.success) {
            res.status(400).json({ message: 'Validasi gagal', errors: parsed.error.flatten().fieldErrors })
            return
        }

        const { month, year, allocations } = parsed.data
        const categoryIds = allocations.map((allocation) => allocation.categoryId)
        const uniqueCategoryIds = [...new Set(categoryIds)]

        if (uniqueCategoryIds.length !== allocations.length) {
            res.status(400).json({ message: 'Kategori budget tidak boleh duplikat' })
            return
        }

        const ownedCategories = await findOwnedCategories({
            userId: req.userId!,
            categoryIds: uniqueCategoryIds,
            type: 'EXPENSE',
        })

        if (ownedCategories.length !== uniqueCategoryIds.length) {
            res.status(400).json({ message: 'Kategori budget tidak valid atau bukan milik user' })
            return
        }

        // Upsert each allocation in a transaction
        const results = await prisma.$transaction(
            allocations.map((alloc) =>
                prisma.budget.upsert({
                    where: {
                        userId_categoryId_month_year: {
                            userId: req.userId!,
                            categoryId: alloc.categoryId,
                            month,
                            year,
                        },
                    },
                    create: {
                        userId: req.userId!,
                        categoryId: alloc.categoryId,
                        month,
                        year,
                        amount: alloc.amount,
                    },
                    update: {
                        amount: alloc.amount,
                    },
                })
            )
        )

        res.status(200).json({ message: 'Budget berhasil disimpan', count: results.length })
    } catch (err) {
        console.error('Upsert budget error:', err)
        res.status(500).json({ message: 'Terjadi kesalahan server' })
    }
}

// DELETE /api/budgets?month=4&year=2026
export const deleteBudget = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const parsed = budgetQuerySchema.safeParse(req.query)
        if (!parsed.success) {
            res.status(400).json({ message: 'Query tidak valid', errors: parsed.error.flatten().fieldErrors })
            return
        }

        const { month, year } = parsed.data

        const result = await prisma.budget.deleteMany({
            where: { userId: req.userId!, month, year },
        })

        res.status(200).json({ message: 'Budget berhasil dihapus', count: result.count })
    } catch (err) {
        console.error('Delete budget error:', err)
        res.status(500).json({ message: 'Terjadi kesalahan server' })
    }
}
