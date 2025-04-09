'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import DataDashboard from '@/components/dashboard/Dashboard';

// Importar dinamicamente o mapa para evitar erros de SSR com as bibliotecas de mapa
const MapContainer = dynamic(
  () => import('@/components/map/MapContainer'),
  { ssr: false }
);

export default function Home() {
  const [showDashboard, setShowDashboard] = useState(true);

  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">GeoView</h1>
            <p className="text-blue-200">Visualização de dados geográficos em tempo real</p>
          </div>
          
          <div className="flex gap-4">
            <button 
              className="px-4 py-2 bg-white text-blue-700 rounded-lg font-medium shadow hover:bg-blue-50 transition-colors"
              onClick={() => setShowDashboard(!showDashboard)}
            >
              {showDashboard ? 'Ocultar Dashboard' : 'Mostrar Dashboard'}
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="flex-grow flex flex-col md:flex-row p-4 gap-4">
        {/* Mapa */}
        <div className={`${showDashboard ? 'md:w-2/3' : 'w-full'} h-[70vh] md:h-auto mb-4 md:mb-0 transition-all duration-300`}>
          <MapContainer />
        </div>
        
        {/* Dashboard */}
        {showDashboard && (
          <div className="md:w-1/3 bg-white rounded-lg shadow-lg overflow-auto">
            <DataDashboard />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 border-t p-4 mt-auto">
        <div className="container mx-auto text-gray-600 text-sm">
          <p>© {new Date().getFullYear()} GeoView - Dados de terremotos fornecidos por USGS</p>
        </div>
      </footer>
    </main>
  );
}