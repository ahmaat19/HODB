import express from 'express'
import {
  searchPatient,
  assignToDoctor,
  assignNewPatientToDoctor,
} from '../controllers/Patient.js'

const router = express.Router()

router.route('/search').get(searchPatient)
router.route('/new').post(assignNewPatientToDoctor)
router.route('/existing').post(assignToDoctor)

export default router
