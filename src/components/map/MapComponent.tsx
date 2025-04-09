// components/map/MapComponent.tsx
'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import maplibregl, { Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Interfaces para marcadores e propriedades
interface MarkerItem {
    longitude: number;
    latitude: number;
    title?: string;
    description?: string;
    magnitude?: number;
}

interface MapComponentProps {
    initialView?: {
        center: [number, number];
        zoom: number;
    };
    style?: string;
    markers?: MarkerItem[];
    showControls?: boolean;
}

const MapComponent: React.FC<MapComponentProps> = ({
    initialView = { center: [-98.5795, 39.8283], zoom: 3 }, // Centro dos EUA como padrão
    style = 'https://demotiles.maplibre.org/style.json', // Estilo padrão
    markers = [],
    showControls = true
}) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<Map | null>(null);
    const [mapInitialized, setMapInitialized] = useState(false);
    const [mapType, setMapType] = useState<'streets' | 'satellite' | 'terrain'>('streets');
    const [mapMarkers, setMapMarkers] = useState<maplibregl.Marker[]>([]);

    // Inicializar mapa
    useEffect(() => {
        if (map.current || !mapContainer.current) return;

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: style,
            center: initialView.center,
            zoom: initialView.zoom
        });

        // Adicionar controles de navegação
        if (showControls) {
            map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
            map.current.addControl(
                new maplibregl.GeolocateControl({
                    positionOptions: {
                        enableHighAccuracy: true
                    },
                    trackUserLocation: true
                }),
                'top-right'
            );
        }

        map.current.on('load', () => {
            setMapInitialized(true);
        });

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, [initialView.center, initialView.zoom, style, showControls]);

    // Criar elemento para marcador
    const createMarkerElement = useCallback((item: MarkerItem) => {
        const el = document.createElement('div');

        // Estilo baseado na magnitude (para terremotos)
        let bgColor = 'bg-gray-700';

        if (item.magnitude !== undefined) {
            if (item.magnitude >= 5) {
                bgColor = 'bg-red-500';
            } else if (item.magnitude >= 3) {
                bgColor = 'bg-amber-500';
            } else if (item.magnitude >= 1) {
                bgColor = 'bg-green-500';
            }
        }

        el.innerHTML = `
      <div class="w-6 h-6 ${bgColor} rounded-full flex items-center justify-center">
        <span class="text-white text-xs font-bold">!</span>
      </div>
    `;

        return el;
    }, []);

    // Adicionar marcadores ao mapa
    useEffect(() => {
        if (!map.current || !mapInitialized || markers.length === 0) return;

        // Remover marcadores existentes
        mapMarkers.forEach(marker => marker.remove());

        // Adicionar novos marcadores
        const newMarkers = markers.map(item => {
            const el = createMarkerElement(item);

            const marker = new maplibregl.Marker({ element: el })
                .setLngLat([item.longitude, item.latitude])
                .addTo(map.current!);

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

        setMapMarkers(newMarkers);

        return () => {
            newMarkers.forEach(marker => marker.remove());
        };
    }, [markers, mapInitialized, createMarkerElement]);

    // Função para mudar o tipo de mapa
    const changeMapStyle = useCallback((type: 'streets' | 'satellite' | 'terrain') => {
        if (!map.current) return;

        let styleUrl = 'https://demotiles.maplibre.org/style.json'; // Estilo padrão (streets)

        if (type === 'satellite') {
            // Usar outro estilo gratuito para exemplo
            styleUrl = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
        } else if (type === 'terrain') {
            // Usar outro estilo gratuito para exemplo
            styleUrl = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
        }

        map.current.setStyle(styleUrl);
        setMapType(type);
    }, []);

    // Reset da visualização do mapa
    const resetView = useCallback(() => {
        if (!map.current) return;

        map.current.flyTo({
            center: initialView.center,
            zoom: initialView.zoom,
            bearing: 0,
            pitch: 0
        });
    }, [initialView.center, initialView.zoom]);

    // Toggle visualização 3D
    const toggle3D = useCallback(() => {
        if (!map.current) return;

        const currentPitch = map.current.getPitch();

        if (currentPitch > 0) {
            // Voltar para 2D
            map.current.easeTo({
                pitch: 0,
                bearing: 0
            });
        } else {
            // Mudar para 3D
            map.current.easeTo({
                pitch: 60,
                bearing: 30
            });
        }
    }, []);

    return (
        <div className="relative w-full h-full">
            <div ref={mapContainer} className="absolute inset-0 rounded-lg shadow-lg" />

            {mapInitialized && showControls && (
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
            )}
        </div>
    );
};

export default MapComponent;