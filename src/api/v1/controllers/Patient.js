import asyncHandler from 'express-async-handler'
import moment from 'moment'
import config from '../../../../utils/dbConfig.js'
import { get } from '../../../../utils/pool-manager.js'
import dotenv from 'dotenv'

dotenv.config()

const searchPatient = asyncHandler(async (req, res) => {
  const hospital = req.query.hospital
  try {
    const search = req.query.q

    if (!search || search === '') {
      return res.status(400).json({
        status: 400,
        message: 'Please enter a search term',
      })
    }

    const searchArray = search.split('')
    const noZero =
      searchArray[0] === '0' ? searchArray.slice(1).join('') : search
    const withZero = searchArray[0] === '0' ? search : '0' + search

    if (search.length < 5) {
      return res.status(404).json({
        status: 404,
        message: 'Search must be at least 5 characters long',
      })
    }
    const pool = await get(`${hospital}1`, config(hospital))
    const result = await pool.request().query(
      `SELECT PatientID, Name, Gender, Tel, Status, Age, DateUnit, DOB FROM Patients
  WHERE PatientID = '${search}' OR Tel = '${withZero}' OR Tel = '${noZero}'`
    )

    const patients =
      result &&
      result.recordset.map((patient) => ({
        PatientID: patient.PatientID,
        Name: patient.Name,
        Gender: patient.Gender,
        Tel: patient.Tel,
        Status: patient.Status,
        Age: patient.Age + ' ' + patient.DateUnit,
        DOB: patient.DOB,
      }))
    await pool.close()
    res.status(200).json({ total: patients.length, patients })
  } catch (error) {
    return res.status(500).send(error)
  }
})

const assignToDoctor = asyncHandler(async (req, res) => {
  const { PatientID, DoctorID, AppointmentDate, BookingTel } = req.body

  if (!PatientID || !DoctorID || !AppointmentDate || !BookingTel) {
    return res.status(400).json({
      status: 400,
      message: 'Please enter all fields',
    })
  }

  const hospital = req.query.hospital

  if (PatientID.length < 5) {
    return res.status(404).json({
      status: 404,
      message: 'Invalid Patient ID',
    })
  }

  try {
    const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD')
    const aDate = moment(AppointmentDate).format('YYYY-MM-DD')
    const today = moment().format('YYYY-MM-DD')

    if (aDate < today) {
      return res.status(400).json({
        status: 400,
        message: 'Appointment date cannot be in the past',
      })
    }

    if (aDate > tomorrow) {
      return res.status(500).json({
        status: 500,
        message: 'Appointment Date cannot be grater than tomorrow',
      })
    }

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
    const apiKey = req.query.apiKey
    const pool0 = await get('getKey', db)
    const keyResult = await pool0
      .request()
      .query(
        `SELECT * FROM Agent WHERE Active = 'Yes' AND ApiKey = '${apiKey}'`
      )

    const AgentID = keyResult.recordset[0].ID

    const pool1 = await get(`${hospital}1`, config(hospital))

    const patientQuery = `
      SELECT PatientID, Tel FROM Patients
      WHERE PatientID = '${PatientID}'
      `
    const doctorQuery = `
      SELECT DoctorID, Cost, UserName, WorkingDays, Limitation, DoctorNo, OnlineDoctorNo FROM Doctors
      WHERE DoctorID = '${DoctorID}' AND  Active = 'Yes' AND Doctor = 'Yes'`

    const patient = await pool1.request().query(patientQuery)

    if (patient && patient.recordset.length === 0) {
      return res
        .status(500)
        .json({ status: 500, message: 'Invalid Patient ID' })
    }

    await pool1.close()

    const pool2 = await get(`${hospital}2`, config(hospital))
    const doctor = await pool2.request().query(doctorQuery)

    if (doctor && doctor.recordset.length === 0) {
      return res.status(500).json({ status: 500, message: 'Invalid Doctor ID' })
    }

    const workingDays = doctor.recordset[0].WorkingDays

    const day = moment(AppointmentDate).format('dddd')
    const workingDaysArray = workingDays.split(',')

    if (!workingDaysArray.includes(day)) {
      return res.status(500).json({
        status: 500,
        message: `Doctor is not working on ${AppointmentDate}`,
      })
    }

    if (doctor.recordset[0].Limitation > 0) {
      if (
        aDate === today &&
        doctor.recordset[0].DoctorNo >= doctor.recordset[0].Limitation
      ) {
        return res.status(500).json({
          status: 500,
          message: `Doctor has reached his limit on ${AppointmentDate}`,
        })
      }

      if (
        aDate === tomorrow &&
        doctor.recordset[0].OnlineDoctorNo >= doctor.recordset[0].Limitation
      ) {
        return res.status(500).json({
          status: 500,
          message: `Doctor has reached his limit on ${AppointmentDate}`,
        })
      }
    }

    const patientId = patient.recordset[0].PatientID
    const Tel = patient.recordset[0].Tel
    const doctorId = doctor.recordset[0].DoctorID
    const Cost = doctor.recordset[0].Cost
    const UserName = doctor.recordset[0].UserName
    const Status = 'Existing'
    const appDate = moment(AppointmentDate).format('YYYY-MM-DD')
    const DateAdded = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
    const AddedBy = 'Himilo'

    const assignQuery = `
          INSERT INTO DoctorAssignation (PatientID, DoctorID, UserName, PatientType, Cost, Agent, Date, Booked, AddedBy, DateAdded, Tel, Status, BookingTel) VALUES ('${patientId}', '${doctorId}', '${UserName}', 'OutPatient', ${Cost}, ${AgentID}, '${appDate}', Null, '${AddedBy}', '${DateAdded}', '${Tel}', '${Status}', '${BookingTel}')
          `

    await pool2.close()

    const pool3 = await get(`${hospital}3`, config(hospital))
    await pool3.request().query(assignQuery)

    res.status(201).json({
      status: 'Success',
      message: 'Patient Assigned to Doctor Successfully',
    })
  } catch (error) {
    return res.status(500).send(error)
  }
})

