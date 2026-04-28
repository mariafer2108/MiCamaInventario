const { db } = require('@vercel/postgres');

module.exports = async function handler(request, response) {
  try {
    const client = await db.connect();

    // Create Inventory table
    await client.sql`
      CREATE TABLE IF NOT EXISTS inventory (
        id SERIAL PRIMARY KEY,
        nombre TEXT NOT NULL,
        categoria TEXT,
        tamaño TEXT,
        color TEXT,
        cantidadstock INTEGER DEFAULT 0,
        stockminimo INTEGER DEFAULT 0,
        precioventa INTEGER DEFAULT 0,
        fechaingreso DATE,
        estado TEXT DEFAULT 'disponible',
        descripcion TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create Sales table
    await client.sql`
      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        inventory_id INTEGER REFERENCES inventory(id),
        nombre TEXT,
        categoria TEXT,
        tamaño TEXT,
        color TEXT,
        cantidad_vendida INTEGER NOT NULL,
        precio_venta INTEGER NOT NULL,
        total_venta INTEGER NOT NULL,
        metodo_pago TEXT,
        notas TEXT,
        fecha_venta TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create Reservations table
    await client.sql`
      CREATE TABLE IF NOT EXISTS reservations (
        id SERIAL PRIMARY KEY,
        inventory_id INTEGER REFERENCES inventory(id),
        nombre_producto TEXT,
        categoria TEXT,
        tamaño TEXT,
        color TEXT,
        cantidad_reservada INTEGER NOT NULL,
        valor_reserva INTEGER NOT NULL,
        cliente TEXT NOT NULL,
        telefono TEXT,
        notas TEXT,
        fecha_reserva TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        estado TEXT DEFAULT 'activa',
        precio_unitario INTEGER,
        total_producto INTEGER
      );
    `;

    // Create Users table for custom Auth
    await client.sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    return response.status(200).json({ message: 'Database tables created successfully' });
  } catch (error) {
    console.error('Database setup error:', error);
    return response.status(500).json({ error: error.message });
  }
};