// components/map/Tooltip.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Map } from 'maplibre-gl';
import ReactDOM from 'react-dom';

interface TooltipProps {
  map: Map;
  enabled?: boolean;
  layerIds?: string[];
  hoverOnly?: boolean;
  formatTooltip?: (feature: any) => React.ReactNode | string;
}

const Tooltip: React.FC<TooltipProps> = ({
  map,
  enabled = true,
  layerIds = ['unclustered-point'], // Camadas para mostrar tooltip
  hoverOnly = true,
  formatTooltip
}) => {
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: React.ReactNode | string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    content: ''
  });
  
  const tooltipContainerRef = useRef<HTMLDivElement | null>(null);
  
  // Criar container para o tooltip no DOM
  useEffect(() => {
    if (!tooltipContainerRef.current) {
      const container = document.createElement('div');
      container.className = 'absolute pointer-events-none z-50';
      document.body.appendChild(container);
      tooltipContainerRef.current = container;
    }
    
    return () => {
      if (tooltipContainerRef.current) {
        document.body.removeChild(tooltipContainerRef.current);
      }
    };
  }, []);
  
  // Formatar conteúdo do tooltip
  const getTooltipContent = (feature: any) => {
    if (formatTooltip) {
      return formatTooltip(feature);
    }
    
    // Formatação padrão se não for fornecida uma função personalizada
    const properties = feature.properties;
    
    return `
      <div class="p-2">
        <div class="font-semibold">${properties.title || 'Item'}</div>
        ${properties.description ? `<div>${properties.description}</div>` : ''}
      </div>
    `;
  };
  
  useEffect(() => {
    if (!map || !enabled) return;
    
    // Handler para movimento do mouse
    const handleMouseMove = (e: maplibregl.MapMouseEvent & maplibregl.EventData) => {
      if (!hoverOnly) return;
      
      const features = map.queryRenderedFeatures(e.point, { layers: layerIds });
      
      if (features.length > 0) {
        const content = getTooltipContent(features[0]);
        
        setTooltip({
          visible: true,
          x: e.point.x,
          y: e.point.y,
          content
        });
        
        map.getCanvas().style.cursor = 'pointer';
      } else {
        setTooltip(prev => ({ ...prev, visible: false }));
        map.getCanvas().style.cursor = '';
      }
    };
    
    // Handler para click (se não for apenas hover)
    const handleClick = (e: maplibregl.MapMouseEvent & maplibregl.EventData) => {
      if (hoverOnly) return;
      
      const features = map.queryRenderedFeatures(e.point, { layers: layerIds });
      
      if (features.length > 0) {
        const content = getTooltipContent(features[0]);
        
        setTooltip({
          visible: true,
          x: e.point.x,
          y: e.point.y,
          content
        });
      } else {
        setTooltip(prev => ({ ...prev, visible: false }));
      }
    };
    
    // Adicionar event listeners
    map.on('mousemove', handleMouseMove);
    if (!hoverOnly) {
      map.on('click', handleClick);
    }
    
    // Limpar event listeners
    return () => {
      map.off('mousemove', handleMouseMove);
      if (!hoverOnly) {
        map.off('click', handleClick);
      }
    };
  }, [map, enabled, layerIds, hoverOnly, formatTooltip]);
  
  // Renderizar tooltip
  useEffect(() => {
    if (!tooltipContainerRef.current) return;
    
    ReactDOM.render(
      <div 
        className={`bg-white shadow-lg rounded-md p-1 max-w-xs ${tooltip.visible ? 'block' : 'hidden'}`}
        style={{
          position: 'absolute',
          left: tooltip.x + 10,
          top: tooltip.y + 10,
          zIndex: 1000,
          pointerEvents: 'none',
          transform: 'translate(0, 0)',
        }}
      >
        {typeof tooltip.content === 'string' ? (
          <div dangerouslySetInnerHTML={{ __html: tooltip.content as string }} />
        ) : (
          tooltip.content
        )}
      </div>,
      tooltipContainerRef.current
    );
  }, [tooltip]);
  
  return null; // Este componente não renderiza nada visualmente
};

export default Tooltip;