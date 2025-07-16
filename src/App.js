import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Download, Search, Package, TrendingUp, AlertTriangle, FileText } from 'lucide-react';
import './App.css';
import useLocalStorage from './useLocalStorage';
import { createRoot } from 'react-dom/client'; 
import App from './App';




const InventoryApp = () => {
 const [inventory, setInventory] = useState(() => {
  try {
    const saved = localStorage.getItem('inventory');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error leyendo localStorage:', error);
    return [];
  }
});
  const [currentView, setCurrentView] = useState('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    categoria: 'Sábana',
    tamaño: 'individual',
    color: '',
    material: '',
    proveedor: '',
    cantidadStock: '',    // vacíos para que no muestren 0
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
  try {
    localStorage.setItem('inventory', JSON.stringify(inventory));
  } catch (error) {
    console.error('Error guardando en localStorage:', error);
  }
}, [inventory]);

const handleSubmit = () => {
    const itemToSave = {
      ...formData,
      cantidadStock: parseInt(formData.cantidadStock) || 0,
      stockMinimo: parseInt(formData.stockMinimo) || 0,
      precioCompra: parseFloat(formData.precioCompra) || 0,
      precioVenta: parseFloat(formData.precioVenta) || 0,
      fechaIngreso: formData.fechaIngreso || new Date().toISOString().split('T')[0],
    };

    if (editingItem) {
      setInventory(inventory.map(item =>
        item.id === editingItem.id ? { ...itemToSave, id: editingItem.id } : item
      ));
    } else {
      setInventory([...inventory, { ...itemToSave, id: Date.now() }]);
    }

    resetForm();
    setIsModalOpen(false);
  };

  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: '',
      categoria: 'Sábana',
      tamaño: 'individual',
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

  const deleteItem = (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este artículo?')) {
      setInventory(inventory.filter(item => item.id !== id));
    }
  };

  const editItem = (item) => {
    // Para que no haya problemas al mostrar en inputs numéricos:
    setFormData({
      ...item,
      cantidadStock: item.cantidadStock === 0 ? '' : item.cantidadStock,
      stockMinimo: item.stockMinimo === 0 ? '' : item.stockMinimo,
      precioCompra: item.precioCompra === 0 ? '' : item.precioCompra,
      precioVenta: item.precioVenta === 0 ? '' : item.precioVenta,
    });
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.proveedor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = inventory.filter(item => item.cantidadStock <= item.stockMinimo);
  const totalValue = inventory.reduce((sum, item) => sum + (item.cantidadStock * item.precioVenta), 0);
  const totalItems = inventory.reduce((sum, item) => sum + item.cantidadStock, 0);

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
        item.cantidadStock,
        item.stockMinimo,
        item.precioCompra,
        item.precioVenta,
        item.ubicacion,
        item.fechaIngreso,
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
          .reduce((sum, item) => sum + (item.cantidadStock * item.precioVenta), 0)
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
      `- ${item.nombre} (${item.codigo}): ${item.cantidadStock} unidades (Mínimo: ${item.stockMinimo})`
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{item.categoria.replace('_', ' ')}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-900">{item.cantidadStock}</span>
                            {item.cantidadStock <= item.stockMinimo && (
                              <AlertTriangle className="w-4 h-4 text-red-500 ml-2" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.precioVenta.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${item.estado === 'disponible' ? 'bg-green-100 text-green-800' :
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
                  <ul className="list-disc list-inside text-gray-700 mt-2">
                    {categories.slice(1).map(cat => (
                      <li key={cat.value}>
                        {cat.label}: {inventory.filter(item => item.categoria === cat.value).length} items
                      </li>
                    ))}
                  </ul>
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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="space-y-4"
            >
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
                  value={formData.cantidadStock === 0 ? '' : formData.cantidadStock}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cantidadStock: e.target.value === '' ? '' : parseInt(e.target.value),
                    })
                  }
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
                  value={formData.stockMinimo === 0 ? '' : formData.stockMinimo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stockMinimo: e.target.value === '' ? '' : parseInt(e.target.value),
                    })
                  }
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
                  value={formData.precioCompra === 0 ? '' : formData.precioCompra}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      precioCompra: e.target.value === '' ? '' : parseFloat(e.target.value),
                    })
                  }
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
                  value={formData.precioVenta === 0 ? '' : formData.precioVenta}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      precioVenta: e.target.value === '' ? '' : parseFloat(e.target.value),
                    })
                  }
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
                  {estados.map(est => (
                    <option key={est.value} value={est.value}>{est.label}</option>
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
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setIsModalOpen(false);
                  }}
                  className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingItem ? 'Actualizar' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryApp;

