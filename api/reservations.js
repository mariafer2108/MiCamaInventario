const { sql } = require('@vercel/postgres');

module.exports = async function handler(request, response) {
  if (request.method === 'GET') {
    try {
      const { rows } = await sql`SELECT * FROM reservations ORDER BY fecha_reserva DESC`;
      return response.status(200).json(rows);
    } catch (error) {
      console.error('Error in GET reservations:', error);
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

      // Ensure numeric values
      const finalInventoryId = inventory_id ? parseInt(inventory_id) : null;
      const finalCantidad = parseInt(cantidad_reservada) || 0;
      const finalValor = parseInt(valor_reserva) || 0;
      const finalPrecioUnitario = parseInt(precio_unitario) || 0;
      const finalTotal = parseInt(total_producto) || (finalCantidad * finalPrecioUnitario);
      const finalFecha = fecha_reserva || new Date().toISOString();

      const { rows } = await sql`
        INSERT INTO reservations (
          inventory_id, nombre_producto, categoria, tamaño, color, 
          cantidad_reservada, valor_reserva, cliente, telefono, 
          notas, fecha_reserva, estado, precio_unitario, total_producto
        ) VALUES (
          ${finalInventoryId}, ${nombre_producto}, ${categoria}, ${tamaño}, ${color}, 
          ${finalCantidad}, ${finalValor}, ${cliente}, ${telefono}, 
          ${notas || ''}, ${finalFecha}, ${estado || 'activa'}, ${finalPrecioUnitario}, ${finalTotal}
        ) RETURNING *;
      `;
      return response.status(201).json(rows[0]);
    } catch (error) {
      console.error('Error in POST reservations:', error);
      return response.status(500).json({ error: error.message });
    }
  }

  if (request.method === 'PUT') {
    try {
      const { id, ...data } = request.body;
      const finalCantidad = parseInt(data.cantidad_reservada) || 0;
      const finalValor = parseInt(data.valor_reserva) || 0;
      const finalPrecioUnitario = parseInt(data.precio_unitario) || 0;
      const finalTotal = parseInt(data.total_producto) || (finalCantidad * finalPrecioUnitario);

      const { rows } = await sql`
        UPDATE reservations SET 
          cantidad_reservada = ${finalCantidad}, 
          valor_reserva = ${finalValor}, 
          cliente = ${data.cliente}, 
          telefono = ${data.telefono}, 
          notas = ${data.notas || ''}, 
          estado = ${data.estado || 'activa'},
          precio_unitario = ${finalPrecioUnitario},
          total_producto = ${finalTotal}
        WHERE id = ${id}
        RETURNING *;
      `;
      return response.status(200).json(rows[0]);
    } catch (error) {
      console.error('Error in PUT reservations:', error);
      return response.status(500).json({ error: error.message });
    }
  }

  if (request.method === 'DELETE') {
    try {
      const { id } = request.query;
      await sql`DELETE FROM reservations WHERE id = ${id}`;
      return response.status(200).json({ message: 'Reservation deleted' });
    } catch (error) {
      console.error('Error in DELETE reservations:', error);
      return response.status(500).json({ error: error.message });
    }
  }

  return response.status(405).json({ message: 'Method not allowed' });
};