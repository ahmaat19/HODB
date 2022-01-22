import asyncHandler from 'express-async-handler'
import sql from 'mssql'
import config from '../../../../utils/dbConfig.js'

const getTowns = asyncHandler(async (req, res) => {
  const hospital = req.query.hospital

  try {
    await sql.connect(config(hospital))
    const q = `SELECT TownID, Town FROM Town`
    const result = await sql.query(q)

    res.json({ total: result.recordset.length, towns: result.recordset })
    await sql.close()
  } catch (err) {
    res.status(500).json({
      status: 500,
      message: err.originalError.info.message,
    })
  }
})

export { getTowns }
