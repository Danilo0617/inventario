import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { MovementType } from '../types';
import { ArrowRightLeft, History, Ruler, Box, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatNumber, formatCurrency } from '../utils/format';

type InputMode = 'quantity' | 'measure';

const Movements = () => {
  const { products, movements, addMovement } = useInventory();
  
  // Estado para controlar el modo de entrada (Cantidad vs Medida)
  const [inputMode, setInputMode] = useState<InputMode>('quantity');

  const [formData, setFormData] = useState({
    type: 'Ingreso' as MovementType,
    productId: '',
    quantity: '' as string | number,
    height: '' as string | number,
    width: '' as string | number,
    warehouse: 'Principal',
    notes: '',
    cost: '' as string | number // Nuevo campo para costo
  });

  const selectedProduct = products.find(p => p.id === formData.productId);

  // Calcular área para visualización
  const area = (Number(formData.height) || 0) * (Number(formData.width) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    // Lógica para cantidad:
    // Si el usuario ingresó valor, se usa. Si está vacío, es 0.
    // Ya NO asumimos 1 por defecto.
    let finalQuantity = Number(formData.quantity);
    
    addMovement({
      type: formData.type,
      productId: formData.productId,
      productName: selectedProduct.name,
      quantity: finalQuantity,
      height: inputMode === 'measure' && formData.height ? Number(formData.height) : undefined,
      width: inputMode === 'measure' && formData.width ? Number(formData.width) : undefined,
      warehouse: formData.warehouse,
      notes: formData.notes,
      cost: formData.type === 'Ingreso' && formData.cost ? Number(formData.cost) : undefined
    });

    // Resetear formulario
    setFormData(prev => ({ 
      ...prev, 
      quantity: '', 
      height: '', 
      width: '', 
      notes: '',
      cost: ''
    }));
  };

  // Validación para habilitar el botón
  const isFormValid = () => {
    if (!formData.productId) return false;
    
    if (inputMode === 'quantity') {
      return Number(formData.quantity) > 0;
    } else {
      // En modo medida, requerimos alto y ancho. 
      // La cantidad es opcional (puede ser 0 o vacía)
      return Number(formData.height) > 0 && Number(formData.width) > 0;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Gestión de Movimientos</h2>

      <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg border border-gray-200">
        <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-700 flex items-center gap-2">
          <ArrowRightLeft className="text-blue-600" />
          Registrar Movimiento
        </h3>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          
          {/* Selector de Tipo de Movimiento - SOLO INGRESO Y SALIDA */}
          <div className="col-span-1 md:col-span-3 lg:col-span-3 mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-2 md:hidden">Tipo de Movimiento</label>
            <div className="flex flex-col sm:flex-row gap-3">
              {(['Ingreso', 'Salida'] as MovementType[]).map((type) => (
                <label key={type} className={`
                  flex-1 cursor-pointer p-3 sm:p-4 rounded-lg border-2 text-center transition-all relative overflow-hidden
                  ${formData.type === type 
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold shadow-sm' 
                    : 'border-gray-200 hover:border-blue-200 text-gray-600 hover:bg-gray-50'}
                `}>
                  <input 
                    type="radio" 
                    name="type" 
                    value={type} 
                    checked={formData.type === type}
                    onChange={() => setFormData({...formData, type})}
                    className="hidden"
                  />
                  <span className="relative z-10">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Selector de Producto */}
          <div className="md:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
            <select 
              required
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white"
              value={formData.productId}
              onChange={e => setFormData({...formData, productId: e.target.value})}
            >
              <option value="">Seleccionar Producto...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.code} - {p.name} ({p.type})</option>
              ))}
            </select>
          </div>

          {/* Selector de Modo (Cantidad vs Medida) */}
          <div className="md:col-span-2 lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Modo de Registro</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setInputMode('quantity')}
                className={`flex-1 py-2 px-4 rounded-md border flex items-center justify-center gap-2 transition-colors ${
                  inputMode === 'quantity' 
                    ? 'bg-gray-800 text-white border-gray-800' 
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Box size={18} />
                Por Cantidad
              </button>
              <button
                type="button"
                onClick={() => setInputMode('measure')}
                disabled={selectedProduct?.type === 'Unidad'}
                className={`flex-1 py-2 px-4 rounded-md border flex items-center justify-center gap-2 transition-colors ${
                  inputMode === 'measure' 
                    ? 'bg-gray-800 text-white border-gray-800' 
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
                title={selectedProduct?.type === 'Unidad' ? 'Solo disponible para Planchas' : ''}
              >
                <Ruler size={18} />
                Por Medida
              </button>
            </div>
          </div>

          {/* Campos Dinámicos según el Modo */}
          {inputMode === 'measure' ? (
            <>
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alto (m)</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  value={formData.height}
                  onChange={e => setFormData({...formData, height: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ancho (m)</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  required
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
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad de Piezas <span className="text-gray-400 font-normal text-xs">(Opcional, si se deja vacío será 0)</span>
                </label>
                <input 
                  type="number" 
                  min="0"
                  // Ya no es required
                  placeholder="0"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  value={formData.quantity}
                  onChange={e => setFormData({...formData, quantity: e.target.value})}
                />
              </div>
            </>
          ) : (
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad {selectedProduct?.type === 'Plancha' ? '(Planchas)' : '(Unidades)'}
              </label>
              <input 
                type="number" 
                min="1"
                required
                placeholder="0"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: e.target.value})}
              />
              {selectedProduct && (
                <p className="text-xs text-gray-500 mt-1">Stock actual: {formatNumber(selectedProduct.quantity, 0)}</p>
              )}
            </div>
          )}

          {/* Campo de Costo - SOLO VISIBLE EN INGRESO */}
          {formData.type === 'Ingreso' && (
            <div className="md:col-span-2 lg:col-span-1 animate-in fade-in slide-in-from-top-2">
              <label className="block text-sm font-medium text-green-700 mb-1 flex items-center gap-1">
                <DollarSign size={14} /> Costo Unitario (Q)
              </label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                className="w-full p-2 border border-green-300 rounded focus:ring-2 focus:ring-green-500 placeholder-gray-400"
                value={formData.cost}
                onChange={e => setFormData({...formData, cost: e.target.value})}
              />
              <p className="text-[10px] text-green-600 mt-1">Actualizará el costo del producto</p>
            </div>
          )}

          <div className="md:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Almacén</label>
            <select 
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white"
              value={formData.warehouse}
              onChange={e => setFormData({...formData, warehouse: e.target.value})}
            >
              <option value="Principal">Almacén Principal</option>
              <option value="Secundario">Almacén Secundario</option>
              <option value="Showroom">Showroom</option>
            </select>
          </div>

          <div className="col-span-1 md:col-span-2 lg:col-span-3 pt-2">
            <button 
              type="submit" 
              disabled={!isFormValid()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition-colors shadow-md hover:shadow-lg active:scale-[0.99] transform duration-150"
            >
              Registrar {formData.type}
            </button>
          </div>
        </form>
      </div>

      {/* Movement Detail View */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
        <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
          <History className="text-gray-500" size={20} />
          <h3 className="text-lg font-semibold text-gray-700">Historial Reciente</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medidas</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo (Ingreso)</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Almacén</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {movements.slice(0, 10).map((movement) => (
                <tr key={movement.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(movement.date), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${movement.type === 'Ingreso' ? 'bg-green-100 text-green-800' : 
                        movement.type === 'Salida' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'}`}>
                      {movement.type}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{movement.productName}</td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {movement.height && movement.width 
                      ? `${formatNumber(movement.height)}m x ${formatNumber(movement.width)}m`
                      : '-'}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(movement.quantity, 0)}</td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {movement.type === 'Ingreso' && movement.cost ? `Q${formatCurrency(movement.cost)}` : '-'}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{movement.warehouse}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Movements;
