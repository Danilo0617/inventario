import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "h-12" }) => {
  return (
    <svg 
      viewBox="0 0 120 80" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      aria-label="DAYM Logo"
    >
      {/* 
        Diseño basado en la imagen proporcionada:
        3 bloques inclinados hacia la derecha.
        Colores aproximados: Beige (#C5B69E), Gris (#757B7F), Gris Oscuro (#333132)
      */}
      
      {/* Bloque Izquierdo - Beige */}
      <path d="M25 5 L55 5 L35 75 L5 75 Z" fill="#C5B69E" />
      
      {/* Bloque Central - Gris */}
      <path d="M58 5 L88 5 L68 75 L38 75 Z" fill="#757B7F" />
      
      {/* Bloque Derecho - Gris Oscuro/Negro */}
      <path d="M91 5 L121 5 L101 75 L71 75 Z" fill="#333132" />
      
      {/* Texto DAYM */}
      <text 
        x="63" 
        y="52" 
        fontSize="38" 
        fontWeight="bold" 
        fill="white" 
        textAnchor="middle" 
        fontFamily="Arial, Helvetica, sans-serif" 
        letterSpacing="-1"
      >
        DAYM
      </text>
    </svg>
  );
};
