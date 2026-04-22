import { z } from 'zod'

export const registerSchema = z.object({
    username: z.string().trim().min(3, 'Username minimal 3 karakter'),
    email: z.string().trim().email('Format email tidak valid'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
})

export const loginSchema = z.object({
    email: z.string().trim().email('Format email tidak valid'),
    password: z.string().min(1, 'Password wajib diisi'),
})

export const updateProfileSchema = z.object({
    username: z.string().trim().min(3, 'Username minimal 3 karakter'),
    email: z.string().trim().email('Format email tidak valid'),
})

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Password saat ini wajib diisi'),
    newPassword: z.string().min(6, 'Password baru minimal 6 karakter'),
})
