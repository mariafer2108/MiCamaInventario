import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Trash2,
  Eye,
  Download,
  Calendar,
  ShoppingCart,
  BarChart3,
  LogOut,
  Edit2,
  DollarSign,
  TrendingUp,
  X
} from 'lucide-react';

// Importar todas las funciones de supabaseService
import {
  getCurrentUser,
  signIn,
  signOut,
  fetchInventory,
  fetchSales,
  addItem,
  updateItem,
  deleteItemFromDB,
  sellProductWithTransfer,
  updateSale,
  deleteSaleFromDB
} from './supabaseService';

// Función para obtener tamaños según categoría
const getTamañosPorCategoria = (categoria) => {
  const tamañosAlmohadas = [
    '40x60 cm (Pequeña)',
    '50x70 cm (Estándar)',
    '50x90 cm (Grande)'
  ];
  
  const tamaños = [
    '1 Plaza', '1 1/2 Plaza', '2 Plaza', 'King', 'Super King'
  ];
  
  if (categoria === 'Almohadas') {
    return tamañosAlmohadas;
  }
  return tamaños;
};

// Componente para tarjetas de inventario en móvil
const MobileInventoryCard = ({ item, setSelectedInventoryDetails, setIsInventoryDetailsModalOpen, sellItem, editItem, deleteItem }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">{item.nombre}</h3>
          <p className="text-sm text-gray-600">{item.categoria}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          item.cantidadstock === 0 ? 'bg-red-100 text-red-800' :
          item.cantidadstock < 5 ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {item.cantidadstock === 0 ? 'Agotado' :
           item.cantidadstock < 5 ? 'Bajo Stock' : 'Disponible'}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Stock</p>
          <p className="font-semibold text-gray-900">{item.cantidadstock}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Precio</p>
          <p className="font-semibold text-green-600">${item.precioventa?.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Tamaño</p>
          <p className="font-semibold text-gray-900">{item.tamaño}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Ubicación</p>
          <p className="font-semibold text-gray-900">{item.ubicacion}</p>
        </div>
      </div>
      
      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <button
          onClick={() => {
            setSelectedInventoryDetails(item);
            setIsInventoryDetailsModalOpen(true);
          }}
          className="text-gray-600 hover:text-gray-800 p-2"
          title="Ver detalles"
        >
          <Eye className="w-5 h-5" />
        </button>
        <button
          onClick={() => sellItem(item)}
          className="text-green-600 hover:text-green-800 p-2"
          disabled={item.cantidadstock === 0}
          title="Vender producto"
        >
          <DollarSign className="w-5 h-5" />
        </button>
        <button
          onClick={() => editItem(item)}
          className="text-blue-600 hover:text-blue-800 p-2"
          title="Editar producto"
        >
          <Edit2 className="w-5 h-5" />
        </button>
        <button
          onClick={() => {
            if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
              deleteItem(item.id);
            }
          }}
          className="text-red-600 hover:text-red-800 p-2"
          title="Eliminar producto"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// Componente para tarjetas de ventas en móvil
const MobileSalesCard = ({ sale, openSaleDetails, openEditSale, deleteSale }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">{sale.nombre}</h3>
          <p className="text-sm text-gray-600">{sale.categoria}</p>
        </div>
        <span className="text-xs text-gray-500">
          {new Date(sale.fecha_venta).toLocaleDateString('es-ES')}
        </span>
      </div>
      
      <div className="mb-3">
        <p className="text-2xl font-bold text-green-600">
          ${sale.total_venta?.toLocaleString()}
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Cantidad</p>
          <p className="font-semibold text-gray-900">{sale.cantidad_vendida}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Precio Unit.</p>
          <p className="font-semibold text-gray-900">${sale.precio_venta?.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Tamaño</p>
          <p className="font-semibold text-gray-900">{sale.tamaño || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Método Pago</p>
          <p className="font-semibold text-gray-900 capitalize">{sale.metodo_pago}</p>
        </div>
      </div>
      
      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <button
          onClick={() => openSaleDetails(sale)}
          className="text-blue-600 hover:text-blue-800 p-2"
          title="Ver detalles"
        >
          <Eye className="w-5 h-5" />
        </button>
        <button
          onClick={() => openEditSale(sale)}
          className="text-orange-600 hover:text-orange-800 p-2"
          title="Editar venta"
        >
          <Edit2 className="w-5 h-5" />
        </button>
        <button
          onClick={() => {
            if (window.confirm('¿Estás seguro de que deseas eliminar esta venta?')) {
              deleteSale(sale.id);
            }
          }}
          className="text-red-600 hover:text-red-800 p-2"
          title="Eliminar venta"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

function App() {

// Estados de autenticación y preloader

const [user, setUser] = useState(null);

const [message, setMessage] = useState({ type: '', text: '' });

const [showPreloader, setShowPreloader] = useState(true);

const [email, setEmail] = useState('');

const [password, setPassword] = useState('');

const [loginError, setLoginError] = useState('');

const [isLoggingIn, setIsLoggingIn] = useState(false);

// Estados principales

const [inventory, setInventory] = useState([]);

const [sales, setSales] = useState([]);



const [currentView, setCurrentView] = useState('inventory');

const [isModalOpen, setIsModalOpen] = useState(false);

const [editingItem, setEditingItem] = useState(null);

const [searchTerm, setSearchTerm] = useState('');

const [categoryFilter, setCategoryFilter] = useState('');

const [ageGroupFilter, setAgeGroupFilter] = useState('');

const [sizeFilter, setSizeFilter] = useState('');
const [locationFilter, setLocationFilter] = useState('');
const [sortBy] = useState('nombre'); // Solo lectura
const [sortOrder] = useState('asc'); // Solo lectura



const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);

const [sellingItem, setSellingItem] = useState(null);

const [isSaleDetailsModalOpen, setIsSaleDetailsModalOpen] = useState(false);

const [selectedSaleDetails, setSelectedSaleDetails] = useState(null);

const [isEditSaleModalOpen, setIsEditSaleModalOpen] = useState(false);

const [editingSale, setEditingSale] = useState(null);

const [isInventoryDetailsModalOpen, setIsInventoryDetailsModalOpen] = useState(false);

const [selectedInventoryDetails, setSelectedInventoryDetails] = useState(null);

const [salesSearchTerm, setSalesSearchTerm] = useState('');

const [salesCategoryFilter, setSalesCategoryFilter] = useState('');

const [salesSortBy] = useState('fecha_venta');

const [salesSortOrder] = useState('desc');

const [salesDateFilter, setSalesDateFilter] = useState('');

const [inventoryDateFilter, setInventoryDateFilter] = useState('');

// Estados para formularios

const [formData, setFormData] = useState({

nombre: '',

categoria: '',

grupoedad: '',

tamaño: '',

color: '',

cantidadstock: '',

precioventa: '',

ubicacion: '',

notas: ''

});

const [saleData, setSaleData] = useState({

cantidadVendida: 1,

precioVenta: '',

metodoPago: 'efectivo',

notas: ''

});

const [editSaleData, setEditSaleData] = useState({

cantidadVendida: '',

precioVenta: '',

fechaVenta: '',

metodoPago: 'efectivo',

notas: ''

});

// Datos de configuración

  const categorias = [

    'Sábanas', 'Almohadas', 'Frazadas', 'Faldón', 'Protector colchón', 'Plumones', 'Quilt','Toalla'

  ];

const gruposEdad = [
'Adulto', 'Infantil'
];

const tamaños = [
'1 Plaza', '1 1/2 Plaza', '2 Plaza', 'King', 'Super King'
];

// Tamaños específicos para almohadas
const tamañosAlmohadas = [
'40x60 cm (Pequeña)',
'50x70 cm (Estándar)', 
'50x90 cm (Grande)'
];

const paymentMethods = [

{ value: 'efectivo', label: 'Efectivo' },

{ value: 'tarjeta_debito', label: 'Tarjeta de Débito' },

{ value: 'tarjeta_credito', label: 'Tarjeta de Crédito' },

{ value: 'transferencia', label: 'Transferencia' },

{ value: 'cheque', label: 'Cheque' },

{ value: 'otro', label: 'Otro' }

];

const ubicaciones = [
  'Local', 'Bodega'
];

const dateFilters = [

{ value: '', label: 'Todas las fechas' },

{ value: 'today', label: 'Hoy' },

{ value: 'yesterday', label: 'Ayer' },

{ value: 'this_week', label: 'Esta semana' },

{ value: 'last_week', label: 'Semana pasada' },

{ value: 'this_month', label: 'Este mes' },

{ value: 'last_month', label: 'Mes pasado' },

{ value: 'this_year', label: 'Este año' }

];

// Efectos
useEffect(() => {
  checkUser();
}, []);

useEffect(() => {
  if (user) {
    // Cargar datos inmediatamente
    loadData();
    
    // Configurar actualización automática cada 30 segundos
    const interval = setInterval(() => {
      loadData();
    }, 30000); // 30 segundos
    
    return () => clearInterval(interval);
  }
}, [user]);

// Agregar actualización cuando la ventana vuelve a tener foco
useEffect(() => {
  const handleFocus = () => {
    if (user) {
      loadData();
    }
  };
  
  window.addEventListener('focus', handleFocus);
  return () => window.removeEventListener('focus', handleFocus);
}, [user]);

useEffect(() => {

const timer = setTimeout(() => {

setShowPreloader(false);

}, 2000);

return () => clearTimeout(timer);

}, []);

// Limpiar tamaño cuando cambie la categoría
useEffect(() => {
  if (formData.categoria && !editingItem) {
    // Solo limpiar si no estamos editando un producto existente
    const tamañosDisponibles = getTamañosPorCategoria(formData.categoria);
    if (formData.tamaño && !tamañosDisponibles.includes(formData.tamaño)) {
      setFormData(prev => ({ ...prev, tamaño: '' }));
    }
  }
}, [formData.categoria, formData.tamaño, editingItem]);

// Funciones de autenticación

const checkUser = async () => {

try {

const currentUser = await getCurrentUser();

setUser(currentUser);

} catch (error) {

console.error('Error checking user:', error);

}

};

const handleLogin = async (e) => {

e.preventDefault();

setIsLoggingIn(true);

setLoginError('');

try {

const user = await signIn(email, password);

setUser(user);

setEmail('');

setPassword('');

} catch (error) {

setLoginError(error.message);

} finally {

setIsLoggingIn(false);

}

};

const handleLogout = async () => {

try {

await signOut();

setUser(null);

setCurrentView('inventory');

} catch (error) {

console.error('Error signing out:', error);

}

};

// Funciones de carga de datos

const loadData = async () => {
  console.log('🔄 Iniciando carga de datos...');
  try {
    const [inventoryData, salesData] = await Promise.all([
      fetchInventory(),
      fetchSales()
    ]);
    setInventory(inventoryData || []);
    setSales(salesData || []);
    console.log('✅ Datos actualizados:', {
      inventario: inventoryData?.length || 0,
      ventas: salesData?.length || 0
    });
  } catch (error) {
    console.error('Error loading data:', error);
    setMessage({ 
      type: 'error', 
      text: 'Error al cargar los datos. Intentando nuevamente...' 
    });
  }
};
  // Funciones de inventario
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔄 Intentando actualizar producto:', editingItem?.id, formData);
    
    // Limpiar mensajes anteriores
    setMessage({ type: '', text: '' });
    
    // Validar campos requeridos
    if (!formData.nombre || !formData.categoria || !formData.cantidadstock || !formData.precioventa) {
      setMessage({ 
        type: 'error', 
        text: 'Por favor, completa todos los campos obligatorios (nombre, categoría, cantidad y precio)' 
      });
      return;
    }
    
    try {
      if (editingItem) {
        await updateItem(editingItem.id, formData);
        setMessage({ 
          type: 'success', 
          text: `Producto "${formData.nombre}" actualizado exitosamente` 
        });
      } else {
        await addItem(formData);
        setMessage({ 
          type: 'success', 
          text: `Producto "${formData.nombre}" agregado exitosamente` 
        });
      }
      
      await loadData();
      
      // Cerrar modal después de un breve delay para mostrar el mensaje
      setTimeout(() => {
        setIsModalOpen(false);
        resetForm();
        setMessage({ type: '', text: '' });
      }, 1500);
      
    } catch (error) {
      console.error('Error saving item:', error);
      
      // Mensaje de error específico basado en el tipo de error
      let errorMessage = 'Error al guardar el producto';
      
      if (error.message && error.message.includes('grupoedad')) {
        errorMessage = 'Error: La columna "grupoedad" no existe en la base de datos. Verifica la configuración de Supabase.';
      } else if (error.message && error.message.includes('PGRST204')) {
        errorMessage = 'Error de base de datos: Columna no encontrada. Verifica la estructura de la tabla.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      setMessage({ 
        type: 'error', 
        text: errorMessage 
      });
    }
  };

  const handleSale = async (e) => {
    e.preventDefault();
    try {
      const saleInfo = {
        cantidadVendida: parseInt(saleData.cantidadVendida),
        precioVenta: parseFloat(saleData.precioVenta || sellingItem.precioventa),
        metodoPago: saleData.metodoPago,
        notas: saleData.notas
      };
      
      await sellProductWithTransfer(sellingItem.id, saleInfo);
      await loadData();
      setIsSaleModalOpen(false);
      resetSaleForm();
      
      // Mostrar mensaje de éxito
      setMessage({ 
        type: 'success', 
        text: 'Venta registrada y stock actualizado exitosamente' 
      });
    } catch (error) {
      console.error('Error processing sale:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Error al procesar la venta' 
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      categoria: '',
      grupoedad: '',
      tamaño: '',
      color: '',
      cantidadstock: '',
      precioventa: '',
      ubicacion: '',
      notas: ''
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
    try {
      await deleteItemFromDB(id);
      await loadData();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const deleteSale = async (id) => {
    try {
      await deleteSaleFromDB(id);
      await loadData();
    } catch (error) {
      console.error('Error deleting sale:', error);
    }
  };

  const openSaleDetails = (sale) => {
    setSelectedSaleDetails(sale);
    setIsSaleDetailsModalOpen(true);
  };

  const closeSaleDetails = () => {
    setSelectedSaleDetails(null);
    setIsSaleDetailsModalOpen(false);
  };

  const openEditSale = (sale) => {
    setEditingSale(sale);
    setEditSaleData({
      cantidadVendida: sale.cantidad_vendida,
      precioVenta: sale.precio_venta,
      fechaVenta: new Date(sale.fecha_venta).toISOString().split('T')[0],
      metodoPago: sale.metodo_pago,
      notas: sale.notas || ''
    });
    setIsEditSaleModalOpen(true);
  };

  const closeEditSale = () => {
    setEditingSale(null);
    setEditSaleData({
      cantidadVendida: '',
      precioVenta: '',
      fechaVenta: '',
      metodoPago: 'efectivo',
      notas: ''
    });
    setIsEditSaleModalOpen(false);
  };

  const handleEditSale = async (e) => {
    e.preventDefault();
    try {
      const updatedSaleData = {
        cantidadVendida: parseInt(editSaleData.cantidadVendida),
        precioVenta: parseFloat(editSaleData.precioVenta),
        fechaVenta: editSaleData.fechaVenta,
        metodoPago: editSaleData.metodoPago,
        notas: editSaleData.notas
      };
      
      await updateSale(editingSale.id, updatedSaleData);
      await loadData();
      closeEditSale();
    } catch (error) {
      console.error('Error updating sale:', error);
    }
  };

  const editItem = (item) => {
    setEditingItem(item);
    setFormData({
      nombre: item.nombre,
      categoria: item.categoria,
      grupoedad: item.grupo_edad || '',
      tamaño: item.tamaño,
      color: item.color,
      cantidadstock: item.cantidadstock,
      precioventa: item.precioventa,
      ubicacion: item.ubicacion,
      notas: item.notas || ''
    });
    setIsModalOpen(true);
  };

  const sellItem = (item) => {
    setSellingItem(item);
    setSaleData({
      cantidadVendida: 1,
      precioVenta: item.precioventa,
      metodoPago: 'efectivo',
      notas: ''
    });
    setIsSaleModalOpen(true);
  };

  // Funciones de filtrado y utilidades
  const filterInventoryByDate = (items, dateFilter) => {
    if (!dateFilter) return items;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return items.filter(item => {
      const itemDate = new Date(item.created_at);
      const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
      
      switch (dateFilter) {
        case 'today':
          return itemDateOnly.getTime() === today.getTime();
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          return itemDateOnly.getTime() === yesterday.getTime();
        case 'this_week':
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          return itemDateOnly >= startOfWeek;
        case 'last_week':
          const startOfLastWeek = new Date(today);
          startOfLastWeek.setDate(today.getDate() - today.getDay() - 7);
          const endOfLastWeek = new Date(today);
          endOfLastWeek.setDate(today.getDate() - today.getDay() - 1);
          return itemDateOnly >= startOfLastWeek && itemDateOnly <= endOfLastWeek;
        case 'this_month':
          return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
        case 'last_month':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          return itemDate.getMonth() === lastMonth.getMonth() && itemDate.getFullYear() === lastMonth.getFullYear();
        case 'this_year':
          return itemDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });
  };

  const filterSalesByDate = (sales, dateFilter) => {
    if (!dateFilter) return sales;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return sales.filter(sale => {
      const saleDate = new Date(sale.fecha_venta);
      const saleDateOnly = new Date(saleDate.getFullYear(), saleDate.getMonth(), saleDate.getDate());
      
      switch (dateFilter) {
        case 'today':
          return saleDateOnly.getTime() === today.getTime();
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          return saleDateOnly.getTime() === yesterday.getTime();
        case 'this_week':
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          return saleDateOnly >= startOfWeek;
        case 'last_week':
          const startOfLastWeek = new Date(today);
          startOfLastWeek.setDate(today.getDate() - today.getDay() - 7);
          const endOfLastWeek = new Date(today);
          endOfLastWeek.setDate(today.getDate() - today.getDay() - 1);
          return saleDateOnly >= startOfLastWeek && saleDateOnly <= endOfLastWeek;
        case 'this_month':
          return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
        case 'last_month':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          return saleDate.getMonth() === lastMonth.getMonth() && saleDate.getFullYear() === lastMonth.getFullYear();
        case 'this_year':
          return saleDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });
  };

  const exportToTXT = () => {
    const filteredInventory = filterInventoryByDate(inventory, inventoryDateFilter)
      .filter(item => {
        const matchesSearch = item.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !categoryFilter || item.categoria === categoryFilter;
        const matchesAgeGroup = !ageGroupFilter || item.grupoedad === ageGroupFilter;
        const matchesSize = !sizeFilter || item.tamaño === sizeFilter;
        const matchesLocation = !locationFilter || item.ubicacion === locationFilter;
        return matchesSearch && matchesCategory && matchesAgeGroup && matchesSize && matchesLocation;
      });

    let content = 'INVENTARIO MICAMA\n';
    content += '='.repeat(50) + '\n\n';
    content += `Fecha de exportación: ${new Date().toLocaleDateString('es-ES')}\n`;
    content += `Total de productos: ${filteredInventory.length}\n\n`;
    
    filteredInventory.forEach((item, index) => {
      content += `${index + 1}. ${item.nombre}\n`;
      content += `   Categoría: ${item.categoria || 'N/A'}\n`;
      content += `   Grupo de Edad: ${item.grupoedad || 'N/A'}\n`;
      content += `   Tamaño: ${item.tamaño || 'N/A'}\n`;
      content += `   Color: ${item.color || 'N/A'}\n`;
      content += `   Stock: ${item.cantidadstock || 0}\n`;
      content += `   Precio Venta: $${item.precioventa || 0}\n`;
      content += `   Ubicación: ${item.ubicacion || 'N/A'}\n`;
      if (item.notas) {
        content += `   Notas: ${item.notas}\n`;
      }
      content += '\n';
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventario_micama_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };



  const exportSalesToTXT = () => {
    const filteredSales = filterSalesByDate(sales, salesDateFilter)
      .filter(sale => {
        const matchesSearch = sale.nombre?.toLowerCase().includes(salesSearchTerm.toLowerCase());
        const matchesCategory = !salesCategoryFilter || sale.categoria === salesCategoryFilter;
        return matchesSearch && matchesCategory;
      });

    let content = 'REPORTE DE VENTAS MICAMA\n';
    content += '='.repeat(50) + '\n\n';
    content += `Fecha de exportación: ${new Date().toLocaleDateString('es-ES')}\n`;
    content += `Total de ventas: ${filteredSales.length}\n`;
    content += `Total vendido: $${filteredSales.reduce((sum, sale) => sum + (sale.total_venta || 0), 0).toLocaleString()}\n\n`;
    
    filteredSales.forEach((sale, index) => {
      content += `${index + 1}. ${sale.nombre}\n`;
      content += `   Fecha: ${new Date(sale.fecha_venta).toLocaleDateString('es-ES')}\n`;
      content += `   Categoría: ${sale.categoria || 'N/A'}\n`;
      content += `   Cantidad: ${sale.cantidad_vendida}\n`;
      content += `   Precio Unitario: $${sale.precio_venta?.toLocaleString() || 0}\n`;
      content += `   Total: $${sale.total_venta?.toLocaleString() || 0}\n`;
      content += `   Método de Pago: ${sale.metodo_pago || 'N/A'}\n`;
      if (sale.notas) {
        content += `   Notas: ${sale.notas}\n`;
      }
      content += '\n';
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ventas_micama_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };



  const getSortedSales = () => {
    let filtered = sales.filter(sale => {
      const matchesSearch = sale.nombre?.toLowerCase().includes(salesSearchTerm.toLowerCase());
      const matchesCategory = !salesCategoryFilter || sale.categoria === salesCategoryFilter;
      return matchesSearch && matchesCategory;
    });

    filtered = filterSalesByDate(filtered, salesDateFilter);

    return filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (salesSortBy) {
        case 'fecha_venta':
          aValue = new Date(a.fecha_venta);
          bValue = new Date(b.fecha_venta);
          break;
        case 'nombre':
          aValue = a.nombre?.toLowerCase() || '';
          bValue = b.nombre?.toLowerCase() || '';
          break;
        case 'total_venta':
          aValue = a.total_venta || 0;
          bValue = b.total_venta || 0;
          break;
        case 'cantidad_vendida':
          aValue = a.cantidad_vendida || 0;
          bValue = b.cantidad_vendida || 0;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return salesSortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return salesSortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const calculateDailyEarnings = () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    return sales
      .filter(sale => {
        let saleDate;
        if (typeof sale.fecha_venta === 'string') {
          saleDate = sale.fecha_venta.split('T')[0];
        } else {
          const date = new Date(sale.fecha_venta);
          saleDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }
        return saleDate === todayStr;
      })
      .reduce((total, sale) => total + (sale.total_venta || 0), 0);
  };

  const calculateUniqueSalesDays = () => {
    if (!sales || sales.length === 0) return 0;
    
    const uniqueDates = new Set();
    
    sales.forEach(sale => {
      // Verificar que la venta tenga fecha válida
      if (!sale.fecha_venta) return;
      
      let saleDate;
      try {
        if (typeof sale.fecha_venta === 'string') {
          // Si es string, tomar solo la parte de la fecha
          saleDate = sale.fecha_venta.split('T')[0];
        } else {
          // Si es objeto Date, convertir a string formato YYYY-MM-DD
          const date = new Date(sale.fecha_venta);
          if (isNaN(date.getTime())) return; // Fecha inválida
          saleDate = date.toISOString().split('T')[0];
        }
        
        // Solo agregar fechas válidas (formato YYYY-MM-DD)
        if (saleDate && saleDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          uniqueDates.add(saleDate);
        }
      } catch (error) {
        console.warn('Error procesando fecha de venta:', sale.fecha_venta, error);
      }
    });
    
    // Debug temporal - puedes remover estas líneas después
    console.log('🔍 Fechas únicas detectadas:', Array.from(uniqueDates));
    console.log('📊 Total días con ventas:', uniqueDates.size);
    
    return uniqueDates.size;
  };

  // Función de debug temporal para días con ventas
  const debugUniqueSalesDays = () => {
    console.log('🔍 DEBUG DÍAS CON VENTAS:');
    console.log('Total de ventas:', sales.length);
    
    const uniqueDates = new Set();
    const dateDetails = [];
    
    sales.forEach((sale, index) => {
      let saleDate;
      if (typeof sale.fecha_venta === 'string') {
        saleDate = sale.fecha_venta.split('T')[0];
      } else {
        const date = new Date(sale.fecha_venta);
        saleDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      }
      
      uniqueDates.add(saleDate);
      dateDetails.push({
        index: index + 1,
        producto: sale.nombre,
        fecha_original: sale.fecha_venta,
        fecha_procesada: saleDate,
        total: sale.total_venta
      });
    });
    
    console.log('Fechas únicas encontradas:', Array.from(uniqueDates));
    console.log('Cantidad de días únicos:', uniqueDates.size);
    console.log('Detalles de cada venta:');
    dateDetails.forEach(detail => {
      console.log(`${detail.index}. ${detail.producto} - ${detail.fecha_procesada} (original: ${detail.fecha_original}) - $${detail.total}`);
    });
    
    // Agrupar por fecha
    const ventasPorFecha = {};
    dateDetails.forEach(detail => {
      if (!ventasPorFecha[detail.fecha_procesada]) {
        ventasPorFecha[detail.fecha_procesada] = [];
      }
      ventasPorFecha[detail.fecha_procesada].push(detail);
    });
    
    console.log('Ventas agrupadas por fecha:');
    Object.keys(ventasPorFecha).forEach(fecha => {
      console.log(`📅 ${fecha}: ${ventasPorFecha[fecha].length} ventas`);
      ventasPorFecha[fecha].forEach(venta => {
        console.log(`   - ${venta.producto}: $${venta.total}`);
      });
    });
  };



  const getDailyEarningsStats = () => {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayEarnings = sales
        .filter(sale => {
          const saleDate = new Date(sale.fecha_venta).toISOString().split('T')[0];
          return saleDate === dateStr;
        })
        .reduce((total, sale) => total + (sale.total_venta || 0), 0);
      
      last7Days.push({
        date: dateStr,
        day: date.toLocaleDateString('es-ES', { weekday: 'short' }),
        earnings: dayEarnings
      });
    }
    
    return last7Days;
  };

  // Estadísticas calculadas
  const totalValue = inventory.reduce((sum, item) => sum + (item.precioventa * item.cantidadstock), 0);
  const totalItems = inventory.reduce((sum, item) => sum + item.cantidadstock, 0);
  const totalSales = sales.reduce((sum, sale) => sum + (sale.total_venta || 0), 0);
  const dailyEarnings = calculateDailyEarnings();
  const dailyStats = getDailyEarningsStats();
  const uniqueSalesDays = calculateUniqueSalesDays();

  // Llamar función de debug
  if (sales.length > 0) {
    debugUniqueSalesDays();
  }



  // Función de debug para el filtro de grupo de edad
  const debugAgeGroupFilter = () => {
    console.log('🔍 DEBUG FILTRO GRUPO DE EDAD:');
    console.log('ageGroupFilter seleccionado:', ageGroupFilter);
    console.log('Productos en inventario:', inventory.length);
    
    // Mostrar todos los valores únicos de grupo_edad en el inventario
    const gruposEdad = [...new Set(inventory.map(item => item.grupo_edad).filter(Boolean))];
    console.log('Grupos de edad disponibles en BD:', gruposEdad);
    
    // Mostrar algunos productos de ejemplo
    console.log('Primeros 3 productos con sus grupos de edad:');
    inventory.slice(0, 3).forEach(item => {
      console.log(`- ${item.nombre}: grupo_edad = "${item.grupo_edad}" (tipo: ${typeof item.grupo_edad})`);
    });
    
    // Mostrar productos filtrados
    if (ageGroupFilter) {
      const filtrados = inventory.filter(item => item.grupo_edad === ageGroupFilter);
      console.log(`Productos que coinciden con "${ageGroupFilter}":`, filtrados.length);
      filtrados.forEach(item => {
        console.log(`- ${item.nombre}: "${item.grupo_edad}"`);
      });
    }
  };

  // Llamar la función cuando cambie el filtro
  if (ageGroupFilter) {
    debugAgeGroupFilter();
  }

  // Filtrado de inventario
  const filteredInventory = filterInventoryByDate(inventory, inventoryDateFilter)
    .filter(item => {
      const matchesSearch = item.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || item.categoria === categoryFilter;
      const matchesAgeGroup = !ageGroupFilter || item.grupo_edad === ageGroupFilter;
      const matchesSize = !sizeFilter || item.tamaño === sizeFilter;
      const matchesLocation = !locationFilter || item.ubicacion === locationFilter;
      return matchesSearch && matchesCategory && matchesAgeGroup && matchesSize && matchesLocation;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'nombre':
          aValue = a.nombre?.toLowerCase() || '';
          bValue = b.nombre?.toLowerCase() || '';
          break;
        case 'categoria':
          aValue = a.categoria?.toLowerCase() || '';
          bValue = b.categoria?.toLowerCase() || '';
          break;
        case 'cantidadstock':
          aValue = a.cantidadstock || 0;
          bValue = b.cantidadstock || 0;
          break;
        case 'precioventa':
          aValue = a.precioventa || 0;
          bValue = b.precioventa || 0;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const sortedSales = getSortedSales();

  // Preloader
  if (showPreloader) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">MiCama Inventario</h2>
          <p className="text-gray-600">Cargando sistema...</p>
        </div>
      </div>
    );
  }

  // Login
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">MiCama</h1>
            <p className="text-gray-600">Sistema de Inventario</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="tu@email.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
            
            {loginError && (
              <div className="text-red-600 text-sm text-center">
                {loginError}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoggingIn ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="gradient-bg shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo y título */}
            <div className="flex items-center gap-4">
              <div className="bg-white p-2 rounded-lg shadow-md">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="show-mobile">
                <h1 className="text-xl font-bold text-gray-800">MiCama</h1>
                <p className="text-sm text-gray-600 hidden sm:block">Sistema de Inventario</p>
              </div>
            </div>
            
            {/* Navegación y botones */}
            <div className="flex items-center space-x-1 sm:space-x-3">
              <div className="flex space-x-1 sm:space-x-2">
                <button
                  onClick={() => setCurrentView('inventory')}
                  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    currentView === 'inventory'
                      ? 'bg-yellow-500 text-white shadow-md'
                      : 'bg-white/20 text-gray-800 hover:bg-white/30'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span className="hidden sm:inline">Inventario</span>
                  <span className="sm:hidden">Inv</span>
                </button>
                <button
                  onClick={() => setCurrentView('sales')}
                  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    currentView === 'sales'
                      ? 'bg-yellow-500 text-white shadow-md'
                      : 'bg-white/20 text-gray-800 hover:bg-white/30'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span className="hidden sm:inline">Ventas</span>
                  <span className="sm:hidden">Ven</span>
                </button>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    currentView === 'dashboard'
                      ? 'bg-yellow-500 text-white shadow-md'
                      : 'bg-white/20 text-gray-800 hover:bg-white/30'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                  <span className="sm:hidden">Dash</span>
                </button>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 sm:gap-2 bg-red-500/90 text-white px-2 sm:px-4 py-2 rounded-lg hover:bg-red-600 text-xs sm:text-sm font-medium transition-all shadow-md"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Date Filter */}
      <div className="bg-orange-100 border-l-4 border-orange-500 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-4 items-center">
            {currentView === 'inventory' && (
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Filtrar por fecha:</span>
                <select
                  value={inventoryDateFilter}
                  onChange={(e) => setInventoryDateFilter(e.target.value)}
                  className="text-sm border border-orange-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="2025">2025</option>
                  {dateFilters.map(filter => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>
                <select
                  className="text-sm border border-orange-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option>Todos los meses</option>
                </select>
              </div>
            )}
            
            {currentView === 'sales' && (
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Filtrar por fecha:</span>
                <select
                  value={salesDateFilter}
                  onChange={(e) => setSalesDateFilter(e.target.value)}
                  className="text-sm border border-orange-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  {dateFilters.map(filter => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>



      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Inventory View */}
        {currentView === 'inventory' && (
          <div>
            {/* Inventory Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-2xl font-bold text-gray-900">Inventario</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={exportToTXT}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center text-sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center text-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Producto
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-wrap gap-4 items-center mb-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o categoría"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-48"
                >
                  <option value="">Todas las categorías</option>
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                
                <select
                  value={sizeFilter}
                  onChange={(e) => setSizeFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-48"
                >
                  <option value="">Todos los tamaños</option>
                  {[...tamaños, ...tamañosAlmohadas].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-48"
                >
                  <option value="">Todas las ubicaciones</option>
                  {ubicaciones.map(ubicacion => (
                    <option key={ubicacion} value={ubicacion}>{ubicacion}</option>
                  ))}
                </select>
                
                <select
                  value={ageGroupFilter}
                  onChange={(e) => setAgeGroupFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-48"
                >
                  <option value="">Todas las edades</option>
                  {gruposEdad.map(grupo => (
                    <option key={grupo} value={grupo}>{grupo}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Mostrando {filteredInventory.length} de {inventory.length} artículos
                </div>
              </div>
            </div>

            {/* Grid de productos como en la imagen - Desktop */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredInventory.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  {/* Ícono del producto */}
                  <div className="flex items-center mb-3">
                    <div className="bg-blue-100 rounded-lg p-2 mr-3">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 product-title-multiline">{item.nombre}</h3>
                      <p className="text-sm text-gray-500">{item.categoria}</p>
                    </div>
                  </div>
                  
                  {/* Información del producto */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Categoría:</span>
                      <span className="font-medium">{item.categoria}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Stock:</span>
                      <span className={`font-medium ${
                        item.cantidadstock === 0 ? 'text-red-600' : 
                        item.cantidadstock < 5 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {item.cantidadstock} {item.cantidadstock === 0 && '⚠️'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Precio:</span>
                      <span className="font-medium text-green-600">
                        ${item.precioventa?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tamaño:</span>
                      <span className="font-medium">{item.tamaño}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Estado:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.cantidadstock === 0 ? 'bg-red-100 text-red-800' :
                        item.cantidadstock < 5 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {item.cantidadstock === 0 ? 'vendido' :
                         item.cantidadstock < 5 ? 'bajo stock' : 'disponible'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Botones de acción */}
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setSelectedInventoryDetails(item);
                        setIsInventoryDetailsModalOpen(true);
                      }}
                      className="text-gray-600 hover:text-gray-800 p-1"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => sellItem(item)}
                      className="text-green-600 hover:text-green-800 p-1"
                      disabled={item.cantidadstock === 0}
                      title="Vender producto"
                    >
                      <DollarSign className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => editItem(item)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Editar producto"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
                          deleteItem(item.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Inventory Grid - Mobile */}
            <div className="md:hidden">
              {filteredInventory.length > 0 ? (
                filteredInventory.map((item) => (
                  <MobileInventoryCard 
                    key={item.id} 
                    item={item} 
                    setSelectedInventoryDetails={setSelectedInventoryDetails}
                    setIsInventoryDetailsModalOpen={setIsInventoryDetailsModalOpen}
                    sellItem={sellItem}
                    editItem={editItem}
                    deleteItem={deleteItem}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No se encontraron productos</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sales View */}
        {currentView === 'sales' && (
          <div>
            {/* Ganancias por Día */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-2 rounded-lg mr-3">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Ganancias por Día</h2>
              </div>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
                <div className="bg-green-50 rounded-lg p-3 sm:p-4 border border-green-200">
                  <div className="flex items-center mb-2">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-2" />
                    <span className="text-xs sm:text-sm font-medium text-green-800">Total Ganancias</span>
                  </div>
                  <p className="text-lg sm:text-2xl font-bold text-green-900">${totalSales.toLocaleString()}</p>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
                  <div className="flex items-center mb-2">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2" />
                    <span className="text-xs sm:text-sm font-medium text-blue-800">Promedio Diario</span>
                  </div>
                  <p className="text-lg sm:text-2xl font-bold text-blue-900">${uniqueSalesDays > 0 ? Math.round(totalSales / uniqueSalesDays).toLocaleString() : '0'}</p>
                </div>
              </div>
            </div>

            {/* Sales Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre..."
                      value={salesSearchTerm}
                      onChange={(e) => setSalesSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>
                
                <select
                  value={salesCategoryFilter}
                  onChange={(e) => setSalesCategoryFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">Todas las categorías</option>
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                
                <button
                  onClick={exportSalesToTXT}
                  className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 flex items-center justify-center text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar TXT
                </button>
              </div>
            </div>

            {/* Sales Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {sortedSales.map((sale) => (
                <div key={sale.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="text-xs text-gray-500">{new Date(sale.fecha_venta).toLocaleDateString('es-ES')}</span>
                  </div>
                  
                  <h3 className="font-bold text-gray-900 mb-1">{sale.nombre}</h3>
                  <p className="text-2xl font-bold text-green-600 mb-2">${sale.total_venta?.toLocaleString()}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Categoría • Tamaño</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-900">{sale.categoria} • {sale.tamaño || 'N/A'}</span>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center">
                        <span className="text-blue-600 mr-1">#</span>
                        <span className="text-sm font-medium">Cantidad</span>
                        <span className="text-green-600 ml-2">{sale.cantidad_vendida}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-green-600 mr-1">$</span>
                        <span className="text-sm font-medium">Precio Unit.</span>
                        <span className="text-green-600 ml-2">${sale.precio_venta?.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between pt-2">
                      <span className="text-gray-600">Método de Pago</span>
                    </div>
                    <div className="text-gray-900 capitalize font-medium">{sale.metodo_pago}</div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-4">
                    <button
                      onClick={() => openSaleDetails(sale)}
                      className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditSale(sale)}
                      className="text-orange-600 hover:text-orange-800 p-1 rounded transition-colors"
                      title="Editar venta"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('¿Estás seguro de que deseas eliminar esta venta?')) {
                          deleteSale(sale.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                      title="Eliminar venta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Sales Grid - Mobile */}
            <div className="md:hidden">
              {sortedSales.length > 0 ? (
                sortedSales.map((sale) => (
                  <MobileSalesCard 
                    key={sale.id} 
                    sale={sale} 
                    openSaleDetails={openSaleDetails}
                    openEditSale={openEditSale}
                    deleteSale={deleteSale}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No se encontraron ventas</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dashboard View */}
        {currentView === 'dashboard' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
            
            {/* Stats Cards - Desktop */}
            <div className="hidden md:grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Package className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Productos</p>
                    <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Valor Total Inventario</p>
                    <p className="text-2xl font-bold text-gray-900">${totalValue.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Ventas</p>
                    <p className="text-2xl font-bold text-gray-900">${totalSales.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Ventas Hoy</p>
                    <p className="text-2xl font-bold text-gray-900">${dailyEarnings.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards - Mobile */}
            <div className="md:hidden grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-center">
                  <Package className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-xs font-medium text-gray-500">Productos</p>
                  <p className="text-lg font-bold text-gray-900">{totalItems}</p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-center">
                  <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <p className="text-xs font-medium text-gray-500">Valor Inventario</p>
                  <p className="text-lg font-bold text-gray-900">${(totalValue/1000).toFixed(0)}K</p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-center">
                  <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-xs font-medium text-gray-500">Total Ventas</p>
                  <p className="text-lg font-bold text-gray-900">${(totalSales/1000).toFixed(0)}K</p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-center">
                  <Calendar className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                  <p className="text-xs font-medium text-gray-500">Ventas Hoy</p>
                  <p className="text-lg font-bold text-gray-900">${dailyEarnings.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Daily Earnings Chart - Desktop */}
            <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Ventas de los últimos 7 días</h3>
              <div className="flex items-end space-x-2 h-40">
                {dailyStats.map((day, index) => {
                  const maxEarnings = Math.max(...dailyStats.map(d => d.earnings));
                  const height = maxEarnings > 0 ? (day.earnings / maxEarnings) * 100 : 0;
                  
                  return (
                                         <div key={index} className="flex-1 flex flex-col items-center">
                       <div 
                         className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600 mb-2"
                         style={{ height: `${height}%` }}
                         title={`${day.date}: $${day.earnings.toLocaleString()}`}
                       ></div>
                       <div className="text-xs text-gray-600 text-center">
                         <div className="font-medium">{day.day}</div>
                         <div>${day.earnings.toLocaleString()}</div>
                       </div>
                     </div>
                   );
                 })}
               </div>
             </div>

             {/* Daily Earnings Chart - Mobile */}
             <div className="md:hidden bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
               <h3 className="text-lg font-medium text-gray-900 mb-4">Ventas de los últimos 7 días</h3>
               <div className="space-y-3">
                 {dailyStats.map((day, index) => {
                   const maxEarnings = Math.max(...dailyStats.map(d => d.earnings));
                   const percentage = maxEarnings > 0 ? (day.earnings / maxEarnings) * 100 : 0;
                   
                   return (
                     <div key={index} className="flex items-center space-x-3">
                       <div className="w-12 text-xs text-gray-600 font-medium">{day.day}</div>
                       <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                         <div 
                           className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                           style={{ width: `${percentage}%` }}
                         ></div>
                       </div>
                       <div className="w-20 text-xs text-gray-900 font-medium text-right">
                         ${day.earnings.toLocaleString()}
                       </div>
                     </div>
                   );
                 })}
               </div>
           </div>
          </div>
        )}
      </main>

      {/* Modal para agregar/editar producto */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingItem ? 'Editar Producto' : 'Agregar Producto'}
              </h2>
              
              {/* Mensaje de estado */}
              {message.text && (
                <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'} mb-4`}>
                  <div className="flex items-center">
                    {message.type === 'error' ? (
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span>{message.text}</span>
                  </div>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Categoría</label>
                    <select
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar categoría</option>
                      {categorias.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Grupo de Edad</label>
                    <select
                      value={formData.grupoedad}
                      onChange={(e) => setFormData({ ...formData, grupoedad: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar grupo</option>
                      {gruposEdad.map(grupo => (
                        <option key={grupo} value={grupo}>{grupo}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Tamaño</label>
                    <select
                      value={formData.tamaño}
                      onChange={(e) => setFormData({ ...formData, tamaño: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar tamaño</option>
                      {getTamañosPorCategoria(formData.categoria).map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Color</label>
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Stock *</label>
                    <input
                      type="number"
                      value={formData.cantidadstock}
                      onChange={(e) => setFormData({ ...formData, cantidadstock: e.target.value })}
                      min="0"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Precio Venta *</label>
                    <input
                      type="number"
                      value={formData.precioventa}
                      onChange={(e) => setFormData({ ...formData, precioventa: e.target.value })}
                      min="0"
                      step="0.01"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Ubicación</label>
                  <select
                    value={formData.ubicacion}
                    onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar ubicación</option>
                    {ubicaciones.map(ubicacion => (
                      <option key={ubicacion} value={ubicacion}>{ubicacion}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Notas</label>
                  <textarea
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>
              </form>
            </div>
            <div className="border-t bg-gray-50 px-6 py-4 flex justify-end space-x-2">
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
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingItem ? 'Actualizar' : 'Agregar'}
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
                <p className="text-sm text-gray-600">{sellingItem.categoria}</p>
                <p className="text-sm text-gray-600">Stock disponible: {sellingItem.cantidadstock}</p>
                <p className="text-sm text-gray-600">Precio: ${sellingItem.precioventa}</p>
              </div>
              <form onSubmit={handleSale} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Cantidad a vender</label>
                  <input
                    type="number"
                    value={saleData.cantidadVendida}
                    onChange={(e) => setSaleData({ ...saleData, cantidadVendida: e.target.value })}
                    min="1"
                    max={sellingItem.cantidadstock}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Precio de venta (opcional)</label>
                  <input
                    type="number"
                    value={saleData.precioVenta}
                    onChange={(e) => setSaleData({ ...saleData, precioVenta: e.target.value })}
                    min="0"
                    step="0.01"
                    placeholder={`Precio por defecto: $${sellingItem.precioventa}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Método de pago</label>
                  <select
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
                  <label className="block text-sm font-medium mb-1">Notas (opcional)</label>
                  <textarea
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

      {/* Modal de detalles de venta */}
      {isSaleDetailsModalOpen && selectedSaleDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Detalles de la Venta</h3>
              <button
                onClick={closeSaleDetails}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedSaleDetails.fecha_venta).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedSaleDetails.fecha_venta).toLocaleTimeString('es-ES', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                <p className="text-sm text-gray-900 font-medium">{selectedSaleDetails.nombre}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <p className="text-sm text-gray-900">{selectedSaleDetails.categoria}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño</label>
                  <p className="text-sm text-gray-900">{selectedSaleDetails.tamaño}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                  <p className="text-sm text-gray-900">{selectedSaleDetails.cantidad_vendida}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio Unitario</label>
                  <p className="text-sm text-gray-900">${selectedSaleDetails.precio_venta?.toLocaleString()}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                <p className="text-lg font-bold text-gray-900">${selectedSaleDetails.total_venta?.toLocaleString()}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                <p className="text-sm text-gray-900 capitalize">{selectedSaleDetails.metodo_pago}</p>
              </div>
              
              {selectedSaleDetails.notas && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                  <div className="bg-gray-50 rounded-md p-3">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedSaleDetails.notas}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={closeSaleDetails}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  openEditSale(selectedSaleDetails);
                  closeSaleDetails();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={() => {
                  if (window.confirm('¿Estás seguro de que deseas eliminar esta venta?')) {
                    deleteSale(selectedSaleDetails.id);
                    closeSaleDetails();
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar venta */}
      {isEditSaleModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Editar Venta</h3>
                <button
                  onClick={closeEditSale}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {editingSale && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Información del Producto</h4>
                  <p className="text-sm text-gray-600">
                    <strong>Producto:</strong> {editingSale.nombre}<br/>
                    <strong>Categoría:</strong> {editingSale.categoria}<br/>
                    <strong>Tamaño:</strong> {editingSale.tamaño}<br/>
                    <strong>Color:</strong> {editingSale.color}<br/>
                    <strong>Fecha de Venta:</strong> {new Date(editingSale.fecha_venta).toLocaleDateString('es-ES')}
                  </p>
                </div>
              )}
              
              <form onSubmit={handleEditSale} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantidad Vendida *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editSaleData.cantidadVendida}
                      onChange={(e) => setEditSaleData({...editSaleData, cantidadVendida: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio de Venta *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editSaleData.precioVenta}
                      onChange={(e) => setEditSaleData({...editSaleData, precioVenta: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Venta *
                  </label>
                  <input
                    type="date"
                    value={editSaleData.fechaVenta}
                    onChange={(e) => setEditSaleData({...editSaleData, fechaVenta: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Método de Pago
                  </label>
                  <select
                    value={editSaleData.metodoPago}
                    onChange={(e) => setEditSaleData({...editSaleData, metodoPago: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {paymentMethods.map(method => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas
                  </label>
                  <textarea
                    value={editSaleData.notas}
                    onChange={(e) => setEditSaleData({...editSaleData, notas: e.target.value})}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Notas adicionales sobre la venta..."
                  />
                </div>
                
                {editSaleData.cantidadVendida && editSaleData.precioVenta && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Total de la venta:</strong> ${(parseFloat(editSaleData.precioVenta) * parseInt(editSaleData.cantidadVendida)).toLocaleString()}
                    </p>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeEditSale}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Actualizar Venta
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalles del inventario */}
      {isInventoryDetailsModalOpen && selectedInventoryDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Detalles del Producto</h3>
              <button
                onClick={() => {
                  setSelectedInventoryDetails(null);
                  setIsInventoryDetailsModalOpen(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto</label>
                <p className="text-sm text-gray-900 font-medium">{selectedInventoryDetails.nombre}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <p className="text-sm text-gray-900">{selectedInventoryDetails.categoria}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grupo de Edad</label>
                  <p className="text-sm text-gray-900">{selectedInventoryDetails.grupo_edad || 'Adulto'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño</label>
                  <p className="text-sm text-gray-900">{selectedInventoryDetails.tamaño}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <p className="text-sm text-gray-900">{selectedInventoryDetails.color || 'N/A'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Disponible</label>
                  <p className={`text-sm font-medium ${
                    selectedInventoryDetails.cantidadstock === 0 ? 'text-red-600' : 
                    selectedInventoryDetails.cantidadstock < 5 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {selectedInventoryDetails.cantidadstock} unidades
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio de Venta</label>
                  <p className="text-sm text-gray-900 font-medium">
                    ${selectedInventoryDetails.precioventa?.toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                <p className="text-sm text-gray-900">{selectedInventoryDetails.ubicacion || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedInventoryDetails.cantidadstock === 0 ? 'bg-red-100 text-red-800' :
                  selectedInventoryDetails.cantidadstock < 5 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {selectedInventoryDetails.cantidadstock === 0 ? 'Agotado' :
                   selectedInventoryDetails.cantidadstock < 5 ? 'Bajo Stock' : 'Disponible'}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Creación</label>
                <p className="text-sm text-gray-900">
                  {selectedInventoryDetails.created_at ? 
                    new Date(selectedInventoryDetails.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'N/A'
                  }
                </p>
              </div>
              
              {selectedInventoryDetails.notas && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                  <div className="bg-gray-50 rounded-md p-3">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedInventoryDetails.notas}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => {
                  setSelectedInventoryDetails(null);
                  setIsInventoryDetailsModalOpen(false);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  editItem(selectedInventoryDetails);
                  setSelectedInventoryDetails(null);
                  setIsInventoryDetailsModalOpen(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={() => {
                  sellItem(selectedInventoryDetails);
                  setSelectedInventoryDetails(null);
                  setIsInventoryDetailsModalOpen(false);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                disabled={selectedInventoryDetails.cantidadstock === 0}
              >
                <DollarSign className="w-4 h-4" />
                Vender
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}

export default App;