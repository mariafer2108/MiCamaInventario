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

// --- AUTHENTICATION ---
export const signIn = async (email, password) => {
  const res = await fetch(`${API_BASE}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', email, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Error al iniciar sesión');
  }
  const data = await res.json();
  localStorage.setItem('auth_token', data.token);
  localStorage.setItem('user_data', JSON.stringify(data.user));
  return data.user;
};

export const signInAnonymously = async () => {
  // Mock anonymous login for Vercel
  const guestUser = { id: 'guest-' + Date.now(), email: 'invitado@micama.com', isGuest: true };
  localStorage.setItem('guest_user', JSON.stringify(guestUser));
  return guestUser;
};

export const signOut = async () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
  localStorage.removeItem('guest_user');
  localStorage.removeItem('micama_guest_user');
  return true;
};

export const getCurrentUser = async () => {
  const token = localStorage.getItem('auth_token');
  const guestRaw = localStorage.getItem('guest_user') || localStorage.getItem('micama_guest_user');
  
  if (guestRaw) return JSON.parse(guestRaw);
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/auth`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      return null;
    }
    const data = await res.json();
    return data.user;
  } catch (error) {
    return null;
  }
};

// Function to setup initial admin (utility)
export const setupAdmin = async (email, password) => {
  const res = await fetch(`${API_BASE}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'setup-admin', email, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Error al configurar admin');
  }
  return res.json();
};
