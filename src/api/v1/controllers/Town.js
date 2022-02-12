import asyncHandler from 'express-async-handler'
import config from '../../../../utils/dbConfig.js'
import { get } from '../../../../utils/pool-manager.js'

const getTowns = asyncHandler(async (req, res) => {
  const hospital = req.query.hospital
  try {
    const pool = await get(`${hospital}`, config(hospital))
    const result = await pool.request().query(`SELECT TownID, Town FROM Town`)

    await pool.close()
    res.json({ total: result.recordset.length, towns: result.recordset })
  } catch (err) {
    res.status(500).json({
      status: 500,
      message: err.originalError.info.message,
    })
  }
})

export { getTowns }
