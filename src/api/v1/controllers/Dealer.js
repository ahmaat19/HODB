import asyncHandler from 'express-async-handler'
import moment from 'moment'
import config from '../../../../utils/dbConfig.js'
import { get } from '../../../../utils/pool-manager.js'

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
    const pool = await get(`Dealer`, db)
    const result = await pool
      .request()
      .query(`SELECT * FROM Dealers WHERE Active = 'Yes'`)
    await pool.close()
    res.json({ total: result.recordset.length, dealers: result.recordset })
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
    const pool = await get(`Dealers`, db)
    const result = await pool
      .request()
      .query(`SELECT * FROM Dealers WHERE Code = ${code} AND Active = 'Yes'`)

    if (result.recordset.length === 0) {
      return res.status(404).json({
        status: 404,
        message: 'Dealer not found',
      })
    }
    await pool.close()
    res.json(result.recordset[0])
  } catch (err) {
    res.status(500).json({
      status: 500,
      message: err.originalError.info.message,
    })
  }
})

export { getDealers, getDealer }
