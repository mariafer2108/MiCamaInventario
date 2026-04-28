import { db } from '@vercel/postgres';

export default async function handler(request, response) {
  const client = await db.connect();

  if (request.method === 'GET') {
    try {
      const { rows } = await client.sql`SELECT * FROM inventory ORDER BY created_at DESC`;
      return response.status(200).json(rows);
    } catch (error) {
      return response.status(500).json({ error: error.message });
    }
  }

  if (request.method === 'POST') {
    try {
      const { 
        nombre, categoria, tamaño, color, 
        cantidadstock, stockminimo, precioventa, 
        fechaingreso, estado, descripcion 
      } = request.body;

      const { rows } = await client.sql`
        INSERT INTO inventory (
          nombre, categoria, tamaño, color, 
          cantidadstock, stockminimo, precioventa, 
          fechaingreso, estado, descripcion
        ) VALUES (
          ${nombre}, ${categoria}, ${tamaño}, ${color}, 
          ${cantidadstock}, ${stockminimo}, ${precioventa}, 
          ${fechaingreso}, ${estado}, ${descripcion}
        ) RETURNING *;
      `;
      return response.status(201).json(rows[0]);
    } catch (error) {
      return response.status(500).json({ error: error.message });
    }
  }

  if (request.method === 'PUT') {
    try {
      const { id, ...data } = request.body;
      const { rows } = await client.sql`
        UPDATE inventory SET 
          nombre = ${data.nombre}, 
          categoria = ${data.categoria}, 
          tamaño = ${data.tamaño}, 
          color = ${data.color}, 
          cantidadstock = ${data.cantidadstock}, 
          stockminimo = ${data.stockminimo}, 
          precioventa = ${data.precioventa}, 
          fechaingreso = ${data.fechaingreso}, 
          estado = ${data.estado}, 
          descripcion = ${data.descripcion}
        WHERE id = ${id}
        RETURNING *;
      `;
      return response.status(200).json(rows[0]);
    } catch (error) {
      return response.status(500).json({ error: error.message });
    }
  }

  if (request.method === 'DELETE') {
    try {
      const { id } = request.query;
      await client.sql`DELETE FROM inventory WHERE id = ${id}`;
      return response.status(200).json({ message: 'Item deleted' });
    } catch (error) {
      return response.status(500).json({ error: error.message });
    }
  }

  return response.status(405).json({ message: 'Method not allowed' });
}
