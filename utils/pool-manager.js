import pkg from 'mssql'
const { ConnectionPool } = pkg

const pools = new Map()

export function get(name, config) {
  if (!pools.has(name)) {
    if (!config) {
      throw new Error('Pool does not exist')
    }
    const pool = new ConnectionPool(config)
    // automatically remove the pool from the cache if `pool.close()` is called
    const close = pool.close.bind(pool)
    pool.close = (...args) => {
      pools.delete(name)
      return close(...args)
    }
    pools.set(name, pool.connect())
  }
  return pools.get(name)
}
export function closeAll() {
  return Promise.all(
    Array.from(pools.values()).map((connect) => {
      return connect.then((pool) => pool.close())
    })
  )
}
