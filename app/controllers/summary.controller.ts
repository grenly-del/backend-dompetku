import { Response } from 'express'
import { prisma } from '../config/adapterDB'
import { AuthRequest } from '../middlewares/auth'

function formatDateKey(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function parseDateInput(value: string | undefined): Date | null {
    if (!value) {
        return new Date()
    }

    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T00:00:00`)
        : new Date(value)

    if (Number.isNaN(normalized.getTime())) {
        return null
    }

    return normalized
}

// GET /api/summary/overview - total balance for authenticated user
export const getOverview = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const [incomeAgg, expenseAgg] = await Promise.all([
            prisma.transaction.aggregate({
                where: { userId: req.userId!, type: 'INCOME' },
                _sum: { amount: true },
            }),
            prisma.transaction.aggregate({
                where: { userId: req.userId!, type: 'EXPENSE' },
                _sum: { amount: true },
            }),
        ])

        const totalIncome = Number(incomeAgg._sum.amount || 0)
        const totalExpense = Number(expenseAgg._sum.amount || 0)

        res.status(200).json({
            totalBalance: totalIncome - totalExpense,
        })
    } catch (err) {
        console.error('Get overview error:', err)
        res.status(500).json({ message: 'Terjadi kesalahan server' })
    }
}

// GET /api/summary/expense-stats?date=2026-04-19 - expense totals for today and this month
export const getExpenseStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const rawDate = typeof req.query.date === 'string' ? req.query.date : undefined
        const baseDate = parseDateInput(rawDate)

        if (!baseDate) {
            res.status(400).json({ message: 'Parameter date tidak valid' })
            return
        }

        const dayStart = new Date(baseDate)
        dayStart.setHours(0, 0, 0, 0)

        const dayEnd = new Date(baseDate)
        dayEnd.setHours(23, 59, 59, 999)

        const monthStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1)
        const monthEnd = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0, 23, 59, 59, 999)

        const [todayAgg, monthAgg] = await Promise.all([
            prisma.transaction.aggregate({
                where: {
                    userId: req.userId!,
                    type: 'EXPENSE',
                    date: { gte: dayStart, lte: dayEnd },
                },
                _sum: { amount: true },
            }),
            prisma.transaction.aggregate({
                where: {
                    userId: req.userId!,
                    type: 'EXPENSE',
                    date: { gte: monthStart, lte: monthEnd },
                },
                _sum: { amount: true },
            }),
        ])

        res.status(200).json({
            date: formatDateKey(baseDate),
            todayExpense: Number(todayAgg._sum.amount || 0),
            monthExpense: Number(monthAgg._sum.amount || 0),
        })
    } catch (err) {
        console.error('Get expense stats error:', err)
        res.status(500).json({ message: 'Terjadi kesalahan server' })
    }
}

// GET /api/summary?month=4&year=2026 - single month financial summary
export const getSummary = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const month = Number(req.query.month)
        const year = Number(req.query.year)

        if (!month || !year || month < 1 || month > 12) {
            res.status(400).json({ message: 'Parameter month dan year wajib diisi (month: 1-12)' })
            return
        }

        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0, 23, 59, 59, 999)

        const [incomeAgg, expenseAgg, budgetAgg, categoryBreakdown] = await Promise.all([
            prisma.transaction.aggregate({
                where: { userId: req.userId!, type: 'INCOME', date: { gte: startDate, lte: endDate } },
                _sum: { amount: true },
            }),
            prisma.transaction.aggregate({
                where: { userId: req.userId!, type: 'EXPENSE', date: { gte: startDate, lte: endDate } },
                _sum: { amount: true },
            }),
            prisma.budget.aggregate({
                where: { userId: req.userId!, month, year },
                _sum: { amount: true },
            }),
            prisma.transaction.groupBy({
                by: ['categoryId'],
                where: { userId: req.userId!, type: 'EXPENSE', date: { gte: startDate, lte: endDate } },
                _sum: { amount: true },
                orderBy: { _sum: { amount: 'desc' } },
            }),
        ])

        const totalIncome = Number(incomeAgg._sum.amount || 0)
        const totalExpense = Number(expenseAgg._sum.amount || 0)
        const totalBudget = Number(budgetAgg._sum.amount || 0)
        const balance = totalIncome - totalExpense
        const savings = totalIncome - totalExpense

        const categoryIds = categoryBreakdown.map((c) => c.categoryId)
        const categories = await prisma.category.findMany({
            where: { id: { in: categoryIds }, userId: req.userId! },
            select: { id: true, name: true, icon: true },
        })
        const categoryMap = new Map(categories.map((c) => [c.id, c]))

        const expenseByCategory = categoryBreakdown.map((item) => {
            const cat = categoryMap.get(item.categoryId)
            const amount = Number(item._sum.amount || 0)
            return {
                categoryId: item.categoryId,
                categoryName: cat?.name || 'Unknown',
                categoryIcon: cat?.icon || 'help-circle-outline',
                amount,
                percent: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
            }
        })

        await prisma.financialSummary.upsert({
            where: { userId_month_year: { userId: req.userId!, month, year } },
            create: { userId: req.userId!, month, year, totalIncome, totalExpense, totalBudget, balance, savings },
            update: { totalIncome, totalExpense, totalBudget, balance, savings },
        })

        res.status(200).json({
            month,
            year,
            totalIncome,
            totalExpense,
            totalBudget,
            balance,
            savings,
            expenseByCategory,
        })
    } catch (err) {
        console.error('Get summary error:', err)
        res.status(500).json({ message: 'Terjadi kesalahan server' })
    }
}

// GET /api/summary/trend?year=2026 - monthly trend for a year
export const getMonthlySummaries = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const year = Number(req.query.year)
        if (!year) {
            res.status(400).json({ message: 'Parameter year wajib diisi' })
            return
        }

        const summaries = await prisma.financialSummary.findMany({
            where: { userId: req.userId!, year },
            orderBy: { month: 'asc' },
            select: {
                month: true,
                year: true,
                totalIncome: true,
                totalExpense: true,
                balance: true,
                savings: true,
            },
        })

        res.status(200).json({ year, summaries })
    } catch (err) {
        console.error('Get trend error:', err)
        res.status(500).json({ message: 'Terjadi kesalahan server' })
    }
}
