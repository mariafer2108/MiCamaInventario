// Service to interact with Vercel Serverless Functions (Postgres)

const API_BASE = '/api';

export const fetchInventory = async () => {
  const res = await fetch(`${API_BASE}/inventory`);
  if (!res.ok) throw new Error('Error fetching inventory');
  return res.json();
};

export const addItem = async (item) => {
  const res = await fetch(`${API_BASE}/inventory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Error adding item');
  return res.json();
};

export const updateItem = async (id, item) => {
  const res = await fetch(`${API_BASE}/inventory`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...item }),
  });
  if (!res.ok) throw new Error('Error updating item');
  return res.json();
};

export const deleteItemFromDB = async (id) => {
  const res = await fetch(`${API_BASE}/inventory?id=${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error deleting item');
  return res.json();
};

export const fetchSales = async () => {
  const res = await fetch(`${API_BASE}/sales`);
  if (!res.ok) throw new Error('Error fetching sales');
  return res.json();
};

export const sellProductWithTransfer = async (inventoryId, saleData) => {
  // Simple implementation for now, mirroring the Supabase logic
  // In a real migration, we might want to handle transferFromWarehouse in the API
  const res = await fetch(`${API_BASE}/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inventory_id: inventoryId,
      ...saleData,
      // Map frontend fields to DB fields if necessary
      cantidad_vendida: saleData.cantidadVendida,
      precio_venta: saleData.precioVenta,
      total_venta: saleData.precioVenta * saleData.cantidadVendida,
      metodo_pago: saleData.metodoPago,
      fecha_venta: new Date().toISOString(),
    }),
  });
  if (!res.ok) throw new Error('Error processing sale');
  const saleRecord = await res.json();
  return { success: true, saleRecord };
};

export const updateSale = async (id, saleData) => {
  const updateData = {
    id,
    cantidad_vendida: saleData.cantidadVendida,
    precio_venta: saleData.precioVenta,
    total_venta: saleData.precioVenta * saleData.cantidadVendida,
    metodo_pago: saleData.metodoPago,
    notas: saleData.notas || '',
    fecha_venta: saleData.fechaVenta ? saleData.fechaVenta + 'T12:00:00.000Z' : new Date().toISOString()
  };

  const res = await fetch(`${API_BASE}/sales`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
  });
  if (!res.ok) throw new Error('Error updating sale');
  return res.json();
};

export const deleteSaleFromDB = async (id) => {
  const res = await fetch(`${API_BASE}/sales?id=${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error deleting sale');
  return res.json();
};

// --- RESERVATIONS ---
export const fetchReservations = async () => {
  const res = await fetch(`${API_BASE}/reservations`);
  if (!res.ok) throw new Error('Error fetching reservations');
  return res.json();
};

export const addReservation = async (reservationData) => {
  const res = await fetch(`${API_BASE}/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reservationData),
  });
  if (!res.ok) throw new Error('Error adding reservation');
  return res.json();
};

export const updateReservation = async (id, reservationData) => {
  const res = await fetch(`${API_BASE}/reservations`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...reservationData }),
  });
  if (!res.ok) throw new Error('Error updating reservation');
  return res.json();
};

export const deleteReservationFromDB = async (id) => {
  const res = await fetch(`${API_BASE}/reservations?id=${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error deleting reservation');
  return res.json();
};

// Placeholder for Auth (since Vercel Postgres doesn't provide it)
// We keep using Supabase Auth or implement a simple mock/guest logic
export const getCurrentUser = async () => {
  // For now, return what's in localStorage or null
  const savedUser = localStorage.getItem('guest_user');
  return savedUser ? JSON.parse(savedUser) : null;
};
