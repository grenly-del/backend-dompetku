import { Response } from 'express'
import { prisma } from '../config/adapterDB'
import { AuthRequest } from '../middlewares/auth'
import { createCategorySchema, updateCategorySchema } from '../validations/category'

// GET /api/categories?type=INCOME|EXPENSE
export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { type } = req.query

        const categories = await prisma.category.findMany({
            where: {
                userId: req.userId!,
                isActive: true,
                ...(type && { type: type as 'INCOME' | 'EXPENSE' }),
            },
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { transactions: true } } },
        })

        res.status(200).json({ categories })
    } catch (err) {
        console.error('Get categories error:', err)
        res.status(500).json({ message: 'Terjadi kesalahan server' })
    }
}

// POST /api/categories
export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const parsed = createCategorySchema.safeParse(req.body)
        if (!parsed.success) {
            res.status(400).json({ message: 'Validasi gagal', errors: parsed.error.flatten().fieldErrors })
            return
        }

        const category = await prisma.category.create({
            data: { ...parsed.data, userId: req.userId! },
        })

        res.status(201).json({ message: 'Kategori berhasil dibuat', category })
    } catch (err: any) {
        if (err?.code === 'P2002') {
            res.status(409).json({ message: 'Kategori dengan nama dan tipe ini sudah ada' })
            return
        }
        console.error('Create category error:', err)
        res.status(500).json({ message: 'Terjadi kesalahan server' })
    }
}

// PUT /api/categories/:id
export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const parsed = updateCategorySchema.safeParse(req.body)
        if (!parsed.success) {
            res.status(400).json({ message: 'Validasi gagal', errors: parsed.error.flatten().fieldErrors })
            return
        }

        const category = await prisma.category.updateMany({
            where: { id: req.params.id, userId: req.userId },
            data: parsed.data,
        })

        if (category.count === 0) {
            res.status(404).json({ message: 'Kategori tidak ditemukan' })
            return
        }

        res.status(200).json({ message: 'Kategori berhasil diupdate' })
    } catch (err) {
        console.error('Update category error:', err)
        res.status(500).json({ message: 'Terjadi kesalahan server' })
    }
}

// DELETE /api/categories/:id (soft delete)
export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const result = await prisma.category.updateMany({
            where: { id: req.params.id, userId: req.userId! },
            data: { isActive: false },
        })

        if (result.count === 0) {
            res.status(404).json({ message: 'Kategori tidak ditemukan' })
            return
        }

        res.status(200).json({ message: 'Kategori berhasil dihapus' })
    } catch (err) {
        console.error('Delete category error:', err)
        res.status(500).json({ message: 'Terjadi kesalahan server' })
    }
}
