'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import maplibregl, { Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import MapClustering from './MapClustering';

interface MarkerItem {
    longitude: number;
    latitude: number;
    title?: string;
    description?: string;
    magnitude?: number;
    time?: Date | string | number;
    place?: string;
    [key: string]: any;
}

interface MapComponentProps {
    initialView?: {
        center: [number, number];
        zoom: number;
    };
    style?: string;
    markers?: MarkerItem[];
    showControls?: boolean;
    filters?: {
        magnitude?: number;
        timeRange?: string;
        region?: string;
    };
    onMarkerClick?: (marker: MarkerItem) => void;
    enableClustering?: boolean;
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
    showControls = true,
    filters: initialFilters = {},
    onMarkerClick,
    enableClustering = true
}) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<Map | null>(null);
    const [mapInitialized, setMapInitialized] = useState(false);
    const [mapType, setMapType] = useState<'streets' | 'satellite' | 'terrain' | 'osm'>('osm');
    const [mapMarkers, setMapMarkers] = useState<maplibregl.Marker[]>([]);
    const [mapError, setMapError] = useState<string | null>(null);
    const [clusteringEnabled, setClusteringEnabled] = useState(enableClustering);
    const [selectedMarker, setSelectedMarker] = useState<MarkerItem | null>(null);

    // Definir filtros como estado 
    const [filters, setFilters] = useState({
        magnitude: initialFilters.magnitude || 0,
        timeRange: initialFilters.timeRange || '24h',
        region: initialFilters.region || 'all'
    });

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

    // Lidar com clique em marcador
    const handleMarkerClick = useCallback((marker: MarkerItem) => {
        setSelectedMarker(marker);
        if (onMarkerClick) {
            onMarkerClick(marker);
        }
    }, [onMarkerClick]);

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
        el.style.cursor = 'pointer';

        // Adicionar evento de clique
        el.addEventListener('click', () => {
            handleMarkerClick(item);
        });

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
    }, [handleMarkerClick]);

    // Adicionando marcadores apenas após a inicialização do mapa
    useEffect(() => {
        if (!mapInitialized || !map.current || clusteringEnabled) return;

        console.log("Adicionando marcadores individuais:", markers.length);

        // Remover marcadores existentes
        mapMarkers.forEach(marker => marker.remove());

        // Filtrar marcadores com base nos filtros
        const filteredMarkers = markers.filter(item => {
            // Filtro de magnitude
            if (filters.magnitude !== undefined && item.magnitude !== undefined &&
                item.magnitude < filters.magnitude) {
                return false;
            }

            // Filtro de região
            if (filters.region && filters.region !== 'all' && item.place) {
                if (!item.place.toLowerCase().includes(filters.region.toLowerCase())) {
                    return false;
                }
            }

            // Filtro de tempo
            if (filters.timeRange && item.time) {
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
                    default: // 24h
                        timeLimit = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                }

                if (new Date(item.time) < timeLimit) {
                    return false;
                }
            }

            return true;
        });

        // Adicionar novos marcadores
        const newMarkers = filteredMarkers.map(item => {
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
    }, [markers, mapInitialized, createMarkerElement, filters, clusteringEnabled]);

    // Alternar clustering
    const toggleClustering = useCallback(() => {
        // Remover todos os marcadores quando ativar clustering
        if (!clusteringEnabled) {
            mapMarkers.forEach(marker => marker.remove());
            setMapMarkers([]);
        }

        setClusteringEnabled(!clusteringEnabled);
    }, [clusteringEnabled, mapMarkers]);

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

    // Manipular clique diretamente no mapa (para adicionar marcadores)
    const handleMapClick = useCallback((e: maplibregl.MapMouseEvent) => {
        // Implemente aqui a lógica de adicionar marcador ao clicar
        console.log("Clique no mapa:", e.lngLat);

        // Se desejar adicionar um novo marcador, pode implementar aqui
    }, []);

    // Manipular alterações nos filtros
    const handleMagnitudeChange = (value: string) => {
        setFilters(prev => ({
            ...prev,
            magnitude: parseFloat(value)
        }));
    };

    const handleTimeRangeChange = (value: string) => {
        setFilters(prev => ({
            ...prev,
            timeRange: value
        }));
    };

    const handleRegionChange = (value: string) => {
        setFilters(prev => ({
            ...prev,
            region: value
        }));
    };

    // Aplicar filtros (função consolidada)
    const applyFilters = () => {
        // Esta função não precisa fazer nada especial,
        // pois os filtros já são aplicados por reatividade
        console.log("Filtros aplicados:", filters);
    };

    useEffect(() => {
        if (!map.current || !mapInitialized) return;

        // Adicionar evento de clique no mapa
        map.current.on('click', handleMapClick);

        return () => {
            if (map.current) {
                map.current.off('click', handleMapClick);
            }
        };
    }, [map.current, mapInitialized, handleMapClick]);

    return (
        <div className="relative w-full h-full" style={{ minHeight: '500px' }}>
            <div
                ref={mapContainer}
                className="absolute inset-0 rounded-lg shadow-lg"
                style={{ width: '100%', height: '100%' }}
            />

            {/* Componente de clustering */}
            {mapInitialized && clusteringEnabled && (
                <MapClustering
                    map={map.current}
                    markers={markers}
                    filters={filters}
                    onMarkerClick={handleMarkerClick}
                    onClusterClick={(features) => {
                        console.log("Cluster expandido:", features);
                    }}
                />
            )}

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

            {/* Painel de controle para opções de mapa */}
            {mapInitialized && showControls && (
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
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
                            <button
                                className={`px-3 py-1 rounded-md text-sm ${clusteringEnabled ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                onClick={toggleClustering}
                            >
                                {clusteringEnabled ? 'Desativar Clustering' : 'Ativar Clustering'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Painel de informações do marcador selecionado */}
            {selectedMarker && (
                <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg max-w-xs z-10">
                    <div className="flex justify-between mb-2">
                        <h3 className="font-bold text-gray-800">
                            {selectedMarker.title || 'Marcador Selecionado'}
                        </h3>
                        <button
                            className="text-gray-500 hover:text-gray-700"
                            onClick={() => setSelectedMarker(null)}
                        >
                            &times;
                        </button>
                    </div>

                    {selectedMarker.magnitude !== undefined && (
                        <div className="mb-1">
                            <span className="text-sm font-semibold">Magnitude:</span>
                            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs text-white ${selectedMarker.magnitude >= 5 ? 'bg-red-600' :
                                selectedMarker.magnitude >= 3 ? 'bg-amber-500' :
                                    'bg-green-600'
                                }`}>
                                {selectedMarker.magnitude.toFixed(1)}
                            </span>
                        </div>
                    )}

                    {selectedMarker.time && (
                        <div className="mb-1 text-sm">
                            <span className="font-semibold">Data:</span>
                            <span className="ml-1">{new Date(selectedMarker.time).toLocaleString()}</span>
                        </div>
                    )}

                    {selectedMarker.place && (
                        <div className="mb-1 text-sm">
                            <span className="font-semibold">Local:</span>
                            <span className="ml-1">{selectedMarker.place}</span>
                        </div>
                    )}

                    {selectedMarker.description && (
                        <div className="mt-2 text-sm text-gray-700">
                            {selectedMarker.description}
                        </div>
                    )}

                    <div className="mt-2 text-xs text-gray-500">
                        Coordenadas: {selectedMarker.longitude.toFixed(4)}, {selectedMarker.latitude.toFixed(4)}
                    </div>
                </div>
            )}

            {/* Painel de filtros */}
            {mapInitialized && showControls && (
                <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg z-10 w-48">
                    <h3 className="font-semibold text-gray-700 mb-2">Filtros</h3>

                    <div className="mb-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Magnitude Mínima
                        </label>
                        <select
                            className="w-full p-1 text-sm border border-gray-300 rounded"
                            value={filters.magnitude?.toString() || "0"}
                            onChange={(e) => handleMagnitudeChange(e.target.value)}
                            disabled={!clusteringEnabled} // Desabilitar quando não estiver usando clustering
                        >
                            <option value="0">Todas</option>
                            <option value="1">Acima de 1</option>
                            <option value="3">Acima de 3</option>
                            <option value="5">Acima de 5</option>
                        </select>
                    </div>

                    <div className="mb-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Período de Tempo
                        </label>
                        <select
                            className="w-full p-1 text-sm border border-gray-300 rounded"
                            value={filters.timeRange || "24h"}
                            onChange={(e) => handleTimeRangeChange(e.target.value)}
                            disabled={!clusteringEnabled}
                        >
                            <option value="1h">Última hora</option>
                            <option value="6h">Últimas 6 horas</option>
                            <option value="12h">Últimas 12 horas</option>
                            <option value="24h">Últimas 24 horas</option>
                        </select>
                    </div>

                    <div className="mb-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Região
                        </label>
                        <select
                            className="w-full p-1 text-sm border border-gray-300 rounded"
                            value={filters.region || "all"}
                            onChange={(e) => handleRegionChange(e.target.value)}
                            disabled={!clusteringEnabled}
                        >
                            <option value="all">Todas as regiões</option>
                            <option value="california">Califórnia</option>
                            <option value="alaska">Alaska</option>
                            <option value="hawaii">Havaí</option>
                            <option value="japan">Japão</option>
                        </select>
                    </div>

                    <div className="flex justify-end mt-3">
                        <button
                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                            onClick={applyFilters}
                            disabled={!clusteringEnabled}
                        >
                            Aplicar Filtros
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapComponent;