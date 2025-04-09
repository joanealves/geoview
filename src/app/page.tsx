// app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import useSWR from 'swr';

// Importar dinamicamente o Dashboard
import DataDashboard from '@/components/dashboard/Dashboard';

// Importar dinamicamente o mapa para evitar erros de SSR com as bibliotecas de mapa
const MapComponent = dynamic(
  () => import('@/components/map/MapComponent'),
  { ssr: false }
);

// URL da API USGS para dados de terremotos nas últimas 24 horas
const EARTHQUAKE_API = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';

// Função para buscar dados
const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Home() {
  const [showDashboard, setShowDashboard] = useState(true);
  const [earthquakeMarkers, setEarthquakeMarkers] = useState<Array<{
    longitude: number;
    latitude: number;
    title: string;
    description: string;
    magnitude: number;
  }>>([]);

  // Buscar dados com SWR para atualização automática
  const { data, error, isLoading } = useSWR(EARTHQUAKE_API, fetcher, {
    refreshInterval: 60000, // Atualizar a cada minuto
  });

  // Processar dados para marcadores
  useEffect(() => {
    if (!data || !data.features) return;

    const markers = data.features.map((feature: any) => ({
      longitude: feature.geometry.coordinates[0],
      latitude: feature.geometry.coordinates[1],
      title: feature.properties.title,
      description: `Magnitude: ${feature.properties.mag}, Profundidade: ${feature.geometry.coordinates[2]}km`,
      magnitude: feature.properties.mag
    }));

    setEarthquakeMarkers(markers);
  }, [data]);

  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 shadow-md">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">GeoView</h1>
            <p className="text-blue-200">Visualização de terremotos em tempo real</p>
          </div>

          <div className="flex gap-4 mt-2 md:mt-0">
            <div className="text-sm">
              {isLoading ? 'Carregando dados...' :
                error ? 'Erro ao carregar dados' :
                  `${earthquakeMarkers.length} terremotos detectados`}
            </div>
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
          <MapComponent
            initialView={{ center: [-98.5795, 39.8283], zoom: 3 }}
            markers={earthquakeMarkers}
            showControls={true}
          />
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