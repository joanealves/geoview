// components/map/MapContainer.tsx
'use client';

import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import MapControls from './MapControls';
import DataLayer from './DataLayer';

interface MapContainerProps {
  initialView?: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
  style?: React.CSSProperties;
}

const defaultView = {
  longitude: -98.5795,
  latitude: 39.8283,
  zoom: 3,
};

const MapContainer: React.FC<MapContainerProps> = ({ 
  initialView = defaultView,
  style 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  useEffect(() => {
    if (map.current) return; // Map already initialized
    
    if (mapContainer.current) {
      // Initialize the map
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://demotiles.maplibre.org/style.json', // Free tile provider
        center: [initialView.longitude, initialView.latitude],
        zoom: initialView.zoom,
      });
      
      // Add navigation controls
      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
      
      // Add geolocate control
      map.current.addControl(
        new maplibregl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true
        }),
        'top-right'
      );
      
      // Set map as loaded
      map.current.on('load', () => {
        setMapLoaded(true);
      });
    }
    
    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [initialView]);
  
  return (
    <div className="relative w-full h-full">
      <div 
        ref={mapContainer} 
        className="absolute inset-0 rounded-lg shadow-lg" 
        style={style}
      />
      
      {mapLoaded && map.current && (
        <>
          <MapControls map={map.current} />
          <DataLayer map={map.current} />
        </>
      )}
    </div>
  );
};

export default MapContainer;