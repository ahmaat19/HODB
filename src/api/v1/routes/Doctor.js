import express from 'express'
import { getDoctors, searchDoctor } from '../controllers/Doctor.js'

const router = express.Router()

router.route('/').get(getDoctors)
router.route('/search').get(searchDoctor)

export default router
