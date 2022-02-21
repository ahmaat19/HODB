import moment from 'moment'
import config from '../../../../utils/dbConfig.js'
import dotenv from 'dotenv'

import { get } from '../../../../utils/pool-manager.js'

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

export const auth = async (req, res, next) => {
  const apiKey = req.query.apiKey
  const hospital = req.query.hospital

  if (hospital !== 'all') {
    try {
      if (config(hospital).database === 'invalid') {
        return res
          .status(500)
          .json({ status: 500, message: 'Invalid hospital' })
      }
      const pool = await get('apiKeyCheck', db)
      const result = await pool
        .request()
        .query(`SELECT * FROM Agent WHERE Active = 'Yes'`)

      const agent = result.recordset.find((agent) => agent.Apikey === apiKey)
      if (agent) {
        return next()
      }
      return res
        .status(401)
        .json({ status: 401, message: 'API key is missing or invalid' })
    } catch (error) {
      return res.status(500).send(error)
    }
  } else {
    return next()
  }
}

export const internetCheck = async (req, res, next) => {
  const hospital = req.query.hospital

  if (hospital !== 'all') {
    try {
      const pool = await get(`${hospital}1`, config(hospital))
      const result = await pool
        .request()
        .query(`SELECT InternetDate FROM InternetConnection`)

      if (result && result.recordset.length === 0) {
        return res
          .status(500)
          .json({ status: 500, message: 'Invalid Internet Connection' })
      }
      const internetDate = result.recordset[0].InternetDate
      const currentDate = moment(new Date())
      const offlineMinutes = currentDate.diff(internetDate, 'minutes') + 180

      if (offlineMinutes > 5) {
        return res.status(500).json({
          status: 500,
          message:
            'We have detected issues with the hospital internet connection.',
        })
      } else {
        return next()
      }
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: error.originalError.info.message,
      })
    }
  } else {
    return next()
  }
}
