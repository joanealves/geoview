// components/map/Markers.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import maplibregl, { Map } from 'maplibre-gl';
import useSWR from 'swr';

// Interface para um item de marcador
interface MarkerItem {
  longitude: number;
  latitude: number;
  title?: string;
  description?: string;
  // Substituído [key: string]: any por uma tipagem mais específica
  [key: string]: string | number | undefined;
}

// URL para dados de exemplo ou API de dados geográficos
const API_URL = 'https://api.example.com/markers';

// Função para buscar dados
const fetcher = (url: string) => fetch(url).then(res => res.json());

interface MarkersProps {
  map: Map;
  markerType?: string;
  visible?: boolean;
  data?: MarkerItem[]; // Dados de marcadores passados como props
}

const Markers: React.FC<MarkersProps> = ({
  map,
  markerType = 'default',
  visible = true,
  data: propData
}) => {
  const [markers, setMarkers] = useState<maplibregl.Marker[]>([]);

  // Buscar dados da API se não forem fornecidos via props
  const { data: apiData } = useSWR<MarkerItem[]>(propData ? null : API_URL, fetcher, {
    refreshInterval: 60000, // Atualizar a cada minuto
  });

  // Usar dados das props ou da API
  const markerData = propData || apiData;

  // Função para criar um elemento personalizado para o marcador
  // Memoizando com useCallback para evitar recriação desnecessária
  const createMarkerElement = useCallback((markerItem: MarkerItem) => {
    const el = document.createElement('div');

    // Você pode usar dados do markerItem para personalizar o marcador
    // Por exemplo, poderia usar markerItem.type se disponível
    const markerTypeToUse = markerItem.type as string || markerType;

    // Diferentes estilos baseados no tipo de marcador
    switch (markerTypeToUse) {
      case 'station':
        el.className = 'marker-station';
        el.innerHTML = `
        <div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <span class="text-white text-xs font-bold">${markerItem.label || 'S'}</span>
        </div>
      `;
        break;
      case 'event':
        el.className = 'marker-event';
        el.innerHTML = `
        <div class="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
          <span class="text-white text-xs font-bold">${markerItem.label || '!'}</span>
        </div>
      `;
        break;
      default:
        el.className = 'marker-default';
        el.innerHTML = `
        <div class="w-4 h-4 bg-gray-700 rounded-full border-2 border-white"></div>
      `;
    }

    return el;
  }, [markerType]);

  // Adicionar ou atualizar marcadores no mapa
  useEffect(() => {
    if (!map || !markerData || !visible) return;

    // Remover marcadores existentes
    markers.forEach(marker => marker.remove());

    // Criar novos marcadores
    const newMarkers = markerData.map((item) => {
      const el = createMarkerElement(item);

      // Criar e adicionar marcador ao mapa
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([item.longitude, item.latitude])
        .addTo(map);

      // Adicionar popup se houver informações
      if (item.title || item.description) {
        const popup = new maplibregl.Popup({ offset: 25 })
          .setHTML(`
            <div class="p-2">
              <h3 class="font-bold">${item.title || ''}</h3>
              <p>${item.description || ''}</p>
            </div>
          `);

        marker.setPopup(popup);
      }

      return marker;
    });

    setMarkers(newMarkers);

    // Limpar marcadores ao desmontar
    return () => {
      newMarkers.forEach(marker => marker.remove());
    };
  }, [map, markerData, markerType, visible, createMarkerElement, markers]);

  // Se os marcadores não estão visíveis, não fazer nada
  useEffect(() => {
    if (!visible) {
      markers.forEach(marker => marker.remove());
    }
  }, [visible, markers]);

  return null; // Componente não renderiza nada visualmente
};

export default Markers;