// EXTERNAL 
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'

// INTERNAL
import { APPS } from './config'
import { prisma } from './config/adapterDB'
import { ConnectDB } from './config/connectDB'
import routes from './routes'
const app = express()
const isProduction = process.env.NODE_ENV === 'production'

function isAllowedDevOrigin(origin: string) {
    if (isProduction) {
        return false
    }

    try {
        const { hostname } = new URL(origin)
        return hostname === 'localhost' || hostname === '127.0.0.1'
    } catch {
        return false
    }
}

ConnectDB(prisma)
app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))


// API Routes
app.use('/api', routes)

app.get('/health', (req, res) => {
    res.status(200).json({
        message: 'OK',
        timestamp: new Date().toISOString(),
    })
})




const port = APPS.PORT
app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})
