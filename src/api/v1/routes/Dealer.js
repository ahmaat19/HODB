import express from 'express'
import { getDealers, getDealer } from '../controllers/Dealer.js'

const router = express.Router()

router.route('/').get(getDealers)
router.route('/:id').get(getDealer)

export default router
