import React, { useState, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { FileDown, Calendar, Edit2, Trash2, X, Check, Search, PlayCircle, Eye, RefreshCw, Scale } from 'lucide-react';
import { formatNumber, formatCurrency } from '../utils/format';
import { Movement } from '../types';

const Reports = () => {
  const { movements, products, updateMovement, deleteMovement, isLoading } = useInventory();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState<'Ingreso' | 'Salida' | 'Diferencia'>('Ingreso');
  const [isReportGenerated, setIsReportGenerated] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
  const [editForm, setEditForm] = useState({
    quantity: '',
    warehouse: '',
    notes: ''
  });

  useEffect(() => {
    if (startDate || endDate) {
      setIsReportGenerated(false);
      setShowAllHistory(false);
    }
  }, [startDate, endDate]);

  // Función para obtener datos crudos filtrados por fecha
  const getRawDataInRange = () => {
    if (showAllHistory) return movements;
    if (!startDate || !endDate) return [];

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59`);

    return movements.filter(m => {
      const movementDate = new Date(m.date);
      return movementDate >= start && movementDate <= end;
    });
  };

  const getFilteredData = (type: 'Ingreso' | 'Salida') => {
    const rawData = getRawDataInRange();
    return rawData.filter(m => m.type === type);
  };

  // Lógica para calcular Diferencias (Balance) CORREGIDA
  const getDifferenceData = () => {
    const rawData = getRawDataInRange();
    const differences: Record<string, {
      productName: string;
      code: string;
      qtyIn: number;
      qtyOut: number;
      areaIn: number;
      areaOut: number;
    }> = {};

    rawData.forEach(m => {
      // Buscar el producto asociado para obtener datos base y medidas por defecto
      const prod = products.find(p => p.id === m.productId);

      if (!differences[m.productId]) {
        differences[m.productId] = {
          productName: m.productName,
          code: prod?.code || '-',
          qtyIn: 0,
          qtyOut: 0,
          areaIn: 0,
          areaOut: 0
        };
      }

      // LÓGICA INTELIGENTE DE ÁREA:
      let height = m.height || 0;
      let width = m.width || 0;
      
      // Variable para el cálculo del área. 
      // Si la cantidad es 0 pero hay medidas, asumimos factor 1 para el área.
      let areaMultiplier = m.quantity;

      // Caso 1: Movimiento tiene medidas específicas (Por Medida)
      if (height > 0 && width > 0) {
        if (areaMultiplier === 0) {
            areaMultiplier = 1; // Si es 0 unidades pero tiene medidas, es 1 pieza de esa medida
        }
      } 
      // Caso 2: Movimiento NO tiene medidas (Por Cantidad), usamos las del producto
      else if (prod?.type === 'Plancha') {
        height = prod.height || 0;
        width = prod.width || 0;
        // Aquí areaMultiplier sigue siendo m.quantity (si es 0, el área es 0, lo cual es correcto si no hay medidas)
      }

      // Calcular área del movimiento
      const movementArea = height * width * areaMultiplier;

      if (m.type === 'Ingreso') {
        differences[m.productId].qtyIn += m.quantity;
        differences[m.productId].areaIn += movementArea;
      } else if (m.type === 'Salida') {
        differences[m.productId].qtyOut += m.quantity;
        differences[m.productId].areaOut += movementArea;
      }
    });

    return Object.values(differences);
  };

  const previewData = activeTab === 'Diferencia' ? getDifferenceData() : getFilteredData(activeTab as 'Ingreso' | 'Salida');

  const handleGenerateReport = () => {
    if (startDate && endDate) {
      setIsReportGenerated(true);
      setShowAllHistory(false);
    }
  };

  const handleShowAll = () => {
    setStartDate('');
    setEndDate('');
    setShowAllHistory(true);
    setIsReportGenerated(true);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const dateRange = showAllHistory ? 'Histórico Completo' : `Del ${startDate} al ${endDate}`;
    
    doc.setFontSize(18);
    doc.text(`Reporte de ${activeTab}`, 14, 15);
    doc.setFontSize(10);
    doc.text(dateRange, 14, 22);
    doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 27);
    
    let headRow: string[] = [];
    let bodyData: any[] = [];

    if (activeTab === 'Diferencia') {
      headRow = ['Código', 'Producto', 'Cant. Entrada', 'Cant. Salida', 'Diferencia', 'Area Ent. (m2)', 'Area Sal. (m2)', 'Dif. Area (m2)'];
      const data = getDifferenceData();
      bodyData = data.map(d => [
        d.code,
        d.productName,
        formatNumber(d.qtyIn, 0),
        formatNumber(d.qtyOut, 0),
        formatNumber(d.qtyIn - d.qtyOut, 0),
        formatNumber(d.areaIn),
        formatNumber(d.areaOut),
        formatNumber(d.areaIn - d.areaOut)
      ]);
    } else {
      // Reporte Normal (Ingreso/Salida)
      headRow = ['Fecha', 'Producto', 'Medidas', 'Cantidad'];
      if (activeTab === 'Ingreso') {
        headRow.push('Costo Unit.', 'Total');
      }
      headRow.push('Almacén', 'Notas');
      
      const data = getFilteredData(activeTab);
      bodyData = data.map(m => {
        const row = [
          format(new Date(m.date), 'dd/MM/yyyy HH:mm'),
          m.productName,
          m.height && m.width ? `${formatNumber(m.height)}m x ${formatNumber(m.width)}m` : '-',
          formatNumber(m.quantity, 0)
        ];
        if (activeTab === 'Ingreso') {
          row.push(
            m.cost ? `Q${formatCurrency(m.cost)}` : '-',
            m.cost ? `Q${formatCurrency(m.cost * m.quantity)}` : '-'
          );
        }
        row.push(m.warehouse, m.notes || '');
        return row;
      });
    }
    
    autoTable(doc, {
      startY: 35,
      head: [headRow],
      body: bodyData,
      styles: { fontSize: 8 },
      headStyles: { 
        fillColor: activeTab === 'Ingreso' ? [22, 163, 74] : activeTab === 'Salida' ? [220, 38, 38] : [79, 70, 229] 
      }
    });

    doc.save(`reporte-${activeTab.toLowerCase()}-${showAllHistory ? 'todos' : startDate}.pdf`);
  };

  const exportExcel = () => {
    let data: any[] = [];

    if (activeTab === 'Diferencia') {
      const diffData = getDifferenceData();
      data = diffData.map(d => ({
        Codigo: d.code,
        Producto: d.productName,
        Entradas_Unidades: d.qtyIn,
        Salidas_Unidades: d.qtyOut,
        Diferencia_Unidades: d.qtyIn - d.qtyOut,
        Entradas_Area_m2: d.areaIn,
        Salidas_Area_m2: d.areaOut,
        Diferencia_Area_m2: d.areaIn - d.areaOut
      }));
    } else {
      const movData = getFilteredData(activeTab);
      data = movData.map(m => {
        const row: any = {
          Fecha: format(new Date(m.date), 'dd/MM/yyyy HH:mm'),
          Producto: m.productName,
          Medidas: m.height && m.width ? `${formatNumber(m.height)}m x ${formatNumber(m.width)}m` : '-',
          Cantidad: m.quantity
        };
        if (activeTab === 'Ingreso') {
          row['Costo Unit.'] = m.cost ? `Q${formatCurrency(m.cost)}` : '-';
          row['Total'] = m.cost ? `Q${formatCurrency(m.cost * m.quantity)}` : '-';
        }
        row.Almacen = m.warehouse;
        row.Notas = m.notes || '';
        return row;
      });
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeTab);
    XLSX.writeFile(wb, `reporte-${activeTab.toLowerCase()}-${showAllHistory ? 'todos' : startDate}.xlsx`);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este registro? Esto actualizará el stock automáticamente.')) {
      try {
        await deleteMovement(id);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const openEditModal = (movement: Movement) => {
    setEditingMovement(movement);
    setEditForm({
      quantity: movement.quantity.toString(),
      warehouse: movement.warehouse,
      notes: movement.notes || ''
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMovement) return;

    try {
      await updateMovement(editingMovement.id, {
        quantity: Number(editForm.quantity),
        warehouse: editForm.warehouse,
        notes: editForm.notes
      });
      setEditingMovement(null);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Generador de Reportes</h2>
        {isLoading && (
          <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm">
            <RefreshCw className="animate-spin" size={16} />
            Actualizando datos...
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-6 items-end mb-2">
          <div className="w-full lg:w-1/4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="date" 
                className="pl-10 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
          </div>
          <div className="w-full lg:w-1/4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="date" 
                className="pl-10 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>
          
          <div className="w-full lg:w-1/2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleGenerateReport}
              disabled={!startDate || !endDate}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm text-sm font-medium"
            >
              <PlayCircle size={16} />
              Generar Reporte
            </button>
            
            <button
              onClick={handleShowAll}
              className="flex-1 bg-gray-800 hover:bg-gray-900 text-white py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm text-sm font-medium"
            >
              <Eye size={16} />
              Ver Histórico
            </button>
          </div>
        </div>
        
        {showAllHistory && (
          <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
            <Check size={14} className="text-green-500" />
            Mostrando todos los registros históricos
          </p>
        )}
      </div>

      <div className={`transition-all duration-500 ${isReportGenerated ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 pointer-events-none'}`}>
        <div className="border-b border-gray-200 mb-4">
          <nav className="-mb-px flex space-x-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('Ingreso')}
              className={`${
                activeTab === 'Ingreso'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
            >
              Reporte de Ingresos
              <span className={`py-0.5 px-2 rounded-full text-xs ${activeTab === 'Ingreso' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                {isReportGenerated ? getFilteredData('Ingreso').length : '-'}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('Salida')}
              className={`${
                activeTab === 'Salida'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
            >
              Reporte de Salidas
              <span className={`py-0.5 px-2 rounded-full text-xs ${activeTab === 'Salida' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'}`}>
                {isReportGenerated ? getFilteredData('Salida').length : '-'}
              </span>
            </button>
            {/* Nuevo Tab: Diferencia */}
            <button
              onClick={() => setActiveTab('Diferencia')}
              className={`${
                activeTab === 'Diferencia'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
            >
              <Scale size={16} />
              Diferencia de Medidas
            </button>
          </nav>
        </div>

        <div className="flex gap-4 mb-4 justify-end">
          <button 
            onClick={exportExcel}
            disabled={!isReportGenerated || previewData.length === 0}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-2 px-4 rounded flex items-center gap-2 text-sm transition-colors shadow-sm"
          >
            <FileDown size={16} /> Excel
          </button>
          <button 
            onClick={exportPDF}
            disabled={!isReportGenerated || previewData.length === 0}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white py-2 px-4 rounded flex items-center gap-2 text-sm transition-colors shadow-sm"
          >
            <FileDown size={16} /> PDF
          </button>
        </div>

        <div className="overflow-x-auto border rounded-lg bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {activeTab === 'Diferencia' ? (
                  // Encabezados para Reporte de Diferencia
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-green-600 uppercase tracking-wider">Entrada (U)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-red-600 uppercase tracking-wider">Salida (U)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-800 uppercase tracking-wider bg-gray-100">Diferencia (U)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-green-600 uppercase tracking-wider">Area Ent. (m²)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-red-600 uppercase tracking-wider">Area Sal. (m²)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-800 uppercase tracking-wider bg-gray-100">Dif. Area (m²)</th>
                  </>
                ) : (
                  // Encabezados Normales
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medidas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cant.</th>
                    {activeTab === 'Ingreso' && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Costo</th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Almacén</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notas</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isReportGenerated && previewData.length > 0 ? (
                activeTab === 'Diferencia' ? (
                  // Cuerpo de Tabla Diferencia
                  (previewData as any[]).map((d, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{d.code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{d.productName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">{formatNumber(d.qtyIn, 0)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">{formatNumber(d.qtyOut, 0)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold bg-gray-50">{formatNumber(d.qtyIn - d.qtyOut, 0)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">{formatNumber(d.areaIn)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">{formatNumber(d.areaOut)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold bg-gray-50">{formatNumber(d.areaIn - d.areaOut)}</td>
                    </tr>
                  ))
                ) : (
                  // Cuerpo de Tabla Normal
                  (previewData as Movement[]).map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(m.date), 'dd/MM/yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {m.productName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {m.height && m.width ? `${formatNumber(m.height)}m x ${formatNumber(m.width)}m` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                        {formatNumber(m.quantity, 0)}
                      </td>
                      {activeTab === 'Ingreso' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                          {m.cost ? (
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">Q{formatCurrency(m.cost)}</span>
                              <span className="text-xs text-gray-400">Tot: Q{formatCurrency(m.cost * m.quantity)}</span>
                            </div>
                          ) : '-'}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {m.warehouse}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">
                        {m.notes || <span className="text-gray-300 italic">Sin notas</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => openEditModal(m)}
                            className="text-blue-600 hover:text-blue-900 p-1.5 hover:bg-blue-50 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(m.id)}
                            className="text-red-600 hover:text-red-900 p-1.5 hover:bg-red-50 rounded transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              ) : (
                <tr>
                  <td colSpan={activeTab === 'Ingreso' ? 8 : activeTab === 'Diferencia' ? 8 : 7} className="px-6 py-16 text-center text-gray-500">
                    {!isReportGenerated 
                      ? (
                        <div className="flex flex-col items-center gap-3 animate-pulse">
                          <Search size={40} className="text-gray-300" />
                          <p className="text-lg font-medium text-gray-400">Seleccione fechas y genere el reporte</p>
                        </div>
                      )
                      : (
                        <div className="flex flex-col items-center gap-3">
                          <X size={40} className="text-gray-300" />
                          <p className="text-lg font-medium text-gray-400">No hay registros en este rango de fechas</p>
                        </div>
                      )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingMovement && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-xl font-bold text-gray-800">Editar Movimiento</h3>
              <button onClick={() => setEditingMovement(null)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                <input 
                  type="text" 
                  disabled 
                  value={editingMovement.productName}
                  className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 font-medium"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  value={editForm.quantity}
                  onChange={e => setEditForm({...editForm, quantity: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Almacén</label>
                <select 
                  value={editForm.warehouse}
                  onChange={e => setEditForm({...editForm, warehouse: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Principal">Almacén Principal</option>
                  <option value="Secundario">Almacén Secundario</option>
                  <option value="Showroom">Showroom</option>
                  <option value="Ajuste Admin">Ajuste Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea 
                  value={editForm.notes}
                  onChange={e => setEditForm({...editForm, notes: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Razón del cambio..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setEditingMovement(null)}
                  className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-md transition-all hover:shadow-lg"
                >
                  <Check size={18} /> Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
