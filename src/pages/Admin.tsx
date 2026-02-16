import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { UserRole } from '../types';
import { Shield, UserPlus, Trash2, Edit, Lock, Mail, User } from 'lucide-react';

const Admin = () => {
  const { users, addUser, updateUser, deleteUser } = useInventory();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Empleado' as UserRole,
    password: '' // Campo para contraseña
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      // Al editar, solo enviamos la contraseña si se escribió algo
      const updates: any = { ...formData };
      if (!updates.password) delete updates.password;
      
      updateUser(editingId, updates);
      setEditingId(null);
    } else {
      addUser(formData);
    }
    setFormData({ name: '', email: '', role: 'Empleado', password: '' });
    setIsFormOpen(false);
  };

  const handleEdit = (user: any) => {
    // No cargamos la contraseña actual por seguridad, dejamos el campo vacío
    setFormData({ name: user.name, email: user.email, role: user.role, password: '' });
    setEditingId(user.id);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Administración de Usuarios</h2>
        <button 
          onClick={() => {
            setIsFormOpen(!isFormOpen);
            setEditingId(null);
            setFormData({ name: '', email: '', role: 'Empleado', password: '' });
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition-colors"
        >
          <UserPlus size={20} />
          {isFormOpen ? 'Cancelar' : 'Nuevo Usuario'}
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-xl font-semibold mb-4 text-gray-700 flex items-center gap-2">
            {editingId ? <Edit size={20} className="text-purple-600"/> : <UserPlus size={20} className="text-purple-600"/>}
            {editingId ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text" 
                    required
                    placeholder="Nombre completo"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="email" 
                    required
                    placeholder="correo@ejemplo.com"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {editingId ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder={editingId ? "Dejar vacío para mantener" : "Ej: 123456"}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    required={!editingId} // Obligatorio solo al crear
                />
              </div>
              {editingId && <p className="text-xs text-gray-500 mt-1">Si lo dejas vacío, no se cambia.</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <select 
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 bg-white"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                >
                    <option value="Admon">Administrador</option>
                    <option value="Empleado">Empleado</option>
                    <option value="Lector">Lector</option>
                </select>
              </div>
            </div>
            <div className="md:col-span-2 lg:col-span-4 flex justify-end gap-2 mt-2">
              <button 
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg shadow-sm transition-colors"
              >
                {editingId ? 'Actualizar Usuario' : 'Crear Usuario'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm
                        ${user.role === 'Admon' ? 'bg-purple-500' : user.role === 'Empleado' ? 'bg-blue-500' : 'bg-gray-500'}`}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-400">ID: {user.id.slice(0, 8)}...</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border 
                    ${user.role === 'Admon' ? 'bg-purple-100 text-purple-800 border-purple-200' : 
                      user.role === 'Empleado' ? 'bg-blue-100 text-blue-800 border-blue-200' : 
                      'bg-gray-100 text-gray-800 border-gray-200'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button 
                        onClick={() => handleEdit(user)}
                        className="text-indigo-600 hover:text-indigo-900 p-1.5 hover:bg-indigo-50 rounded transition-colors"
                        title="Editar"
                    >
                        <Edit size={18} />
                    </button>
                    <button 
                        onClick={() => {
                            if(window.confirm(`¿Seguro que desea eliminar al usuario ${user.name}?`)) {
                                deleteUser(user.id);
                            }
                        }}
                        className="text-red-600 hover:text-red-900 p-1.5 hover:bg-red-50 rounded transition-colors"
                        title="Eliminar"
                    >
                        <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
                <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                        No hay usuarios registrados.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Admin;
