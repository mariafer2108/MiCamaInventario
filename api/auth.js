import { db } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export default async function handler(request, response) {
  const client = await db.connect();

  if (request.method === 'POST') {
    const { action, email, password } = request.body;

    // Login Action
    if (action === 'login') {
      try {
        const { rows } = await client.sql`SELECT * FROM users WHERE email = ${email}`;
        const user = rows[0];

        if (!user) {
          return response.status(401).json({ error: 'Credenciales inválidas' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return response.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        
        return response.status(200).json({ 
          token, 
          user: { id: user.id, email: user.email, role: user.role } 
        });
      } catch (error) {
        return response.status(500).json({ error: error.message });
      }
    }

    // Register initial admin (only if table is empty)
    if (action === 'setup-admin') {
      try {
        const { rows: existingUsers } = await client.sql`SELECT count(*) FROM users`;
        if (parseInt(existingUsers[0].count) > 0) {
          return response.status(400).json({ error: 'El administrador ya ha sido configurado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const { rows } = await client.sql`
          INSERT INTO users (email, password, role)
          VALUES (${email}, ${hashedPassword}, 'admin')
          RETURNING id, email, role;
        `;
        return response.status(201).json(rows[0]);
      } catch (error) {
        return response.status(500).json({ error: error.message });
      }
    }
  }

  // Check current session
  if (request.method === 'GET') {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.status(401).json({ error: 'No autorizado' });
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return response.status(200).json({ user: decoded });
    } catch (error) {
      return response.status(401).json({ error: 'Token inválido' });
    }
  }

  return response.status(405).json({ message: 'Method not allowed' });
}
