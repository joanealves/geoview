'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import ChartPanel from './ChartPanel';
import DataTable from './DataTable';
import FilterBar from './FilterBar';

const EARTHQUAKE_API = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface DashboardProps {
  className?: string;
}

interface Filters {
  magnitude: number;
  timeRange: string;
  region: string;
}

interface EarthquakeFeature {
  id: string;
  properties: {
    title: string;
    mag: number;
    time: number;
    place: string;
    type: string;
    status: string;
    url: string;
  };
  geometry: {
    coordinates: [number, number, number];
  };
}

interface ProcessedEarthquake {
  id: string;
  title: string;
  magnitude: number;
  depth: number;
  time: Date;
  place: string;
  coordinates: [number, number];
  type: string;
  status: string;
  url: string;
}

interface EarthquakeApiResponse {
  features: EarthquakeFeature[];
  metadata: {
    generated: number;
  };
}

const Dashboard: React.FC<DashboardProps> = ({ className = '' }) => {
  const { data, error, isLoading } = useSWR<EarthquakeApiResponse>(EARTHQUAKE_API, fetcher, {
    refreshInterval: 60000, 
  });

  const [processedData, setProcessedData] = useState<ProcessedEarthquake[]>([]);

  const [filters, setFilters] = useState<Filters>({
    magnitude: 0,
    timeRange: '24h',
    region: 'all'
  });

  const [activeTab, setActiveTab] = useState<'charts' | 'table'>('charts');

  useEffect(() => {
    if (!data || !data.features) return;

    let processed = data.features.map((feature: EarthquakeFeature) => ({
      id: feature.id,
      title: feature.properties.title,
      magnitude: feature.properties.mag,
      depth: feature.geometry.coordinates[2],
      time: new Date(feature.properties.time),
      place: feature.properties.place,
      coordinates: [
        feature.geometry.coordinates[0],
        feature.geometry.coordinates[1]
      ] as [number, number],
      type: feature.properties.type,
      status: feature.properties.status,
      url: feature.properties.url
    }));

    processed = processed.filter(item => item.magnitude >= filters.magnitude);

    const now = new Date();
    let timeLimit: Date;

    switch (filters.timeRange) {
      case '1h':
        timeLimit = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '6h':
        timeLimit = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '12h':
        timeLimit = new Date(now.getTime() - 12 * 60 * 60 * 1000);
        break;
      default: 
        timeLimit = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    processed = processed.filter(item => item.time >= timeLimit);

    if (filters.region !== 'all') {
      processed = processed.filter(item =>
        item.place.toLowerCase().includes(filters.region.toLowerCase())
      );
    }

    processed = processed.sort((a, b) => b.magnitude - a.magnitude);

    setProcessedData(processed);
  }, [data, filters]);

  const stats = {
    total: processedData.length,
    maxMagnitude: processedData.length > 0
      ? Math.max(...processedData.map(item => item.magnitude))
      : 0,
    averageMagnitude: processedData.length > 0
      ? processedData.reduce((sum, item) => sum + item.magnitude, 0) / processedData.length
      : 0,
    recentCount: processedData.filter(item => {
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return item.time >= hourAgo;
    }).length
  };

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters({ ...filters, ...newFilters });
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="bg-gray-50 p-4 rounded-t-lg border-b">
        <h2 className="text-xl font-bold text-gray-800">Painel de Terremotos</h2>
        <p className="text-sm text-gray-600">
          Dados atualizados: {isLoading ? 'Atualizando...' :
            data ? new Date(data.metadata.generated).toLocaleString() : 'Carregando...'}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-700">Total de Eventos</p>
          <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
        </div>
        <div className="bg-red-50 p-3 rounded-lg">
          <p className="text-sm text-red-700">Magnitude Máxima</p>
          <p className="text-2xl font-bold text-red-800">{stats.maxMagnitude.toFixed(1)}</p>
        </div>
        <div className="bg-amber-50 p-3 rounded-lg">
          <p className="text-sm text-amber-700">Magnitude Média</p>
          <p className="text-2xl font-bold text-amber-800">{stats.averageMagnitude.toFixed(1)}</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-sm text-green-700">Última Hora</p>
          <p className="text-2xl font-bold text-green-800">{stats.recentCount}</p>
        </div>
      </div>

      <FilterBar filters={filters} onFilterChange={handleFilterChange} />

      <div className="flex border-b">
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'charts'
            ? 'border-b-2 border-blue-500 text-blue-600'
            : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('charts')}
        >
          Gráficos
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'table'
            ? 'border-b-2 border-blue-500 text-blue-600'
            : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('table')}
        >
          Dados
        </button>
      </div>

      <div className="flex-grow overflow-auto p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 p-4">
            Erro ao carregar dados. Por favor, tente novamente.
          </div>
        ) : activeTab === 'charts' ? (
          <ChartPanel data={processedData} />
        ) : (
          <DataTable data={processedData} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
