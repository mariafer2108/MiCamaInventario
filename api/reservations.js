const { db } = require('@vercel/postgres');

module.exports = async function handler(request, response) {
  const client = await db.connect();

  if (request.method === 'GET') {
    try {
      const { rows } = await client.sql`SELECT * FROM reservations ORDER BY fecha_reserva DESC`;
      return response.status(200).json(rows);
    } catch (error) {
      return response.status(500).json({ error: error.message });
    }
  }

  if (request.method === 'POST') {
    try {
      const { 
        inventory_id, nombre_producto, categoria, tamaño, color, 
        cantidad_reservada, valor_reserva, cliente, telefono, 
        notas, fecha_reserva, estado, precio_unitario, total_producto 
      } = request.body;

      const { rows } = await client.sql`
        INSERT INTO reservations (
          inventory_id, nombre_producto, categoria, tamaño, color, 
          cantidad_reservada, valor_reserva, cliente, telefono, 
          notas, fecha_reserva, estado, precio_unitario, total_producto
        ) VALUES (
          ${inventory_id}, ${nombre_producto}, ${categoria}, ${tamaño}, ${color}, 
          ${cantidad_reservada}, ${valor_reserva}, ${cliente}, ${telefono}, 
          ${notas}, ${fecha_reserva}, ${estado}, ${precio_unitario}, ${total_producto}
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
        UPDATE reservations SET 
          cantidad_reservada = ${data.cantidad_reservada}, 
          valor_reserva = ${data.valor_reserva}, 
          cliente = ${data.cliente}, 
          telefono = ${data.telefono}, 
          notas = ${data.notas}, 
          estado = ${data.estado},
          precio_unitario = ${data.precio_unitario},
          total_producto = ${data.total_producto}
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
      await client.sql`DELETE FROM reservations WHERE id = ${id}`;
      return response.status(200).json({ message: 'Reservation deleted' });
    } catch (error) {
      return response.status(500).json({ error: error.message });
    }
  }

  return response.status(405).json({ message: 'Method not allowed' });
};