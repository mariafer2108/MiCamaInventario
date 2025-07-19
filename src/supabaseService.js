import { supabase } from './supabaseClient';

// Obtener todos los productos del inventario
// Mejorar fetchInventory
export const fetchInventory = async () => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching inventory:', error);
      throw new Error(`Error al obtener inventario: ${error.message}`);
    }

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error in fetchInventory:', error);
    throw error;
  }
};

// Mejorar fetchSales
export const fetchSales = async () => {
  try {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('fecha_venta', { ascending: false });

    if (error) {
      console.error('Error fetching sales:', error);
      throw new Error(`Error al obtener ventas: ${error.message}`);
    }

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error in fetchSales:', error);
    throw error;
  }
};

// Agregar un nuevo producto
export const addItem = async (item) => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .insert([{
        nombre: item.nombre,
        categoria: item.categoria,
        tamaño: item.tamaño,
        color: item.color,
        proveedor: item.proveedor,
        cantidadstock: item.cantidadstock,
        stockminimo: item.stockminimo,
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
        nombre: item.nombre,
        categoria: item.categoria,
        tamaño: item.tamaño,
        color: item.color,
        proveedor: item.proveedor,
        cantidadstock: item.cantidadstock,
        stockminimo: item.stockminimo,
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

    console.log('📊 Nuevo stock calculado:', { newStock, newStatus });

    // Actualizar stock en inventory
    const { error: updateError } = await supabase
      .from('inventory')
      .update({ 
        cantidadstock: newStock,
        estado: newStatus
      })
      .eq('id', inventoryId);

    if (updateError) throw updateError;

    console.log('✅ Stock actualizado correctamente');

    // Registrar la venta
    const { data: saleRecord, error: saleError } = await supabase
      .from('sales')
      .insert([{
        inventory_id: inventoryId,
        nombre: product.nombre,
        categoria: product.categoria,
        tamaño: product.tamaño,
        color: product.color,
        cantidad_vendida: saleData.cantidadVendida,
        precio_venta: saleData.precioVenta || product.precioventa,
        total_venta: (saleData.precioVenta || product.precioventa) * saleData.cantidadVendida,
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

// Función para transferir producto de bodega a local
export const transferFromWarehouse = async (productName, categoria, tamaño, color, cantidadNecesaria) => {
  try {
    console.log('🔍 Buscando en bodega:', { productName, categoria, tamaño, color, cantidadNecesaria });
    
    // BÚSQUEDA MÁS FLEXIBLE: Primero buscar por nombre y categoría
    let { data: warehouseProducts, error: searchError } = await supabase
      .from('inventory')
      .select('*')
      .ilike('nombre', `%${productName.trim()}%`)
      .eq('categoria', categoria)
      .ilike('ubicacion', '%bodega%')
      .gt('cantidadstock', 0)
      .order('cantidadstock', { ascending: false }); // Ordenar por mayor stock

    if (searchError) throw searchError;

    console.log('🏪 Productos encontrados en bodega (búsqueda flexible):', warehouseProducts);

    // Si no encuentra nada, intentar búsqueda exacta
    if (!warehouseProducts || warehouseProducts.length === 0) {
      const { data: exactProducts, error: exactError } = await supabase
        .from('inventory')
        .select('*')
        .eq('nombre', productName)
        .eq('categoria', categoria)
        .eq('tamaño', tamaño)
        .eq('color', color)
        .ilike('ubicacion', '%bodega%')
        .gt('cantidadstock', 0)
        .limit(1);

      if (exactError) throw exactError;
      warehouseProducts = exactProducts;
      console.log('🏪 Productos encontrados en bodega (búsqueda exacta):', warehouseProducts);
    }

    // Si aún no encuentra nada, buscar solo por categoría
    if (!warehouseProducts || warehouseProducts.length === 0) {
      const { data: categoryProducts, error: categoryError } = await supabase
        .from('inventory')
        .select('*')
        .eq('categoria', categoria)
        .ilike('ubicacion', '%bodega%')
        .gt('cantidadstock', 0)
        .order('cantidadstock', { ascending: false })
        .limit(1);

      if (categoryError) throw categoryError;
      warehouseProducts = categoryProducts;
      console.log('🏪 Productos encontrados en bodega (por categoría):', warehouseProducts);
    }

    if (!warehouseProducts || warehouseProducts.length === 0) {
      return { 
        success: false, 
        message: `⚠️ No hay stock disponible en bodega para categoría: ${categoria}`,
        bodegaAgotada: true
      };
    }

    const warehouseProduct = warehouseProducts[0];
    console.log('📦 Producto seleccionado de bodega:', warehouseProduct);

    // CAMBIO: Transferir todo lo disponible en bodega, aunque no cubra la cantidad necesaria
    const cantidadATransferir = Math.min(warehouseProduct.cantidadstock, cantidadNecesaria);
    const stockInsuficiente = warehouseProduct.cantidadstock < cantidadNecesaria;
    
    console.log('📊 Análisis de transferencia:', {
      stockBodega: warehouseProduct.cantidadstock,
      cantidadNecesaria,
      cantidadATransferir,
      stockInsuficiente
    });

    // Buscar producto en local (también más flexible)
    const { data: localProducts, error: localSearchError } = await supabase
      .from('inventory')
      .select('*')
      .ilike('nombre', `%${productName.trim()}%`)
      .eq('categoria', categoria)
      .ilike('ubicacion', '%local%')
      .limit(1);

    if (localSearchError) throw localSearchError;

    console.log('🏪 Productos encontrados en local:', localProducts);

    if (!localProducts || localProducts.length === 0) {
      return { 
        success: false, 
        message: `⚠️ No se encontró el producto en local para transferir` 
      };
    }

    const localProduct = localProducts[0];
    console.log('📦 Producto seleccionado de local:', localProduct);

    // Reducir stock en bodega (transferir todo lo disponible)
    const newWarehouseStock = warehouseProduct.cantidadstock - cantidadATransferir;
    const { error: warehouseUpdateError } = await supabase
      .from('inventory')
      .update({ 
        cantidadstock: newWarehouseStock,
        estado: newWarehouseStock === 0 ? 'vendido' : warehouseProduct.estado
      })
      .eq('id', warehouseProduct.id);

    if (warehouseUpdateError) throw warehouseUpdateError;

    console.log('📉 Stock reducido en bodega:', newWarehouseStock);

    // Aumentar stock en local
    const newLocalStock = localProduct.cantidadstock + cantidadATransferir;
    const { error: localUpdateError } = await supabase
      .from('inventory')
      .update({ 
        cantidadstock: newLocalStock,
        estado: 'disponible'
      })
      .eq('id', localProduct.id);

    if (localUpdateError) throw localUpdateError;

    console.log('📈 Stock aumentado en local:', newLocalStock);

    // Generar mensaje según el resultado
    let mensaje = '';
    let bodegaAgotada = false;
    
    if (newWarehouseStock === 0) {
      bodegaAgotada = true;
      if (stockInsuficiente) {
        mensaje = `⚠️ SE AGOTÓ LA BODEGA: Transferidas ${cantidadATransferir} unidades de "${warehouseProduct.nombre}" (todo el stock disponible). Faltaron ${cantidadNecesaria - cantidadATransferir} unidades. Nuevo stock local: ${newLocalStock}`;
      } else {
        mensaje = `⚠️ SE AGOTÓ LA BODEGA: Transferidas ${cantidadATransferir} unidades de "${warehouseProduct.nombre}". Nuevo stock local: ${newLocalStock}`;
      }
    } else {
      mensaje = `✅ Transferidas ${cantidadATransferir} unidades de "${warehouseProduct.nombre}" desde bodega a local. Nuevo stock local: ${newLocalStock}, Stock restante en bodega: ${newWarehouseStock}`;
    }

    return { 
      success: true, 
      message: mensaje,
      newLocalStock,
      newWarehouseStock,
      cantidadTransferida: cantidadATransferir,
      cantidadFaltante: stockInsuficiente ? cantidadNecesaria - cantidadATransferir : 0,
      bodegaAgotada,
      stockInsuficiente
    };

  } catch (error) {
    console.error('❌ Error in transferFromWarehouse:', error);
    return { 
      success: false, 
      message: `❌ Error en transferencia: ${error.message}` 
    };
  }
};

// Procesar venta de producto con transferencia automática
export const sellProductWithTransfer = async (inventoryId, saleData) => {
  try {
    console.log('🔍 Iniciando venta con transferencia:', { inventoryId, saleData });
    
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

    console.log('📦 Producto encontrado:', product);

    // Si es un producto local y no tiene suficiente stock, intentar transferir desde bodega
    if (product.cantidadstock < saleData.cantidadVendida && 
        product.ubicacion && product.ubicacion.toLowerCase().includes('local')) {
      
      console.log('🚚 Stock local insuficiente, transfiriendo desde bodega...');
      
      const cantidadNecesaria = saleData.cantidadVendida - product.cantidadstock;
      
      const transferResult = await transferFromWarehouse(
        product.nombre,
        product.categoria,
        product.tamaño,
        product.color,
        cantidadNecesaria
      );
      
      if (transferResult.success) {
        // Actualizar el stock del producto después de la transferencia
        product.cantidadstock = transferResult.newLocalStock;
        console.log('✅ Transferencia completada:', transferResult.message);
        
        // Si la bodega se agotó pero aún no hay suficiente stock para la venta
        if (product.cantidadstock < saleData.cantidadVendida) {
          throw new Error(
            `❌ VENTA CANCELADA: Stock insuficiente incluso después de transferir todo desde bodega.\n` +
            `${transferResult.message}\n` +
            `• Stock actual en local: ${product.cantidadstock}\n` +
            `• Cantidad solicitada: ${saleData.cantidadVendida}\n` +
            `• Faltante: ${saleData.cantidadVendida - product.cantidadstock}`
          );
        }
      } else {
        // No hay stock en bodega
        throw new Error(
          `❌ VENTA CANCELADA: Stock insuficiente y no hay disponibilidad en bodega.\n` +
          `${transferResult.message}\n` +
          `• Stock en local: ${product.cantidadstock}\n` +
          `• Cantidad solicitada: ${saleData.cantidadVendida}\n` +
          `• Faltante: ${saleData.cantidadVendida - product.cantidadstock}`
        );
      }
    } else if (product.cantidadstock < saleData.cantidadVendida) {
      // Producto no es local o no hay transferencia posible
      throw new Error(
        `❌ VENTA CANCELADA: Stock insuficiente.\n` +
        `• Stock disponible: ${product.cantidadstock}\n` +
        `• Cantidad solicitada: ${saleData.cantidadVendida}\n` +
        `• Faltante: ${saleData.cantidadVendida - product.cantidadstock}`
      );
    }

    // Calcular nuevo stock
    const newStock = product.cantidadstock - saleData.cantidadVendida;
    const newStatus = newStock === 0 ? 'vendido' : product.estado;

    console.log('📊 Nuevo stock calculado:', { newStock, newStatus });

    // Actualizar stock en inventory
    const { error: updateError } = await supabase
      .from('inventory')
      .update({ 
        cantidadstock: newStock,
        estado: newStatus
      })
      .eq('id', inventoryId);

    if (updateError) throw updateError;

    console.log('✅ Stock actualizado correctamente');

    // Registrar la venta
    const { data: saleRecord, error: saleError } = await supabase
      .from('sales')
      .insert([{
        inventory_id: inventoryId,
        nombre: product.nombre,
        categoria: product.categoria,
        tamaño: product.tamaño,
        color: product.color,
        cantidad_vendida: saleData.cantidadVendida,
        precio_venta: saleData.precioVenta || product.precioventa,
        total_venta: (saleData.precioVenta || product.precioventa) * saleData.cantidadVendida,
        metodo_pago: saleData.metodoPago || 'efectivo',
        notas: saleData.notas || ''
      }])
      .select();

    if (saleError) throw saleError;

    console.log('💰 Venta registrada:', saleRecord);

    let transferResult = null;
    
    // Transferencia automática post-venta (para reponer stock)
    if (product.ubicacion && product.ubicacion.toLowerCase().includes('local')) {
      console.log('🚚 Iniciando transferencia de reposición desde bodega...');
      
      transferResult = await transferFromWarehouse(
        product.nombre,
        product.categoria,
        product.tamaño,
        product.color,
        saleData.cantidadVendida
      );
      
      console.log('🚚 Resultado de transferencia de reposición:', transferResult);
    }

    // Generar alertas
    let alertaStock = '';
    if (newStock === 0) {
      alertaStock = `⚠️ ALERTA: El producto "${product.nombre}" en ${product.ubicacion} se ha quedado SIN STOCK.`;
    }
    
    // Si hay transferencia con bodega agotada
    if (transferResult && transferResult.bodegaAgotada) {
      alertaStock += alertaStock ? '\n' : '';
      alertaStock += `🚨 ALERTA: SE AGOTÓ LA BODEGA para "${product.nombre}".`;
    }
    
    // Si hay transferencia fallida
    if (transferResult && !transferResult.success) {
      alertaStock += alertaStock ? '\n' : '';
      alertaStock += `⚠️ ALERTA: No se pudo reponer stock desde bodega. ${transferResult.message}`;
    }

    return { 
      success: true, 
      saleRecord, 
      newStock,
      transferResult,
      alertaStock: alertaStock || null
    };
  } catch (error) {
    console.error('❌ Error in sellProductWithTransfer:', error);
    throw error;
  }
};

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