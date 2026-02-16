import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ArrowLeftRight, Search, FileText, Users, Menu, X, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { useInventory } from '../context/InventoryContext';
import { Logo } from './Logo';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, currentUser } = useInventory();

  // Close sidebar on route change (mobile UX)
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Handle screen resize to reset state if needed
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Definir items base accesibles para todos
  const baseNavItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/catalog', icon: Package, label: 'Catálogo' },
    { to: '/movements', icon: ArrowLeftRight, label: 'Movimiento' },
    { to: '/search', icon: Search, label: 'Buscar' },
  ];

  // Definir items solo para Administradores
  const adminNavItems = [
    { to: '/reports', icon: FileText, label: 'Reporte' },
    { to: '/admin', icon: Users, label: 'Administrador' },
  ];

  // Combinar listas según el rol
  const navItems = currentUser?.role === 'Admon' 
    ? [...baseNavItems, ...adminNavItems] 
    : baseNavItems;

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#001f3f]/90 backdrop-blur-md text-white rounded shadow-lg hover:bg-blue-900 transition-colors border border-white/10"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container - Glassmorphism Design */}
      <div className={clsx(
        "fixed inset-y-0 left-0 z-40 w-64 text-white transition-transform duration-300 ease-in-out flex flex-col",
        // Glassmorphism styles: Semi-transparent Navy Blue + Blur + Border
        "bg-[#001f3f]/85 backdrop-blur-xl border-r border-white/10 shadow-2xl",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        
        {/* Header Section - Transparent with border */}
        <div className="flex flex-col items-center justify-center py-8 border-b border-white/10 bg-transparent">
          {/* Logo Section */}
          <div className="mb-2 transform hover:scale-105 transition-transform duration-300 drop-shadow-lg">
            <Logo className="h-20 w-auto" />
          </div>
          
          {currentUser && (
            <div className="flex flex-col items-center mt-2">
              <span className="text-xs text-blue-100 font-medium bg-white/10 border border-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                Hola, {currentUser.name.split(' ')[0]}
              </span>
              <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">
                {currentUser.role}
              </span>
            </div>
          )}
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 mt-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  "flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                  isActive 
                    ? "bg-white/15 text-white shadow-lg border border-white/10 backdrop-blur-sm" 
                    : "text-gray-300 hover:bg-white/5 hover:text-white hover:border hover:border-white/5"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active Indicator Line (Optional aesthetic touch) */}
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-l-xl"></div>}
                  
                  <item.icon className={clsx(
                    "w-5 h-5 mr-3 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-blue-300" : "text-gray-400 group-hover:text-white"
                  )} />
                  <span className="font-medium tracking-wide">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer / Logout - Transparent with border */}
        <div className="p-4 border-t border-white/10 bg-transparent">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-red-200 hover:bg-red-500/20 hover:text-white rounded-xl transition-all duration-200 group border border-transparent hover:border-red-500/30"
          >
            <LogOut className="w-5 h-5 mr-3 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
