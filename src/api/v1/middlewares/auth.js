import expressAsyncHandler from 'express-async-handler'
import moment from 'moment'
import sql from 'mssql'
import config from '../../../../utils/dbConfig.js'

export const internetCheck = (req, res, next) => {
  const hospital = req.query.hospital
  sql.connect(config(hospital), (error) => {
    if (error) {
      console.log(error)
      return res.status(500).send(error)
    }

    const request = new sql.Request()
    const internetQuery = `SELECT InternetDate FROM InternetConnection`

    request.query(internetQuery, (err, internet) => {
      if (err) {
        console.log(err)
        return res
          .status(500)
          .json({ status: 500, message: err.originalError.info.message })
      }
      if (internet && internet.recordset.length === 0) {
        return res
          .status(500)
          .json({ status: 500, message: 'Invalid Internet Connection' })
      }
      const internetDate = internet.recordset[0].InternetDate
      const currentDate = moment(new Date())
      const offlineMinutes = currentDate.diff(internetDate, 'minutes') + 180
      console.log(internet && internet.recordset)
      if (offlineMinutes > 5) {
        return res.status(500).json({
          status: 500,
          message:
            'We have detected issues with the hospital internet connection.',
        })
      } else {
        return next()
      }
    })
  })
}

export const auth = async (req, res, next) => {
  try {
    const host = req.headers.host
    const userAgent = req.headers['user-agent']
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    const apiKey = req.query.apiKey
    const hospital = req.query.hospital

    console.log({ CONGIGGGGGGGGGG: config(hospital) })

    if (config(hospital).database === 'invalid') {
      return res.status(500).json({ status: 500, message: 'Invalid hospital' })
    }

    sql.connect(config(hospital), (error) => {
      if (error) {
        console.log(error)
        return res.status(500).send(error)
      }

      const request = new sql.Request()
      const agency = 'SELECT * FROM Agent'

      request.query(agency, (err, agent) => {
        if (err) {
          console.log(err)
          return res
            .status(500)
            .json({ status: 500, message: err.originalError.info.message })
        }
        if (agent && agent.recordset.length === 0) {
          return res
            .status(500)
            .json({ status: 500, message: 'API key is missing or invalid' })
        }

        const singleAgent = agent.recordset[0]

        if (singleAgent.Apikey === apiKey) {
          return next()
        }

        return res
          .status(401)
          .json({ status: 401, message: 'API key is missing or invalid' })
      })
    })
  } catch (error) {
    return res.status(500).send(error)
  }
}
