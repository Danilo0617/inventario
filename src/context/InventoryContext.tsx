import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Movement, User } from '../types';
import { supabase } from '../lib/supabase';

interface InventoryContextType {
  products: Product[];
  movements: Movement[];
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addMovement: (movement: Omit<Movement, 'id' | 'date'>) => Promise<void>;
  updateMovement: (id: string, updates: Partial<Movement>) => Promise<void>;
  deleteMovement: (id: string) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  addUser: (user: Omit<User, 'id'> & { password?: string }) => Promise<void>;
  updateUser: (id: string, updates: Partial<User> & { password?: string }) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  // Cargar datos iniciales
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // 1. Obtener Productos
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (productsError) throw productsError;

      // 2. Obtener Movimientos
      const { data: movementsData, error: movementsError } = await supabase
        .from('movements')
        .select('*')
        .order('created_at', { ascending: false });

      if (movementsError) throw movementsError;

      // 3. Obtener Usuarios
      const { data: usersData, error: usersError } = await supabase
        .from('app_users')
        .select('*');

      if (usersError) throw usersError;

      // --- LÓGICA DE CÁLCULO DE STOCK ---
      // Calculamos el stock basado puramente en el historial de movimientos
      // Esto asegura que el stock siempre sea: (Suma Ingresos) - (Suma Salidas)
      const stockMap = new Map<string, number>();

      if (movementsData) {
        movementsData.forEach(m => {
          const currentStock = stockMap.get(m.product_id) || 0;
          if (m.type === 'Ingreso') {
            stockMap.set(m.product_id, currentStock + m.quantity);
          } else if (m.type === 'Salida') {
            stockMap.set(m.product_id, currentStock - m.quantity);
          }
        });
      }

      // Mapear Productos e inyectar el stock calculado
      if (productsData) {
        const mappedProducts = productsData.map(p => ({
          id: p.id,
          code: p.code,
          name: p.name,
          type: p.type,
          // Aquí usamos el valor calculado del mapa, o 0 si no hay movimientos
          quantity: stockMap.get(p.id) || 0, 
          minQuantity: p.min_quantity || 5,
          maxQuantity: p.max_quantity || 100,
          height: p.height,
          width: p.width,
          area: p.area,
          cost: p.cost
        }));
        setProducts(mappedProducts);
      }
      
      if (movementsData) {
        const mappedMovements = movementsData.map(m => ({
          id: m.id,
          date: m.created_at,
          type: m.type,
          productId: m.product_id,
          productName: m.product_name,
          quantity: m.quantity,
          height: m.height,
          width: m.width,
          warehouse: m.warehouse,
          notes: m.notes,
          cost: m.cost
        }));
        setMovements(mappedMovements);
      }

      if (usersData) setUsers(usersData);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  const addProduct = async (product: Omit<Product, 'id'>) => {
    try {
      const dbProduct = {
        code: product.code,
        name: product.name,
        type: product.type,
        quantity: 0, // Siempre inicia en 0, el stock se define por movimientos
        min_quantity: product.minQuantity || 5, 
        max_quantity: product.maxQuantity || 100,
        height: product.height,
        width: product.width,
        area: product.area,
        cost: product.cost
      };

      const { error } = await supabase.from('products').insert([dbProduct]);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Error al guardar el producto.');
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const dbUpdates: any = {};
      if (updates.code !== undefined) dbUpdates.code = updates.code;
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      
      if (updates.minQuantity !== undefined) dbUpdates.min_quantity = updates.minQuantity;
      if (updates.maxQuantity !== undefined) dbUpdates.max_quantity = updates.maxQuantity;
      
      if (updates.height !== undefined) dbUpdates.height = updates.height;
      if (updates.width !== undefined) dbUpdates.width = updates.width;
      if (updates.area !== undefined) dbUpdates.area = updates.area;

      const { error } = await supabase.from('products').update(dbUpdates).eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Error al actualizar el producto');
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      
      if (error) {
        if (error.code === '23503') {
          const confirm = window.confirm(
            'Este producto tiene historial de movimientos. ¿Desea eliminar el producto y todos sus registros asociados? Esta acción no se puede deshacer.'
          );

          if (confirm) {
            const { error: movementsError } = await supabase
              .from('movements')
              .delete()
              .eq('product_id', id);

            if (movementsError) throw movementsError;

            const { error: deleteError } = await supabase
              .from('products')
              .delete()
              .eq('id', id);

            if (deleteError) throw deleteError;
            
            await fetchData();
            return;
          } else {
            return;
          }
        }
        throw error;
      }
      await fetchData();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      alert('Error al eliminar el producto');
    }
  };

  const addMovement = async (movement: Omit<Movement, 'id' | 'date'>) => {
    try {
      const dbMovement = {
        type: movement.type,
        product_id: movement.productId,
        product_name: movement.productName,
        quantity: movement.quantity,
        height: movement.height,
        width: movement.width,
        warehouse: movement.warehouse,
        notes: movement.notes,
        cost: movement.cost || 0
      };

      const { error } = await supabase.from('movements').insert([dbMovement]);
      if (error) throw error;

      // Actualizar costo del producto si es un ingreso
      if (movement.type === 'Ingreso' && movement.cost && movement.cost > 0) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ cost: movement.cost })
          .eq('id', movement.productId);
          
        if (updateError) console.error('Error updating product cost:', updateError);
      }
      
      await fetchData(); // Esto recalculará el stock automáticamente
    } catch (error) {
      console.error('Error adding movement:', error);
      alert('Error al registrar movimiento.');
    }
  };

  const updateMovement = async (id: string, updates: Partial<Movement>) => {
    try {
      const dbUpdates: any = {};
      if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
      if (updates.warehouse !== undefined) dbUpdates.warehouse = updates.warehouse;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.height !== undefined) dbUpdates.height = updates.height;
      if (updates.width !== undefined) dbUpdates.width = updates.width;
      if (updates.cost !== undefined) dbUpdates.cost = updates.cost;

      const { error } = await supabase.from('movements').update(dbUpdates).eq('id', id);
      if (error) throw error;
      await fetchData(); // Recalcular stock
    } catch (error) {
      console.error('Error updating movement:', error);
      alert('Error al actualizar el movimiento');
      throw error;
    }
  };

  const deleteMovement = async (id: string) => {
    try {
      const { error } = await supabase.from('movements').delete().eq('id', id);
      if (error) throw error;
      await fetchData(); // Recalcular stock
    } catch (error) {
      console.error('Error deleting movement:', error);
      alert('Error al eliminar el movimiento');
      throw error;
    }
  };

  const addUser = async (user: Omit<User, 'id'> & { password?: string }) => {
    try {
      const dbUser = { 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        password: user.password || '123456'
      }; 
      const { error } = await supabase.from('app_users').insert([dbUser]);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Error al crear usuario.');
    }
  };

  const updateUser = async (id: string, updates: Partial<User> & { password?: string }) => {
    try {
      const dbUpdates: any = { ...updates };
      if (!dbUpdates.password) {
        delete dbUpdates.password;
      }

      const { error } = await supabase.from('app_users').update(dbUpdates).eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error al actualizar usuario');
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const { error } = await supabase.from('app_users').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error al eliminar usuario');
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !data) return false;

      if (data.password === password) {
        setCurrentUser(data);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <InventoryContext.Provider value={{ 
      products, 
      movements, 
      users, 
      currentUser,
      isLoading,
      addProduct, 
      deleteProduct,
      addMovement,
      updateMovement,
      deleteMovement,
      updateProduct, 
      addUser, 
      updateUser, 
      deleteUser, 
      login,
      logout
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
