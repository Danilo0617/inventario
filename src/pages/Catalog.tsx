import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { ProductName, ProductType, Product } from '../types';
import { Plus, Save, AlertTriangle, CheckCircle, AlertCircle, Edit2, Trash2, X } from 'lucide-react';
import { formatNumber } from '../utils/format';

const Catalog = () => {
  const { products, addProduct, updateProduct, deleteProduct, currentUser } = useInventory();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    code: '',
    name: '' as ProductName,
    type: 'Plancha' as ProductType,
    height: '' as string | number,
    width: '' as string | number,
    minQuantity: '5' as string | number,
    maxQuantity: '100' as string | number
  });

  const area = (Number(formData.height) || 0) * (Number(formData.width) || 0);

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      type: 'Plancha',
      height: '',
      width: '',
      minQuantity: '5',
      maxQuantity: '100'
    });
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleEdit = (product: Product) => {
    setFormData({
      code: product.code,
      name: product.name,
      type: product.type,
      height: product.height || '',
      width: product.width || '',
      minQuantity: product.minQuantity,
      maxQuantity: product.maxQuantity
    });
    setEditingId(product.id);
    setIsFormOpen(true);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este producto? Esta acción no se puede deshacer.')) {
      await deleteProduct(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData = {
      code: formData.code,
      name: formData.name,
      type: formData.type,
      minQuantity: Number(formData.minQuantity) || 5,
      maxQuantity: Number(formData.maxQuantity) || 100,
      // Si están vacíos, se envían como undefined para que la base de datos los guarde como NULL
      height: formData.height ? Number(formData.height) : undefined,
      width: formData.width ? Number(formData.width) : undefined,
      area: formData.type === 'Plancha' && area > 0 ? area : undefined
    };

    if (editingId) {
      await updateProduct(editingId, productData);
    } else {
      await addProduct({
        ...productData,
        quantity: 0,
        cost: 0
      });
    }
    
    resetForm();
  };

  // Función para determinar el estado visual
  const getStockStatus = (qty: number, min: number, max: number) => {
    if (qty <= min) {
      return {
        label: 'Bajo',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: <AlertCircle size={14} />,
        barColor: 'bg-red-500'
      };
    } else if (qty >= max) {
      return {
        label: 'Alto',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircle size={14} />,
        barColor: 'bg-green-500'
      };
    } else {
      return {
        label: 'Medio',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <AlertTriangle size={14} />,
        barColor: 'bg-yellow-500'
      };
    }
  };

  const isAdmin = currentUser?.role === 'Admon';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Catálogo y Reglas</h2>
        
        {isAdmin && (
          <button 
            onClick={() => {
              resetForm();
              setIsFormOpen(!isFormOpen);
            }}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            {isFormOpen ? <X size={20} /> : <Plus size={20} />}
            {isFormOpen ? 'Cancelar' : 'Nuevo Producto'}
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg border border-gray-200 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-700">
            {editingId ? 'Editar Producto' : 'Agregar Nuevo Producto'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
              <input 
                type="text" 
                required
                placeholder="Ej: MAR-001"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                value={formData.code}
                onChange={e => setFormData({...formData, code: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Producto</label>
              <input 
                type="text"
                required
                placeholder="Ej: Mármol Carrara"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select 
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value as ProductType})}
              >
                <option value="Plancha">Plancha</option>
                <option value="Unidad">Unidad</option>
              </select>
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span> Mínimo
                </label>
                <input 
                  type="number" 
                  min="0"
                  required
                  placeholder="5"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  value={formData.minQuantity}
                  onChange={e => setFormData({...formData, minQuantity: e.target.value})}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span> Máximo
                </label>
                <input 
                  type="number" 
                  min="0"
                  required
                  placeholder="100"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  value={formData.maxQuantity}
                  onChange={e => setFormData({...formData, maxQuantity: e.target.value})}
                />
              </div>
            </div>

            {formData.type === 'Plancha' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alto (m) <span className="text-gray-400 font-normal text-xs">(Opcional)</span>
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    // Removed required attribute
                    placeholder="0.00"
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                    value={formData.height}
                    onChange={e => setFormData({...formData, height: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ancho (m) <span className="text-gray-400 font-normal text-xs">(Opcional)</span>
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    // Removed required attribute
                    placeholder="0.00"
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                    value={formData.width}
                    onChange={e => setFormData({...formData, width: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Área (m²)</label>
                  <input 
                    type="text" 
                    readOnly
                    className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-500"
                    value={area > 0 ? formatNumber(area) : ''}
                    placeholder="0.00"
                  />
                </div>
              </>
            )}

            <div className="md:col-span-2 lg:col-span-4 flex justify-end mt-4 gap-2">
              <button 
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center justify-center gap-2"
              >
                <Save size={20} />
                {editingId ? 'Actualizar Producto' : 'Guardar Producto'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Detail View at Bottom */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-700">Detalle de Inventario</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dimensiones</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Estado de Stock (Reglas)</th>
                {isAdmin && (
                  <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => {
                const status = getStockStatus(product.quantity, product.minQuantity, product.maxQuantity);
                const percent = Math.min(100, Math.max(0, (product.quantity / product.maxQuantity) * 100));
                
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.code}</td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.name}</td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.type === 'Plancha' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                        {product.type}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.type === 'Plancha' && product.height && product.width 
                        ? `${formatNumber(product.height)}m x ${formatNumber(product.width)}m` 
                        : '-'}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-bold text-gray-800">{formatNumber(product.quantity, 0)} Unid.</span>
                          <span className={`px-2 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full border gap-1 items-center ${status.color}`}>
                            {status.icon} {status.label}
                          </span>
                        </div>
                        {/* Visual Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className={`h-2.5 rounded-full ${status.barColor} transition-all duration-500`} 
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                          <span>Min: {product.minQuantity}</span>
                          <span>Max: {product.maxQuantity}</span>
                        </div>
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(product)}
                            className="text-blue-600 hover:text-blue-900 p-1.5 hover:bg-blue-50 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-900 p-1.5 hover:bg-red-50 rounded transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Catalog;