const assignNewPatientToDoctor = asyncHandler(async (req, res) => {
  const {
    Name,
    Gender,
    Age,
    DateUnit,
    Town,
    Tel,
    MaritalStatus,
    DoctorID,
    AppointmentDate,
    BookingTel,
  } = req.body

  const hospital = req.query.hospital

  if (
    !Name ||
    !Gender ||
    !Age ||
    !DateUnit ||
    !Town ||
    !Tel ||
    !MaritalStatus ||
    !DoctorID ||
    !AppointmentDate ||
    !BookingTel
  ) {
    return res.status(400).json({
      status: 400,
      message: 'Please enter all fields',
    })
  }

  if (DateUnit !== 'Years' && DateUnit !== 'Months' && DateUnit !== 'Days') {
    return res.status(400).json({
      status: 400,
      message: 'Invalid Date Unit',
    })
  }

  try {
    const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD')
    const aDate = moment(AppointmentDate).format('YYYY-MM-DD')
    const today = moment().format('YYYY-MM-DD')

    const DOB = moment().subtract(Age, DateUnit).format('YYYY-MM-DD')

    if (aDate < today) {
      return res.status(400).json({
        status: 400,
        message: 'Appointment date cannot be in the past',
      })
    }

    if (aDate > tomorrow) {
      return res.status(500).json({
        status: 500,
        message: 'Appointment Date cannot be grater than tomorrow',
      })
    }

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
    const apiKey = req.query.apiKey
    const pool0 = await get('getKey2', db)
    const keyResult = await pool0
      .request()
      .query(
        `SELECT * FROM Agent WHERE Active = 'Yes' AND ApiKey = '${apiKey}'`
      )

    const AgentID = keyResult.recordset[0].ID

    const pool1 = await get(`${hospital}1`, config(hospital))

    const lastRecordQuery = `
      SELECT TOP 1 PatientID FROM Patients ORDER BY SerialNo DESC
      `

    const doctorQuery = `
      SELECT * FROM Doctors
      WHERE DoctorID = '${DoctorID}' AND  Active = 'Yes' AND Doctor = 'Yes'`

    const lastRecord = await pool1.request().query(lastRecordQuery)

    if (lastRecord && lastRecord.recordset.length === 0) {
      return res
        .status(500)
        .json({ status: 500, message: 'Invalid Patient ID' })
    }

    const lastPatientID = lastRecord.recordset[0].PatientID.slice(1)
    const newPatientID = `T${Number(lastPatientID) + 1}`
    const newTempID = `T${Number(lastPatientID) + 1}`

    const DateAdded = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')

    const AddedBy = 'Himilo'

    const newPatientQuery = `
        INSERT INTO Patients (PatientID, Name, Gender, Age, Town, Tel, MaritalStatus, City, Date, DateAdded, AddedBy, DateUnit, DOB, TempID) 
          VALUES ('${newPatientID}', '${Name}', '${Gender}', ${Age}, '${Town}', '${Tel}', '${MaritalStatus}', 'MOGADISHU', '${AppointmentDate}', '${DateAdded}', '${AddedBy}', '${DateUnit}', '${DOB}', '${newTempID}')
          `

    await pool1.close()

    const pool2 = await get(`${hospital}2`, config(hospital))
    const doctor = await pool2.request().query(doctorQuery)

    if (doctor && doctor.recordset.length === 0) {
      return res.status(500).json({ status: 500, message: 'Invalid Doctor ID' })
    }

    const workingDays = doctor.recordset[0].WorkingDays

    const day = moment(AppointmentDate).format('dddd')
    const workingDaysArray = workingDays.split(',')

    if (!workingDaysArray.includes(day)) {
      return res.status(500).json({
        status: 500,
        message: `Doctor is not working on ${AppointmentDate}`,
      })
    }

    await pool2.close()

    const pool3 = await get(`${hospital}3`, config(hospital))
    await pool3.request().query(newPatientQuery)

    const doctorId = DoctorID
    const Cost = doctor.recordset[0].Cost
    const UserName = doctor.recordset[0].UserName
    const Status = 'New'

    const assignQuery = `
          INSERT INTO DoctorAssignation (PatientID, DoctorID, UserName, PatientType, Cost, Agent, Date, Booked, AddedBy, DateAdded, Tel, Status, BookingTel) 
          VALUES ('${newPatientID}', '${doctorId}', '${UserName}', 'OutPatient', ${Cost}, ${AgentID}, '${AppointmentDate}', Null, '${AddedBy}', '${DateAdded}', '${Tel}', '${Status}', '${BookingTel}')
          `
    await pool3.close()
    const pool4 = await get(`${hospital}4`, config(hospital))
    await pool4.request().query(assignQuery)

    res.status(201).json({
      status: 'Success',
      message: 'Patient Assigned to Doctor Successfully',
    })
  } catch (error) {
    return res.status(500).send(error)
  }
})

export { searchPatient, assignToDoctor, assignNewPatientToDoctor }
