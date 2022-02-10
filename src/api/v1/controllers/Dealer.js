import asyncHandler from 'express-async-handler'
import sql from 'mssql'
import dotenv from 'dotenv'

dotenv.config()

const db = {
  user: process.env.DEALER_DB_USER,
  password: process.env.DEALER_DB_PASSWORD,
  server: process.env.DEALER_DB_SERVER,
  database: process.env.DEALER_DB_NAME,
  port: Number(process.env.GLOBAL_DB_PORT),
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
}
const getDealers = asyncHandler(async (req, res) => {
  try {
    await sql.connect(db)
    const q = `SELECT * FROM Dealers WHERE Active = 'Yes'`
    const result = await sql.query(q)

    res.json({ total: result.recordset.length, dealers: result.recordset })
    await sql.close()
  } catch (err) {
    res.status(500).json({
      status: 500,
      message: err.originalError.info.message,
    })
  }
})

const getDealer = asyncHandler(async (req, res) => {
  const id = req.params.id
  const code = Number(id)
  try {
    await sql.connect(db)
    const q = `SELECT * FROM Dealers WHERE Code = ${code} AND Active = 'Yes'`
    const result = await sql.query(q)

    if (result.recordset.length === 0) {
      return res.status(404).json({
        status: 404,
        message: 'Dealer not found',
      })
    }
    res.json(result.recordset[0])
    await sql.close()
  } catch (err) {
    res.status(500).json({
      status: 500,
      message: err.originalError.info.message,
    })
  }
})

export { getDealers, getDealer }
