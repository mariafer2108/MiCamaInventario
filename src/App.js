import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Download, Search, Package, TrendingUp, AlertTriangle, ShoppingCart, DollarSign, Calendar, LogOut } from 'lucide-react';
import './App.css';
import {
  fetchInventory,
  fetchSales,
  fetchReservations,
  createReservation,
  confirmReservation,
  cancelReservation,
  deleteReservation,
  updateItem,
  addItem,
  sellProductWithTransfer,
  deleteItemFromDB,
  deleteSaleFromDB
} from './supabaseService';
import { supabase } from './supabaseClient';
import Login from './Login';

// ===== COMPONENTES DE PRELOADER Y SKELETON =====

// Componente Preloader
const PreloaderComponent = ({ showPreloader }) => {
  return (
    <div className={`app-preloader ${!showPreloader ? 'fade-out' : ''}`}>
      <div className="preloader-logo gpu-accelerated">
        <Package className="w-8 h-8 text-blue-600" />
      </div>
      <div className="preloader-spinner"></div>
      <div className="preloader-text">MiCama Inventory</div>
      <div className="preloader-subtext">Cargando sistema...</div>
    </div>
  );
};

// Componente Skeleton
const SkeletonLoader = () => {
  return (
    <div className="skeleton-container">
      <div className="skeleton-header"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="skeleton-card"></div>
        <div className="skeleton-card"></div>
        <div className="skeleton-card"></div>
        <div className="skeleton-card"></div>
      </div>
      <div className="skeleton-table"></div>
    </div>
  );
};

