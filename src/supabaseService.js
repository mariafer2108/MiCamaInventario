import { supabase } from './supabaseClient';

// Obtener todos los productos del inventario
export const fetchInventory = async () => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching inventory:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchInventory:', error);
    return [];
  }
};

// Agregar un nuevo producto
export const addItem = async (item) => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .insert([{
        codigo: item.codigo,
        nombre: item.nombre,
        categoria: item.categoria,
        tamaño: item.tamaño,
        color: item.color,
        material: item.material,
        proveedor: item.proveedor,
        cantidadstock: item.cantidadstock,
        stockminimo: item.stockminimo,
        preciocompra: item.preciocompra,
        precioventa: item.precioventa,
        ubicacion: item.ubicacion,
        fechaingreso: item.fechaingreso,
        estado: item.estado,
        descripcion: item.descripcion
      }])
      .select();

    if (error) {
      console.error('Error adding item:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in addItem:', error);
    throw error;
  }
};

// Actualizar un producto existente
export const updateItem = async (id, item) => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .update({
        codigo: item.codigo,
        nombre: item.nombre,
        categoria: item.categoria,
        tamaño: item.tamaño,
        color: item.color,
        material: item.material,
        proveedor: item.proveedor,
        cantidadstock: item.cantidadstock,
        stockminimo: item.stockminimo,
        preciocompra: item.preciocompra,
        precioventa: item.precioventa,
        ubicacion: item.ubicacion,
        fechaingreso: item.fechaingreso,
        estado: item.estado,
        descripcion: item.descripcion
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating item:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateItem:', error);
    throw error;
  }
};

// Eliminar un producto
export const deleteItemFromDB = async (id) => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting item:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in deleteItemFromDB:', error);
    throw error;
  }
};
// ... existing code ...

// Procesar venta de producto
export const sellProduct = async (inventoryId, saleData) => {
  try {
    // Primero obtener el producto actual
    const { data: product, error: fetchError } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', inventoryId)
      .single();

    if (fetchError) throw fetchError;
    
    if (!product) {
      throw new Error('Producto no encontrado');
    }

    if (product.cantidadstock < saleData.cantidadVendida) {
      throw new Error('Stock insuficiente');
    }

    // Calcular nuevo stock
    const newStock = product.cantidadstock - saleData.cantidadVendida;
    const newStatus = newStock === 0 ? 'vendido' : product.estado;

    // Actualizar stock en inventory
    const { error: updateError } = await supabase
      .from('inventory')
      .update({ 
        cantidadstock: newStock,
        estado: newStatus
      })
      .eq('id', inventoryId);

    if (updateError) throw updateError;

    // Registrar la venta
    const { data: saleRecord, error: saleError } = await supabase
      .from('sales')
      .insert([{
        inventory_id: inventoryId,
        codigo: product.codigo,
        nombre: product.nombre,
        categoria: product.categoria,
        tamaño: product.tamaño,
        color: product.color,
        cantidad_vendida: saleData.cantidadVendida,
        precio_venta: saleData.precioVenta || product.precioventa,
        total_venta: (saleData.precioVenta || product.precioventa) * saleData.cantidadVendida,
        cliente: saleData.cliente || '',
        metodo_pago: saleData.metodoPago || 'efectivo',
        notas: saleData.notas || ''
      }])
      .select();

    if (saleError) throw saleError;

    return { success: true, saleRecord, newStock };
  } catch (error) {
    console.error('Error in sellProduct:', error);
    throw error;
  }
};

// Obtener historial de ventas
export const fetchSales = async () => {
  try {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('fecha_venta', { ascending: false });

    if (error) {
      console.error('Error fetching sales:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchSales:', error);
    return [];
  }
};

// Obtener ventas por rango de fechas
export const fetchSalesByDateRange = async (startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .gte('fecha_venta', startDate)
      .lte('fecha_venta', endDate)
      .order('fecha_venta', { ascending: false });

    if (error) {
      console.error('Error fetching sales by date range:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchSalesByDateRange:', error);
    return [];
  }
};
// ... existing code ...

// Eliminar una venta
export const deleteSaleFromDB = async (saleId) => {
  try {
    const { data, error } = await supabase
      .from('sales')
      .delete()
      .eq('id', saleId);

    if (error) {
      console.error('Error deleting sale:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in deleteSaleFromDB:', error);
    throw error;
  }
};