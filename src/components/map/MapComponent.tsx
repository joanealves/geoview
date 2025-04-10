'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import maplibregl, { Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

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

const MAP_STYLES = {
    streets: 'https://api.maptiler.com/maps/streets/style.json?key=vuFX9QXs86TZoRsqoyCk',
    satellite: 'https://api.maptiler.com/maps/hybrid/style.json?key=vuFX9QXs86TZoRsqoyCk',
    terrain: 'https://api.maptiler.com/maps/topographique/style.json?key=vuFX9QXs86TZoRsqoyCk',
    osm: 'https://api.maptiler.com/maps/openstreetmap/style.json?key=vuFX9QXs86TZoRsqoyCk'
};

const MapComponent: React.FC<MapComponentProps> = ({
    initialView = { center: [-98.5795, 39.8283], zoom: 3 },
    style = MAP_STYLES.osm, // Usar OSM como padrão
    markers = [],
    showControls = true
}) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<Map | null>(null);
    const [mapInitialized, setMapInitialized] = useState(false);
    const [mapType, setMapType] = useState<'streets' | 'satellite' | 'terrain' | 'osm'>('osm');
    const [mapMarkers, setMapMarkers] = useState<maplibregl.Marker[]>([]);
    const [mapError, setMapError] = useState<string | null>(null);

    // Inicializar o mapa
