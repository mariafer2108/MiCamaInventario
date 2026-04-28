const { sql } = require('@vercel/postgres');

module.exports = async function handler(request, response) {
  if (request.method === 'GET') {
    try {
      const { rows } = await sql`SELECT * FROM sales ORDER BY fecha_venta DESC`;
      return response.status(200).json(rows);
    } catch (error) {
      console.error('Error in GET sales:', error);
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

      // Ensure numeric values are integers
      const finalInventoryId = parseInt(inventory_id);
      const finalCantidad = parseInt(cantidad_vendida) || 0;
      const finalPrecio = parseInt(precio_venta) || 0;
      const finalTotal = parseInt(total_venta) || (finalCantidad * finalPrecio);
      const finalFecha = fecha_venta || new Date().toISOString();

      // Transaction to update stock and record sale
      // Note: @vercel/postgres 'sql' tag doesn't support multiple statements in one call easily for transactions
      // We should use a client for transactions
      const { db } = require('@vercel/postgres');
      const client = await db.connect();
      
      try {
        await client.sql`BEGIN`;
        
        // Update stock
        await client.sql`
          UPDATE inventory 
          SET cantidadstock = cantidadstock - ${finalCantidad}
          WHERE id = ${finalInventoryId}
        `;

        // Insert sale record
        const { rows } = await client.sql`
          INSERT INTO sales (
            inventory_id, nombre, categoria, tamaño, color, 
            cantidad_vendida, precio_venta, total_venta, 
            metodo_pago, notas, fecha_venta
          ) VALUES (
            ${finalInventoryId}, ${nombre}, ${categoria}, ${tamaño}, ${color}, 
            ${finalCantidad}, ${finalPrecio}, ${finalTotal}, 
            ${metodo_pago}, ${notas || ''}, ${finalFecha}
          ) RETURNING *;
        `;

        await client.sql`COMMIT`;
        return response.status(201).json(rows[0]);
      } catch (transactionError) {
        await client.sql`ROLLBACK`;
        throw transactionError;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error in POST sales:', error);
      return response.status(500).json({ error: error.message });
    }
  }

  if (request.method === 'PUT') {
    try {
      const { id, ...data } = request.body;
      const finalCantidad = parseInt(data.cantidad_vendida) || 0;
      const finalPrecio = parseInt(data.precio_venta) || 0;
      const finalTotal = parseInt(data.total_venta) || (finalCantidad * finalPrecio);

      const { rows } = await sql`
        UPDATE sales SET 
          cantidad_vendida = ${finalCantidad}, 
          precio_venta = ${finalPrecio}, 
          total_venta = ${finalTotal}, 
          metodo_pago = ${data.metodo_pago}, 
          notas = ${data.notas || ''}, 
          fecha_venta = ${data.fecha_venta || new Date().toISOString()}
        WHERE id = ${id}
        RETURNING *;
      `;
      return response.status(200).json(rows[0]);
    } catch (error) {
      console.error('Error in PUT sales:', error);
      return response.status(500).json({ error: error.message });
    }
  }

  if (request.method === 'DELETE') {
    try {
      const { id } = request.query;
      await sql`DELETE FROM sales WHERE id = ${id}`;
      return response.status(200).json({ message: 'Sale deleted' });
    } catch (error) {
      console.error('Error in DELETE sales:', error);
      return response.status(500).json({ error: error.message });
    }
  }

  return response.status(405).json({ message: 'Method not allowed' });
};