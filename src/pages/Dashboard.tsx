import React from 'react';
import { useInventory } from '../context/InventoryContext';
import { Package, ArrowUpRight, ArrowDownRight, AlertTriangle, CheckCircle, Activity, CalendarClock, AlertCircle } from 'lucide-react';
import { formatNumber, formatCurrency } from '../utils/format';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Dashboard = () => {
  const { products, movements, currentUser } = useInventory();

  const totalProducts = products.length;
  const totalValue = products.reduce((acc, curr) => acc + (curr.quantity * curr.cost), 0);
  
  const recentIngresos = movements.filter(m => m.type === 'Ingreso').length;
  const recentSalidas = movements.filter(m => m.type === 'Salida').length;

  // Verificar si es administrador
  const isAdmin = currentUser?.role === 'Admon';

  // Card Class más compacta
  const cardClass = "bg-white p-3 rounded-lg shadow-md border-l-4 relative overflow-hidden group transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-default z-0 hover:z-10 h-24 flex items-center";

  // Preparar datos para la tabla detallada
  const productStats = products.map(product => {
    const productMovements = movements.filter(m => m.productId === product.id);
    const totalIn = productMovements.filter(m => m.type === 'Ingreso').length;
    const totalOut = productMovements.filter(m => m.type === 'Salida').length;
    const lastMovement = productMovements.length > 0 ? productMovements[0].date : null;
    
    // Estado de Stock (Reglas)
    let status = 'Medio';
    if (product.quantity <= product.minQuantity) status = 'Bajo';
    else if (product.quantity >= product.maxQuantity) status = 'Alto';

    return {
      ...product,
      totalIn,
      totalOut,
      lastMovement,
      status
    };
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard General</h2>
      
      {/* Tarjetas Superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-2"> 
        
        {/* Card 1: Total Productos */}
        <div className={`${cardClass} border-blue-500`}>
          <div className="absolute top-2 left-2 p-2 bg-blue-50 rounded-full text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors shadow-sm z-20">
            <Package size={18} />
          </div>
          <div className="z-10 relative w-full text-right pr-2"> 
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Productos</p>
            <p className="mt-0 text-xl font-bold text-gray-800">{formatNumber(totalProducts, 0)}</p>
            <p className="text-[10px] text-blue-500 font-medium">En inventario</p>
          </div>
        </div>

        {/* Card 2: Valor Inventario - SOLO VISIBLE PARA ADMIN */}
        {isAdmin && (
          <div className={`${cardClass} border-green-500`}>
            <div className="absolute top-2 left-2 p-2 bg-green-50 rounded-full text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors shadow-sm z-20">
              <span className="font-bold text-sm h-[18px] w-[18px] flex items-center justify-center">Q</span>
            </div>
            <div className="z-10 relative w-full text-right pr-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor Total</p>
              <p className="mt-0 text-xl font-bold text-gray-800 truncate">Q{formatCurrency(totalValue)}</p>
              <p className="text-[10px] text-green-500 font-medium">Costo</p>
            </div>
          </div>
        )}

        {/* Card 3: Ingresos */}
        <div className={`${cardClass} border-indigo-500`}>
          <div className="absolute top-2 left-2 p-2 bg-indigo-50 rounded-full text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors shadow-sm z-20">
            <ArrowDownRight size={18} />
          </div>
          <div className="z-10 relative w-full text-right pr-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ingresos</p>
            <p className="mt-0 text-xl font-bold text-gray-800">{formatNumber(recentIngresos, 0)}</p>
            <p className="text-[10px] text-indigo-500 font-medium">Recientes</p>
          </div>
        </div>

        {/* Card 4: Salidas */}
        <div className={`${cardClass} border-orange-500`}>
          <div className="absolute top-2 left-2 p-2 bg-orange-50 rounded-full text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors shadow-sm z-20">
            <ArrowUpRight size={18} />
          </div>
          <div className="z-10 relative w-full text-right pr-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Salidas</p>
            <p className="mt-0 text-xl font-bold text-gray-800">{formatNumber(recentSalidas, 0)}</p>
            <p className="text-[10px] text-orange-500 font-medium">Recientes</p>
          </div>
        </div>
      </div>

      {/* Nueva Tabla de Estado del Inventario */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <Activity className="text-blue-600" size={20} />
            Estado del Inventario y Movimientos
          </h3>
          <div className="text-xs text-gray-500 flex gap-2">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full"></span> Bajo</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-500 rounded-full"></span> Medio</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Alto</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Actual</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Reglas (Min/Max)</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ingresos</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Salidas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Actividad</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productStats.map((p) => (
                <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${p.status === 'Bajo' ? 'bg-red-50/30' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">{p.name}</span>
                      <span className="text-xs text-gray-500">{p.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {p.status === 'Bajo' && (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 border border-red-200 gap-1 items-center">
                        <AlertCircle size={12} /> Bajo
                      </span>
                    )}
                    {p.status === 'Medio' && (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200 gap-1 items-center">
                        <AlertTriangle size={12} /> Medio
                      </span>
                    )}
                    {p.status === 'Alto' && (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 border border-green-200 gap-1 items-center">
                        <CheckCircle size={12} /> Alto
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                    {formatNumber(p.quantity, 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                    {formatNumber(p.minQuantity, 0)} / {formatNumber(p.maxQuantity, 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                      +{p.totalIn}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-red-600 font-medium bg-red-50 px-2 py-1 rounded">
                      -{p.totalOut}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {p.lastMovement ? (
                      <div className="flex items-center gap-1">
                        <CalendarClock size={14} className="text-gray-400" />
                        {format(new Date(p.lastMovement), 'dd/MM/yyyy', { locale: es })}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Sin movimientos</span>
                    )}
                  </td>
                </tr>
              ))}
              {productStats.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                    No hay productos registrados.
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

export default Dashboard;