useEffect(() => {
    if (map.current || !mapContainer.current) return;

    console.log("Inicializando mapa...");
    setMapError(null);

    // Sempre iniciar com o estilo OSM local, que é mais confiável
    const initialStyle = MAP_STYLES.osm;

    try {
        const newMap = new maplibregl.Map({
            container: mapContainer.current,
            style: initialStyle,
            center: initialView.center,
            zoom: initialView.zoom
        });

        // Adicionar controles ao mapa
        if (showControls) {
            newMap.addControl(new maplibregl.NavigationControl(), 'top-right');
            newMap.addControl(new maplibregl.ScaleControl(), 'bottom-right');
        }

        // Adicionar um log mais detalhado quando o estilo muda
        newMap.on('styledata', () => {
            console.log("Estilo de mapa carregado com sucesso!");
        });

        // Esperar até que o mapa carregue completamente
        newMap.on('load', () => {
            console.log("Mapa carregado com sucesso!");
            map.current = newMap;
            setMapInitialized(true);
        });

        // Manipular erros
        newMap.on('error', (e) => {
            console.error("Erro ao carregar o mapa:", e);
            // Exibir informações detalhadas do erro
            const errorMessage = e.error 
                ? `Erro ao carregar o mapa: ${e.error.message || JSON.stringify(e.error)}` 
                : `Erro ao carregar o mapa: Verifique a conexão e a URL do estilo`;
            setMapError(errorMessage);
        });
    } catch (error: any) {
        console.error("Erro ao inicializar o mapa:", error);
        setMapError(`Erro ao inicializar o mapa: ${error?.message || JSON.stringify(error) || 'Erro desconhecido'}`);
    }

    // Função de limpeza
    return () => {
        if (map.current) {
            map.current.remove();
            map.current = null;
        }
    };
}, [initialView.center, initialView.zoom, showControls]);

    // Criação de elementos de marcador
    const createMarkerElement = useCallback((item: MarkerItem) => {
        // Criar um elemento DOM para o marcador
        const el = document.createElement('div');

        // Determinar a cor com base na magnitude (para terremotos)
        let size = '24px';
        let color = '#555';

        if (item.magnitude !== undefined) {
            if (item.magnitude >= 5) {
                color = '#dc2626'; // Vermelho
                size = '32px';
            } else if (item.magnitude >= 3) {
                color = '#f59e0b'; // Âmbar
                size = '28px';
            } else if (item.magnitude >= 1) {
                color = '#10b981'; // Verde
                size = '24px';
            }
        }

        // Definir o estilo diretamente no elemento (sem depender do Tailwind)
        el.style.width = size;
        el.style.height = size;
        el.style.backgroundColor = color;
        el.style.borderRadius = '50%';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

        // Adicionar texto para a magnitude se disponível
        if (item.magnitude !== undefined) {
            const span = document.createElement('span');
            span.style.color = 'white';
            span.style.fontSize = '12px';
            span.style.fontWeight = 'bold';
            span.textContent = item.magnitude.toFixed(1);
            el.appendChild(span);
        } else {
            // Adicionar um ícone padrão se não houver magnitude
            const span = document.createElement('span');
            span.style.color = 'white';
            span.style.fontSize = '12px';
            span.style.fontWeight = 'bold';
            span.textContent = '!';
            el.appendChild(span);
        }

        return el;
    }, []);

    // Adicionando marcadores apenas após a inicialização do mapa
    useEffect(() => {
        if (!mapInitialized || !map.current) return;

        console.log("Adicionando marcadores:", markers.length);

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
                const popupContent = document.createElement('div');
                popupContent.style.padding = '10px';

                if (item.title) {
                    const title = document.createElement('h3');
                    title.style.fontWeight = 'bold';
                    title.style.marginBottom = '5px';
                    title.textContent = item.title;
                    popupContent.appendChild(title);
                }

                if (item.description) {
                    const desc = document.createElement('p');
                    desc.textContent = item.description;
                    popupContent.appendChild(desc);
                }

                const popup = new maplibregl.Popup({ offset: 25 })
                    .setDOMContent(popupContent);

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
    const changeMapStyle = useCallback((type: 'streets' | 'satellite' | 'terrain' | 'osm') => {
        if (!map.current) return;

        console.log("Mudando estilo do mapa para:", type);
        setMapError(null);

        let styleUrl = MAP_STYLES.osm; // Fallback para o estilo local OSM

        switch (type) {
            case 'streets':
                styleUrl = MAP_STYLES.streets;
                break;
            case 'satellite':
                styleUrl = MAP_STYLES.satellite;
                break;
            case 'terrain':
                styleUrl = MAP_STYLES.terrain;
                break;
            case 'osm':
                styleUrl = MAP_STYLES.osm;
                break;
        }

        try {
            map.current.setStyle(styleUrl);
            setMapType(type);
        } catch (error: any) {
            console.error("Erro ao mudar o estilo do mapa:", error);
            setMapError(`Erro ao mudar o estilo do mapa: ${error?.message || 'Erro desconhecido'}`);
        }
    }, []);

    // Reset da visualização do mapa
    const resetView = useCallback(() => {
        if (!map.current) return;

        console.log("Resetando visualização do mapa");

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
        console.log("Alternando visualização 3D. Pitch atual:", currentPitch);

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
        <div className="relative w-full h-full" style={{ minHeight: '500px' }}>
  <div 
    ref={mapContainer} 
    className="absolute inset-0 rounded-lg shadow-lg"
    style={{ width: '100%', height: '100%' }}
  />

            {/* Mensagem de inicialização/erro */}
            {!mapInitialized && !mapError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 rounded-lg">
                    <div className="text-center p-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-700">Carregando mapa...</p>
                    </div>
                </div>
            )}

            {/* Mensagem de erro */}
            {mapError && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-50 bg-opacity-90 rounded-lg">
                    <div className="text-center p-4 max-w-md">
                        <div className="text-red-500 text-5xl mb-4">⚠️</div>
                        <p className="text-red-700 font-bold mb-2">Erro no mapa</p>
                        <p className="text-red-600">{mapError}</p>
                        <button
                            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            onClick={() => {
                                if (map.current) {
                                    map.current.remove();
                                    map.current = null;
                                }
                                setMapError(null);
                                setMapInitialized(false);
                                setTimeout(() => {
                                    // Reinicializar com o estilo OSM local
                                    changeMapStyle('osm');
                                }, 100);
                            }}
                        >
                            Tentar Novamente com OSM
                        </button>
                    </div>
                </div>
            )}

            {mapInitialized && showControls && (
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                    {/* Painel de controle */}
                    <div className="bg-white rounded-lg shadow-lg p-3 w-48">
                        <h3 className="font-semibold text-gray-700 mb-2">Estilo do Mapa</h3>
                        <div className="flex flex-col gap-1">
                            <button
                                className={`px-3 py-1 rounded-md text-sm ${mapType === 'osm' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                onClick={() => changeMapStyle('osm')}
                            >
                                OpenStreetMap
                            </button>
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