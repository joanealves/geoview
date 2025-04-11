'use client';

import { useEffect, useCallback, useRef } from 'react';
import maplibregl from 'maplibre-gl';

interface MarkerItem {
  longitude: number;
  latitude: number;
  title?: string;
  description?: string;
  type?: string;
  [key: string]: any;
}

interface MarkersProps {
  map: maplibregl.Map;
  data: MarkerItem[];
  onMarkerClick: (marker: MarkerItem) => void;
}

const Markers: React.FC<MarkersProps> = ({ map, data, onMarkerClick }) => {
  // Usar ref para manter track dos marcadores criados
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const createMarkerElement = useCallback((item: MarkerItem) => {
    const el = document.createElement('div');

    // Estilo baseado no tipo de marcador
    const color = item.type === 'station' ? '#3b82f6' : '#ef4444';
    const size = '24px';

    el.style.width = size;
    el.style.height = size;
    el.style.backgroundColor = color;
    el.style.borderRadius = '50%';
    el.style.border = '2px solid white';
    el.style.cursor = 'pointer';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';

    // Ícone interno
    const icon = document.createElement('div');
    icon.style.color = 'white';
    icon.style.fontWeight = 'bold';
    icon.style.fontSize = '10px';
    icon.textContent = item.type === 'station' ? 'S' : 'E';
    el.appendChild(icon);

    return el;
  }, []);

  useEffect(() => {
    if (!map || !data?.length) return;

    // Limpar marcadores anteriores
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Criar novos marcadores
    const markers = data.map(item => {
      const el = createMarkerElement(item);

      // Usar uma função nomeada para o evento para poder remover depois
      const handleClick = () => onMarkerClick(item);

      // Adicionar evento de clique
      el.addEventListener('click', handleClick);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([item.longitude, item.latitude])
        .addTo(map);

      // Popup
      if (item.title || item.description) {
        const popup = new maplibregl.Popup({ offset: 25 })
          .setHTML(`
            <div class="p-2 max-w-xs">
              <h4 class="font-bold">${item.title || ''}</h4>
              <p class="text-sm mt-1">${item.description || ''}</p>
            </div>
          `);

        marker.setPopup(popup);
      }

      // Armazenar função de clique no marcador para remover depois
      (marker as any)._clickHandler = handleClick;
      (marker as any)._element = el;

      return marker;
    });

    // Atualizar a ref com os novos marcadores
    markersRef.current = markers;

    return () => {
      markers.forEach(marker => {
        if ((marker as any)._element && (marker as any)._clickHandler) {
          (marker as any)._element.removeEventListener('click', (marker as any)._clickHandler);
        }
        marker.remove();
      });
      markersRef.current = [];
    };
  }, [map, data, createMarkerElement, onMarkerClick]);

  return null;
};

export default Markers;