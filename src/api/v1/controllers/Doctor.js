import asyncHandler from 'express-async-handler'
import moment from 'moment'
import sql from 'mssql'
import config from '../../../../utils/dbConfig.js'

const getDoctors = asyncHandler(async (req, res) => {
  try {
    sql.connect(config, (error) => {
      if (error) {
        console.log(error)
        return res.status(500).send(error)
      }

      const today = moment().format('dddd')
      const request = new sql.Request()
      const query = `
      SELECT DoctorID, Name, Gender, Specialization, Cost, UserName, DoctorNo, OnlineDoctorNo FROM Doctors
      WHERE Active = 'Yes' AND Doctor = 'Yes' AND WorkingDays LIKE '%${today}%'
      `
      const internetQuery = `SELECT InternetDate FROM InternetConnection`
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
            .json({ total: result.recordset.length, doctors: result.recordset })
        })
      })
    })
  } catch (error) {
    console.log(error)
    return res.status(500).send(error)
  }
})

export { getDoctors }
