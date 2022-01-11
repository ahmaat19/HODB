import asyncHandler from 'express-async-handler'
import sql from 'mssql'
import config from '../../../../utils/dbConfig.js'

const getTowns = asyncHandler(async (req, res) => {
  try {
    sql.connect(config, (err) => {
      if (err) {
        console.log(err)
        res.status(500).send(err)
      }

      const request = new sql.Request()
      const query = `SELECT * FROM Town`
      request.query(query, (err, result) => {
        if (err) {
          console.log(err)
          res
            .status(500)
            .json({ status: 'Failed', message: err.originalError.info.message })
        }

        const towns =
          result &&
          result.recordset.map((town) => ({
            id: town.TownID,
            name: town.Town,
          }))
        res.status(200).json({ total: towns.length, towns })
      })
    })
  } catch (error) {
    console.log(error)
    res.status(500).send(error)
  }
})

export { getTowns }
