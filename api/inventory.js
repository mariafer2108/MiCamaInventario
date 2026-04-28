const { sql } = require('@vercel/postgres');

module.exports = async function handler(request, response) {
  if (request.method === 'GET') {
    try {
      const { rows } = await sql`SELECT * FROM inventory ORDER BY created_at DESC`;
      return response.status(200).json(rows);
    } catch (error) {
      console.error('Error in GET inventory:', error);
      return response.status(500).json({ error: error.message });
    }
  }

  if (request.method === 'POST') {
    try {
      const { 
        nombre, categoria, tamaño, color, 
        cantidadstock, stockminimo, precioventa, 
        fechaingreso, estado, descripcion, notas 
      } = request.body;

      // Map 'notas' to 'descripcion' if provided
      const finalDescripcion = descripcion || notas || '';
      
      // Ensure numeric values are integers and handle empty strings
      const finalStock = parseInt(cantidadstock) || 0;
      const finalMinimo = parseInt(stockminimo) || 0;
      const finalPrecio = parseInt(precioventa) || 0;
      
      // Handle date
      const finalFecha = (fechaingreso && fechaingreso !== '') ? fechaingreso : new Date().toISOString().split('T')[0];

      const { rows } = await sql`
        INSERT INTO inventory (
          nombre, categoria, tamaño, color, 
          cantidadstock, stockminimo, precioventa, 
          fechaingreso, estado, descripcion
        ) VALUES (
          ${nombre}, ${categoria}, ${tamaño}, ${color}, 
          ${finalStock}, ${finalMinimo}, ${finalPrecio}, 
          ${finalFecha}, ${estado || 'disponible'}, ${finalDescripcion}
        ) RETURNING *;
      `;
      return response.status(201).json(rows[0]);
    } catch (error) {
      console.error('Error in POST inventory:', error);
      return response.status(500).json({ error: error.message });
    }
  }

  if (request.method === 'PUT') {
    try {
      const { id, ...data } = request.body;
      
      const finalDescripcion = data.descripcion || data.notas || '';
      const finalStock = parseInt(data.cantidadstock) || 0;
      const finalMinimo = parseInt(data.stockminimo) || 0;
      const finalPrecio = parseInt(data.precioventa) || 0;
      const finalFecha = (data.fechaingreso && data.fechaingreso !== '') ? data.fechaingreso : new Date().toISOString().split('T')[0];

      const { rows } = await sql`
        UPDATE inventory SET 
          nombre = ${data.nombre}, 
          categoria = ${data.categoria}, 
          tamaño = ${data.tamaño}, 
          color = ${data.color}, 
          cantidadstock = ${finalStock}, 
          stockminimo = ${finalMinimo}, 
          precioventa = ${finalPrecio}, 
          fechaingreso = ${finalFecha}, 
          estado = ${data.estado || 'disponible'}, 
          descripcion = ${finalDescripcion}
        WHERE id = ${id}
        RETURNING *;
      `;
      return response.status(200).json(rows[0]);
    } catch (error) {
      console.error('Error in PUT inventory:', error);
      return response.status(500).json({ error: error.message });
    }
  }

  if (request.method === 'DELETE') {
    try {
      const { id } = request.query;
      await sql`DELETE FROM inventory WHERE id = ${id}`;
      return response.status(200).json({ message: 'Item deleted' });
    } catch (error) {
      console.error('Error in DELETE inventory:', error);
      return response.status(500).json({ error: error.message });
    }
  }

  return response.status(405).json({ message: 'Method not allowed' });
};