// Service to interact with Vercel Serverless Functions (Postgres)

const getApiUrl = (endpoint) => {
  // Use relative path for production, which works fine in Vercel.
  return `/api/${endpoint.startsWith('/') ? endpoint.slice(1) : endpoint}`;
};

const safeStorage = {
  getItem: (key) => {
    try {
      return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    } catch (e) {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      if (typeof window !== 'undefined') localStorage.setItem(key, value);
    } catch (e) {
      console.warn('Storage error:', e);
    }
  },
  removeItem: (key) => {
    try {
      if (typeof window !== 'undefined') localStorage.removeItem(key);
    } catch (e) {
    }
  }
};

export const fetchInventory = async () => {
  const res = await fetch(getApiUrl('inventory'));
  if (!res.ok) throw new Error('Error fetching inventory');
  return res.json();
};

export const addItem = async (item) => {
  const res = await fetch(getApiUrl('inventory'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error adding item');
  }
  return res.json();
};

export const updateItem = async (id, item) => {
  const res = await fetch(getApiUrl('inventory'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...item }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error updating item');
  }
  return res.json();
};

export const deleteItemFromDB = async (id) => {
  const res = await fetch(getApiUrl(`inventory?id=${id}`), {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error deleting item');
  return res.json();
};

export const fetchSales = async () => {
  const res = await fetch(getApiUrl('sales'));
  if (!res.ok) throw new Error('Error fetching sales');
  return res.json();
};

export const sellProductWithTransfer = async (inventoryId, saleData) => {
  const res = await fetch(getApiUrl('sales'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inventory_id: inventoryId,
      ...saleData,
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
    fecha_venta: saleData.fechaVenta ? (saleData.fechaVenta.includes('T') ? saleData.fechaVenta : saleData.fechaVenta + 'T12:00:00.000Z') : new Date().toISOString()
  };

  const res = await fetch(getApiUrl('sales'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
  });
  if (!res.ok) throw new Error('Error updating sale');
  return res.json();
};

export const deleteSaleFromDB = async (id) => {
  const res = await fetch(getApiUrl(`sales?id=${id}`), {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error deleting sale');
  return res.json();
};

// --- RESERVATIONS ---
export const fetchReservations = async () => {
  const res = await fetch(getApiUrl('reservations'));
  if (!res.ok) throw new Error('Error fetching reservations');
  return res.json();
};

export const addReservation = async (reservationData) => {
  const res = await fetch(getApiUrl('reservations'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reservationData),
  });
  if (!res.ok) throw new Error('Error adding reservation');
  return res.json();
};

export const updateReservation = async (id, reservationData) => {
  const res = await fetch(getApiUrl('reservations'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...reservationData }),
  });
  if (!res.ok) throw new Error('Error updating reservation');
  return res.json();
};

export const deleteReservationFromDB = async (id) => {
  const res = await fetch(getApiUrl(`reservations?id=${id}`), {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error deleting reservation');
  return res.json();
};

// --- AUTHENTICATION ---
export const signIn = async (email, password) => {
  const res = await fetch(getApiUrl('auth'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', email, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Error al iniciar sesión');
  }
  const data = await res.json();
  safeStorage.setItem('auth_token', data.token);
  safeStorage.setItem('user_data', JSON.stringify(data.user));
  return data.user;
};

export const signInAnonymously = async () => {
  const guestUser = { id: 'guest-' + Date.now(), email: 'invitado@micama.com', isGuest: true };
  safeStorage.setItem('micama_guest_user', JSON.stringify(guestUser));
  return guestUser;
};

export const signOut = async () => {
  safeStorage.removeItem('auth_token');
  safeStorage.removeItem('user_data');
  safeStorage.removeItem('micama_guest_user');
  safeStorage.removeItem('guest_user');
  return true;
};

export const getCurrentUser = async () => {
  const token = safeStorage.getItem('auth_token');
  const guestRaw = safeStorage.getItem('micama_guest_user') || safeStorage.getItem('guest_user');
  
  if (guestRaw) {
    try {
      return JSON.parse(guestRaw);
    } catch (e) {
      safeStorage.removeItem('micama_guest_user');
      safeStorage.removeItem('guest_user');
    }
  }
  if (!token) return null;

  try {
    const res = await fetch(getApiUrl('auth'), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) {
      safeStorage.removeItem('auth_token');
      safeStorage.removeItem('user_data');
      return null;
    }
    const data = await res.json();
    return data.user;
  } catch (error) {
    return null;
  }
};

export const setupAdmin = async (email, password) => {
  const res = await fetch(getApiUrl('auth'), {
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