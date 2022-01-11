import express from 'express'
import { getTowns } from '../controllers/Town.js'

const router = express.Router()

router.route('/').get(getTowns)

export default router
