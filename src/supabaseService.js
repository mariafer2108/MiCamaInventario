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

// ==================== SISTEMA DE RESERVAS ====================

// Crear una nueva reserva
export const createReservation = async (reservationData) => {
  try {
    console.log('📝 Creando nueva reserva:', reservationData);
    
    const {
      inventoryId,
      cantidadReservada,
      valorReserva,
      cliente,
      telefono,
      notas,
    } = reservationData;

    // Verificar que el producto existe y tiene suficiente stock
    const { data: product, error: fetchError } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', inventoryId)
      .single();

    if (fetchError) throw fetchError;
    
    if (!product) {
      throw new Error('Producto no encontrado');
    }

    // Verificar stock disponible (considerando reservas activas)
    const stockDisponible = await getAvailableStock(inventoryId);
    
    if (stockDisponible < cantidadReservada) {
      throw new Error(
        `Stock insuficiente. Disponible: ${stockDisponible}, Solicitado: ${cantidadReservada}`
      );
    }

    // Crear la reserva
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .insert([{
        inventory_id: inventoryId,
        nombre_producto: product.nombre,
        categoria: product.categoria,
        tamaño: product.tamaño,
        color: product.color,
        cantidad_reservada: cantidadReservada,
        valor_reserva: valorReserva,
        cliente: cliente,
        telefono: telefono || '',
        notas: notas || '',
        fecha_reserva: new Date().toISOString(),
        estado: 'activa',
        precio_unitario: product.precioventa,
        total_producto: product.precioventa * cantidadReservada
      }])
      .select();

    if (reservationError) throw reservationError;

    console.log('✅ Reserva creada exitosamente:', reservation[0]);

    return {
      success: true,
      reservation: reservation[0],
      message: `✅ Reserva creada para ${cliente}. Producto: "${product.nombre}", Cantidad: ${cantidadReservada}, Valor reserva: CLP ${valorReserva}`
    };

  } catch (error) {
    console.error('❌ Error creating reservation:', error);
    throw error;
  }
};

// Obtener stock disponible (descontando reservas activas)
export const getAvailableStock = async (inventoryId) => {
  try {
    // Obtener stock total del producto
    const { data: product, error: productError } = await supabase
      .from('inventory')
      .select('cantidadstock')
      .eq('id', inventoryId)
      .single();

    if (productError) throw productError;

    // Obtener total de reservas activas
    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select('cantidad_reservada')
      .eq('inventory_id', inventoryId)
      .eq('estado', 'activa');

    if (reservationsError) throw reservationsError;

    const totalReservado = reservations.reduce((sum, res) => sum + res.cantidad_reservada, 0);
    const stockDisponible = product.cantidadstock - totalReservado;

    return Math.max(0, stockDisponible);
  } catch (error) {
    console.error('❌ Error getting available stock:', error);
    return 0;
  }
};

// Obtener todas las reservas
export const fetchReservations = async () => {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .order('fecha_reserva', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Error fetching reservations:', error);
    throw error;
  }
};

// Obtener reservas por estado
export const fetchReservationsByStatus = async (estado = 'activa') => {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('estado', estado)
      .order('fecha_reserva', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Error fetching reservations by status:', error);
    throw error;
  }
};

