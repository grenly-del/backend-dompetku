import { z } from 'zod'

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
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
})
