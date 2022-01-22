import asyncHandler from 'express-async-handler'
import moment from 'moment'
import sql from 'mssql'
import config from '../../../../utils/dbConfig.js'

const searchPatient = asyncHandler(async (req, res) => {
  const hospital = req.query.hospital

  try {
    const search = req.query.search
    if (search.length < 5) {
      return res.status(404).json({
        status: 404,
        message: 'Search must be at least 5 characters long',
      })
    }
    await sql.connect(config(hospital))
    const q = `
  SELECT PatientID, Name, Gender, Tel, Status, Age, DateUnit, DOB FROM Patients
  WHERE PatientID = '${search}' OR Tel = '${search}'
  `
    const result = await sql.query(q)

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
    res.status(200).json({ total: patients.length, patients })
    await sql.close()
  } catch (error) {
    console.log(error)
    return res.status(500).send(error)
  }
})

const assignToDoctor = asyncHandler(async (req, res) => {
  const {
    PatientID,
    DoctorID,
    PatientType,
    Booked,
    AppointmentDate,
    BookingTel,
  } = req.body

  const today = moment().format('dddd')

  if (PatientID.length < 5) {
    return res.status(404).json({
      status: 404,
      message: 'Invalid Patient ID',
    })
  }

  try {
    const hospital = req.query.hospital

    await sql.connect(config(hospital))

    const patientQuery = `
      SELECT PatientID, Tel FROM Patients
      WHERE PatientID = '${PatientID}'
      `
    const doctorQuery = `
      SELECT DoctorID, Cost, UserName FROM Doctors
      WHERE DoctorID = '${DoctorID}' AND  Active = 'Yes' AND Doctor = 'Yes' AND WorkingDays LIKE '%${today}%'
      `

    const patient = await sql.query(patientQuery)

    if (patient && patient.recordset.length === 0) {
      return res
        .status(500)
        .json({ status: 500, message: 'Invalid Patient ID' })
    }

    const doctor = await sql.query(doctorQuery)

    if (doctor && doctor.recordset.length === 0) {
      return res.status(500).json({ status: 500, message: 'Invalid Doctor ID' })
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
          INSERT INTO DoctorAssignation (PatientID, DoctorID, UserName, PatientType, Cost, Date, Booked, AddedBy, DateAdded, Tel, Status, BookingTel) VALUES ('${patientId}', '${doctorId}', '${UserName}', '${PatientType}', ${Cost}, '${appDate}', Null, '${AddedBy}', '${DateAdded}', '${Tel}', '${Status}', '${BookingTel}')
          `

    await sql.query(assignQuery)

    res.status(201).json({
      status: 'Success',
      message: 'Patient Assigned to Doctor Successfully',
    })
    await sql.close()
  } catch (error) {
    console.log(error)
    return res.status(500).send(error)
  }
})

const assignNewPatientToDoctor = asyncHandler(async (req, res) => {
  const {
    Name,
    Gender,
    Age,
    DateUnit,
    DOB,
    Town,
    Address,
    Tel,
    MaritalStatus,
    City,

    DoctorID,
    PatientType,
    Booked,
    AppointmentDate,
    BookingTel,
  } = req.body

  const today = moment().format('dddd')

  try {
    const hospital = req.query.hospital

    await sql.connect(config(hospital))

    const lastRecordQuery = `
      SELECT TOP 1 PatientID FROM Patients ORDER BY SerialNo DESC
      `

    const doctorQuery = `
      SELECT * FROM Doctors
      WHERE DoctorID = '${DoctorID}' AND  Active = 'Yes' AND Doctor = 'Yes' AND WorkingDays LIKE '%${today}%'
      `
    const lastRecord = await sql.query(lastRecordQuery)

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
    const dateOfBirth = moment(DOB).format('YYYY-MM-DD')

    const newPatientQuery = `
        INSERT INTO Patients (PatientID, Name, Gender, Age, Town, Tel, MaritalStatus, City, Date, DateAdded, AddedBy, DateUnit, DOB, TempID) 
          VALUES ('${newPatientID}', '${Name}', '${Gender}', ${Age}, '${Town}', '${Tel}', '${MaritalStatus}', '${City}', '${AppointmentDate}', '${DateAdded}', '${AddedBy}', '${DateUnit}', '${dateOfBirth}', '${newTempID}')
          `

    const doctor = await sql.query(doctorQuery)

    if (doctor && doctor.recordset.length === 0) {
      return res.status(500).json({ status: 500, message: 'Invalid Doctor ID' })
    }

    await sql.query(newPatientQuery)

    const doctorId = DoctorID
    const Cost = doctor.recordset[0].Cost
    const UserName = doctor.recordset[0].UserName
    const Status = 'New'

    const assignQuery = `
          INSERT INTO DoctorAssignation (PatientID, DoctorID, UserName, PatientType, Cost, Date, Booked, AddedBy, DateAdded, Tel, Status, BookingTel) 
          VALUES ('${newPatientID}', '${doctorId}', '${UserName}', '${PatientType}', ${Cost}, '${AppointmentDate}', Null, '${AddedBy}', '${DateAdded}', '${Tel}', '${Status}', '${BookingTel}')
          `
    await sql.query(assignQuery)

    res.status(201).json({
      status: 'Success',
      message: 'Patient Assigned to Doctor Successfully',
    })
    await sql.close()
  } catch (error) {
    console.log(error)
    return res.status(500).send(error)
  }
})

export { searchPatient, assignToDoctor, assignNewPatientToDoctor }
