import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // <--- Importamos el Router
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/inventario"> {/* <--- Agregamos el basename aquí */}
      <App />
    </BrowserRouter>
  </StrictMode>,
);
