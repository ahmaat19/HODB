import express from 'express'
import dotenv from 'dotenv'
import colors from 'colors'
import cors from 'cors'
import morgan from 'morgan'
import { errorHandler, notFound } from './api/v1/test/middlewares/errors.js'

import Town from './api/v1/test/routes/Town.js'
import Doctor from './api/v1/test/routes/Doctor.js'
import Patient from './api/v1/test/routes/Patient.js'
import Dealer from './api/v1/test/routes/Dealer.js'
import { authPool, internetCheckPool } from './api/v1/test/middlewares/auth.js'

dotenv.config()

const app = express()
app.use(express.json())

app.use(
  cors({
    origin: '*',
  })
)

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

app.use(function (req, res, next) {
  res.setTimeout(60000, function () {
    console.log('Request has timed out.')
    res.status(408).json({ status: 408, message: 'Request has timed out.' })
  })

  next()
})

app.use('/api/v1/dealers', Dealer)

// app.use(authPool)
app.use(internetCheckPool)

app.get('/', async (req, res) => {
  res.send('API is running')
})

app.use('/api/v1/test/towns', Town)
app.use('/api/v1/test/doctors', Doctor)
app.use('/api/v1/test/patients', Patient)

app.use(notFound)

app.use(errorHandler)

const PORT = process.env.PORT || 5000

app.listen(
  PORT,
  console.log(
    `Server running ${process.env.NODE_ENV} mode on post ${PORT}`.yellow.bold
  )
)
