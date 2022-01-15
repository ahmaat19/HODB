import asyncHandler from 'express-async-handler'
import moment from 'moment'
import sql from 'mssql'
import config from '../../../../utils/dbConfig.js'

const searchPatient = asyncHandler(async (req, res) => {
  try {
    sql.connect(config, (error) => {
      if (error) {
        console.log(error)
        return res.status(500).send(error)
      }

      const search = req.query.search
      if (search.length < 5) {
        return res.status(404).json({
          status: 'Failed',
          message: 'Search must be at least 5 characters long',
        })
      }

      const request = new sql.Request()
      const query = `
      SELECT PatientID, Name, Gender, Tel, Status, Age, DateUnit, DOB FROM Patients
      WHERE PatientID = '${search}' OR Tel = '${search}'
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
          return res.status(200).json({ total: patients.length, patients })
        })
      })
    })
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

  try {
    sql.connect(config, (error) => {
      if (error) {
        console.log(error)
        return res.status(500).send(error)
      }

      if (PatientID.length < 5) {
        return res.status(404).json({
          status: 'Failed',
          message: 'Invalid Patient ID',
        })
      }

      const request = new sql.Request()
      const patientQuery = `
      SELECT PatientID, Tel FROM Patients
      WHERE PatientID = '${PatientID}'
      `
      const doctorQuery = `
      SELECT DoctorID, Cost, UserName FROM Doctors
      WHERE DoctorID = '${DoctorID}' AND  Active = 'Yes' AND Doctor = 'Yes' AND WorkingDays LIKE '%${today}%'
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
        // Search for patient
        request.query(patientQuery, (err, patient) => {
          if (err) {
            console.log(err)
            return res.status(500).json({
              status: 'Failed',
              message: err.originalError.info.message,
            })
          }
          if (patient && patient.recordset.length === 0) {
            return res
              .status(500)
              .json({ status: 'Failed', message: 'Invalid Patient ID' })
          }

          // Search for doctor
          request.query(doctorQuery, (err, doctor) => {
            if (err) {
              console.log(err)
              return res.status(500).json({
                status: 'Failed',
                message: err.originalError.info.message,
              })
            }
            if (doctor && doctor.recordset.length === 0) {
              return res
                .status(500)
                .json({ status: 'Failed', message: 'Invalid Doctor ID' })
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

            request.query(assignQuery, (err, assign) => {
              if (err) {
                console.log(err)
                return res.status(500).json({
                  status: 'Failed',
                  message: err.originalError.info.message,
                })
              }

              return res.status(201).json({
                status: 'Success',
                message: 'Patient Assigned to Doctor Successfully',
              })
            })
          })
        })
      })
    })
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
    sql.connect(config, (error) => {
      if (error) {
        console.log(error)
        return res.status(500).send(error)
      }

      const request = new sql.Request()

      // get last patient id
      const lastRecordQuery = `
      SELECT TOP 1 PatientID FROM Patients ORDER BY SerialNo DESC
      `

      // Search for doctor
      const doctorQuery = `
      SELECT * FROM Doctors
      WHERE DoctorID = '${DoctorID}' AND  Active = 'Yes' AND Doctor = 'Yes' AND WorkingDays LIKE '%${today}%'
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
        // Search for patient
        request.query(lastRecordQuery, (err, lastRecord) => {
          if (err) {
            console.log(err)
            return res.status(500).json({
              status: 'Failed',
              message: err.originalError.info.message,
            })
          }
          if (lastRecord && lastRecord.recordset.length === 0) {
            return res
              .status(500)
              .json({ status: 'Failed', message: 'Invalid Patient ID' })
          }

          const lastPatientID = lastRecord.recordset[0].PatientID.slice(1)
          const newPatientID = `T${Number(lastPatientID) + 1}`
          const newTempID = `T${Number(lastPatientID) + 1}`

          const DateAdded = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
          console.log({ DateAdded })
          const AddedBy = 'Himilo'
          const dateOfBirth = moment(DOB).format('YYYY-MM-DD')

          const newPatientQuery = `
        INSERT INTO Patients (PatientID, Name, Gender, Age, Town, Tel, MaritalStatus, City, Date, DateAdded, AddedBy, DateUnit, DOB, TempID) 
          VALUES ('${newPatientID}', '${Name}', '${Gender}', ${Age}, '${Town}', '${Tel}', '${MaritalStatus}', '${City}', '${AppointmentDate}', '${DateAdded}', '${AddedBy}', '${DateUnit}', '${dateOfBirth}', '${newTempID}')
          `

          // Search for doctor
          request.query(doctorQuery, (err, doctor) => {
            if (err) {
              console.log(err)
              return res.status(500).json({
                status: 'Failed',
                message: err.originalError.info.message,
              })
            }
            if (doctor && doctor.recordset.length === 0) {
              return res
                .status(500)
                .json({ status: 'Failed', message: 'Invalid Doctor ID' })
            }

            request.query(newPatientQuery, (err, patient) => {
              if (err) {
                console.log(err)
                return res.status(500).json({
                  status: 'Failed',
                  message: err.originalError.info.message,
                })
              }

              const patientId = newPatientID
              const doctorId = DoctorID
              const Cost = doctor.recordset[0].Cost
              const UserName = doctor.recordset[0].UserName
              const Status = 'New'

              const assignQuery = `
          INSERT INTO DoctorAssignation (PatientID, DoctorID, UserName, PatientType, Cost, Date, Booked, AddedBy, DateAdded, Tel, Status, BookingTel) 
          VALUES ('${newPatientID}', '${doctorId}', '${UserName}', '${PatientType}', ${Cost}, '${AppointmentDate}', Null, '${AddedBy}', '${DateAdded}', '${Tel}', '${Status}', '${BookingTel}')
          `
              console.log({ assignQuery })

              request.query(assignQuery, (err, assign) => {
                if (err) {
                  console.log(err)
                  return res.status(500).json({
                    status: 'Failed',
                    message: err.originalError.info.message,
                  })
                }

                return res.status(201).json({
                  status: 'Success',
                  message: 'Patient Assigned to Doctor Successfully',
                })
              })
            })
          })
        })
      })
    })
  } catch (error) {
    console.log(error)
    return res.status(500).send(error)
  }
})

export { searchPatient, assignToDoctor, assignNewPatientToDoctor }
