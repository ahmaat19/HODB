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
      SELECT * FROM Doctors
      WHERE Active = 'Yes' AND Doctor = 'Yes' AND WorkingDays LIKE '%${today}%'
      `
      request.query(query, (err, result) => {
        if (err) {
          console.log(err)
          return res
            .status(500)
            .json({ status: 'Failed', message: err.originalError.info.message })
        }
        const doctors =
          result &&
          result.recordset.map((doctor) => ({
            DoctorID: doctor.DoctorID,
            Name: doctor.Name,
            Gender: doctor.Gender,
            Specialization: doctor.Specialization,
            Cost: doctor.Cost,
            UserName: doctor.UserName,
          }))
        return res.status(200).json({ total: doctors.length, doctors })
      })
    })
  } catch (error) {
    console.log(error)
    return res.status(500).send(error)
  }
})

export { getDoctors }