// Confirmar reserva (convertir a venta)
export const confirmReservation = async (reservationId, metodoPago = 'efectivo') => {
  try {
    console.log('✅ Confirmando reserva:', reservationId);

    // Obtener datos de la reserva
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (fetchError) throw fetchError;
    
    if (!reservation) {
      throw new Error('Reserva no encontrada');
    }

    if (reservation.estado !== 'activa') {
      throw new Error('La reserva no está activa');
    }

    // Verificar que aún hay stock suficiente
    const { data: product, error: productError } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', reservation.inventory_id)
      .single();

    if (productError) throw productError;

    if (product.cantidadstock < reservation.cantidad_reservada) {
      throw new Error('Stock insuficiente para confirmar la reserva');
    }

    // Procesar la venta
    const saleData = {
      cantidadVendida: reservation.cantidad_reservada,
      precioVenta: reservation.precio_unitario,
      metodoPago: metodoPago,
      notas: `Venta confirmada desde reserva. Cliente: ${reservation.cliente}. ${reservation.notas || ''}`
    };

    const saleResult = await sellProductWithTransfer(reservation.inventory_id, saleData);

    // Actualizar estado de la reserva
    const { error: updateError } = await supabase
      .from('reservations')
      .update({ 
        estado: 'confirmada',
        fecha_confirmacion: new Date().toISOString(),
        sale_id: saleResult.saleRecord[0].id
      })
      .eq('id', reservationId);

    if (updateError) throw updateError;

    console.log('✅ Reserva confirmada y venta procesada');

    return {
      success: true,
      saleRecord: saleResult.saleRecord[0],
      reservation: reservation,
      message: `✅ Reserva confirmada para ${reservation.cliente}. Venta procesada exitosamente.`
    };

  } catch (error) {
    console.error('❌ Error confirming reservation:', error);
    throw error;
  }
};

// Cancelar reserva
export const cancelReservation = async (reservationId, motivo = '') => {
  try {
    console.log('❌ Cancelando reserva:', reservationId);

    const { data, error } = await supabase
      .from('reservations')
      .update({ 
        estado: 'cancelada',
        fecha_cancelacion: new Date().toISOString(),
        motivo_cancelacion: motivo
      })
      .eq('id', reservationId)
      .select();

    if (error) throw error;

    console.log('✅ Reserva cancelada');

    return {
      success: true,
      reservation: data[0],
      message: `✅ Reserva cancelada. ${motivo ? 'Motivo: ' + motivo : ''}`
    };

  } catch (error) {
    console.error('❌ Error canceling reservation:', error);
    throw error;
  }
};

// Actualizar reserva
export const updateReservation = async (reservationId, updateData) => {
  try {
    console.log('📝 Actualizando reserva:', reservationId, updateData);

    const { data, error } = await supabase
      .from('reservations')
      .update({
        ...updateData,
        fecha_actualizacion: new Date().toISOString()
      })
      .eq('id', reservationId)
      .select();

    if (error) throw error;

    console.log('✅ Reserva actualizada');

    return {
      success: true,
      reservation: data[0],
      message: '✅ Reserva actualizada exitosamente'
    };

  } catch (error) {
    console.error('❌ Error updating reservation:', error);
    throw error;
  }
};

// Obtener reservas de un cliente específico
export const fetchReservationsByClient = async (clienteName) => {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .ilike('cliente', `%${clienteName}%`)
      .order('fecha_reserva', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Error fetching client reservations:', error);
    throw error;
  }
};

// Obtener estadísticas de reservas
export const getReservationStats = async () => {
  try {
    const { data: allReservations, error } = await supabase
      .from('reservations')
      .select('estado, valor_reserva, total_producto');

    if (error) throw error;

    const stats = {
      total: allReservations.length,
      activas: allReservations.filter(r => r.estado === 'activa').length,
      confirmadas: allReservations.filter(r => r.estado === 'confirmada').length,
      canceladas: allReservations.filter(r => r.estado === 'cancelada').length,
      valorTotalReservas: allReservations
        .filter(r => r.estado === 'activa')
        .reduce((sum, r) => sum + r.valor_reserva, 0),
      valorTotalProductos: allReservations
        .filter(r => r.estado === 'activa')
        .reduce((sum, r) => sum + r.total_producto, 0)
    };

    return stats;
  } catch (error) {
    console.error('❌ Error getting reservation stats:', error);
    throw error;
  }
};

