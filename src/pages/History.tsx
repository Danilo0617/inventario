import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search as SearchIcon, Calendar, X, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatNumber } from '../utils/format';

const History = () => {
  const { movements } = useInventory();
  const [filterType, setFilterType] = useState<'Todos' | 'Ingreso' | 'Salida'>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredMovements = movements.filter(m => {
    const movementDate = new Date(m.date);
    const matchesType = filterType === 'Todos' || m.type === filterType;
    const matchesSearch = m.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.warehouse.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesDate = true;
    if (startDate && endDate) {
      matchesDate = isWithinInterval(movementDate, {
        start: startOfDay(new Date(startDate)),
        end: endOfDay(new Date(endDate))
      });
    } else if (startDate) {
      matchesDate = movementDate >= startOfDay(new Date(startDate));
    } else if (endDate) {
      matchesDate = movementDate <= endOfDay(new Date(endDate));
    }

    return matchesType && matchesSearch && matchesDate;
  });

  const clearDates = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Buscar Registros</h2>
        
        {/* Contenedor de Filtros */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          
          {/* Barra de Búsqueda */}
          <div className="relative w-full lg:w-1/3">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar producto..." 
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtros de Fecha */}
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto items-center">
            <div className="relative w-full sm:w-auto">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <Calendar size={16} />
                </span>
                <input 
                    type="date" 
                    className="pl-9 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-full sm:w-40 text-sm text-gray-600"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="Desde"
                />
            </div>
            <span className="hidden sm:inline text-gray-400">-</span>
            <div className="relative w-full sm:w-auto">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <Calendar size={16} />
                </span>
                <input 
                    type="date" 
                    className="pl-9 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-full sm:w-40 text-sm text-gray-600"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="Hasta"
                />
            </div>
            {(startDate || endDate) && (
                <button 
                    onClick={clearDates}
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="Limpiar fechas"
                >
                    <X size={18} />
                </button>
            )}
          </div>
          
          {/* Botones de Tipo */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-full lg:w-auto justify-center lg:justify-start overflow-x-auto">
            <button 
              onClick={() => setFilterType('Todos')}
              className={`flex-1 lg:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${filterType === 'Todos' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setFilterType('Ingreso')}
              className={`flex-1 lg:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${filterType === 'Ingreso' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              Ingresos
            </button>
            <button 
              onClick={() => setFilterType('Salida')}
              className={`flex-1 lg:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${filterType === 'Salida' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              Salidas
            </button>
          </div>
        </div>
      </div>

      {/* Tabla Unificada */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medidas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Almacén</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMovements.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(m.date), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full 
                      ${m.type === 'Ingreso' ? 'bg-green-100 text-green-800' : 
                        m.type === 'Salida' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'}`}>
                      {m.type === 'Ingreso' ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                      {m.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {m.productName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {m.height && m.width 
                      ? `${formatNumber(m.height)}m x ${formatNumber(m.width)}m`
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {m.warehouse}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                    {formatNumber(m.quantity, 0)}
                  </td>
                </tr>
              ))}
              {filteredMovements.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500 italic">
                    No se encontraron registros que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default History;
