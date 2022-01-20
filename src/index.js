import express from 'express'
import dotenv from 'dotenv'
import colors from 'colors'
import cors from 'cors'
import morgan from 'morgan'
import { errorHandler, notFound } from './api/v1/middlewares/errors.js'

import Town from './api/v1/routes/Town.js'
import Doctor from './api/v1/routes/Doctor.js'
import Patient from './api/v1/routes/Patient.js'
import { auth, internetCheck } from './api/v1/middlewares/auth.js'

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

app.use(auth)
app.use(internetCheck)

app.get('/', async (req, res) => {
  res.send('API is running')
})

app.use('/api/v1/towns', Town)
app.use('/api/v1/doctors', Doctor)
app.use('/api/v1/patients', Patient)

app.use(notFound)

app.use(errorHandler)

const PORT = process.env.PORT || 5000

app.listen(
  PORT,
  console.log(
    `Server running ${process.env.NODE_ENV} mode on post ${PORT}`.yellow.bold
  )
)
