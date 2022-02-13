import asyncHandler from 'express-async-handler'
import moment from 'moment'
import config from '../../../../utils/dbConfig.js'
import { get } from '../../../../utils/pool-manager.js'

const getDoctors = asyncHandler(async (req, res) => {
  const today = moment().format('dddd')
  const hospital = req.query.hospital

  try {
    const pool = await get(`${hospital}1`, config(hospital))
    const result = await pool
      .request()
      .query(
        `select DoctorID, Name, Gender, Specialization, Cost, UserName, DoctorNo, OnlineDoctorNo, WorkingDays from doctors WHERE Active = 'Yes' AND Doctor = 'Yes' AND WorkingDays LIKE '%${today}%'`
      )

    await pool.close()
    res.json({ total: result.recordset.length, doctors: result.recordset })
  } catch (err) {
    res.status(500).json({
      status: 500,
      message: err.originalError.info.message,
    })
  }
})

export { getDoctors }
