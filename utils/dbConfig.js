import dotenv from 'dotenv'

dotenv.config()
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  options: {
    encrypt: false,
  },
}

export default config
