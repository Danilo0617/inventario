// Utilidad para formatear números con punto decimal y miles con coma (Estilo GT/US)
// Ejemplo: 1,234.56
export const formatNumber = (value: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('es-GT', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};
