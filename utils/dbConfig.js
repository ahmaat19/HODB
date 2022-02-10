import dotenv from 'dotenv'

dotenv.config()

export default function config(hospital) {
  switch (hospital) {
    case 'test':
      return {
        user: process.env.TEST_DB_USER,
        password: process.env.TEST_DB_PASSWORD,
        server: process.env.TEST_DB_SERVER,
        database: process.env.TEST_DB_NAME,
        port: Number(process.env.GLOBAL_DB_PORT),
        options: {
          encrypt: false,
          trustServerCertificate: true,
        },
      }
    case 'aah':
      return {
        user: process.env.AAH_DB_USER,
        password: process.env.AAH_DB_PASSWORD,
        server: process.env.AAH_DB_SERVER,
        database: process.env.AAH_DB_NAME,
        port: Number(process.env.GLOBAL_DB_PORT),
        options: {
          encrypt: false,
          trustServerCertificate: true,
        },
      }
    case 'gacal':
      return {
        user: process.env.GACAL_DB_USER,
        password: process.env.GACAL_DB_PASSWORD,
        server: process.env.GACAL_DB_SERVER,
        database: process.env.GACAL_DB_NAME,
        port: Number(process.env.GLOBAL_DB_PORT),
        options: {
          encrypt: false,
          trustServerCertificate: true,
        },
      }
    case 'ladnaan':
      return {
        user: process.env.LADNAAN_DB_USER,
        password: process.env.LADNAAN_DB_PASSWORD,
        server: process.env.LADNAAN_DB_SERVER,
        database: process.env.LADNAAN_DB_NAME,
        port: Number(process.env.GLOBAL_DB_PORT),
        options: {
          encrypt: true,
          trustServerCertificate: true,
        },
      }

    case 'durdur':
      return {
        user: process.env.DURDUR_DB_USER,
        password: process.env.DURDUR_DB_PASSWORD,
        server: process.env.DURDUR_DB_SERVER,
        database: process.env.DURDUR_DB_NAME,
        port: Number(process.env.GLOBAL_DB_PORT),
        options: {
          encrypt: true,
          trustServerCertificate: true,
        },
      }
    case 'redsea':
      return {
        user: process.env.REDSEA_DB_USER,
        password: process.env.REDSEA_DB_PASSWORD,
        server: process.env.REDSEA_DB_SERVER,
        database: process.env.REDSEA_DB_NAME,
        port: Number(process.env.GLOBAL_DB_PORT),
        options: {
          encrypt: true,
          trustServerCertificate: true,
        },
      }

    default:
      return {
        user: process.env.TEST_DB_USER,
        password: process.env.TEST_DB_PASSWORD,
        server: process.env.TEST_DB_SERVER,
        database: 'invalid',
        port: Number(process.env.GLOBAL_DB_PORT),
        options: {
          encrypt: false,
        },
      }
  }
}
