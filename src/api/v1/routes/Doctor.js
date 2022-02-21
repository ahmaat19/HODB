import express from 'express'
import {
  getDoctors,
  searchSpecializationsFromAllDoctors,
  searchDoctor,
} from '../controllers/Doctor.js'

const router = express.Router()

router.route('/').get(getDoctors)
router.route('/search').get(searchDoctor)
router.route('/specialization/search').get(searchSpecializationsFromAllDoctors)

export default router
