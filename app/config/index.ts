import dotenv from 'dotenv'
import path from 'path'

// const envFile = process.env.NODE_ENV === "production" ? ".env" : ".env.development";
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') })
const SECRET = {
    JWT_SECRET: process.env.JWT_SECRET || "",
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1h",
}
const APPS = {
    PORT: process.env.PORT || 3000,
    CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3001",
}

export { SECRET, APPS }