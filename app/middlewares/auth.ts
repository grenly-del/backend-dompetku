import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { SECRET } from '../config'

export interface AuthRequest extends Request {
    userId?: string
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Token tidak ditemukan' })
        return
    }

    const token = authHeader.split(' ')[1]

    try {
        const decoded = jwt.verify(token, SECRET.JWT_SECRET) as { userId: string }
        console.log(decoded)
        req.userId = decoded.userId
        next()
    } catch {
        res.status(401).json({ message: 'Token tidak valid atau sudah kedaluwarsa' })
    }
}
