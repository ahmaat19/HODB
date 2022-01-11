import express from 'express'
import { searchPatient } from '../controllers/Patient.js'

const router = express.Router()

router.route('/').get(searchPatient)

export default router
