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