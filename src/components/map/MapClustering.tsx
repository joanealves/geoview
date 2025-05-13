'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

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

    const getGeoJsonData = (): maplibregl.GeoJSONSourceOptions['data'] => {
        return {
            type: 'FeatureCollection',
            features: markers
                .filter(marker => {
                    if (filters?.magnitude !== undefined && marker.magnitude !== undefined &&
                        marker.magnitude < filters.magnitude) {
                        return false;
                    }

                    if (filters?.region && filters.region !== 'all' && marker.place) {
                        if (!marker.place.toLowerCase().includes(filters.region.toLowerCase())) {
                            return false;
                        }
                    }

                    if (filters?.timeRange && marker.time) {
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

                        const markerTime = typeof marker.time === 'string' ?
                            new Date(marker.time) :
                            marker.time instanceof Date ?
                                marker.time :
                                new Date(Number(marker.time));

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
                        coordinates: [marker.longitude, marker.latitude]
                    }
                }))
        } as maplibregl.GeoJSONSourceOptions['data'];
    };

    useEffect(() => {
        if (!map || !map.isStyleLoaded()) return;

        const setupClustering = () => {
            try {
                if (map.getSource(sourceId.current)) {
                    if (map.getLayer(clusterCount.current)) map.removeLayer(clusterCount.current);
                    if (map.getLayer(clusterId.current)) map.removeLayer(clusterId.current);
                    if (map.getLayer(unclustered.current)) map.removeLayer(unclustered.current);

                    map.removeSource(sourceId.current);
                }

                map.addSource(sourceId.current, {
                    type: 'geojson',
                    data: getGeoJsonData(),
                    cluster: true,
                    clusterMaxZoom: clusterMaxZoom,
                    clusterRadius: clusterRadius
                });

                map.addLayer({
                    id: clusterId.current,
                    type: 'circle',
                    source: sourceId.current,
                    filter: ['has', 'point_count'],
                    paint: {
                        'circle-color': [
                            'step',
                            ['get', 'point_count'],
                            '#6366f1', 
                            10, '#8b5cf6', 
                            30, '#ec4899'  
                        ],
                        'circle-radius': [
                            'step',
                            ['get', 'point_count'],
                            20,   
                            10, 30, 
                            30, 40  
                        ],
                        'circle-stroke-width': 2,
                        'circle-stroke-color': '#ffffff'
                    }
                });

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
                            0, '#6b7280',  
                            1, '#10b981',  
                            3, '#f59e0b',  
                            5, '#dc2626'   
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

                const clusterClickHandler = (e: maplibregl.MapMouseEvent) => {
                    if (!e.point) return;

                    const features = map.queryRenderedFeatures(e.point, { layers: [clusterId.current] });
                    if (!features.length) return;

                    const feature = features[0];
                    const clusterIdValue = feature.properties?.cluster_id;
                    if (clusterIdValue === undefined) return;

                    const source = map.getSource(sourceId.current);
                    if (!source || typeof source !== 'object') return;

                    if (feature.geometry && feature.geometry.type === 'Point') {
                        const coordinates = feature.geometry.coordinates.slice();

                        map.flyTo({
                            center: [coordinates[0], coordinates[1]],
                            zoom: Math.min(map.getZoom() + 2, 16) 
                        });

                        if (onClusterClick) {
                            onClusterClick([feature]);
                        }
                    }
                };

                const unclusteredClickHandler = (e: maplibregl.MapMouseEvent) => {
                    if (!e.point) return;

                    const features = map.queryRenderedFeatures(e.point, { layers: [unclustered.current] });
                    if (!features.length) return;

                    const feature = features[0];
                    const properties = feature.properties as unknown as MarkerItem;

                    if (onMarkerClick && properties) {
                        onMarkerClick(properties);
                    }

                    if (feature.geometry.type === 'Point') {
                        const coordinates = feature.geometry.coordinates.slice();

                        if (coordinates && coordinates.length >= 2) {
                            const popupContent = `
                              <div class="p-2 max-w-xs">
                                <h3 class="font-bold text-gray-900">${properties.title || 'Terremoto'}</h3>
                                <p class="mt-1 text-sm">${properties.description || ''}</p>
                              </div>
                            `;

                            new maplibregl.Popup({ offset: 15 })
                                .setLngLat([coordinates[0], coordinates[1]])
                                .setHTML(popupContent)
                                .addTo(map);
                        }
                    }
                };

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

                handlers.current = {
                    clusterClick: clusterClickHandler,
                    unclusteredClick: unclusteredClickHandler,
                    clusterEnter: clusterEnterHandler,
                    clusterLeave: clusterLeaveHandler,
                    unclusteredEnter: unclusteredEnterHandler,
                    unclusteredLeave: unclusteredLeaveHandler
                };

                map.on('click', clusterId.current, clusterClickHandler);
                map.on('click', unclustered.current, unclusteredClickHandler);
                map.on('mouseenter', clusterId.current, clusterEnterHandler);
                map.on('mouseleave', clusterId.current, clusterLeaveHandler);
                map.on('mouseenter', unclustered.current, unclusteredEnterHandler);
                map.on('mouseleave', unclustered.current, unclusteredLeaveHandler);

                markersAdded.current = true;
            } catch (err) {
                console.error("Erro ao configurar clustering:", err);
            }
        };

        if (map.isStyleLoaded()) {
            setupClustering();
        } else {
            map.once('style.load', setupClustering);
        }

        return () => {
            if (!map) return;

            try {
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

                handlers.current = {
                    clusterClick: null,
                    unclusteredClick: null,
                    clusterEnter: null,
                    clusterLeave: null,
                    unclusteredEnter: null,
                    unclusteredLeave: null
                };
            } catch (err) {
                console.warn('Erro ao remover event listeners:', err);
            }
        };
    }, [map, clusterMaxZoom, clusterRadius, onClusterClick, onMarkerClick]);

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

    return null; 
};

export default MapClustering;
