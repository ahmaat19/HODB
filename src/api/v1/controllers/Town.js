import asyncHandler from 'express-async-handler'
import sql from 'mssql'
import config from '../../../../utils/dbConfig.js'

const getTowns = asyncHandler(async (req, res) => {
  try {
    sql.connect(config, (error) => {
      if (error) {
        console.log(error)
        return res.status(500).send(error)
      }

      const request = new sql.Request()
      const query = `SELECT TownID, Town FROM Town`
      request.query(query, (err, result) => {
        if (err) {
          console.log(err)
          return res
            .status(500)
            .json({ status: 'Failed', message: err.originalError.info.message })
        }

        return res
          .status(200)
          .json({ total: result.recordset.length, towns: result.recordset })
      })
    })
  } catch (error) {
    console.log(error)
    return res.status(500).send(error)
  }
})

export { getTowns }
