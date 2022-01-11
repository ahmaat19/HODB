import express from 'express'
import { getDoctors } from '../controllers/Doctor.js'

const router = express.Router()

router.route('/').get(getDoctors)

export default router
