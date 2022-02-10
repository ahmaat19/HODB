import moment from 'moment'
import sql from 'mssql'
import config from '../../../../utils/dbConfig.js'

export const internetCheck = async (req, res, next) => {
  const hospital = req.query.hospital

  try {
    await sql.connect(config(hospital))

    const internetQuery = `SELECT InternetDate FROM InternetConnection`
    const internet = await sql.query(internetQuery)

    if (internet && internet.recordset.length === 0) {
      return res
        .status(500)
        .json({ status: 500, message: 'Invalid Internet Connection' })
    }
    const internetDate = internet.recordset[0].InternetDate
    const currentDate = moment(new Date())
    const offlineMinutes = currentDate.diff(internetDate, 'minutes') + 180

    if (offlineMinutes > 5) {
      await sql.close()
      return res.status(500).json({
        status: 500,
        message:
          'We have detected issues with the hospital internet connection.',
      })
    } else {
      await sql.close()
      return next()
    }
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.originalError.info.message,
    })
  }
}

export const auth = async (req, res, next) => {
  try {
    const host = req.headers.host
    const userAgent = req.headers['user-agent']
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    const apiKey = req.query.apiKey
    const hospital = req.query.hospital

    if (config(hospital).database === 'invalid') {
      return res.status(500).json({ status: 500, message: 'Invalid hospital' })
    }

    await sql.connect(config(hospital))
    const q = `SELECT * FROM Agent`
    const agent = await sql.query(q)

    if (agent && agent.recordset.length === 0) {
      return res
        .status(500)
        .json({ status: 500, message: 'API key is missing or invalid' })
    }

    const singleAgent = agent.recordset[0]

    if (singleAgent.Apikey === apiKey) {
      await sql.close()
      return next()
    }
    await sql.close()
    return res
      .status(401)
      .json({ status: 401, message: 'API key is missing or invalid' })
  } catch (error) {
    return res.status(500).send(error)
  }
}
