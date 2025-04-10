'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

// Interfaces GeoJSON adequadas
interface GeoJSONPoint {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
}

interface GeoJSONFeature {
    type: 'Feature';
    properties: Record<string, any>;
    geometry: GeoJSONPoint;
}

interface GeoJSONCollection {
    type: 'FeatureCollection';
    features: GeoJSONFeature[];
}

interface MarkerItem {
    longitude: number;
    latitude: number;
    title?: string;
    description?: string;
    magnitude?: number;
    place?: string;
    time?: number | string | Date;
    [key: string]: any;
}

interface MapClusteringProps {
    map: maplibregl.Map | null;
    markers: MarkerItem[];
    clusterRadius?: number;
    clusterMaxZoom?: number;
    onClusterClick?: (features: any[]) => void;
    onMarkerClick?: (marker: MarkerItem) => void;
    filters?: {
        magnitude?: number;
        timeRange?: string;
        region?: string;
    };
}

const MapClustering: React.FC<MapClusteringProps> = ({
    map,
    markers,
    clusterRadius = 50,
    clusterMaxZoom = 14,
    onClusterClick,
    onMarkerClick,
    filters = {}
}) => {
    const sourceId = useRef('earthquake-source');
    const clusterId = useRef('earthquake-clusters');
    const unclustered = useRef('earthquake-unclustered');
    const clusterCount = useRef('earthquake-cluster-count');
    const markersAdded = useRef(false);

    // Referências para os handlers de eventos
    const handlers = useRef<{
        clusterClick: ((e: maplibregl.MapMouseEvent) => void) | null;
        unclusteredClick: ((e: maplibregl.MapMouseEvent) => void) | null;
        clusterEnter: ((e: maplibregl.MapMouseEvent) => void) | null;
        clusterLeave: ((e: maplibregl.MapMouseEvent) => void) | null;
        unclusteredEnter: ((e: maplibregl.MapMouseEvent) => void) | null;
        unclusteredLeave: ((e: maplibregl.MapMouseEvent) => void) | null;
    }>({
        clusterClick: null,
        unclusteredClick: null,
        clusterEnter: null,
        clusterLeave: null,
        unclusteredEnter: null,
        unclusteredLeave: null
    });

    // Converter marcadores para formato GeoJSON
    const getGeoJsonData = (): GeoJSONCollection => {
        return {
            type: 'FeatureCollection',
            features: markers
                .filter(marker => {
                    // Aplicar filtros
                    if (filters.magnitude !== undefined && marker.magnitude !== undefined &&
                        marker.magnitude < filters.magnitude) {
                        return false;
                    }

                    // Filtro de região (se existir no marker)
                    if (filters.region && filters.region !== 'all' && marker.place) {
                        if (!marker.place.toLowerCase().includes(filters.region.toLowerCase())) {
                            return false;
                        }
                    }

                    // Filtro de tempo (se existir no marker)
                    if (filters.timeRange && marker.time) {
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

                        const markerTime = typeof marker.time === 'string' ?
                            new Date(marker.time) : new Date(marker.time);

                        if (markerTime < timeLimit) {
                            return false;
                        }
                    }

                    return true;
                })
                .map(marker => ({
                    type: 'Feature',
                    properties: {
                        ...marker,
                        magnitude: marker.magnitude || 0,
                        title: marker.title || '',
                        description: marker.description || ''
                    },
                    geometry: {
                        type: 'Point',
                        coordinates: [marker.longitude, marker.latitude] as [number, number]
                    }
                }))
        };
    };

    // Configurar cores baseadas na magnitude
    const getMagnitudeColor = (magnitude: number): string => {
        if (magnitude >= 5) return '#dc2626'; // Vermelho
        if (magnitude >= 3) return '#f59e0b'; // Âmbar
        if (magnitude >= 1) return '#10b981'; // Verde
        return '#6b7280'; // Cinza
    };

    const getMagnitudeSize = (magnitude: number): number => {
        if (magnitude >= 5) return 18;
        if (magnitude >= 3) return 14;
        if (magnitude >= 1) return 10;
        return 8;
    };

    // Adicionar fonte e camadas para clustering
    useEffect(() => {
        if (!map || !map.isStyleLoaded()) return;

        const setupClustering = () => {
            // Verificar se a fonte já existe e removê-la
            if (map.getSource(sourceId.current)) {
                // Remover todas as camadas relacionadas primeiro
                if (map.getLayer(clusterCount.current)) map.removeLayer(clusterCount.current);
                if (map.getLayer(clusterId.current)) map.removeLayer(clusterId.current);
                if (map.getLayer(unclustered.current)) map.removeLayer(unclustered.current);

                // Agora remover a fonte
                map.removeSource(sourceId.current);
            }

            // Adicionar nova fonte com dados GeoJSON
            map.addSource(sourceId.current, {
                type: 'geojson',
                data: getGeoJsonData(),
                cluster: true,
                clusterMaxZoom: clusterMaxZoom,
                clusterRadius: clusterRadius
            });

            // Adicionar camada de círculos para clusters
            map.addLayer({
                id: clusterId.current,
                type: 'circle',
                source: sourceId.current,
                filter: ['has', 'point_count'],
                paint: {
                    'circle-color': [
                        'step',
                        ['get', 'point_count'],
                        '#6366f1', // Azul para clusters pequenos
                        10, '#8b5cf6', // Roxo para clusters médios
                        30, '#ec4899'  // Rosa para clusters grandes
                    ],
                    'circle-radius': [
                        'step',
                        ['get', 'point_count'],
                        20,   // Raio para clusters pequenos
                        10, 30,  // Raio para clusters médios
                        30, 40   // Raio para clusters grandes
                    ],
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff'
                }
            });

            // Adicionar camada para contagem de pontos no cluster
            map.addLayer({
                id: clusterCount.current,
                type: 'symbol',
                source: sourceId.current,
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': '{point_count_abbreviated}',
                    'text-size': 14,
                    'text-font': ['Open Sans Regular']
                },
                paint: {
                    'text-color': '#ffffff'
                }
            });

            // Adicionar camada para pontos individuais
            map.addLayer({
                id: unclustered.current,
                type: 'circle',
                source: sourceId.current,
                filter: ['!', ['has', 'point_count']],
                paint: {
                    'circle-color': [
                        'interpolate',
                        ['linear'],
                        ['get', 'magnitude'],
                        0, '#6b7280',  // Cinza
                        1, '#10b981',  // Verde
                        3, '#f59e0b',  // Âmbar
                        5, '#dc2626'   // Vermelho
                    ],
                    'circle-radius': [
                        'interpolate',
                        ['linear'],
                        ['get', 'magnitude'],
                        0, 8,
                        1, 10,
                        3, 14,
                        5, 18
                    ],
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff',
                    'circle-opacity': 0.85
                }
            });

            // Handler para clique em clusters
            const clusterClickHandler = (e: maplibregl.MapMouseEvent) => {
                if (!e.point) return;

                const features = map.queryRenderedFeatures(e.point, { layers: [clusterId.current] });
                if (!features.length) return;

                const feature = features[0];
                const clusterIdValue = feature.properties?.cluster_id;
                if (clusterIdValue === undefined) return;

                const source = map.getSource(sourceId.current);
                if (!source || source.type !== 'geojson') return;

                // Verificar a disponibilidade dos métodos na versão do MapLibre
                if (typeof (source as any).getClusterLeaves === 'function') {
                    // MapLibre < 3.0
                    (source as any).getClusterLeaves(
                        clusterIdValue,
                        100, // limite
                        (err: Error | null, clusterFeatures: any[]) => {
                            if (err) {
                                console.error('Erro ao expandir cluster:', err);
                                return;
                            }

                            if (onClusterClick && clusterFeatures) {
                                onClusterClick(clusterFeatures);
                            }

                            // Dar zoom no cluster
                            if (typeof (source as any).getClusterExpansionZoom === 'function') {
                                (source as any).getClusterExpansionZoom(
                                    clusterIdValue,
                                    (err: Error | null, zoom: number) => {
                                        if (err) return;

                                        if (feature.geometry.type === 'Point') {
                                            const coords = feature.geometry.coordinates;

                                            if (coords && coords.length >= 2) {
                                                map.easeTo({
                                                    center: [coords[0], coords[1]],
                                                    zoom: zoom
                                                });
                                            }
                                        }
                                    }
                                );
                            }
                        }
                    );
                } else {
                    // MapLibre >= 3.0 ou abordagem alternativa
                    console.warn('getClusterLeaves não está disponível nesta versão do MapLibre');

                    // Zoom no cluster como alternativa
                    map.easeTo({
                        center: [
                            (feature.geometry as GeoJSONPoint).coordinates[0],
                            (feature.geometry as GeoJSONPoint).coordinates[1]
                        ],
                        zoom: map.getZoom() + 2
                    });
                }
            };

            // Handler para clique em marcadores individuais
            const unclusteredClickHandler = (e: maplibregl.MapMouseEvent) => {
                if (!e.point) return;

                const features = map.queryRenderedFeatures(e.point, { layers: [unclustered.current] });
                if (!features.length) return;

                const feature = features[0];
                const marker = feature.properties as MarkerItem;

                if (onMarkerClick) {
                    onMarkerClick(marker);
                }

                if (feature.geometry.type === 'Point') {
                    const coordinates = feature.geometry.coordinates.slice();

                    if (coordinates && coordinates.length >= 2) {
                        const popupContent = `
              <div class="p-2 max-w-xs">
                <h3 class="font-bold text-gray-900">${marker.title || 'Terremoto'}</h3>
                <p class="mt-1 text-sm">${marker.description || ''}</p>
              </div>
            `;

                        new maplibregl.Popup({ offset: 15 })
                            .setLngLat([coordinates[0], coordinates[1]])
                            .setHTML(popupContent)
                            .addTo(map);
                    }
                }
            };

            // Handlers para cursor
            const clusterEnterHandler = () => {
                map.getCanvas().style.cursor = 'pointer';
            };

            const clusterLeaveHandler = () => {
                map.getCanvas().style.cursor = '';
            };

            const unclusteredEnterHandler = () => {
                map.getCanvas().style.cursor = 'pointer';
            };

            const unclusteredLeaveHandler = () => {
                map.getCanvas().style.cursor = '';
            };

            // Armazenar os handlers para limpeza posterior
            handlers.current = {
                clusterClick: clusterClickHandler,
                unclusteredClick: unclusteredClickHandler,
                clusterEnter: clusterEnterHandler,
                clusterLeave: clusterLeaveHandler,
                unclusteredEnter: unclusteredEnterHandler,
                unclusteredLeave: unclusteredLeaveHandler
            };

            // Adicionar os event listeners
            map.on('click', clusterId.current, clusterClickHandler);
            map.on('click', unclustered.current, unclusteredClickHandler);
            map.on('mouseenter', clusterId.current, clusterEnterHandler);
            map.on('mouseleave', clusterId.current, clusterLeaveHandler);
            map.on('mouseenter', unclustered.current, unclusteredEnterHandler);
            map.on('mouseleave', unclustered.current, unclusteredLeaveHandler);

            markersAdded.current = true;
        };

        // Verificar se o estilo já está carregado
        if (map.isStyleLoaded()) {
            setupClustering();
        } else {
            map.once('style.load', setupClustering);
        }

        // Limpar listeners ao desmontar
        return () => {
            if (!map) return;

            // Usar try/catch para evitar erros se a camada ou fonte já tiver sido removida
            try {
                // Remover event listeners de forma segura
                const clusterLayerId = clusterId.current;
                const unclusteredLayerId = unclustered.current;

                if (handlers.current.clusterClick) {
                    map.off('click', clusterLayerId, handlers.current.clusterClick);
                }

                if (handlers.current.unclusteredClick) {
                    map.off('click', unclusteredLayerId, handlers.current.unclusteredClick);
                }

                if (handlers.current.clusterEnter) {
                    map.off('mouseenter', clusterLayerId, handlers.current.clusterEnter);
                }

                if (handlers.current.clusterLeave) {
                    map.off('mouseleave', clusterLayerId, handlers.current.clusterLeave);
                }

                if (handlers.current.unclusteredEnter) {
                    map.off('mouseenter', unclusteredLayerId, handlers.current.unclusteredEnter);
                }

                if (handlers.current.unclusteredLeave) {
                    map.off('mouseleave', unclusteredLayerId, handlers.current.unclusteredLeave);
                }
            } catch (err) {
                console.warn('Erro ao remover event listeners:', err);
            }
        };
    }, [map]);

    // Atualizar dados quando os marcadores ou filtros mudarem
    useEffect(() => {
        if (!map || !markersAdded.current) return;

        try {
            const source = map.getSource(sourceId.current);
            if (source && source.type === 'geojson') {
                (source as maplibregl.GeoJSONSource).setData(getGeoJsonData());
            }
        } catch (err) {
            console.warn('Erro ao atualizar dados GeoJSON:', err);
        }
    }, [map, markers, filters]);

    return null; // Componente não renderiza nada visualmente
};

export default MapClustering;