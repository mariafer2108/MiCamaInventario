import { db } from '@vercel/postgres';

export default async function handler(request, response) {
  const client = await db.connect();

  if (request.method === 'GET') {
    try {
      const { rows } = await client.sql`SELECT * FROM sales ORDER BY fecha_venta DESC`;
      return response.status(200).json(rows);
    } catch (error) {
      return response.status(500).json({ error: error.message });
    }
  }

  if (request.method === 'POST') {
    try {
      const { 
        inventory_id, nombre, categoria, tamaño, color,
        cantidad_vendida, precio_venta, total_venta,
        metodo_pago, notas, fecha_venta
      } = request.body;

      // Start transaction for stock update
      await client.sql`BEGIN`;

      // Insert sale
      const { rows: saleRows } = await client.sql`
        INSERT INTO sales (
          inventory_id, nombre, categoria, tamaño, color,
          cantidad_vendida, precio_venta, total_venta,
          metodo_pago, notas, fecha_venta
        ) VALUES (
          ${inventory_id}, ${nombre}, ${categoria}, ${tamaño}, ${color},
          ${cantidad_vendida}, ${precio_venta}, ${total_venta},
          ${metodo_pago}, ${notas}, ${fecha_venta}
        ) RETURNING *;
      `;

      // Update inventory stock
      await client.sql`
        UPDATE inventory 
        SET cantidadstock = cantidadstock - ${cantidad_vendida},
            estado = CASE WHEN cantidadstock - ${cantidad_vendida} = 0 THEN 'vendido' ELSE estado END
        WHERE id = ${inventory_id}
      `;

      await client.sql`COMMIT`;
      return response.status(201).json(saleRows[0]);
    } catch (error) {
      await client.sql`ROLLBACK`;
      return response.status(500).json({ error: error.message });
    }
  }

  if (request.method === 'PUT') {
    try {
      const { id, ...data } = request.body;
      const { rows } = await client.sql`
        UPDATE sales SET 
          cantidad_vendida = ${data.cantidad_vendida},
          precio_venta = ${data.precio_venta},
          total_venta = ${data.total_venta},
          metodo_pago = ${data.metodo_pago}, 
          notas = ${data.notas},
          fecha_venta = ${data.fecha_venta}
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
      await client.sql`DELETE FROM sales WHERE id = ${id}`;
      return response.status(200).json({ message: 'Sale deleted' });
    } catch (error) {
      return response.status(500).json({ error: error.message });
    }
  }

  return response.status(405).json({ message: 'Method not allowed' });
}
