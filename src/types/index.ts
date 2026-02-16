export type UserRole = 'Admon' | 'Empleado' | 'Lector';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type ProductType = 'Plancha' | 'Unidad';

export type ProductName = string;

export interface Product {
  id: string;
  code: string;
  name: ProductName;
  type: ProductType;
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  height?: number;
  width?: number;
  area?: number;
  cost: number;
}

export type MovementType = 'Ingreso' | 'Salida' | 'Edición';

export interface Movement {
  id: string;
  date: string; // ISO string
  type: MovementType;
  productId: string;
  productName: string;
  quantity: number;
  height?: number;
  width?: number;
  warehouse: string;
  notes?: string;
  cost?: number;
}
