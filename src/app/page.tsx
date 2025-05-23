'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import useSWR from 'swr';

import DataDashboard from '@/components/dashboard/Dashboard';

const MapComponent = dynamic(
  () => import('@/components/map/MapComponent'),
  { ssr: false }
);

const EARTHQUAKE_API = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface EarthquakeFeature {
  geometry: {
    coordinates: [number, number, number]; 
  };
  properties: {
    title: string;
    mag: number;
    place: string;
  };
}

interface EarthquakeData {
  features: EarthquakeFeature[];
}

export default function Home() {
  const [showDashboard, setShowDashboard] = useState(true);
  const [earthquakeMarkers, setEarthquakeMarkers] = useState<Array<{
    longitude: number;
    latitude: number;
    title: string;
    description: string;
    magnitude: number;
  }>>([]);

  const { data, error, isLoading } = useSWR<EarthquakeData>(EARTHQUAKE_API, fetcher, {
    refreshInterval: 60000, 
  });

  useEffect(() => {
    if (!data || !data.features) return;

    const markers = data.features.map((feature: EarthquakeFeature) => ({
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

      <div className="flex-grow flex flex-col md:flex-row p-4 gap-4">
        <div className={`${showDashboard ? 'md:w-2/3' : 'w-full'} h-[70vh] md:h-auto mb-4 md:mb-0 transition-all duration-300`}>
          <MapComponent
            initialView={{ center: [-98.5795, 39.8283], zoom: 3 }}
            markers={earthquakeMarkers}
            showControls={true}
          />
        </div>

        {showDashboard && (
          <div className="md:w-1/3 bg-white rounded-lg shadow-lg overflow-auto">
            <DataDashboard />
          </div>
        )}
      </div>

      <footer className="bg-gray-100 border-t p-4 mt-auto">
        <div className="container mx-auto text-gray-600 text-sm">
          <p>© {new Date().getFullYear()} GeoView - Dados de terremotos fornecidos por USGS</p>
        </div>
      </footer>
    </main>
  );
}
