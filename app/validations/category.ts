import { z } from 'zod'

export const createCategorySchema = z.object({
    name: z.string().min(1, 'Nama kategori wajib diisi'),
    type: z.enum(['INCOME', 'EXPENSE'], { message: 'Type harus INCOME atau EXPENSE' }),
    icon: z.string().min(1, 'Icon wajib diisi'),
})

export const updateCategorySchema = z.object({
    name: z.string().min(1).optional(),
    icon: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
})
