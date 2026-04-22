import { z } from 'zod'

const dateQuerySchema = z.string().refine((value) => {
    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? `${value}T00:00:00`
        : value

    return !Number.isNaN(new Date(normalized).getTime())
}, { message: 'Format tanggal tidak valid' })

export const createTransactionSchema = z.object({
    name: z.string().min(1, 'Nama transaksi wajib diisi'),
    amount: z.number().positive('Jumlah harus lebih dari 0'),
    type: z.enum(['INCOME', 'EXPENSE'], { message: 'Type harus INCOME atau EXPENSE' }),
    date: z.string().datetime({ message: 'Format tanggal tidak valid (ISO 8601)' }),
    note: z.string().optional(),
    categoryId: z.string().min(1, 'Kategori wajib dipilih'),
})

export const updateTransactionSchema = z.object({
    name: z.string().min(1).optional(),
    amount: z.number().positive().optional(),
    date: z.string().datetime().optional(),
    note: z.string().optional(),
    categoryId: z.string().min(1).optional(),
})

export const transactionQuerySchema = z.object({
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
    categoryId: z.string().optional(),
    month: z.coerce.number().min(1).max(12).optional(),
    year: z.coerce.number().min(2020).max(2100).optional(),
    startDate: dateQuerySchema.optional(),
    endDate: dateQuerySchema.optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
})
