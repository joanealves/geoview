// components/map/MapControls.tsx
'use client';

import { useState } from 'react';
import { Map } from 'maplibre-gl';

interface MapControlsProps {
  map: Map;
}

const MapControls: React.FC<MapControlsProps> = ({ map }) => {
  const [mapType, setMapType] = useState<'streets' | 'satellite' | 'terrain'>('streets');
  
  // Função para mudar o tipo de mapa
  const changeMapStyle = (type: 'streets' | 'satellite' | 'terrain') => {
    let styleUrl = 'https://demotiles.maplibre.org/style.json'; // Estilo padrão (streets)
    
    if (type === 'satellite') {
      // Usar o estilo de satélite gratuito de OpenMapTiles
      styleUrl = 'https://api.maptiler.com/maps/hybrid/style.json?key=get_your_own_key';
    } else if (type === 'terrain') {
      // Usar o estilo de terreno gratuito de OpenMapTiles
      styleUrl = 'https://api.maptiler.com/maps/topo/style.json?key=get_your_own_key';
    }
    
    map.setStyle(styleUrl);
    setMapType(type);
  };
  
  // Reset da visualização do mapa
  const resetView = () => {
    map.flyTo({
      center: [-98.5795, 39.8283], // Centro dos EUA
      zoom: 3,
      bearing: 0,
      pitch: 0
    });
  };
  
  // Adicionar visualização 3D
  const toggle3D = () => {
    const currentPitch = map.getPitch();
    if (currentPitch > 0) {
      // Voltar para 2D
      map.easeTo({
        pitch: 0,
        bearing: 0
      });
    } else {
      // Mudar para 3D
      map.easeTo({
        pitch: 60,
        bearing: 30
      });
    }
  };
  
  return (
    <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
      {/* Painel de controle */}
      <div className="bg-white rounded-lg shadow-lg p-3 w-48">
        <h3 className="font-semibold text-gray-700 mb-2">Estilo do Mapa</h3>
        <div className="flex flex-col gap-1">
          <button 
            className={`px-3 py-1 rounded-md text-sm ${mapType === 'streets' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => changeMapStyle('streets')}
          >
            Ruas
          </button>
          <button 
            className={`px-3 py-1 rounded-md text-sm ${mapType === 'satellite' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => changeMapStyle('satellite')}
          >
            Satélite
          </button>
          <button 
            className={`px-3 py-1 rounded-md text-sm ${mapType === 'terrain' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => changeMapStyle('terrain')}
          >
            Terreno
          </button>
        </div>
        
        <hr className="my-2 border-gray-200" />
        
        <h3 className="font-semibold text-gray-700 mb-2">Visualização</h3>
        <div className="flex flex-col gap-1">
          <button 
            className="px-3 py-1 rounded-md text-sm bg-gray-200 text-gray-700 hover:bg-gray-300"
            onClick={resetView}
          >
            Resetar Visualização
          </button>
          <button 
            className="px-3 py-1 rounded-md text-sm bg-gray-200 text-gray-700 hover:bg-gray-300"
            onClick={toggle3D}
          >
            Alternar 3D
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapControls;