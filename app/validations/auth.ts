import { z } from 'zod'

export const registerSchema = z.object({
    username: z.string().trim().min(3, 'Username minimal 3 karakter'),
    email: z.string().trim().email('Format email tidak valid'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
    whatsapp: z.string().trim()
        .min(10, 'Nomor WhatsApp minimal 10 digit')
        .max(16, 'Nomor WhatsApp maksimal 16 karakter')
        .regex(/^(\+62|62|0)\d{8,13}$/, 'Format nomor WhatsApp tidak valid (contoh: 082187199940)')
        .optional()
        .or(z.literal('')),
})

export const loginSchema = z.object({
    email: z.string().trim().email('Format email tidak valid'),
    password: z.string().min(1, 'Password wajib diisi'),
})

export const updateProfileSchema = z.object({
    username: z.string().trim().min(3, 'Username minimal 3 karakter'),
    email: z.string().trim().email('Format email tidak valid'),
    whatsapp: z.string().trim()
        .min(10, 'Nomor WhatsApp minimal 10 digit')
        .max(16, 'Nomor WhatsApp maksimal 16 karakter')
        .regex(/^(\+62|62|0)\d{8,13}$/, 'Format nomor WhatsApp tidak valid (contoh: 082187199940)')
        .optional()
        .or(z.literal(''))
        .nullable(),
})

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Password saat ini wajib diisi'),
    newPassword: z.string().min(6, 'Password baru minimal 6 karakter'),
})

export const resetPasswordSchema = z.object({
    email: z.string().trim().email('Format email tidak valid'),
    newPassword: z.string().min(6, 'Password baru minimal 6 karakter'),
})