// Eliminar reserva permanentemente
export const deleteReservation = async (reservationId) => {
  try {
    console.log('🗑️ Eliminando reserva:', reservationId);

    // Obtener datos de la reserva antes de eliminarla
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (fetchError) throw fetchError;
    
    if (!reservation) {
      throw new Error('Reserva no encontrada');
    }

    // Eliminar la reserva de la base de datos
    const { error: deleteError } = await supabase
      .from('reservations')
      .delete()
      .eq('id', reservationId);

    if (deleteError) throw deleteError;

    console.log('✅ Reserva eliminada permanentemente');

    return {
      success: true,
      reservation: reservation,
      message: `✅ Reserva de ${reservation.cliente} eliminada permanentemente`
    };

  } catch (error) {
    console.error('❌ Error deleting reservation:', error);
    throw error;
  }
};

// Función para eliminar TODAS las reservas
export const deleteAllReservations = async () => {
  try {
    console.log('🗑️ Eliminando TODAS las reservas...');

    // Obtener todas las reservas primero para mostrar estadísticas
    const { data: allReservations, error: fetchError } = await supabase
      .from('reservations')
      .select('*');

    if (fetchError) throw fetchError;

    const totalReservations = allReservations ? allReservations.length : 0;

    if (totalReservations === 0) {
      return {
        success: true,
        deletedCount: 0,
        message: '✅ No hay reservas para eliminar'
      };
    }

    // Eliminar todas las reservas
    const { error: deleteError } = await supabase
      .from('reservations')
      .delete()
      .neq('id', 0); // Esto elimina todos los registros

    if (deleteError) throw deleteError;

    console.log(`✅ ${totalReservations} reservas eliminadas permanentemente`);

    return {
      success: true,
      deletedCount: totalReservations,
      message: `✅ ${totalReservations} reservas eliminadas permanentemente`
    };

  } catch (error) {
    console.error('❌ Error eliminando todas las reservas:', error);
    throw error;
  }
};

