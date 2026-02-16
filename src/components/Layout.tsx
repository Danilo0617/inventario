import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="flex min-h-screen relative">
      {/* 
        Fondo Global con Degradado:
        Esto es crucial para que el efecto transparente del sidebar se note.
        Usamos un degradado radial sutil que va de gris claro a un gris azulado.
      */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-gray-100 via-gray-200 to-slate-300"></div>
      
      <Sidebar />
      
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-16 md:pt-8 transition-all duration-300 w-full overflow-x-hidden relative z-10">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
