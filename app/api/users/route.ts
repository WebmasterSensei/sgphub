import pool from '@/lib/db'

export async function GET() {
  const { rows } = await pool.query('SELECT id, name, email FROM users')
  return Response.json(rows)
}

export async function POST(request: Request) {
  const { name, email } = await request.json()
  const { rows } = await pool.query(
    'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
    [name, email]
  )
  return Response.json(rows[0], { status: 201 })
}