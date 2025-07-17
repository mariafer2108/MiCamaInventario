import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Download, Search, Package, TrendingUp, AlertTriangle, FileText } from 'lucide-react';
import './App.css';
import { fetchInventory, addItem, updateItem, deleteItemFromDB } from './supabaseService';

function App() {
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    categoria: 'Sábana',
    tamaño: '1 plaza',
    color: '',
    material: '',
    proveedor: '',
    cantidadStock: '',
    stockMinimo: '',
    precioCompra: '',
    precioVenta: '',
    ubicacion: '',
    fechaIngreso: new Date().toISOString().split('T')[0],
    estado: 'disponible',
    descripcion: ''
  });

  const categories = [
    { value: 'all', label: 'Todas las categorías' },
    { value: 'Sábana', label: 'Sábanas' },
    { value: 'Almohada', label: 'Almohadas' },
    { value: 'Frazada', label: 'Frazadas' },
    { value: 'Faldon', label: 'Faldón' },
    { value: 'Cubre_colchon', label: 'Cubre colchón' },
    { value: 'Plumones', label: 'Plumones' },
  ];

  const sizes = [
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

  useEffect(() => {
    const loadInventory = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchInventory();
        setInventory(data || []);
      } catch (error) {
        console.error('Error loading inventory:', error);
        setError('Error al cargar el inventario. Por favor, recarga la página.');
        setInventory([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInventory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación básica
    if (!formData.codigo || !formData.nombre) {
      alert('Por favor, completa al menos el código y nombre del artículo.');
      return;
    }

    const newItem = {
      codigo: formData.codigo,
      nombre: formData.nombre,
      categoria: formData.categoria,
      tamaño: formData.tamaño,
      color: formData.color,
      material: formData.material,
      proveedor: formData.proveedor,
      cantidadstock: formData.cantidadStock === '' ? 0 : parseInt(formData.cantidadStock),
      stockminimo: formData.stockMinimo === '' ? 0 : parseInt(formData.stockMinimo),
      preciocompra: formData.precioCompra === '' ? 0 : parseFloat(formData.precioCompra),
      precioventa: formData.precioVenta === '' ? 0 : parseFloat(formData.precioVenta),
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
      
      // Manejo específico de errores
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

  // ... resto de las funciones ...

  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: '',
      categoria: 'Sábana',
      tamaño: '1 plaza',
      color: '',
      material: '',
      proveedor: '',
      cantidadStock: '',
      stockMinimo: '',
      precioCompra: '',
      precioVenta: '',
      ubicacion: '',
      fechaIngreso: new Date().toISOString().split('T')[0],
      estado: 'disponible',
      descripcion: ''
    });
    setEditingItem(null);
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

  const editItem = (item) => {
    setFormData({
      codigo: item.codigo,
      nombre: item.nombre,
      categoria: item.categoria,
      tamaño: item.tamaño,
      color: item.color,
      material: item.material,
      proveedor: item.proveedor,
      cantidadStock: item.cantidadstock === 0 ? '' : item.cantidadstock,
      stockMinimo: item.stockminimo === 0 ? '' : item.stockminimo,
      precioCompra: item.preciocompra === 0 ? '' : item.preciocompra,
      precioVenta: item.precioventa === 0 ? '' : item.precioventa,
      ubicacion: item.ubicacion,
      fechaIngreso: item.fechaingreso,
      estado: item.estado,
      descripcion: item.descripcion
    });
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // Proteger las funciones que usan inventory
  const safeInventory = inventory || [];
  const filteredInventory = safeInventory.filter(item => {
    const matchesSearch = item?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item?.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item?.proveedor?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item?.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = safeInventory.filter(item => item?.cantidadstock <= item?.stockminimo);
  const totalValue = safeInventory.reduce((sum, item) => sum + ((item?.cantidadstock || 0) * (item?.precioventa || 0)), 0);
  const totalItems = safeInventory.reduce((sum, item) => sum + (item?.cantidadstock || 0), 0);

  const exportToCSV = () => {
    const headers = ['Código', 'Nombre', 'Categoría', 'Tamaño', 'Color', 'Material', 'Proveedor', 'Stock', 'Stock Mínimo', 'Precio Compra', 'Precio Venta', 'Ubicación', 'Fecha Ingreso', 'Estado', 'Descripción'];

    const csvContent = [
      headers.join(','),
      ...inventory.map(item => [
        item.codigo,
        item.nombre,
        item.categoria,
        item.tamaño,
        item.color,
        item.material,
        item.proveedor,
        item.cantidadstock,
        item.stockminimo,
        item.preciocompra,
        item.precioventa,
        item.ubicacion,
        item.fechaingreso,
        item.estado,
        item.descripcion
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'inventario_sabanas_cobertores.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateReport = () => {
    const reportData = {
      totalItems,
      totalValue,
      lowStockCount: lowStockItems.length,
      categoryBreakdown: categories.slice(1).map(cat => ({
        category: cat.label,
        count: inventory.filter(item => item.categoria === cat.value).length,
        value: inventory.filter(item => item.categoria === cat.value)
          .reduce((sum, item) => sum + (item.cantidadstock * item.precioventa), 0)
      })),
      topProviders: [...new Set(inventory.map(item => item.proveedor))]
        .map(provider => ({
          provider,
          count: inventory.filter(item => item.proveedor === provider).length
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    };

    const reportContent = `REPORTE DE INVENTARIO - SÁBANAS Y COBERTORES
============================================

RESUMEN GENERAL:
- Total de artículos: ${reportData.totalItems}
- Valor total del inventario: $${reportData.totalValue.toLocaleString()}
- Artículos con stock bajo: ${reportData.lowStockCount}

DESGLOSE POR CATEGORÍA:
${reportData.categoryBreakdown.map(cat =>
      `- ${cat.category}: ${cat.count} artículos (Valor: $${cat.value.toLocaleString()})`
    ).join('\n')}

PRINCIPALES PROVEEDORES:
${reportData.topProviders.map(prov =>
      `- ${prov.provider}: ${prov.count} artículos`
    ).join('\n')}

ARTÍCULOS CON STOCK BAJO:
${lowStockItems.map(item =>
      `- ${item.nombre} (${item.codigo}): ${item.cantidadstock} unidades (Mínimo: ${item.stockminimo})`
    ).join('\n')}

Fecha del reporte: ${new Date().toLocaleDateString()}`;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'reporte_inventario.txt');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

    // Agregar renderizado condicional
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error de Conexión</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Recargar Página
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Sistema de Inventario</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentView('inventory')}
                className={`px-4 py-2 rounded-lg ${currentView === 'inventory' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                <Package className="w-4 h-4 inline mr-2" />
                Inventario
              </button>
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`px-4 py-2 rounded-lg ${currentView === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {currentView === 'inventory' && (
          <>
            <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
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
              </div>
              <div className="flex gap-2">
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exportar CSV
                </button>
                <button
                  onClick={generateReport}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Generar Reporte
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Artículo
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Venta</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInventory.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.codigo}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.nombre}</div>
                          <div className="text-sm text-gray-500">{item.tamaño} - {item.color}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{item.categoria?.replace('_', ' ')}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-900">{item.cantidadstock}</span>
                            {item.cantidadstock <= item.stockminimo && (
                              <AlertTriangle className="w-4 h-4 text-red-500 ml-2" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.precioventa?.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            item.estado === 'disponible' ? 'bg-green-100 text-green-800' :
                            item.estado === 'reservado' ? 'bg-yellow-100 text-yellow-800' :
                            item.estado === 'vendido' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {item.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => editItem(item)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {currentView === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Package className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Artículos</p>
                  <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Valor Total</p>
                  <p className="text-2xl font-bold text-gray-900">${totalValue.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Stock Bajo</p>
                  <p className="text-2xl font-bold text-gray-900">{lowStockItems.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Categorías</p>
                  <div className="text-sm text-gray-700 mt-2">
                    {categories.slice(1).map(cat => (
                      <div key={cat.value}>
                        {cat.label}: {inventory.filter(item => item.categoria === cat.value).length} items
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal para agregar/editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl p-6 overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold mb-4">{editingItem ? 'Editar Artículo' : 'Nuevo Artículo'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Código */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="codigo">Código</label>
                <input
                  type="text"
                  id="codigo"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Nombre */}
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

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="categoria">Categoría</label>
                <select
                  id="categoria"
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {categories.slice(1).map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Tamaño */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="tamaño">Tamaño</label>
                <select
                  id="tamaño"
                  value={formData.tamaño}
                  onChange={(e) => setFormData({ ...formData, tamaño: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {sizes.map(size => (
                    <option key={size.value} value={size.value}>{size.label}</option>
                  ))}
                </select>
              </div>

              {/* Color */}
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

              {/* Material */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="material">Material</label>
                <input
                  type="text"
                  id="material"
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Proveedor */}
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

              {/* Cantidad Stock */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="cantidadStock">Cantidad en Stock</label>
                <input
                  type="number"
                  id="cantidadStock"
                  min="0"
                  value={formData.cantidadStock}
                  onChange={(e) => setFormData({ ...formData, cantidadStock: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Stock Mínimo */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="stockMinimo">Stock Mínimo</label>
                <input
                  type="number"
                  id="stockMinimo"
                  min="0"
                  value={formData.stockMinimo}
                  onChange={(e) => setFormData({ ...formData, stockMinimo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Precio Compra */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="precioCompra">Precio Compra</label>
                <input
                  type="number"
                  id="precioCompra"
                  min="0"
                  step="0.01"
                  value={formData.precioCompra}
                  onChange={(e) => setFormData({ ...formData, precioCompra: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Precio Venta */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="precioVenta">Precio Venta</label>
                <input
                  type="number"
                  id="precioVenta"
                  min="0"
                  step="0.01"
                  value={formData.precioVenta}
                  onChange={(e) => setFormData({ ...formData, precioVenta: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Ubicación */}
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

              {/* Fecha Ingreso */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="fechaIngreso">Fecha de Ingreso</label>
                <input
                  type="date"
                  id="fechaIngreso"
                  value={formData.fechaIngreso}
                  onChange={(e) => setFormData({ ...formData, fechaIngreso: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="estado">Estado</label>
                <select
                  id="estado"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {estados.map(estado => (
                    <option key={estado.value} value={estado.value}>{estado.label}</option>
                  ))}
                </select>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="descripcion">Descripción</label>
                <textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descripción adicional del producto..."
                />
              </div>

              {/* Botones del formulario */}
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {editingItem ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;