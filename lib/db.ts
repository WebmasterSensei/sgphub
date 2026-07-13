import { Pool } from 'pg'

declare global {
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined
}

const pool =
  global.pgPool ??
  new Pool({
    connectionString: 'postgresql://sgp:IfwwtNnMX7K84ZKzBzeer8vXJ0IOZss9@dpg-d9303emh2hms73d0s3ig-a.oregon-postgres.render.com/sgp_db_gep7',
    ssl: { rejectUnauthorized: false }, // Render Postgres needs SSL
    max: 10, // cap connections — important on Render's free/starter tiers
  })

// if (process.env.NODE_ENV !== 'production') global.pgPool = pool

export default pool