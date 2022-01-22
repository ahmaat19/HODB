import asyncHandler from 'express-async-handler'
import moment from 'moment'
import sql from 'mssql'
import config from '../../../../utils/dbConfig.js'

const getDoctors = asyncHandler(async (req, res) => {
  const hospital = req.query.hospital
  const today = moment().format('dddd')

  try {
    await sql.connect(config(hospital))
    const q = `select DoctorID, Name, Gender, Specialization, Cost, UserName, DoctorNo, OnlineDoctorNo from doctors WHERE Active = 'Yes' AND Doctor = 'Yes' AND WorkingDays LIKE '%${today}%'`
    const result = await sql.query(q)

    res.json({ total: result.recordset.length, doctors: result.recordset })
    await sql.close()
  } catch (err) {
    res.status(500).json({
      status: 500,
      message: err.originalError.info.message,
    })
  }
})

export { getDoctors }
