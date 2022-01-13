import asyncHandler from 'express-async-handler'
import moment from 'moment'

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
      const internetQuery = `SELECT InternetDate FROM InternetConnection`
      const query = `SELECT TownID, Town FROM Town`

      request.query(internetQuery, (err, internet) => {
        if (err) {
          console.log(err)
          return res
            .status(500)
            .json({ status: 'Failed', message: err.originalError.info.message })
        }
        if (internet && internet.recordset.length === 0) {
          return res
            .status(500)
            .json({ status: 'Failed', message: 'Invalid Internet Connection' })
        }
        const internetDate = internet.recordset[0].InternetDate
        const currentDate = moment(new Date())
        const offlineMinutes = currentDate.diff(internetDate, 'minutes') + 180

        if (offlineMinutes > 5) {
          return res.status(500).json({
            status: 'Failed',
            message:
              'We have detected issues with the hospital internet connection.',
          })
        }

        request.query(query, (err, result) => {
          if (err) {
            console.log(err)
            return res.status(500).json({
              status: 'Failed',
              message: err.originalError.info.message,
            })
          }

          return res
            .status(200)
            .json({ total: result.recordset.length, towns: result.recordset })
        })
      })
    })
  } catch (error) {
    console.log(error)
    return res.status(500).send(error)
  }
})

export { getTowns }
