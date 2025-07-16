import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Download, Search, Package, TrendingUp, AlertTriangle, FileText } from 'lucide-react';
import './App.css';

const InventoryApp = () => {
  const [inventory, setInventory] = useState([]);
  const [currentView, setCurrentView] = useState('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    categoria: 'sabana',
    tamaño: 'individual',
    color: '',
    material: '',
    proveedor: '',
    cantidadStock: 0,
    stockMinimo: 5,
    precioCompra: 0,
    precioVenta: 0,
    ubicacion: '',
    fechaIngreso: new Date().toISOString().split('T')[0],
    estado: 'disponible',
    descripcion: ''
  });

  const categories = [
    { value: 'all', label: 'Todas las categorías' },
    { value: 'sabana', label: 'Sábanas' },
    { value: 'cobertor', label: 'Cobertores' },
    { value: 'juego_completo', label: 'Juego completo' }
  ];

  const sizes = [
    { value: 'individual', label: 'Individual' },
    { value: 'matrimonial', label: 'Matrimonial' },
    { value: 'queen', label: 'Queen' },
    { value: 'king', label: 'King' }
  ];

  const estados = [
    { value: 'disponible', label: 'Disponible' },
    { value: 'reservado', label: 'Reservado' },
    { value: 'vendido', label: 'Vendido' },
    { value: 'dañado', label: 'Dañado' }
  ];

  useEffect(() => {
    const savedInventory = localStorage.getItem('inventory');
    if (savedInventory) {
      setInventory(JSON.parse(savedInventory));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('inventory', JSON.stringify(inventory));
  }, [inventory]);

  const handleSubmit = () => {
    if (editingItem) {
      setInventory(inventory.map(item => 
        item.id === editingItem.id ? { ...formData, id: editingItem.id } : item
      ));
    } else {
      const newItem = {
        ...formData,
        id: Date.now(),
        fechaIngreso: formData.fechaIngreso || new Date().toISOString().split('T')[0]
      };
      setInventory([...inventory, newItem]);
    }
    
    resetForm();
    setIsModalOpen(false);
  };

  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: '',
      categoria: 'sabana',
      tamaño: 'individual',
      color: '',
      material: '',
      proveedor: '',
      cantidadStock: 0,
      stockMinimo: 5,
      precioCompra: 0,
      precioVenta: 0,
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
    setFormData(item);
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
                  <p className="text-sm font-medium text-gray-500">Productos Únicos</p>
                  <p className="text-2xl font-bold text-gray-900">{inventory.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingItem ? 'Editar Artículo' : 'Nuevo Artículo'}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                    <input
                      type="text"
                      value={formData.codigo}
                      onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                    <select
                      value={formData.categoria}
                      onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="sabana">Sábana</option>
                      <option value="cobertor">Cobertor</option>
                      <option value="juego_completo">Juego completo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño</label>
                    <select
                      value={formData.tamaño}
                      onChange={(e) => setFormData({...formData, tamaño: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {sizes.map(size => (
                        <option key={size.value} value={size.value}>{size.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({...formData, color: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                    <input
                      type="text"
                      value={formData.material}
                      onChange={(e) => setFormData({...formData, material: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                    <input
                      type="text"
                      value={formData.proveedor}
                      onChange={(e) => setFormData({...formData, proveedor: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad en Stock</label>
                    <input
                      type="number"
                      value={formData.cantidadStock}
                      onChange={(e) => setFormData({...formData, cantidadStock: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
                    <input
                      type="number"
                      value={formData.stockMinimo}
                      onChange={(e) => setFormData({...formData, stockMinimo: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio de Compra</label>
                    <input
                      type="number"
                      value={formData.precioCompra}
                      onChange={(e) => setFormData({...formData, precioCompra: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio de Venta</label>
                    <input
                      type="number"
                      value={formData.precioVenta}
                      onChange={(e) => setFormData({...formData, precioVenta: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                    <input
                      type="text"
                      value={formData.ubicacion}
                      onChange={(e) => setFormData({...formData, ubicacion: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <select
                      value={formData.estado}
                      onChange={(e) => setFormData({...formData, estado: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {estados.map(estado => (
                        <option key={estado.value} value={estado.value}>{estado.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingItem ? 'Actualizar' : 'Agregar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryApp;
