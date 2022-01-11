import asyncHandler from 'express-async-handler'
import sql from 'mssql'
import config from '../../../../utils/dbConfig.js'

const searchPatient = asyncHandler(async (req, res) => {
  try {
    sql.connect(config, (err) => {
      if (err) {
        console.log(err)
        res.status(500).send(err)
      }

      const search = req.query.search
      if (search.length < 5)
        return res.status(404).json({
          status: 'Failed',
          message: 'Search must be at least 5 characters long',
        })

      const request = new sql.Request()
      const query = `
      SELECT * FROM Patients
      WHERE PatientID = '${search}' OR Tel = '${search}'
      `
      request.query(query, (err, result) => {
        if (err) {
          console.log(err)
          res
            .status(500)
            .json({ status: 'Failed', message: err.originalError.info.message })
        }
        const patients =
          result &&
          result.recordset.map((patient) => ({
            id: patient.PatientID,
            name: patient.Name,
            gender: patient.Gender,
            tel: patient.Tel,
            status: patient.Status,
            age: patient.Age + ' ' + patient.DateUnit,
            dateOfBirth: patient.DOB,
          }))
        res.status(200).json({ total: patients.length, patients })
      })
    })
  } catch (error) {
    console.log(error)
    res.status(500).send(error)
  }
})

export { searchPatient }