function App() {
  // Estados de autenticación optimizados
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [appReady, setAppReady] = useState(false);
  
  // Estados para preloader y transiciones mejorados
  const [showPreloader, setShowPreloader] = useState(true);
  const [contentReady, setContentReady] = useState(false);
  const [viewTransition, setViewTransition] = useState(false);
  
  const [inventory, setInventory] = useState([]);
  const [sales, setSales] = useState([]);
  // Estados para reservas
  const [reservations, setReservations] = useState([]);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [reservingItem, setReservingItem] = useState(null);
  const [reservationFilter, setReservationFilter] = useState('all');
  const [reservationData, setReservationData] = useState({
    cantidadReservada: '',
    valorReserva: 0,
    cliente: '',
    telefono: '',
    notas: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentView, setCurrentView] = useState('inventory');
  const [selectedLocation, setSelectedLocation] = useState('all');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSize, setSelectedSize] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [sellingItem, setSellingItem] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: 'Sábana',
    tamaño: '1 plaza',
    color: '',
    proveedor: '',
    cantidadStock: '',
    stockMinimo: '',
    precioVenta: '',
    ubicacion: '',
    fechaIngreso: new Date().toISOString().split('T')[0],
    estado: 'disponible',
    descripcion: ''
  });
  const [saleData, setSaleData] = useState({
    cantidadVendida: 1,
    precioVenta: '',
    metodoPago: 'efectivo',
    notas: ''
  });

  const categories = [
    { value: 'all', label: 'Todas las categorías' },
    { value: 'Sábana', label: 'Sábanas' },
    { value: 'Almohada', label: 'Almohadas' },
    { value: 'Frazada', label: 'Frazadas' },
    { value: 'Faldon', label: 'Faldón' },
    { value: 'Cubre_colchon', label: 'Cubre colchón' },
    { value: 'Plumones', label: 'Plumones' },
    { value: 'Quilt', label: 'Quilts' },
  ];

  const sizes = [
    { value: 'all', label: 'Todos los tamaños' },
    { value: '1 plaza', label: '1 plaza' },
    { value: '1 1/2 plaza', label: '1 1/2 plaza' },
    { value: '2 plazas', label: '2 plazas' },
    { value: 'king', label: 'King' },
    { value: 'super king', label: 'Super King' }
  ];

  const estados = [
    { value: 'disponible', label: 'Disponible' },
    { value: 'reservado', label: 'Reservado' },
    { value: 'vendido', label: 'Vendido' },
    { value: 'dañado', label: 'Dañado' }
  ];

  const paymentMethods = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'debito', label: 'Debito' },
    { value: 'credito', label: 'Credito' },
  ];

  const months = [
    { value: 'all', label: 'Todos los meses' },
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' }
  ];

  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 5; i <= currentYear + 2; i++) {
    years.push({ value: i.toString(), label: i.toString() });
  }

  // useEffect optimizado para preloader
  useEffect(() => {
    let mounted = true;
    
    const initializeApp = async () => {
      try {
        // Mostrar preloader mínimo 2 segundos para experiencia suave
        const minLoadTime = new Promise(resolve => setTimeout(resolve, 2000));
        
        // Inicializar autenticación
        setAuthLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          if (session?.user) {
            setCurrentUser(session.user);
            setIsAuthenticated(true);
          } else {
            setCurrentUser(null);
            setIsAuthenticated(false);
          }
          setAuthLoading(false);
          setAuthInitialized(true);
          setAppReady(true);
        }
        
        // Esperar tiempo mínimo
        await minLoadTime;
        
        // Preparar contenido
        if (mounted) {
          setContentReady(true);
          
          // Fade out del preloader con delay
          setTimeout(() => {
            setShowPreloader(false);
          }, 500);
        }
        
      } catch (error) {
        console.error('Error initializing app:', error);
        if (mounted) {
          setShowPreloader(false);
          setContentReady(true);
        }
      }
    };
    
    initializeApp();
    
    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted && event !== 'INITIAL_SESSION') {
          if (session?.user) {
            setCurrentUser(session.user);
            setIsAuthenticated(true);
          } else {
            setCurrentUser(null);
            setIsAuthenticated(false);
            setInventory([]);
            setSales([]);
            setIsInitialized(false);
          }
          setAuthLoading(false);
          setAppReady(true);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);
  
  // useEffect para transiciones de vista
  useEffect(() => {
    if (contentReady) {
      setViewTransition(true);
      const timer = setTimeout(() => setViewTransition(false), 300);
      return () => clearTimeout(timer);
    }
  }, [currentView, contentReady]);

  useEffect(() => {
    const loadData = async () => {
      // Solo cargar datos si está autenticado, auth inicializado y no está cargando auth
      if (!isAuthenticated || !authInitialized || authLoading || !appReady) {
        setIsInitialized(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      setIsInitialized(false);
      
      try {
        const [inventoryData, salesData, reservationsData] = await Promise.all([
          fetchInventory(),
          fetchSales(),
          fetchReservations()
        ]);
        
        setInventory(inventoryData || []);
        setSales(salesData || []);
        setReservations(reservationsData || []);
        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Error al cargar los datos. Por favor, recarga la página.');
        setIsInitialized(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, authInitialized, authLoading, appReady]);

  // Función para manejar login exitoso
  const handleLogin = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setAuthLoading(false);
  };

  // Función para manejar logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setIsAuthenticated(false);
      setInventory([]);
      setSales([]);
      setIsInitialized(false);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre) {
      alert('Por favor, completa al menos el nombre del artículo.');
      return;
    }

    // Generar código automáticamente si no existe
    const generateCode = () => {
      const prefix = formData.categoria.substring(0, 3).toUpperCase();
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
      return `${prefix}-${timestamp}-${random}`;
    };

    const newItem = {
      codigo: editingItem ? editingItem.codigo : generateCode(), // Mantener código existente al editar
      nombre: formData.nombre,
      categoria: formData.categoria,
      tamaño: formData.tamaño,
      color: formData.color,
      material: formData.material || '',
      proveedor: formData.proveedor,
      cantidadstock: isNaN(parseInt(formData.cantidadStock)) ? 0 : parseInt(formData.cantidadStock),
      stockminimo: isNaN(parseInt(formData.stockMinimo)) ? 0 : parseInt(formData.stockMinimo),
      preciocompra: isNaN(parseFloat(formData.precioCompra)) ? 0 : parseFloat(formData.precioCompra),
      precioventa: isNaN(parseFloat(formData.precioVenta)) ? 0 : parseFloat(formData.precioVenta),
      ubicacion: formData.ubicacion,
      fechaingreso: formData.fechaIngreso,
      estado: formData.estado,
      descripcion: formData.descripcion,
    };

    try {
      if (editingItem) {
        await updateItem(editingItem.id, newItem);
        alert('Artículo actualizado exitosamente.');
      } else {
        await addItem(newItem);
        alert('Artículo agregado exitosamente.');
      }

      const data = await fetchInventory();
      setInventory(data);
      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      
      if (error.message?.includes('relation "inventory" does not exist')) {
        alert('Error: La tabla "inventory" no existe en Supabase. Por favor, créala usando el SQL proporcionado.');
      } else if (error.message?.includes('permission denied')) {
        alert('Error de permisos: Verifica las políticas RLS de la tabla inventory.');
      } else if (error.message?.includes('duplicate key')) {
        alert('Error: Ya existe un artículo con ese código.');
      } else {
        alert(`Error al guardar el artículo: ${error.message || 'Error desconocido'}`);
      }
    }
  };

  const handleSale = async (e) => {
    e.preventDefault();

    if (!sellingItem || saleData.cantidadVendida <= 0) {
      alert('Por favor, verifica los datos de la venta.');
      return;
    }

    if (saleData.cantidadVendida > sellingItem.cantidadstock) {
      alert('No hay suficiente stock disponible.');
      return;
    }

    try {
      const saleInfo = {
        cantidadVendida: parseInt(saleData.cantidadVendida),
        precioVenta: saleData.precioVenta ? parseFloat(saleData.precioVenta) : sellingItem.precioventa,
        metodoPago: saleData.metodoPago,
        notas: saleData.notas
      };

      // Usar la nueva función con transferencia automática
      const result = await sellProductWithTransfer(sellingItem.id, saleInfo);
      
      // Recargar datos
      const [inventoryData, salesData] = await Promise.all([
        fetchInventory(),
        fetchSales()
      ]);
      setInventory(inventoryData || []);
      setSales(salesData || []);
      
      // Mostrar mensaje de éxito con información de transferencia
      let message = 'Venta registrada exitosamente.';
      if (result.transferResult) {
        if (result.transferResult.success) {
          message += `\n\n✅ ${result.transferResult.message}`;
        } else {
          message += `\n\n⚠️ ${result.transferResult.message}`;
        }
      }
      
      alert(message);
      resetSaleForm();
      setIsSaleModalOpen(false);
    } catch (error) {
      console.error('Error en handleSale:', error);
      alert(`Error al procesar la venta: ${error.message || 'Error desconocido'}`);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      categoria: 'Sábana',
      tamaño: '1 plaza',
      color: '',
      proveedor: '',
      cantidadStock: '',
      stockMinimo: '',
      precioVenta: '',
      ubicacion: '',
      fechaIngreso: new Date().toISOString().split('T')[0],
      estado: 'disponible',
      descripcion: ''
    });
    setEditingItem(null);
  };

  const resetSaleForm = () => {
    setSaleData({
      cantidadVendida: 1,
      precioVenta: '',
      metodoPago: 'efectivo',
      notas: ''
    });
    setSellingItem(null);
  };

  const deleteItem = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este artículo?')) {
      try {
        await deleteItemFromDB(id);
        const data = await fetchInventory();
        setInventory(data);
      } catch (error) {
        console.error('Error al eliminar el artículo:', error);
        alert('Hubo un error al eliminar el artículo. Por favor, inténtalo de nuevo.');
      }
    }
  };
  const deleteSale = async (saleId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta venta?')) {
      try {
        await deleteSaleFromDB(saleId);
        const salesData = await fetchSales();
        setSales(salesData);
        alert('Venta eliminada exitosamente.');
      } catch (error) {
        console.error('Error al eliminar la venta:', error);
        alert('Hubo un error al eliminar la venta. Por favor, inténtalo de nuevo.');
      }
    }
  };

  const handleReservation = async (e) => {
    e.preventDefault();
    
    if (!reservingItem || reservationData.cantidadReservada <= 0) {
      alert('Por favor, verifica los datos de la reserva.');
      return;
    }

    try {
      const reservationInfo = {
        cantidadReservada: parseInt(reservationData.cantidadReservada),
        valorReserva: reservationData.valorReserva ? parseFloat(reservationData.valorReserva) : 0,
        cliente: reservationData.cliente,
        telefono: reservationData.telefono,
        notas: reservationData.notas
      };

      // Verificar si hay suficiente stock local
      if (reservingItem.cantidadstock < reservationInfo.cantidadReservada) {
        // Si es un producto local, intentar transferir desde bodega
        if (reservingItem.ubicacion && reservingItem.ubicacion.toLowerCase().includes('local')) {
          const cantidadNecesaria = reservationInfo.cantidadReservada - reservingItem.cantidadstock;
          
          try {
            // Importar la función de transferencia
            const { transferFromWarehouse } = await import('./supabaseService');
            
            const transferResult = await transferFromWarehouse(
              reservingItem.nombre,
              reservingItem.categoria,
              reservingItem.tamaño,
              reservingItem.color,
              cantidadNecesaria
            );
            
            if (transferResult.success) {
              alert(`✅ Transferencia completada: ${transferResult.message}`);
              // Actualizar el stock del item en memoria
              reservingItem.cantidadstock = transferResult.newLocalStock;
            } else {
              alert(`⚠️ ${transferResult.message}`);
              if (reservingItem.cantidadstock < reservationInfo.cantidadReservada) {
                alert(`❌ No se puede completar la reserva. Stock insuficiente incluso después de intentar transferir desde bodega.`);
                return;
              }
            }
          } catch (transferError) {
            console.error('Error en transferencia:', transferError);
            alert(`❌ Error al transferir desde bodega: ${transferError.message}`);
            return;
          }
        } else {
          alert(`❌ Stock insuficiente. Disponible: ${reservingItem.cantidadstock}, Solicitado: ${reservationInfo.cantidadReservada}`);
          return;
        }
      }

      // Crear la reserva
      await createReservation({
        inventoryId: reservingItem.id,
        cantidadReservada: reservationInfo.cantidadReservada,
        valorReserva: reservationInfo.valorReserva,
        cliente: reservationInfo.cliente,
        telefono: reservationInfo.telefono,
        notas: reservationInfo.notas
      });
      
      // Descontar del stock local
      const newStock = reservingItem.cantidadstock - reservationInfo.cantidadReservada;
      
      await updateItem(reservingItem.id, {
        ...reservingItem,
        cantidadstock: newStock,
        estado: newStock === 0 ? 'reservado' : reservingItem.estado
      });
      
      // **NUEVA FUNCIONALIDAD: Transferencia automática de reposición (igual que en ventas)**
      let transferResult = null;
      let alertaStock = '';
      
      if (reservingItem.ubicacion && reservingItem.ubicacion.toLowerCase().includes('local')) {
        console.log('🚚 Iniciando transferencia de reposición desde bodega...');
        
        try {
          const { transferFromWarehouse } = await import('./supabaseService');
          
          transferResult = await transferFromWarehouse(
            reservingItem.nombre,
            reservingItem.categoria,
            reservingItem.tamaño,
            reservingItem.color,
            reservationInfo.cantidadReservada
          );
          
          console.log('🚚 Resultado de transferencia de reposición:', transferResult);
          
          if (transferResult.success) {
            alertaStock += `✅ Stock repuesto automáticamente desde bodega: ${transferResult.message}`;
            
            // **AGREGAR ESTA LÍNEA: Actualizar el producto en la base de datos con el nuevo stock**
            await updateItem(reservingItem.id, {
              ...reservingItem,
              cantidadstock: transferResult.newLocalStock,
              estado: 'disponible'
            });
          } else {
            alertaStock += `⚠️ No se pudo reponer stock desde bodega: ${transferResult.message}`;
          }
          
          // Si hay transferencia con bodega agotada
          if (transferResult.bodegaAgotada) {
            alertaStock += alertaStock ? '\n' : '';
            alertaStock += `🚨 ALERTA: SE AGOTÓ LA BODEGA para "${reservingItem.nombre}".`;
          }
          
        } catch (transferError) {
          console.error('Error en transferencia de reposición:', transferError);
          alertaStock += `⚠️ Error al intentar reponer stock: ${transferError.message}`;
        }
      }
      
      // Generar alertas de stock
      if (newStock === 0) {
        alertaStock += alertaStock ? '\n' : '';
        alertaStock += `⚠️ ALERTA: El producto "${reservingItem.nombre}" en ${reservingItem.ubicacion} se ha quedado SIN STOCK.`;
      }
      
      // Recargar datos
      const [inventoryData, reservationsData] = await Promise.all([
        fetchInventory(),
        fetchReservations()
      ]);
      setInventory(inventoryData || []);
      setReservations(reservationsData || []);
      
      // Mostrar mensaje de éxito con información de reposición
      let successMessage = `✅ Reserva creada exitosamente. Stock actualizado: ${newStock} unidades restantes.`;
      if (alertaStock) {
        successMessage += `\n\n${alertaStock}`;
      }
      
      alert(successMessage);
      resetReservationForm();
      setIsReservationModalOpen(false);
    } catch (error) {
      console.error('Error creating reservation:', error);
      alert(`Error al crear la reserva: ${error.message || 'Error desconocido'}`);
    }
  };

  const handleConfirmReservation = async (reservationId) => {
    if (!window.confirm('¿Estás seguro de que quieres confirmar esta reserva y convertirla en venta?')) {
      return;
    }

    try {
      await confirmReservation(reservationId);
      
      // Recargar datos
      const [inventoryData, reservationsData, salesData] = await Promise.all([
        fetchInventory(),
        fetchReservations(),
        fetchSales()
      ]);
      setInventory(inventoryData || []);
      setReservations(reservationsData || []);
      setSales(salesData || []);
      
      alert('Reserva confirmada y convertida en venta exitosamente.');
    } catch (error) {
      console.error('Error confirming reservation:', error);
      alert(`Error al confirmar la reserva: ${error.message || 'Error desconocido'}`);
    }
  };

  const handleCancelReservation = async (reservationId) => {
    const reason = prompt('¿Por qué motivo cancelas esta reserva?');
    if (!reason) return;

    try {
      await cancelReservation(reservationId, reason);
      
      // Recargar datos
      const [inventoryData, reservationsData] = await Promise.all([
        fetchInventory(),
        fetchReservations()
      ]);
      setInventory(inventoryData || []);
      setReservations(reservationsData || []);
      
      alert('Reserva cancelada exitosamente.');
    } catch (error) {
      console.error('Error canceling reservation:', error);
      alert(`Error al cancelar la reserva: ${error.message || 'Error desconocido'}`);
    }
  };

  const handleDeleteReservation = async (reservationId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta reserva permanentemente? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await deleteReservation(reservationId);
      alert('Reserva eliminada exitosamente');
      
      // Recargar datos
      const [inventoryData, reservationsData] = await Promise.all([
        fetchInventory(),
        fetchReservations()
      ]);
      setInventory(inventoryData || []);
      setReservations(reservationsData || []);
    } catch (error) {
      console.error('Error al eliminar la reserva:', error);
      alert('Error al eliminar la reserva: ' + error.message);
    }
  };

  const resetReservationForm = () => {
    setReservationData({
      cantidadReservada: '',
      valorReserva: 0,
      cliente: '',
      telefono: '',
      notas: ''
    });
    setReservingItem(null);
  };

  // Función para calcular valor de reserva automáticamente
  const calculateReservationValue = (cantidad, precioProducto) => {
    // Convertir a números para asegurar cálculo correcto
    const cantidadNum = parseInt(cantidad) || 0;
    const precioNum = parseFloat(precioProducto) || 0;
    
    // Valor líquido completo (100% del valor total)
    const valorTotal = cantidadNum * precioNum;
    return valorTotal.toFixed(2);
  };

  // Función para manejar cambio en cantidad reservada
  const handleCantidadReservadaChange = (cantidad) => {
    // Si la cantidad está vacía, mantener el campo vacío
    if (cantidad === '' || cantidad === null || cantidad === undefined) {
      setReservationData({
        ...reservationData,
        cantidadReservada: '',
        valorReserva: 0
      });
      return;
    }
    
    const valorCalculado = calculateReservationValue(cantidad, parseFloat(reservingItem.precioventa || 0));
    setReservationData({
      ...reservationData,
      cantidadReservada: cantidad,
      valorReserva: valorCalculado
    });
  };
  const editItem = (item) => {
    setFormData({
      nombre: item.nombre,
      categoria: item.categoria,
      tamaño: item.tamaño,
      color: item.color,
      proveedor: item.proveedor,
      cantidadStock: item.cantidadstock.toString(),
      stockMinimo: item.stockminimo.toString(),
      precioVenta: item.precioventa === 0 ? '' : item.precioventa,
      ubicacion: item.ubicacion,
      fechaIngreso: item.fechaingreso,
      estado: item.estado,
      descripcion: item.descripcion
    });
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const sellItem = (item) => {
    if (item.cantidadstock <= 0) {
      alert('No hay stock disponible para este producto.');
      return;
    }
    setSellingItem(item);
    setSaleData({
      cantidadVendida: 1,
      precioVenta: item.precioventa,
      metodoPago: 'efectivo',
      notas: ''
    });
    setIsSaleModalOpen(true);
  };

  // Filtrar inventario por fecha de ingreso
  const filterInventoryByDate = (items) => {
    if (selectedMonth === 'all') return items;
    
    return items.filter(item => {
      if (!item.fechaingreso) return false;
      const itemDate = new Date(item.fechaingreso);
      const itemYear = itemDate.getFullYear().toString();
      const itemMonth = (itemDate.getMonth() + 1).toString().padStart(2, '0');
      
      return itemYear === selectedYear && itemMonth === selectedMonth;
    });
  };
// Agregar esta función después de la función filterInventoryByDate (alrededor de la línea 338)
const filterSalesByDate = (sales) => {
  if (selectedMonth === 'all') return sales;
  
  return sales.filter(sale => {
    if (!sale.fecha_venta) return false;
    const saleDate = new Date(sale.fecha_venta);
    const saleYear = saleDate.getFullYear().toString();
    const saleMonth = (saleDate.getMonth() + 1).toString().padStart(2, '0');
    
    return saleYear === selectedYear && saleMonth === selectedMonth;
  });
};


  const exportToTXT = () => {
    const currentDate = new Date().toLocaleDateString('es-ES');
    const currentTime = new Date().toLocaleTimeString('es-ES');
    
    // Crear encabezado bonito
    const header = `
===============================================
           INVENTARIO SÁBANAS Y COBERTORES
===============================================
Fecha de exportación: ${currentDate} - ${currentTime}
Total de productos: ${filteredInventory.length}
===============================================

`;
    
    // Formatear datos con espaciado fijo
    const formatField = (value, width) => {
      const str = (value || '').toString();
      return str.length > width ? str.substring(0, width-3) + '...' : str.padEnd(width);
    };
    
    const headers = `${'NOMBRE'.padEnd(25)} | ${'CATEGORÍA'.padEnd(15)} | ${'TAMAÑO'.padEnd(12)} | ${'COLOR'.padEnd(15)} | ${'STOCK'.padEnd(8)} | ${'PRECIO'.padEnd(10)} | ${'UBICACIÓN'.padEnd(15)} | ${'ESTADO'.padEnd(12)}`;
    const separator = '='.repeat(headers.length);
    
    const rows = filteredInventory.map(item => 
      `${formatField(item.nombre, 25)} | ${formatField(item.categoria, 15)} | ${formatField(item.tamaño, 12)} | ${formatField(item.color, 15)} | ${formatField(item.cantidadstock, 8)} | ${formatField(`$${item.precioventa}`, 10)} | ${formatField(item.ubicacion, 15)} | ${formatField(item.estado, 12)}`
    );
    
    const footer = `\n\n===============================================\nResumen por categoría:\n===============================================\n`;
    
    // Crear resumen por categoría
    const categoryStats = {};
    filteredInventory.forEach(item => {
      if (!categoryStats[item.categoria]) {
        categoryStats[item.categoria] = { count: 0, totalStock: 0 };
      }
      categoryStats[item.categoria].count++;
      categoryStats[item.categoria].totalStock += parseInt(item.cantidadstock) || 0;
    });
    
    const categoryReport = Object.entries(categoryStats)
      .map(([category, stats]) => `${category.padEnd(20)}: ${stats.count.toString().padStart(3)} productos | Stock total: ${stats.totalStock.toString().padStart(4)}`)
      .join('\n');
    
    const txtContent = header + headers + '\n' + separator + '\n' + rows.join('\n') + footer + categoryReport + '\n\n===============================================\nFin del reporte\n===============================================';
    
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventario_${currentDate.replace(/\//g, '-')}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportSalesToTXT = () => {
    const currentDate = new Date().toLocaleDateString('es-ES');
    const currentTime = new Date().toLocaleTimeString('es-ES');
    
    // Crear encabezado bonito
    const header = `
===============================================
              REPORTE DE VENTAS
===============================================
Fecha de exportación: ${currentDate} - ${currentTime}
Total de ventas: ${filteredSales.length}
Período: ${selectedMonth !== 'all' ? months.find(m => m.value === selectedMonth)?.label + ' ' + selectedYear : 'Todas las fechas'}
===============================================

`;
    
    // Formatear datos con espaciado fijo
    const formatField = (value, width) => {
      const str = (value || '').toString();
      return str.length > width ? str.substring(0, width-3) + '...' : str.padEnd(width);
    };
    
    const headers = `${'FECHA'.padEnd(12)} | ${'PRODUCTO'.padEnd(25)} | ${'CATEGORÍA'.padEnd(15)} | ${'CANT.'.padEnd(6)} | ${'P.UNIT'.padEnd(10)} | ${'TOTAL'.padEnd(10)} | ${'PAGO'.padEnd(10)}`;
    const separator = '='.repeat(headers.length);
    
    const rows = filteredSales.map(sale => 
      `${formatField(new Date(sale.fecha_venta).toLocaleDateString('es-ES'), 12)} | ${formatField(sale.nombre, 25)} | ${formatField(sale.categoria, 15)} | ${formatField(sale.cantidad_vendida, 6)} | ${formatField(`$${sale.precio_venta}`, 10)} | ${formatField(`$${sale.total_venta}`, 10)} | ${formatField(sale.metodo_pago, 10)}`
    );
    
    // Calcular totales
    const totalVentas = filteredSales.reduce((sum, sale) => sum + (parseFloat(sale.total_venta) || 0), 0);
    const totalProductos = filteredSales.reduce((sum, sale) => sum + (parseInt(sale.cantidad_vendida) || 0), 0);
    
    const footer = `\n\n===============================================\nRESUMEN DE VENTAS\n===============================================\nTotal productos vendidos: ${totalProductos}\nTotal en ventas: $${totalVentas.toFixed(2)}\nPromedio por venta: $${(totalVentas / filteredSales.length || 0).toFixed(2)}\n\n`;
    
    // Resumen por método de pago
    const paymentStats = {};
    filteredSales.forEach(sale => {
      if (!paymentStats[sale.metodo_pago]) {
        paymentStats[sale.metodo_pago] = { count: 0, total: 0 };
      }
      paymentStats[sale.metodo_pago].count++;
      paymentStats[sale.metodo_pago].total += parseFloat(sale.total_venta) || 0;
    });
    
    const paymentReport = 'Ventas por método de pago:\n' + 
      Object.entries(paymentStats)
        .map(([method, stats]) => `${method.padEnd(15)}: ${stats.count.toString().padStart(3)} ventas | Total: $${stats.total.toFixed(2).padStart(10)}`)
        .join('\n');
    
    const txtContent = header + headers + '\n' + separator + '\n' + rows.join('\n') + footer + paymentReport + '\n\n===============================================\nFin del reporte\n===============================================';
    
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ventas_${currentDate.replace(/\//g, '-')}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

// ===== COMPONENTES MÓVILES =====

// Componente para tarjetas de inventario en móvil
const MobileInventoryCard = ({ item, sellItem, editItem, deleteItem }) => (
  <div className="mobile-card show-mobile">
    <div className="mobile-card-header">
      <div>
        <div className="mobile-card-title">{item.nombre || 'Sin nombre'}</div>
        {item.codigo && (
          <div className="mobile-card-subtitle">{item.codigo}</div>
        )}
      </div>
      <div className="mobile-card-actions">
        <button
          onClick={() => sellItem(item)}
          disabled={(item.cantidadstock || 0) <= 0}
          className={`p-2 rounded ${(item.cantidadstock || 0) > 0 ? 'text-green-600' : 'text-gray-400'}`}
          title="Vender"
        >
          <DollarSign className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setReservingItem(item);
            setIsReservationModalOpen(true);
          }}
          className="p-2 text-purple-600 rounded"
          title="Reservar"
        >
          <Calendar className="w-4 h-4" />
        </button>
        <button
          onClick={() => editItem(item)}
          className="p-2 text-blue-600 rounded"
          title="Editar"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => deleteItem(item.id)}
          className="p-2 text-red-600 rounded"
          title="Eliminar"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
    <div className="mobile-card-content">
      <div className="mobile-card-field">
        <div className="mobile-card-label">Categoría</div>
        <div className="mobile-card-value">{item.categoria?.replace('_', ' ') || 'Sin categoría'}</div>
      </div>
      {item.tamaño && (
        <div className="mobile-card-field">
          <div className="mobile-card-label">Tamaño</div>
          <div className="mobile-card-value">{item.tamaño}</div>
        </div>
      )}
      <div className="mobile-card-field">
        <div className="mobile-card-label">Stock</div>
        <div className="mobile-card-value flex items-center">
          {item.cantidadstock || 0}
          {(item.cantidadstock || 0) <= (item.stockminimo || 0) && (
            <AlertTriangle className="w-4 h-4 text-red-500 ml-1" />
          )}
        </div>
      </div>
      <div className="mobile-card-field">
        <div className="mobile-card-label">Precio</div>
        <div className="mobile-card-value">${(item.precioventa || 0).toLocaleString()}</div>
      </div>
      <div className="mobile-card-field">
        <div className="mobile-card-label">Estado</div>
        <div className="mobile-card-value">
          <span className={`px-2 py-1 text-xs rounded-full ${
            item.estado === 'disponible' ? 'bg-green-100 text-green-800' :
            item.estado === 'reservado' ? 'bg-yellow-100 text-yellow-800' :
            item.estado === 'vendido' ? 'bg-gray-100 text-gray-800' :
            'bg-red-100 text-red-800'
          }`}>
            {item.estado || 'Sin estado'}
          </span>
        </div>
      </div>
      {item.color && (
        <div className="mobile-card-field">
          <div className="mobile-card-label">Color</div>
          <div className="mobile-card-value">{item.color}</div>
        </div>
      )}
      {item.ubicacion && (
        <div className="mobile-card-field">
          <div className="mobile-card-label">Ubicación</div>
          <div className="mobile-card-value">{item.ubicacion}</div>
        </div>
      )}
      {item.proveedor && (
        <div className="mobile-card-field">
          <div className="mobile-card-label">Proveedor</div>
          <div className="mobile-card-value">{item.proveedor}</div>
        </div>
      )}
    </div>
  </div>
);

// Componente para tarjetas de ventas en móvil
const MobileSalesCard = ({ sale, deleteSale }) => (
  <div className="mobile-card show-mobile">
    <div className="mobile-card-header">
      <div>
        <div className="mobile-card-title">{sale.nombre || 'Sin nombre'}</div>
        <div className="mobile-card-subtitle">{new Date(sale.fecha_venta).toLocaleDateString('es-ES')}</div>
      </div>
      <div className="mobile-card-actions">
        <button
          onClick={() => deleteSale(sale.id)}
          className="p-2 text-red-600 rounded"
          title="Eliminar venta"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
    <div className="mobile-card-content">
      <div className="mobile-card-field">
        <div className="mobile-card-label">Categoría</div>
        <div className="mobile-card-value">{sale.categoria?.replace('_', ' ') || 'Sin categoría'}</div>
      </div>
      {sale.tamaño && (
        <div className="mobile-card-field">
          <div className="mobile-card-label">Tamaño</div>
          <div className="mobile-card-value">{sale.tamaño}</div>
        </div>
      )}
      <div className="mobile-card-field">
        <div className="mobile-card-label">Cantidad</div>
        <div className="mobile-card-value">{sale.cantidad_vendida}</div>
      </div>
      <div className="mobile-card-field">
        <div className="mobile-card-label">Precio Unit.</div>
        <div className="mobile-card-value">${sale.precio_venta}</div>
      </div>
      <div className="mobile-card-field">
        <div className="mobile-card-label">Total</div>
        <div className="mobile-card-value font-bold">${sale.total_venta}</div>
      </div>
      <div className="mobile-card-field">
        <div className="mobile-card-label">Método Pago</div>
        <div className="mobile-card-value capitalize">{sale.metodo_pago}</div>
      </div>
      {sale.notas && (
        <div className="mobile-card-field">
          <div className="mobile-card-label">Notas</div>
          <div className="mobile-card-value">{sale.notas}</div>
        </div>
      )}
    </div>
  </div>
);



  // ✅ Solo después de todas las verificaciones de estado
  const safeInventory = Array.isArray(inventory) ? inventory.filter(item => item && typeof item === 'object') : [];
  const safeSales = Array.isArray(sales) ? sales.filter(sale => sale && typeof sale === 'object') : [];
  const dateFilteredInventory = filterInventoryByDate(safeInventory);
  
  const getUniqueLocations = () => {
    if (!safeInventory || safeInventory.length === 0) {
      return [{ value: 'all', label: 'Todas las ubicaciones' }];
    }
    
    try {
      const locations = [...new Set(
        safeInventory
          .filter(item => item && typeof item === 'object' && item.ubicacion)
          .map(item => item.ubicacion)
          .filter(location => typeof location === 'string' && location.trim() !== '')
      )];
      
      return [
        { value: 'all', label: 'Todas las ubicaciones' },
        ...locations.map(location => ({ value: location, label: location }))
      ];
    } catch (error) {
      console.error('Error in getUniqueLocations:', error);
      return [{ value: 'all', label: 'Todas las ubicaciones' }];
    }
  };
  
  const filteredInventory = dateFilteredInventory.filter(item => {
    if (!item || typeof item !== 'object') return false;
    
    try {
      const matchesSearch = searchTerm === '' || 
        (item.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.codigo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.categoria || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.color || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.proveedor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.ubicacion || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.categoria === selectedCategory;
      const matchesSize = selectedSize === 'all' || item.tamaño === selectedSize;
      const matchesLocation = selectedLocation === 'all' || item.ubicacion === selectedLocation;
      return matchesSearch && matchesCategory && matchesSize && matchesLocation;
    } catch (error) {
      console.error('Error filtering item:', item, error);
      return false;
    }
  });
  
  // Aplicar filtros a las ventas
  const filteredSales = filterSalesByDate(safeSales);

  const lowStockItems = dateFilteredInventory.filter(item => 
    item && typeof item.cantidadstock === 'number' && typeof item.stockminimo === 'number' && 
    item.cantidadstock <= item.stockminimo
  );
  
  const totalValue = dateFilteredInventory.reduce((sum, item) => {
    if (!item || typeof item.cantidadstock !== 'number' || typeof item.precioventa !== 'number') {
      return sum;
    }
    return sum + (item.cantidadstock * item.precioventa);
  }, 0);
  
  const totalItems = dateFilteredInventory.reduce((sum, item) => {
    if (!item || typeof item.cantidadstock !== 'number') {
      return sum;
    }
    return sum + item.cantidadstock;
  }, 0);
  
  // Estadísticas de ventas
  const totalSales = filteredSales.reduce((sum, sale) => {
    if (!sale || typeof sale.total_venta !== 'number') {
      return sum;
    }
    return sum + sale.total_venta;
  }, 0);

  // Pantalla de error (solo si hay error y todo está listo)
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
            <p className="text-lg font-semibold">Error al cargar los datos</p>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setIsInitialized(false);
              setAppReady(false);
              window.location.reload();
            }} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Recargar página
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Preloader */}
      {showPreloader && <PreloaderComponent showPreloader={showPreloader} />}
      
      {/* Skeleton loader durante la transición */}
      {!showPreloader && !contentReady && (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <SkeletonLoader />
        </div>
      )}
      
      {/* Contenido principal - Solo mostrar cuando preloader termine Y contenido esté listo */}
      {!showPreloader && contentReady && (
        <div className={`content-fade-in ${viewTransition ? 'view-transition entering' : 'view-transition entered'} gpu-accelerated`}>
          {/* Pantalla de login */}
          {!isAuthenticated ? (
            <Login onLogin={handleLogin} />
          ) : (
            <>
              {/* Header */}
              <header className="bg-blue-600 shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-white p-2 rounded-lg shadow-md">
                        <img 
                          src="/img/micama.jpg" 
                          alt="MiCama Logo" 
                          className="h-12 w-12 object-contain"
                        />
                      </div>
                      <div className="hidden-mobile">
                        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                          Sistema de Inventario
                          <span className="text-yellow-300">✨</span>
                        </h1>
                        <p className="text-blue-100">Bienvenido, <span className="text-yellow-300 font-semibold">{currentUser?.email}</span></p>
                      </div>
                      <div className="show-mobile">
                        <h1 className="text-xl font-bold text-white">
                          MiCama ✨
                        </h1>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setCurrentView('inventory')}
                          className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                            currentView === 'inventory' 
                              ? 'gold-gradient text-white shadow-lg transform scale-105' 
                              : 'bg-white/20 text-white hover:bg-white/30'
                          }`}
                        >
                          <Package className="w-4 h-4" />
                          <span className="hidden-mobile">Inventario</span>
                        </button>
                        <button
                          onClick={() => setCurrentView('sales')}
                          className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                            currentView === 'sales' 
                              ? 'gold-gradient text-white shadow-lg transform scale-105' 
                              : 'bg-white/20 text-white hover:bg-white/30'
                          }`}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span className="hidden-mobile">Ventas</span>
                        </button>
                        <button
                          onClick={() => setCurrentView('dashboard')}
                          className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                            currentView === 'dashboard' 
                              ? 'gold-gradient text-white shadow-lg transform scale-105' 
                              : 'bg-white/20 text-white hover:bg-white/30'
                          }`}
                        >
                          <TrendingUp className="w-4 h-4" />
                          <span className="hidden-mobile">Dashboard</span>
                        </button>
                        <button
                          onClick={() => setCurrentView('reservations')}
                          className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                            currentView === 'reservations' 
                              ? 'gold-gradient text-white shadow-lg transform scale-105' 
                              : 'bg-white/20 text-white hover:bg-white/30'
                          }`}
                        >
                          <Calendar className="w-4 h-4" />
                          <span className="hidden-mobile">Reservas</span>
                        </button>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden-mobile">Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                </div>
              </header>
              
              {/* Main content con skeleton loading */}
              <main className="max-w-7xl mx-auto px-4 py-6">
                {!isInitialized || isLoading ? (
                  <SkeletonLoader />
                ) : (
                  <div className="gpu-accelerated">
        {/* Filtros de fecha para todas las vistas */}
        <div className="mb-6 bg-white rounded-xl shadow-lg card-shadow p-6 gold-accent animate-fade-in">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 gold-gradient rounded-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-800">Filtrar por fecha:</span>
            </div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-blue-300"
            >
              {years.map(year => (
                <option key={year.value} value={year.value}>{year.label}</option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-blue-300"
            >
              {months.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
            {selectedMonth !== 'all' && (
              <span className="text-sm gold-gradient text-white px-4 py-2 rounded-full font-medium shadow-md">
                📊 {currentView === 'inventory' ? 'Inventario' : currentView === 'sales' ? 'Ventas' : 'Datos'} de {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
              </span>
            )}
          </div>
        </div>

        {currentView === 'inventory' && (
          <>
            <div className="mb-6 flex flex-wrap gap-4 items-center justify-between filter-controls">
              <div className="flex gap-4 items-center">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, código o proveedor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
               <select
  value={selectedCategory}
  onChange={(e) => setSelectedCategory(e.target.value)}
  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
>
  {categories.map(cat => (
    <option key={cat.value} value={cat.value}>{cat.label}</option>
  ))}
</select>
<select
  value={selectedSize}
  onChange={(e) => setSelectedSize(e.target.value)}
  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
>
  {sizes.map(size => (
    <option key={size.value} value={size.value}>{size.label}</option>
  ))}
</select>
<select
  value={selectedLocation}
  onChange={(e) => setSelectedLocation(e.target.value)}
  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
>
  {getUniqueLocations().map(location => (
    <option key={location.value} value={location.value}>{location.label}</option>
  ))}
</select>
              </div>
              <div className="flex gap-3 action-buttons">
                <button
                  onClick={exportToTXT}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-all duration-300 hover-lift shadow-lg"
                >
                  <Download className="w-5 h-5" />
                  Exportar TXT
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-3 gold-gradient text-white rounded-lg hover:shadow-xl flex items-center gap-2 transition-all duration-300 hover-lift shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  Nuevo Artículo
                </button>
              </div>
            </div>

            <div className="mb-4 text-sm text-gray-600">
              Mostrando {filteredInventory.length} de {safeInventory.length} artículos
              {selectedMonth !== 'all' && ` (ingresados en ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear})`}
            </div>

            {/* Vista de tabla para desktop */}
            <div className="bg-white rounded-lg shadow overflow-hidden hidden-mobile">
              <div className="overflow-x-auto table-scroll table-responsive">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Venta</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInventory.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                          {isLoading ? 'Cargando inventario...' : 'No hay productos que coincidan con los filtros'}
                        </td>
                      </tr>
                    ) : (
                      filteredInventory.map((item) => {
                        if (!item || !item.id) return null;
                        
                        return (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{item.nombre || 'Sin nombre'}</div>
                              <div className="text-sm text-gray-500">
                                {item.codigo && `${item.codigo}`}
                                {item.codigo && item.tamaño && ' - '}
                                {item.tamaño && `${item.tamaño}`}
                                {(item.codigo || item.tamaño) && item.color && ' - '}
                                {item.color && `${item.color}`}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                              {item.categoria?.replace('_', ' ') || 'Sin categoría'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="text-sm text-gray-900">{item.cantidadstock || 0}</span>
                                {(item.cantidadstock || 0) <= (item.stockminimo || 0) && (
                                  <AlertTriangle className="w-4 h-4 text-red-500 ml-2" />
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${(item.precioventa || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                item.estado === 'disponible' ? 'bg-green-100 text-green-800' :
                                item.estado === 'reservado' ? 'bg-yellow-100 text-yellow-800' :
                                item.estado === 'vendido' ? 'bg-gray-100 text-gray-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {item.estado || 'Sin estado'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => sellItem(item)}
                                  disabled={(item.cantidadstock || 0) <= 0}
                                  className={`${(item.cantidadstock || 0) > 0 ? 'text-green-600 hover:text-green-900' : 'text-gray-400 cursor-not-allowed'}`}
                                  title="Vender"
                                >
                                  <DollarSign className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setReservingItem(item);
                                    setReservationData({
                                      cantidadReservada: '',
                                      valorReserva: 0,
                                      cliente: '',
                                      telefono: '',
                                      notas: ''
                                    });
                                    setIsReservationModalOpen(true);
                                  }}
                                  className="text-purple-600 hover:text-purple-900"
                                  title="Reservar"
                                >
                                  <Calendar className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => editItem(item)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Editar"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteItem(item.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Vista de cards para móvil */}
            <div className="show-mobile">
              {filteredInventory.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                  {isLoading ? 'Cargando inventario...' : 'No hay productos que coincidan con los filtros'}
                </div>
              ) : (
                <div>
                  {filteredInventory.map((item) => {
                    if (!item || !item.id) return null;
                    return <MobileInventoryCard 
                      key={item.id} 
                      item={item} 
                      sellItem={sellItem}
                      editItem={editItem}
                      deleteItem={deleteItem}
                    />;
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {currentView === 'sales' && (
          <>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Historial de Ventas</h2>
              <div className="flex gap-2">
                <button
                  onClick={exportSalesToTXT}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exportar TXT
                </button>
              </div>
            </div>

            <div className="mb-4 text-sm text-gray-600">
              Mostrando {filteredSales.length} de {safeSales.length} ventas
              {selectedMonth !== 'all' && ` (realizadas en ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear})`}
            </div>
            {/* Vista de tabla para desktop */}
            <div className="bg-white rounded-lg shadow overflow-hidden hidden-mobile">
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unit.</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método Pago</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSales.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                          {selectedMonth !== 'all' 
                            ? `No hay ventas registradas en ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
                            : 'No hay ventas registradas'
                          }
                        </td>
                      </tr>
                    ) : (
                      filteredSales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(sale.fecha_venta).toLocaleDateString('es-ES')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{sale.nombre}</div>
                            <div className="text-sm text-gray-500">{sale.categoria} - {sale.tamaño}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.cantidad_vendida}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${sale.precio_venta?.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${sale.total_venta?.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{sale.metodo_pago}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => deleteSale(sale.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Eliminar venta"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
               </div>
            </div>

            {/* Vista de cards para móvil */}
            <div className="show-mobile">
              {filteredSales.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                  {selectedMonth !== 'all' 
                    ? `No hay ventas registradas en ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
                    : 'No hay ventas registradas'
                  }
                </div>
              ) : (
                <div>
                  {filteredSales.map((sale) => (
                    <MobileSalesCard 
                      key={sale.id} 
                      sale={sale} 
                      deleteSale={deleteSale}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
                
        {currentView === 'dashboard' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <Package className="w-8 h-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Artículos</p>
                    <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
                    {selectedMonth !== 'all' && (
                      <p className="text-xs text-gray-400">En {months.find(m => m.value === selectedMonth)?.label} {selectedYear}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Valor Inventario</p>
                    <p className="text-2xl font-bold text-gray-900">${totalValue.toLocaleString()}</p>
                    {selectedMonth !== 'all' && (
                      <p className="text-xs text-gray-400">En {months.find(m => m.value === selectedMonth)?.label} {selectedYear}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <DollarSign className="w-8 h-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Ventas</p>
                    <p className="text-2xl font-bold text-gray-900">${totalSales.toLocaleString()}</p>
                    {selectedMonth !== 'all' && (
                      <p className="text-xs text-gray-400">En {months.find(m => m.value === selectedMonth)?.label} {selectedYear}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Stock Bajo</p>
                    <p className="text-2xl font-bold text-gray-900">{lowStockItems.length}</p>
                    {selectedMonth !== 'all' && (
                      <p className="text-xs text-gray-400">Ingresados en {months.find(m => m.value === selectedMonth)?.label} {selectedYear}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {currentView === 'reservations' && (
          <div className="space-y-6">
            {/* Estadísticas de reservas */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Reservas</h3>
                <p className="text-3xl font-bold text-blue-600">{reservations.length}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Valor Total</h3>
                <p className="text-2xl font-bold text-orange-600">
                  CLP {reservations.reduce((sum, r) => sum + (parseFloat(r.valor_reserva) || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Activas</h3>
                <p className="text-3xl font-bold text-green-600">
                  {reservations.filter(r => r.estado === 'activa').length}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirmadas</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {reservations.filter(r => r.estado === 'confirmada').length}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Canceladas</h3>
                <p className="text-3xl font-bold text-red-600">
                  {reservations.filter(r => r.estado === 'cancelada').length}
                </p>
              </div>
            </div>

            {/* Filtros y lista de reservas */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Gestión de Reservas</h2>
                <select
                  value={reservationFilter}
                  onChange={(e) => setReservationFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="all">Todas las reservas</option>
                  <option value="activa">Activas</option>
                  <option value="confirmada">Confirmadas</option>
                  <option value="cancelada">Canceladas</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reservations
                      .filter(reservation => reservationFilter === 'all' || reservation.estado === reservationFilter)
                      .map((reservation) => {
                        const product = inventory.find(item => item.id === reservation.inventory_id);
                        return (
                          <tr key={reservation.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {product?.nombre || 'Producto no encontrado'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {product?.codigo}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{reservation.cliente}</div>
                                <div className="text-sm text-gray-500">{reservation.telefono}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {reservation.cantidad_reservada}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              CLP {reservation.valor_reserva?.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                reservation.estado === 'activa' ? 'bg-green-100 text-green-800' :
                                reservation.estado === 'confirmada' ? 'bg-purple-100 text-purple-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {reservation.estado}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              {reservation.estado === 'activa' && (
                                <>
                                  <button
                                    onClick={() => handleConfirmReservation(reservation.id)}
                                    className="text-green-600 hover:text-green-900"
                                  >
                                    Confirmar
                                  </button>
                                  <button
                                    onClick={() => handleCancelReservation(reservation.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    onClick={() => handleDeleteReservation(reservation.id)}
                                    className="text-red-800 hover:text-red-900 font-semibold"
                                    title="Eliminar reserva permanentemente"
                                  >
                                    Eliminar
                                  </button>
                                </>
                              )}
                              {reservation.estado !== 'activa' && (
                                <button
                                  onClick={() => handleDeleteReservation(reservation.id)}
                                  className="text-red-800 hover:text-red-900 font-semibold"
                                  title="Eliminar reserva permanentemente"
                                >
                                  Eliminar
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
                  </div>
                )}
              </main>
            </>
          )}
        </div>
      )}
      


      {/* Modal para agregar/editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl p-6 overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold mb-4">{editingItem ? 'Editar Artículo' : 'Nuevo Artículo'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="nombre">Nombre</label>
                  <input
                    type="text"
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="categoria">Categoría</label>
                  <select
                    id="categoria"
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.slice(1).map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="tamaño">Tamaño</label>
                  <select
                    id="tamaño"
                    value={formData.tamaño}
                    onChange={(e) => setFormData({ ...formData, tamaño: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {sizes.map(size => (
                      <option key={size.value} value={size.value}>{size.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="color">Color</label>
                  <input
                    type="text"
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="proveedor">Proveedor</label>
                  <input
                    type="text"
                    id="proveedor"
                    value={formData.proveedor}
                    onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="cantidadStock">Cantidad en Stock</label>
                  <input
                    type="number"
                    id="cantidadStock"
                    value={formData.cantidadStock}
                    onChange={(e) => setFormData({ ...formData, cantidadStock: e.target.value })}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="stockMinimo">Stock Mínimo</label>
                  <input
                    type="number"
                    id="stockMinimo"
                    value={formData.stockMinimo}
                    onChange={(e) => setFormData({ ...formData, stockMinimo: e.target.value })}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="precioVenta">Precio de Venta</label>
                  <input
                    type="number"
                    id="precioVenta"
                    value={formData.precioVenta}
                    onChange={(e) => setFormData({ ...formData, precioVenta: e.target.value })}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="ubicacion">Ubicación</label>
                  <input
                    type="text"
                    id="ubicacion"
                    value={formData.ubicacion}
                    onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="fechaIngreso">Fecha de Ingreso</label>
                  <input
                    type="date"
                    id="fechaIngreso"
                    value={formData.fechaIngreso}
                    onChange={(e) => setFormData({ ...formData, fechaIngreso: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="estado">Estado</label>
                  <select
                    id="estado"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {estados.map(estado => (
                      <option key={estado.value} value={estado.value}>{estado.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="descripcion">Descripción</label>
                <textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingItem ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para reserva */}
      {isReservationModalOpen && reservingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Reservar Producto</h2>
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900">{reservingItem.nombre}</h3>
                <p className="text-sm text-gray-600">{reservingItem.codigo} - {reservingItem.categoria}</p>
                <p className="text-sm text-gray-600">Stock disponible: {reservingItem.cantidadstock}</p>
                <p className="text-sm text-gray-600">Precio: CLP {reservingItem.precioventa}</p>
              </div>
              <form onSubmit={handleReservation} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Cantidad a reservar</label>
                  <input
                    type="number"
                    value={reservationData.cantidadReservada}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        handleCantidadReservadaChange('');
                      } else {
                        handleCantidadReservadaChange(parseInt(value) || '');
                      }
                    }}
                    min="1"
                    max={reservingItem.cantidadstock}
                    placeholder="Ingrese cantidad"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Valor de reserva (valor líquido)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500 text-sm">CLP</span>
                    <input
                      type="text"
                      value={`CLP ${parseFloat(reservationData.valorReserva || 0).toLocaleString()}`}
                      readOnly
                      className="w-full pl-12 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                      placeholder="Se calcula automáticamente"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">💰</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Valor líquido total: CLP {(reservationData.cantidadReservada * parseFloat(reservingItem.precioventa || 0)).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cliente</label>
                  <input
                    type="text"
                    value={reservationData.cliente}
                    onChange={(e) => setReservationData({ ...reservationData, cliente: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={reservationData.telefono}
                    onChange={(e) => setReservationData({ ...reservationData, telefono: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notas</label>
                  <textarea
                    value={reservationData.notas}
                    onChange={(e) => setReservationData({ ...reservationData, notas: e.target.value })}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>
              </form>
            </div>
            <div className="border-t bg-gray-50 px-6 py-4 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setIsReservationModalOpen(false);
                  resetReservationForm();
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                onClick={handleReservation}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Crear Reserva
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para venta */}
      {isSaleModalOpen && sellingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Vender Producto</h2>
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900">{sellingItem.nombre}</h3>
                <p className="text-sm text-gray-600">{sellingItem.codigo} - {sellingItem.categoria}</p>
                <p className="text-sm text-gray-600">Stock disponible: {sellingItem.cantidadstock}</p>
                <p className="text-sm text-gray-600">Precio: ${sellingItem.precioventa}</p>
              </div>
              <form onSubmit={handleSale} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="cantidadVendida">Cantidad a vender</label>
                  <input
                    type="number"
                    id="cantidadVendida"
                    value={saleData.cantidadVendida}
                    onChange={(e) => setSaleData({ ...saleData, cantidadVendida: e.target.value })}
                    min="1"
                    max={sellingItem.cantidadstock}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="precioVentaModal">Precio de venta (opcional)</label>
                  <input
                    type="number"
                    id="precioVentaModal"
                    value={saleData.precioVenta}
                    onChange={(e) => setSaleData({ ...saleData, precioVenta: e.target.value })}
                    min="0"
                    step="0.01"
                    placeholder={`Precio por defecto: $${sellingItem.precioventa}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="metodoPago">Método de pago</label>
                  <select
                    id="metodoPago"
                    value={saleData.metodoPago}
                    onChange={(e) => setSaleData({ ...saleData, metodoPago: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {paymentMethods.map(method => (
                      <option key={method.value} value={method.value}>{method.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="notas">Notas (opcional)</label>
                  <textarea
                    id="notas"
                    value={saleData.notas}
                    onChange={(e) => setSaleData({ ...saleData, notas: e.target.value })}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">
                    Total: ${((saleData.precioVenta || sellingItem.precioventa) * saleData.cantidadVendida).toLocaleString()}
                  </p>
                </div>
              </form>
            </div>
            {/* Botones fijos en la parte inferior */}
            <div className="border-t bg-gray-50 px-6 py-4 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setIsSaleModalOpen(false);
                  resetSaleForm();
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                onClick={handleSale}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Confirmar Venta
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}

export default App;