import asyncHandler from 'express-async-handler'
import moment from 'moment'
import sql from 'mssql'
import config from '../../../../utils/dbConfig.js'

const getDoctors = asyncHandler(async (req, res) => {
  const hospital = req.query.hospital
  try {
    sql.connect(config(hospital), (error) => {
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

      request.query(query, (err, result) => {
        if (err) {
          console.log(err)
          return res.status(500).json({
            status: 500,
            message: err.originalError.info.message,
          })
        }

        return res
          .status(200)
          .json({ total: result.recordset.length, doctors: result.recordset })
      })
    })
  } catch (error) {
    console.log(error)
    return res.status(500).send(error)
  }
})

export { getDoctors }
