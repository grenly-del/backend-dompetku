import { z } from 'zod'

export const upsertBudgetSchema = z.object({
    month: z.number().min(1).max(12),
    year: z.number().min(2020).max(2100),
    allocations: z.array(z.object({
        categoryId: z.string().min(1, 'Kategori wajib dipilih'),
        amount: z.number().min(0, 'Jumlah minimal 0'),
    })).min(1, 'Minimal 1 alokasi kategori'),
})

export const budgetQuerySchema = z.object({
    month: z.coerce.number().min(1).max(12),
    year: z.coerce.number().min(2020).max(2100),
})