// Actualizar una venta existente
export const updateSale = async (saleId, saleData) => {
  try {
    const updateData = {
      cantidad_vendida: saleData.cantidadVendida,
      precio_venta: saleData.precioVenta,
      total_venta: saleData.precioVenta * saleData.cantidadVendida,
      metodo_pago: saleData.metodoPago,
      notas: saleData.notas || ''
    };

    // Manejar la fecha correctamente sin problemas de zona horaria
    if (saleData.fechaVenta) {
      // Asegurar que la fecha se mantenga como está, sin conversiones de zona horaria
      updateData.fecha_venta = saleData.fechaVenta + 'T12:00:00.000Z';
    }

    const { data, error } = await supabase
      .from('sales')
      .update(updateData)
      .eq('id', saleId)
      .select();

    if (error) {
      console.error('Error updating sale:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateSale:', error);
    throw error;
  }
};

// Función para actualizar ventas relacionadas cuando se edita un producto
export const updateRelatedSales = async (inventoryId, updatedProductData) => {
  try {
    console.log('🔄 Actualizando ventas relacionadas para producto:', inventoryId);
    
    // Buscar ventas que coincidan con el inventory_id
    const { data: relatedSales, error: fetchError } = await supabase
      .from('sales')
      .select('*')
      .eq('inventory_id', inventoryId);

    if (fetchError) throw fetchError;

    if (relatedSales && relatedSales.length > 0) {
      // Actualizar cada venta relacionada
      for (const sale of relatedSales) {
        const { error: updateError } = await supabase
          .from('sales')
          .update({
            nombre: updatedProductData.nombre,
            categoria: updatedProductData.categoria,
            tamaño: updatedProductData.tamaño,
            color: updatedProductData.color,
            proveedor: updatedProductData.proveedor,
            ubicacion: updatedProductData.ubicacion
          })
          .eq('id', sale.id);

        if (updateError) {
          console.error('Error actualizando venta:', updateError);
        }
      }
      
      console.log(`✅ ${relatedSales.length} ventas actualizadas`);
      return { success: true, updatedSales: relatedSales.length };
    }
    
    return { success: true, updatedSales: 0 };
  } catch (error) {
    console.error('❌ Error updating related sales:', error);
    throw error;
  }
};

// Función para actualizar reservas relacionadas cuando se edita un producto
export const updateRelatedReservations = async (inventoryId, updatedProductData) => {
  try {
    console.log('🔄 Actualizando reservas relacionadas para producto:', inventoryId);
    
    // Buscar reservas que coincidan con el producto editado
    const { data: relatedReservations, error: fetchError } = await supabase
      .from('reservations')
      .select('*')
      .eq('inventory_id', inventoryId);

    if (fetchError) throw fetchError;

    if (relatedReservations && relatedReservations.length > 0) {
      // Actualizar cada reserva relacionada
      for (const reservation of relatedReservations) {
        const { error: updateError } = await supabase
          .from('reservations')
          .update({
            nombre: updatedProductData.nombre,
            categoria: updatedProductData.categoria,
            tamaño: updatedProductData.tamaño,
            color: updatedProductData.color,
            precio_unitario: updatedProductData.precioventa,
            total_producto: reservation.cantidad_reservada * updatedProductData.precioventa
          })
          .eq('id', reservation.id);

        if (updateError) {
          console.error('Error actualizando reserva:', updateError);
        }
      }
      
      console.log(`✅ ${relatedReservations.length} reservas actualizadas`);
      return { success: true, updatedReservations: relatedReservations.length };
    }
    
    return { success: true, updatedReservations: 0 };
  } catch (error) {
    console.error('❌ Error updating related reservations:', error);
    throw error;
  }
};

// Función para actualizar ventas existentes sin inventory_id
export const fixExistingSalesInventoryId = async () => {
  try {
    console.log('🔧 Reparando ventas existentes sin inventory_id...');
    
    // Obtener todas las ventas que no tienen inventory_id
    const { data: salesWithoutInventoryId, error: fetchError } = await supabase
      .from('sales')
      .select('*')
      .is('inventory_id', null);

    if (fetchError) throw fetchError;

    if (!salesWithoutInventoryId || salesWithoutInventoryId.length === 0) {
      console.log('✅ No hay ventas sin inventory_id para reparar');
      return { success: true, updatedSales: 0 };
    }

    console.log(`🔍 Encontradas ${salesWithoutInventoryId.length} ventas sin inventory_id`);

    let updatedCount = 0;

    // Para cada venta, buscar el producto correspondiente en inventario
    for (const sale of salesWithoutInventoryId) {
      try {
        // Buscar producto que coincida exactamente
        const { data: matchingProducts, error: searchError } = await supabase
          .from('inventory')
          .select('id')
          .eq('nombre', sale.nombre)
          .eq('categoria', sale.categoria)
          .eq('tamaño', sale.tamaño)
          .eq('color', sale.color)
          .limit(1);

        if (searchError) {
          console.error('Error buscando producto para venta:', sale.id, searchError);
          continue;
        }

        if (matchingProducts && matchingProducts.length > 0) {
          // Actualizar la venta con el inventory_id encontrado
          const { error: updateError } = await supabase
            .from('sales')
            .update({ inventory_id: matchingProducts[0].id })
            .eq('id', sale.id);

          if (updateError) {
            console.error('Error actualizando venta:', sale.id, updateError);
          } else {
            updatedCount++;
            console.log(`✅ Venta ${sale.id} asociada con producto ${matchingProducts[0].id}`);
          }
        } else {
          console.log(`⚠️ No se encontró producto para venta ${sale.id}: ${sale.nombre}`);
        }
      } catch (error) {
        console.error('Error procesando venta:', sale.id, error);
      }
    }

    console.log(`✅ Reparación completada: ${updatedCount} ventas actualizadas`);
    return { success: true, updatedSales: updatedCount };

  } catch (error) {
    console.error('❌ Error reparando ventas existentes:', error);
    throw error;
  }
};