import asyncHandler from 'express-async-handler'
import config from '../../../../utils/dbConfig.js'
import { get } from '../../../../utils/pool-manager.js'

const getDoctors = asyncHandler(async (req, res) => {
  const hospital = req.query.hospital

  try {
    const pool = await get(`${hospital}1`, config(hospital))
    const result = await pool
      .request()
      .query(
        `select DoctorID, Name, Gender, Specialization, Cost, UserName, DoctorNo, OnlineDoctorNo, WorkingDays from doctors WHERE Active = 'Yes' AND Doctor = 'Yes'`
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

const searchDoctor = asyncHandler(async (req, res) => {
  const hospital = req.query.hospital
  try {
    const search = req.query.q

    if (!search || search === '') {
      return res.status(400).json({
        status: 400,
        message: 'Please enter a search term',
      })
    }

    const pool = await get(`${hospital}1`, config(hospital))
    const result = await pool
      .request()
      .query(
        `SELECT DoctorID, Name, Gender, Specialization, Cost, UserName, DoctorNo, OnlineDoctorNo, WorkingDays FROM doctors WHERE DoctorID = '${search}' AND Active = 'Yes' AND Doctor = 'Yes'`
      )

    await pool.close()
    if (result.recordset.length === 0) {
      return res.status(404).json({
        status: 404,
        message: 'Doctor not found',
      })
    }
    res.status(200).json(result.recordset[0])
  } catch (error) {
    return res.status(500).send(error)
  }
})

const searchSpecializationsFromAllDoctors = asyncHandler(async (req, res) => {
  const hospital = req.query.hospital

  console.log({ hospital })

  try {
    if (hospital === 'all') {
      const search = req.query.q

      if (!search || search === '') {
        return res.status(400).json({
          status: 400,
          message: 'Please enter a search term',
        })
      }

      const query = async (hospital, search) => {
        const r = hospital.map(async (name, index) => {
          const result = await get(`${name}1`, config(name))
            .request()
            .query(
              `SELECT DoctorID, Name, Gender, Specialization, Cost, UserName, DoctorNo, OnlineDoctorNo, WorkingDays FROM doctors WHERE DoctorID = '${search}' AND Active = 'Yes' AND Doctor = 'Yes'`
            )

          await result.close()
          return result
        })
        return r
      }

      // let doctors = []

      query(['ladnaan', 'test'], search).then((result) => {
        // // console.log(result.recordset)
        // doctors.push({
        //   hospital: 'ladnaan',
        //   doctor: result.recordset.length > 0 && result.recordset[0],
        // })
        res.status(200).json(result)
      })
      // res.status(200).json(doctors)
    }
  } catch (error) {
    return res.status(500).send(error)
  }
})

export { getDoctors, searchDoctor, searchSpecializationsFromAllDoctors }
