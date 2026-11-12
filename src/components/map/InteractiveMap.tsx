'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Building2,
  Compass,
  Navigation,
  Sparkles,
  Box,
  GitCompare,
  Check,
  Layers,
  LocateFixed,
  Route,
  AlertTriangle,
  CheckCircle2,
  Maximize2,
  Eye,
  EyeOff,
  RotateCcw,
  Sliders,
  Info,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { useSpaceVisionStore } from '@/store/useSpaceVisionStore';
import { scorePropertyForIntent, BUSINESS_TYPE_META } from '@/lib/aiEngine';
import { getBuildingFootprintsGeoJSON } from '@/lib/building3dGeo';
import { calculateHaversineMeters, calculateBearingDegrees } from '@/lib/geoUtils';
import type { PropertyItem, POICategory, POIItem, RouteResult } from '@/types';

export interface InteractiveMapProps {
  mode: 'discovery' | 'location';
  filteredProperties?: PropertyItem[];
  className?: string;
  flyToRouteId?: string | null;
  onClearFlyToRoute?: () => void;
}

type BasemapTheme = 'streets' | 'hybrid' | 'osm';

const BASEMAP_TILES: Record<
  BasemapTheme,
  { label: string; urls: string[]; attribution: string; maxzoom: number }
> = {
  streets: {
    label: 'Đường phố',
    urls: [
      'https://mt0.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      'https://mt2.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      'https://mt3.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    ],
    attribution: '&copy; Google Maps',
    maxzoom: 20,
  },
  hybrid: {
    label: 'Vệ tinh',
    urls: [
      'https://mt0.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      'https://mt2.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      'https://mt3.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    ],
    attribution: '&copy; Google Maps',
    maxzoom: 20,
  },
  osm: {
    label: 'OpenStreetMap',
    urls: [
      'https://a.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
      'https://b.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
      'https://c.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
    ],
    attribution: '&copy; OpenStreetMap contributors',
    maxzoom: 19,
  },
};

export const POI_CATEGORY_META: Record<
  POICategory,
  { label: string; shortLabel: string; color: string; bgHex: string; borderHex: string; badgeSymbol: string }
> = {
  university: {
    label: 'Trường Đại học',
    shortLabel: 'Đại học',
    color: 'text-indigo-600',
    bgHex: '#4f46e5',
    borderHex: '#818cf8',
    badgeSymbol: 'ĐH',
  },
  office: {
    label: 'Tòa nhà Văn phòng',
    shortLabel: 'Văn phòng',
    color: 'text-sky-600',
    bgHex: '#0284c7',
    borderHex: '#38bdf8',
    badgeSymbol: 'VP',
  },
  apartment: {
    label: 'Khu Chung cư / Dân cư',
    shortLabel: 'Chung cư',
    color: 'text-teal-600',
    bgHex: '#0d9488',
    borderHex: '#2dd4bf',
    badgeSymbol: 'CC',
  },
  mall: {
    label: 'TTTM / Mua sắm',
    shortLabel: 'TTTM',
    color: 'text-purple-600',
    bgHex: '#9333ea',
    borderHex: '#c084fc',
    badgeSymbol: 'TM',
  },
  cafe_restaurant: {
    label: 'Cafe & Nhà hàng',
    shortLabel: 'F&B',
    color: 'text-amber-600',
    bgHex: '#d97706',
    borderHex: '#fbbf24',
    badgeSymbol: 'FB',
  },
  competitor: {
    label: 'Đối thủ cùng ngành',
    shortLabel: 'Đối thủ',
    color: 'text-rose-600',
    bgHex: '#e11d48',
    borderHex: '#fb7185',
    badgeSymbol: 'ĐT',
  },
  parking: {
    label: 'Bãi đỗ xe',
    shortLabel: 'Đỗ xe',
    color: 'text-emerald-600',
    bgHex: '#059669',
    borderHex: '#34d399',
    badgeSymbol: 'P',
  },
  bus_stop: {
    label: 'Trạm xe buýt / Metro',
    shortLabel: 'Giao thông',
    color: 'text-cyan-600',
    bgHex: '#0891b2',
    borderHex: '#22d3ee',
    badgeSymbol: 'BUS',
  },
  hospital: {
    label: 'Bệnh viện / Y tế',
    shortLabel: 'Y tế',
    color: 'text-pink-600',
    bgHex: '#db2777',
    borderHex: '#f472b6',
    badgeSymbol: 'YT',
  },
};

/**
 * Normalizes coordinates to [lng, lat] for MapLibre GL.
 * In Hanoi, latitude is ~21.0 (<= 90) and longitude is ~105.8 (> 90).
 */
export function toLngLat(coord: [number, number]): [number, number] {
  if (!coord || coord.length < 2) return [105.8342, 21.0278];
  if (Math.abs(coord[0]) <= 90 && Math.abs(coord[1]) > 90) {
    return [coord[1], coord[0]];
  }
  return [coord[0], coord[1]];
}

/**
 * Generates a GeoJSON Polygon circle around [lng, lat] with radius in meters.
 */
function createGeoJSONCircle(centerLngLat: [number, number], radiusMeters: number, points = 64) {
  const [lng, lat] = centerLngLat;
  const km = radiusMeters / 1000;
  const ret: [number, number][] = [];
  const distanceX = km / (111.32 * Math.cos((lat * Math.PI) / 180));
  const distanceY = km / 110.574;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    ret.push([lng + x, lat + y]);
  }
  ret.push(ret[0]);

  return {
    type: 'Feature' as const,
    geometry: {
      type: 'Polygon' as const,
      coordinates: [ret],
    },
    properties: {},
  };
}

function buildRasterStyle(theme: BasemapTheme): maplibregl.StyleSpecification {
  const cfg = BASEMAP_TILES[theme];
  return {
    version: 8,
    sources: {
      'raster-tiles': {
        type: 'raster',
        tiles: cfg.urls,
        tileSize: 256,
        attribution: cfg.attribution,
        maxzoom: cfg.maxzoom,
      },
    },
    layers: [
      {
        id: 'basemap-layer',
        type: 'raster',
        source: 'raster-tiles',
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  };
}

export function InteractiveMap({
  mode,
  filteredProperties,
  className = '',
  flyToRouteId,
  onClearFlyToRoute,
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const routeLabelMarkersRef = useRef<maplibregl.Marker[]>([]);
  const activePopupRef = useRef<maplibregl.Popup | null>(null);
  const routeAnimRef = useRef<number | null>(null);
  const dashOffsetRef = useRef<number>(0);

  const [basemapTheme, setBasemapTheme] = useState<BasemapTheme>('streets');
  const [mapReady, setMapReady] = useState(false);
  const [showPreviewCard, setShowPreviewCard] = useState(true);
  const [showCatchmentCircle, setShowCatchmentCircle] = useState(true);
  const [is3DActive, setIs3DActive] = useState(true);

  // Camera fly-along state for MapLibre
  const [flyingRoute, setFlyingRoute] = useState<RouteResult | null>(null);
  const [flightProgress, setFlightProgress] = useState(0);
  const flightAnimRef = useRef<number | null>(null);

  const {
    properties,
    selectedPropertyId,
    comparedPropertyIds,
    parsedIntent,
    filterDistrict,
    filterMaxRent,
    filterMinArea,
    selectedBusinessType,
    activePOICategories,
    selectedPOIIds,
    activeRoutes,
    transportMode,
    map3DBuildings,
    mapPitch,
    selectProperty,
    toggleCompareProperty,
    toggleSelectPOI,
    setActiveTab,
    setMap3DBuildings,
    setMapPitch,
  } = useSpaceVisionStore();

  const selectedProperty = useMemo(
    () => properties.find((p) => p.id === selectedPropertyId) || properties[0],
    [properties, selectedPropertyId]
  );

  const visibleProperties = useMemo(() => {
    if (filteredProperties) return filteredProperties;
    return properties.filter((prop) => {
      if (filterDistrict !== 'all' && prop.district !== filterDistrict) return false;
      if (prop.monthlyRentMillionVND > filterMaxRent) return false;
      if (prop.totalAreaSqm < filterMinArea) return false;
      return true;
    });
  }, [filteredProperties, properties, filterDistrict, filterMaxRent, filterMinArea]);

  const propertyScores = useMemo(() => {
    const map = new Map<string, ReturnType<typeof scorePropertyForIntent>>();
    for (const p of properties) {
      map.set(p.id, scorePropertyForIntent(p, parsedIntent, selectedBusinessType));
    }
    return map;
  }, [properties, parsedIntent, selectedBusinessType]);

  // Initialize MapLibre instance with 3D buildings support
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialCenter = selectedProperty
      ? toLngLat(selectedProperty.coordinates)
      : ([105.819, 21.028] as [number, number]);

    const initialPitch = mode === 'location' ? 52 : 45;
    const initialBearing = mode === 'location' ? -20 : -10;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: buildRasterStyle(basemapTheme),
      center: initialCenter,
      zoom: mode === 'location' ? 16 : 13.8,
      maxZoom: 20,
      pitch: initialPitch,
      bearing: initialBearing,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('load', () => {
      setMapReady(true);
    });

    mapRef.current = map;

    return () => {
      if (activePopupRef.current) {
        activePopupRef.current.remove();
        activePopupRef.current = null;
      }
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      routeLabelMarkersRef.current.forEach((m) => m.remove());
      routeLabelMarkersRef.current = [];
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update basemap tile URLs when basemapTheme changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const source = map.getSource('raster-tiles') as maplibregl.RasterTileSource | undefined;
    if (source && typeof source.setTiles === 'function') {
      source.setTiles(BASEMAP_TILES[basemapTheme].urls);
    } else {
      map.setStyle(buildRasterStyle(basemapTheme));
    }
  }, [basemapTheme, mapReady]);

  // Fly to selected property when it changes or mode switches
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !selectedProperty) return;
    const center = toLngLat(selectedProperty.coordinates);
    map.flyTo({
      center,
      zoom: mode === 'location' ? 16.2 : Math.max(map.getZoom(), 14.2),
      pitch: is3DActive ? (mode === 'location' ? 55 : 45) : 0,
      bearing: is3DActive ? -18 : 0,
      duration: 1000,
      essential: true,
    });
    setShowPreviewCard(true);
  }, [selectedPropertyId, mode, mapReady, selectedProperty, is3DActive]);

  // 3D Building Extrusions Layer (HERO FEATURE)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !selectedProperty) return;

    const buildingsData = getBuildingFootprintsGeoJSON(selectedProperty.id);

    const existingSource = map.getSource('buildings-3d-source') as maplibregl.GeoJSONSource | undefined;
    if (existingSource) {
      existingSource.setData(buildingsData as any);
    } else {
      map.addSource('buildings-3d-source', {
        type: 'geojson',
        data: buildingsData as any,
      });

      // Add 3D building extrusion layer
      map.addLayer({
        id: 'buildings-3d-extrusion',
        type: 'fill-extrusion',
        source: 'buildings-3d-source',
        paint: {
          'fill-extrusion-color': [
            'case',
            ['get', 'isSubjectProperty'],
            '#0284c7', // Distinct blue highlight for the subject commercial building
            ['coalesce', ['get', 'color'], '#cbd5e1'], // Architectural concrete & glass tone
          ],
          'fill-extrusion-height': ['coalesce', ['get', 'height'], 24],
          'fill-extrusion-base': ['coalesce', ['get', 'minHeight'], 0],
          'fill-extrusion-opacity': 0.88,
        },
      });

      // Cursor & Click interaction for 3D buildings
      map.on('click', 'buildings-3d-extrusion', (e) => {
        if (!e.features || e.features.length === 0) return;
        const feat = e.features[0];
        const props = feat.properties as any;
        if (!props) return;

        if (activePopupRef.current) {
          activePopupRef.current.remove();
        }

        const isSubject = Boolean(props.isSubjectProperty);
        const tagText = isSubject ? 'Mặt Bằng Đang Khảo Sát' : 'Tòa Nhà Lân Cận';
        const tagBg = isSubject ? 'background:#0284c7; color:#ffffff;' : 'background:#f1f5f9; color:#475569;';

        const popup = new maplibregl.Popup({
          closeButton: true,
          closeOnClick: true,
          offset: [0, -10],
          className: 'map-clean-popup',
        })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #0f172a; padding: 6px 4px; min-width: 180px;">
              <div style="display: inline-block; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-bottom: 6px; ${tagBg}">
                ${tagText}
              </div>
              <div style="font-size: 13px; font-weight: 700; color: #0f172a; line-height: 1.3; margin-bottom: 4px;">
                ${props.name}
              </div>
              <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">
                Chiều cao: <b style="color: #0f172a;">${props.height}m</b> (${props.floors} tầng)
              </div>
              ${
                props.description
                  ? `<div style="font-size: 11px; color: #475569; line-height: 1.35; border-top: 1px solid #e2e8f0; padding-top: 4px; margin-top: 4px;">${props.description}</div>`
                  : ''
              }
            </div>
          `)
          .addTo(map);

        activePopupRef.current = popup;
      });

      map.on('mouseenter', 'buildings-3d-extrusion', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'buildings-3d-extrusion', () => {
        map.getCanvas().style.cursor = '';
      });
    }

    // Toggle 3D extrusion layer visibility
    if (map.getLayer('buildings-3d-extrusion')) {
      map.setLayoutProperty(
        'buildings-3d-extrusion',
        'visibility',
        map3DBuildings ? 'visible' : 'none'
      );
    }
  }, [mapReady, selectedProperty, map3DBuildings]);

  // Render 500m Catchment Circle & Active Route GeoJSON Layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !selectedProperty) return;

    const propLngLat = toLngLat(selectedProperty.coordinates);

    // 1. 500m Catchment Circle Source & Layers
    const circleFeature = createGeoJSONCircle(propLngLat, 500);
    const circleData = {
      type: 'FeatureCollection' as const,
      features: showCatchmentCircle ? [circleFeature] : [],
    };

    const existingCircleSource = map.getSource('catchment-circle') as maplibregl.GeoJSONSource | undefined;
    if (existingCircleSource) {
      existingCircleSource.setData(circleData);
    } else {
      map.addSource('catchment-circle', {
        type: 'geojson',
        data: circleData,
      });
      map.addLayer({
        id: 'catchment-circle-fill',
        type: 'fill',
        source: 'catchment-circle',
        paint: {
          'fill-color': '#0284c7',
          'fill-opacity': mode === 'location' ? 0.06 : 0.03,
        },
      });
      map.addLayer({
        id: 'catchment-circle-border',
        type: 'line',
        source: 'catchment-circle',
        paint: {
          'line-color': '#0284c7',
          'line-width': 1.5,
          'line-dasharray': [4, 4],
          'line-opacity': mode === 'location' ? 0.7 : 0.4,
        },
      });
    }

    if (map.getLayer('catchment-circle-fill')) {
      map.setPaintProperty('catchment-circle-fill', 'fill-opacity', mode === 'location' ? 0.06 : 0.03);
    }
    if (map.getLayer('catchment-circle-border')) {
      map.setPaintProperty('catchment-circle-border', 'line-opacity', mode === 'location' ? 0.7 : 0.4);
    }

    // 2. Active Routes GeoJSON Source & Layers (in location mode)
    const routeFeatures =
      mode === 'location'
        ? activeRoutes.map((route) => ({
            type: 'Feature' as const,
            geometry: {
              type: 'LineString' as const,
              coordinates: route.geometry.map((pt) => toLngLat(pt)),
            },
            properties: {
              poiId: route.poiId,
              poiName: route.poiName,
              isRealRouting: route.isRealRouting,
              distanceMeters: route.distanceMeters,
              durationSeconds: route.durationSeconds,
            },
          }))
        : [];

    const routesCollection = {
      type: 'FeatureCollection' as const,
      features: routeFeatures,
    };

    const existingRouteSource = map.getSource('active-routes') as maplibregl.GeoJSONSource | undefined;
    if (existingRouteSource) {
      existingRouteSource.setData(routesCollection);
    } else {
      map.addSource('active-routes', {
        type: 'geojson',
        data: routesCollection,
      });

      // Outer glow line
      map.addLayer({
        id: 'active-routes-glow',
        type: 'line',
        source: 'active-routes',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': ['case', ['get', 'isRealRouting'], '#0284c7', '#d97706'],
          'line-width': 8,
          'line-opacity': 0.2,
        },
      });

      // Real OSRM Route solid line
      map.addLayer({
        id: 'active-routes-real',
        type: 'line',
        source: 'active-routes',
        filter: ['==', ['get', 'isRealRouting'], true],
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#0284c7',
          'line-width': 3.5,
          'line-opacity': 0.95,
        },
      });

      // Fallback Estimate dashed line
      map.addLayer({
        id: 'active-routes-fallback',
        type: 'line',
        source: 'active-routes',
        filter: ['==', ['get', 'isRealRouting'], false],
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#d97706',
          'line-width': 3,
          'line-dasharray': [2, 2],
          'line-opacity': 0.95,
        },
      });

      // Animated route flow line (Cyan pulsed stream flowing outward from commercial building)
      map.addLayer({
        id: 'active-routes-flow',
        type: 'line',
        source: 'active-routes',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#38bdf8',
          'line-width': 3.5,
          'line-dasharray': [0, 4, 3],
          'line-opacity': 0.95,
        },
      });
    }

    // 3. Route midpoint HTML badges showing Distance + Travel Time + Honest Status
    routeLabelMarkersRef.current.forEach((m) => m.remove());
    routeLabelMarkersRef.current = [];

    if (mode === 'location' && activeRoutes.length > 0) {
      activeRoutes.forEach((route) => {
        if (!route.geometry || route.geometry.length === 0) return;
        const midIdx = Math.floor(route.geometry.length / 2);
        const midLngLat = toLngLat(route.geometry[midIdx]);

        const el = document.createElement('div');
        el.className = 'pointer-events-auto select-none z-20 animate-fade-in';
        const distLabel =
          route.distanceMeters >= 1000
            ? `${(route.distanceMeters / 1000).toFixed(2)} km`
            : `${Math.round(route.distanceMeters)} m`;
        const mins = Math.max(1, Math.round(route.durationSeconds / 60));
        const modeLabel = transportMode === 'foot' ? 'Đi bộ' : transportMode === 'bike' ? 'Xe máy' : 'Ô tô';

        const badgeStyle = route.isRealRouting
          ? 'bg-white border-blue-200 text-slate-800 shadow-lg ring-1 ring-blue-100'
          : 'bg-white border-amber-200 text-slate-800 shadow-lg ring-1 ring-amber-100';

        const tagBadge = route.isRealRouting
          ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">OSRM Thực Tế</span>'
          : '<span class="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200">Ước Tính Đô Thị</span>';

        el.innerHTML = `
          <div class="px-3 py-2 rounded-xl border backdrop-blur-md text-xs leading-tight flex flex-col gap-1 ${badgeStyle}">
            <div class="flex items-center gap-1.5 font-bold text-slate-900 text-[13px]">
              <span class="inline-block w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span>${distLabel}</span>
              <span class="text-slate-400">•</span>
              <span>~${mins} phút (${modeLabel})</span>
            </div>
            <div class="flex items-center justify-between gap-2 mt-0.5">
              <span class="text-xs text-slate-700 truncate max-w-[150px] font-medium">${route.poiName}</span>
              ${tagBadge}
            </div>
          </div>
        `;

        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat(midLngLat)
          .addTo(map);
        routeLabelMarkersRef.current.push(marker);
      });
    }
  }, [
    mapReady,
    mode,
    selectedProperty,
    activeRoutes,
    transportMode,
    showCatchmentCircle,
    basemapTheme,
  ]);

  // Animated flowing dash effect on active routes (pulsing outbound stream)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || activeRoutes.length === 0 || mode !== 'location') {
      if (routeAnimRef.current) {
        cancelAnimationFrame(routeAnimRef.current);
        routeAnimRef.current = null;
      }
      return;
    }

    let isSubscribed = true;
    const animateDash = () => {
      if (!isSubscribed) return;
      dashOffsetRef.current = (dashOffsetRef.current + 0.18) % 12;
      const step = dashOffsetRef.current;
      if (map && map.getLayer('active-routes-flow')) {
        map.setPaintProperty('active-routes-flow', 'line-dasharray', [
          step,
          4,
          Math.max(0.5, 8 - step),
        ]);
      }
      routeAnimRef.current = requestAnimationFrame(animateDash);
    };

    routeAnimRef.current = requestAnimationFrame(animateDash);

    // Smoothly fit map view to show property and its connected amenities
    if (selectedProperty && activeRoutes.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend(toLngLat(selectedProperty.coordinates));
      activeRoutes.forEach((route) => {
        route.geometry.forEach((pt) => bounds.extend(toLngLat(pt)));
      });
      map.fitBounds(bounds, { padding: 80, maxZoom: 16.8, duration: 800 });
    }

    return () => {
      isSubscribed = false;
      if (routeAnimRef.current) {
        cancelAnimationFrame(routeAnimRef.current);
        routeAnimRef.current = null;
      }
    };
  }, [mapReady, activeRoutes, mode, selectedProperty]);

  // Render Clean Property & POI Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (mode === 'discovery') {
      // Clean, professional real estate markers for all visible properties
      visibleProperties.forEach((prop) => {
        const isSelected = prop.id === selectedPropertyId;
        const isCompared = comparedPropertyIds.includes(prop.id);
        const breakdown = propertyScores.get(prop.id) || prop.defaultMatch;
        const score = breakdown ? Math.round(breakdown.overallScore) : 80;

        const scoreColor =
          score >= 85
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : score >= 70
            ? 'bg-blue-50 text-blue-700 border-blue-200'
            : 'bg-amber-50 text-amber-700 border-amber-200';

        const el = document.createElement('div');
        el.className = 'cursor-pointer group select-none';
        el.style.zIndex = isSelected ? '35' : '15';

        el.innerHTML = `
          <div class="relative flex flex-col items-center transition-all duration-200 ${
            isSelected ? 'scale-110' : 'hover:scale-105'
          }">
            ${
              isSelected
                ? '<div class="absolute -inset-1.5 rounded-xl bg-blue-500/25 animate-pulse pointer-events-none"></div>'
                : ''
            }
            <div class="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border shadow-md transition-all ${
              isSelected
                ? 'bg-blue-600 border-blue-600 text-white ring-2 ring-blue-300'
                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
            }">
              <span class="text-xs font-bold tracking-tight">${prop.monthlyRentMillionVND} tr/th</span>
              <span class="text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-500'} font-normal">| ${prop.totalAreaSqm}m²</span>
              <span class="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border ${
                isSelected ? 'bg-white text-blue-700 border-white' : scoreColor
              }">
                ${score}%
              </span>
              ${
                isCompared
                  ? '<span class="w-2 h-2 rounded-full bg-purple-500 ring-2 ring-purple-200" title="Đang so sánh"></span>'
                  : ''
              }
            </div>
            <div class="w-2.5 h-2.5 rotate-45 -mt-1 border-r border-b ${
              isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-200'
            }"></div>
          </div>
        `;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          selectProperty(prop.id);
          setShowPreviewCard(true);
        });

        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat(toLngLat(prop.coordinates))
          .addTo(map);

        markersRef.current.push(marker);
      });
    } else if (mode === 'location' && selectedProperty) {
      // 1. Central Selected Property Pin
      const propEl = document.createElement('div');
      propEl.className = 'select-none z-35';
      propEl.innerHTML = `
        <div class="relative flex flex-col items-center">
          <div class="absolute -inset-2 rounded-full bg-blue-500/20 animate-pulse pointer-events-none"></div>
          <div class="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xl border-2 border-white flex items-center gap-1.5">
            <span class="font-bold">${selectedProperty.code}</span>
            <span class="text-[11px] font-semibold text-blue-100">| ${selectedProperty.monthlyRentMillionVND} tr/tháng</span>
          </div>
          <div class="w-3 h-3 rotate-45 -mt-1.5 bg-blue-600 border-r-2 border-b-2 border-white"></div>
        </div>
      `;

      const propMarker = new maplibregl.Marker({ element: propEl, anchor: 'bottom' })
        .setLngLat(toLngLat(selectedProperty.coordinates))
        .addTo(map);
      markersRef.current.push(propMarker);

      // 2. Surrounding Clean POI Pins
      const visiblePOIs = selectedProperty.nearbyPOIs.filter((poi) =>
        activePOICategories.includes(poi.category)
      );

      visiblePOIs.forEach((poi: POIItem) => {
        const meta = POI_CATEGORY_META[poi.category] || POI_CATEGORY_META.office;
        const isSelectedPOI = selectedPOIIds.includes(poi.id);

        const poiEl = document.createElement('div');
        poiEl.className = 'cursor-pointer group select-none';
        poiEl.style.zIndex = isSelectedPOI ? '30' : '15';

        poiEl.innerHTML = `
          <div class="relative flex flex-col items-center transition-all duration-150 ${
            isSelectedPOI ? 'scale-110' : 'hover:scale-105'
          }">
            <div
              class="flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-sm text-xs font-semibold transition-all ${
                isSelectedPOI
                  ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-blue-400'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
              }"
            >
              <span
                class="w-2 h-2 rounded-full shrink-0"
                style="background-color: ${meta.bgHex};"
              ></span>
              <span class="max-w-[125px] truncate text-[11px]">${poi.name}</span>
            </div>
            <div
              class="w-2 h-2 rotate-45 -mt-1 border-r border-b ${
                isSelectedPOI ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200'
              }"
            ></div>
          </div>
        `;

        poiEl.addEventListener('click', (e) => {
          e.stopPropagation();
          void toggleSelectPOI(poi.id);
        });

        const poiMarker = new maplibregl.Marker({ element: poiEl, anchor: 'bottom' })
          .setLngLat(toLngLat(poi.coordinates))
          .addTo(map);

        markersRef.current.push(poiMarker);
      });
    }
  }, [
    mapReady,
    mode,
    visibleProperties,
    selectedPropertyId,
    comparedPropertyIds,
    propertyScores,
    selectedProperty,
    activePOICategories,
    selectedPOIIds,
    selectProperty,
    toggleSelectPOI,
  ]);

  // Recenter camera
  const handleRecenter = () => {
    const map = mapRef.current;
    if (!map || !selectedProperty) return;
    map.flyTo({
      center: toLngLat(selectedProperty.coordinates),
      zoom: mode === 'location' ? 16.2 : 14.5,
      pitch: is3DActive ? 52 : 0,
      bearing: is3DActive ? -15 : 0,
      duration: 800,
    });
  };

  // Start smooth camera fly-along along route polyline
  const startRouteCameraFlyalong = (route: RouteResult) => {
    const map = mapRef.current;
    if (!map || !route.geometry || route.geometry.length === 0) return;

    if (flightAnimRef.current) {
      cancelAnimationFrame(flightAnimRef.current);
      flightAnimRef.current = null;
    }

    const pts = route.geometry.map((pt) => toLngLat(pt));
    if (pts.length < 2) return;

    const segDistances: number[] = [];
    const cumLengths: number[] = [0];
    let totalLen = 0;

    for (let i = 0; i < pts.length - 1; i++) {
      const d = calculateHaversineMeters(pts[i], pts[i + 1]);
      segDistances.push(d);
      totalLen += d;
      cumLengths.push(totalLen);
    }

    if (totalLen <= 0) return;

    setFlyingRoute(route);
    setFlightProgress(0);

    const duration = Math.min(12000, Math.max(5000, (totalLen / 65) * 1000));
    const startTime = performance.now();

    const animateFlight = (now: number) => {
      const elapsed = now - startTime;
      const alpha = Math.min(1, elapsed / duration);
      setFlightProgress(Math.round(alpha * 100));

      const targetDist = alpha * totalLen;

      let segIdx = 0;
      for (let i = 0; i < segDistances.length; i++) {
        if (targetDist >= cumLengths[i] && targetDist <= cumLengths[i + 1]) {
          segIdx = i;
          break;
        }
      }

      const segLen = segDistances[segIdx] || 1;
      const segAlpha = Math.max(0, Math.min(1, (targetDist - cumLengths[segIdx]) / segLen));
      const p1 = pts[segIdx];
      const p2 = pts[Math.min(pts.length - 1, segIdx + 1)];

      const curLng = p1[0] + (p2[0] - p1[0]) * segAlpha;
      const curLat = p1[1] + (p2[1] - p1[1]) * segAlpha;

      const lookAheadIdx = Math.min(pts.length - 1, segIdx + 1);
      const bearing = calculateBearingDegrees([curLng, curLat], pts[lookAheadIdx]);

      map.jumpTo({
        center: [curLng, curLat],
        zoom: 17.8,
        pitch: 62,
        bearing: bearing,
      });

      if (alpha < 1) {
        flightAnimRef.current = requestAnimationFrame(animateFlight);
      } else {
        map.easeTo({
          center: pts[pts.length - 1],
          zoom: 17.4,
          pitch: 45,
          bearing: (bearing + 25) % 360,
          duration: 1200,
        });
        flightAnimRef.current = null;
        setTimeout(() => {
          setFlyingRoute(null);
          onClearFlyToRoute?.();
        }, 2200);
      }
    };

    flightAnimRef.current = requestAnimationFrame(animateFlight);
  };

  const stopRouteCameraFlyalong = () => {
    if (flightAnimRef.current) {
      cancelAnimationFrame(flightAnimRef.current);
      flightAnimRef.current = null;
    }
    setFlyingRoute(null);
    setFlightProgress(0);
    onClearFlyToRoute?.();
    const map = mapRef.current;
    if (map && selectedProperty) {
      map.flyTo({
        center: toLngLat(selectedProperty.coordinates),
        zoom: 16.2,
        pitch: 52,
        bearing: -15,
        duration: 800,
      });
    }
  };

  // Sync external flyToRouteId if passed from outside
  useEffect(() => {
    if (flyToRouteId && activeRoutes.length > 0) {
      const match = activeRoutes.find((r) => r.poiId === flyToRouteId);
      if (match) {
        startRouteCameraFlyalong(match);
      }
    }
  }, [flyToRouteId, activeRoutes]);

  // Clean up flight anim on unmount
  useEffect(() => {
    return () => {
      if (flightAnimRef.current) {
        cancelAnimationFrame(flightAnimRef.current);
      }
    };
  }, []);

  // Toggle 3D Tilt perspective (0° top-down vs 55° perspective)
  const handleToggle3D = () => {
    const map = mapRef.current;
    if (!map) return;
    const nextState = !is3DActive;
    setIs3DActive(nextState);
    const targetPitch = nextState ? 55 : 0;
    const targetBearing = nextState ? -18 : 0;
    setMapPitch(targetPitch);
    map.easeTo({
      pitch: targetPitch,
      bearing: targetBearing,
      duration: 800,
    });
  };

  // Reset North
  const handleResetNorth = () => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ bearing: 0, duration: 600 });
  };

  // Fit all coordinates
  const handleFitAll = () => {
    const map = mapRef.current;
    if (!map) return;
    const coords: [number, number][] = [];
    if (mode === 'discovery') {
      visibleProperties.forEach((p) => coords.push(toLngLat(p.coordinates)));
    } else if (selectedProperty) {
      coords.push(toLngLat(selectedProperty.coordinates));
      selectedProperty.nearbyPOIs
        .filter((poi) => activePOICategories.includes(poi.category))
        .forEach((poi) => coords.push(toLngLat(poi.coordinates)));
    }
    if (coords.length === 0) return;
    if (coords.length === 1) {
      map.flyTo({ center: coords[0], zoom: 15.5, duration: 700 });
      return;
    }
    const bounds = new maplibregl.LngLatBounds(coords[0], coords[0]);
    coords.forEach((c) => bounds.extend(c));
    map.fitBounds(bounds, { padding: 80, maxZoom: 16.5, duration: 800 });
  };

  const selectedBreakdown = selectedProperty
    ? propertyScores.get(selectedProperty.id) || selectedProperty.defaultMatch
    : undefined;
  const isSelectedCompared = selectedProperty
    ? comparedPropertyIds.includes(selectedProperty.id)
    : false;

  return (
    <div className={`relative w-full h-full bg-slate-100 overflow-hidden ${className}`}>
      {/* MapLibre Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Map Control Bar */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 pointer-events-auto">
        {/* 3D Buildings & Tilt Controls */}
        <div className="flex items-center bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg p-1 shadow-sm">
          <button
            type="button"
            onClick={handleToggle3D}
            title={is3DActive ? 'Chuyển sang bản đồ phẳng 2D (Góc nhìn từ trên xuống)' : 'Chuyển sang góc nhìn nghiêng 3D Toà Nhà'}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              is3DActive
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{is3DActive ? 'Góc nhìn 3D' : 'Bản đồ 2D'}</span>
          </button>

          <button
            type="button"
            onClick={() => setMap3DBuildings(!map3DBuildings)}
            title="Bật/Tắt khối toà nhà 3D (3D Building Extrusions)"
            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-all ml-1 ${
              map3DBuildings
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Khối nhà 3D</span>
          </button>

          <button
            type="button"
            onClick={handleResetNorth}
            title="Xoay bản đồ về hướng Bắc chuẩn"
            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors ml-0.5"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>

        {/* Basemap Switcher */}
        <div className="flex items-center bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg p-1 shadow-sm">
          <Layers className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-1" />
          {(['streets', 'hybrid', 'osm'] as BasemapTheme[]).map((theme) => (
            <button
              key={theme}
              type="button"
              onClick={() => setBasemapTheme(theme)}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                basemapTheme === theme
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {BASEMAP_TILES[theme].label}
            </button>
          ))}
        </div>

        {/* Navigation & Catchment Actions */}
        <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg p-1 shadow-sm">
          <button
            type="button"
            onClick={handleRecenter}
            title="Đưa góc nhìn về trung tâm mặt bằng đang chọn"
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
          >
            <LocateFixed className="w-3.5 h-3.5 text-blue-600" />
            <span>Tâm điểm</span>
          </button>
          <button
            type="button"
            onClick={handleFitAll}
            title="Thu phóng toàn bộ các điểm trên bản đồ"
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Toàn cảnh</span>
          </button>
          <button
            type="button"
            onClick={() => setShowCatchmentCircle((prev) => !prev)}
            title="Bật/Tắt vòng tròn bán kính 500m"
            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-colors ${
              showCatchmentCircle
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Bán kính 500m</span>
          </button>
        </div>

        {/* Data Provenance Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/95 backdrop-blur-md border border-slate-200 text-xs text-slate-600 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Tọa độ Hà Nội • Khối 3D:</span>
          <span className="font-semibold text-slate-900">Mô phỏng đô thị</span>
        </div>
      </div>

      {/* Mode === 'location': Active Routes Legend Overlay */}
      {mode === 'location' && activeRoutes.length > 0 && (
        <div className="absolute bottom-4 left-3 z-20 max-w-sm bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-3 shadow-lg pointer-events-auto">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <Route className="w-4 h-4 text-blue-600" />
              <span>Tuyến đường kết nối ({activeRoutes.length})</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
              {transportMode === 'foot' ? 'Đi bộ' : transportMode === 'bike' ? 'Xe máy' : 'Ô tô'}
            </span>
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {activeRoutes.map((r) => (
              <div
                key={r.poiId}
                className="flex items-center justify-between gap-2 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5"
              >
                <div className="truncate">
                  <div className="font-semibold text-slate-900 truncate">{r.poiName}</div>
                  <div className="text-[10px] text-slate-500">
                    {r.distanceMeters >= 1000
                      ? `${(r.distanceMeters / 1000).toFixed(2)} km`
                      : `${Math.round(r.distanceMeters)} m`}{' '}
                    • ~{Math.max(1, Math.round(r.durationSeconds / 60))} phút
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                      r.isRealRouting
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {r.isRealRouting ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-blue-600" />
                        <span>OSRM</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>Ước tính</span>
                      </>
                    )}
                  </span>

                  <button
                    type="button"
                    onClick={() => startRouteCameraFlyalong(r)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] shadow-xs transition cursor-pointer"
                    title="Camera bay dọc theo tuyến đường từ toà nhà đến tiện ích này"
                  >
                    <Compass className="w-3 h-3" />
                    <span>Bay cam</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating Camera Fly-Along Flight Player HUD */}
      {flyingRoute && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/95 text-slate-900 border-2 border-blue-500 shadow-2xl backdrop-blur-md animate-fade-in pointer-events-auto">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
          </div>
          <div className="text-xs">
            <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
              <span>Đang bay theo đường đi:</span>
              <span className="text-blue-600 font-bold">{flyingRoute.poiName}</span>
            </div>
            <div className="text-[10px] text-slate-500">
              Tiến độ {flightProgress}% •{' '}
              {flyingRoute.distanceMeters >= 1000
                ? `${(flyingRoute.distanceMeters / 1000).toFixed(2)} km`
                : `${Math.round(flyingRoute.distanceMeters)} m`}
            </div>
          </div>
          <button
            type="button"
            onClick={stopRouteCameraFlyalong}
            className="ml-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 border border-slate-200 transition cursor-pointer"
          >
            Dừng camera
          </button>
        </div>
      )}

      {/* Mode === 'discovery': Floating Property Summary Card */}
      {mode === 'discovery' && selectedProperty && (
        <div className="absolute bottom-4 left-3 right-3 md:left-4 md:right-auto md:w-[420px] z-20 pointer-events-auto">
          {!showPreviewCard ? (
            <button
              type="button"
              onClick={() => setShowPreviewCard(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/95 hover:bg-white border border-slate-200 text-xs font-semibold text-slate-800 shadow-lg backdrop-blur-md transition-all"
            >
              <Eye className="w-4 h-4 text-blue-600" />
              <span>Xem tóm tắt: {selectedProperty.title}</span>
            </button>
          ) : (
            <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl p-4 shadow-xl text-slate-800">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {selectedProperty.code}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {selectedProperty.district}, {selectedProperty.city}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1 leading-snug">
                    {selectedProperty.title}
                  </h3>
                  <p className="text-xs text-slate-500 truncate">{selectedProperty.address}</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {selectedBreakdown && (
                    <div className="px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-200 text-right">
                      <div className="text-xs font-extrabold text-blue-700">
                        {Math.round(selectedBreakdown.overallScore)}% Phù hợp
                      </div>
                      <div className="text-[10px] text-blue-600 font-medium">
                        {BUSINESS_TYPE_META[selectedBusinessType]?.labelVi || selectedBusinessType}
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPreviewCard(false)}
                    title="Thu gọn thẻ"
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <EyeOff className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Core Metrics Grid */}
              <div className="grid grid-cols-4 gap-2 my-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <div>
                  <div className="text-[10px] text-slate-500 font-medium">Giá thuê</div>
                  <div className="text-xs font-bold text-blue-600">
                    {selectedProperty.monthlyRentMillionVND} tr/th
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-medium">Diện tích</div>
                  <div className="text-xs font-bold text-slate-900">
                    {selectedProperty.totalAreaSqm} m² ({selectedProperty.floorsCount}T)
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-medium">Mặt tiền</div>
                  <div className="text-xs font-bold text-slate-900">
                    {selectedProperty.frontageMeters}m / Đ.{selectedProperty.roadWidthMeters}m
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-medium">Hướng</div>
                  <div className="text-xs font-bold text-slate-900">
                    {selectedProperty.orientationLabel}
                  </div>
                </div>
              </div>

              {/* Landlord Contact Quick Badge & Actions */}
              {selectedProperty.contact && (
                <div className="mb-3 p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between gap-2.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wide">
                        {selectedProperty.contact.role || 'Chủ nhà'}
                      </span>
                      {selectedProperty.contact.responseSpeed && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {selectedProperty.contact.responseSpeed}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-900 truncate mt-0.5">
                      {selectedProperty.contact.name}
                    </div>
                    <div className="text-[11px] font-mono text-slate-600">
                      {selectedProperty.contact.phone}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`tel:${selectedProperty.contact.phone.replace(/\s+/g, '')}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition-colors shadow-xs"
                      title={`Gọi điện trực tiếp cho ${selectedProperty.contact.name}`}
                    >
                      <Phone className="w-3 h-3" />
                      <span>Gọi ngay</span>
                    </a>
                    <a
                      href={`https://zalo.me/${(selectedProperty.contact.zaloPhone || selectedProperty.contact.phone).replace(/\s+/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] transition-colors shadow-xs"
                      title={`Nhắn tin Zalo với ${selectedProperty.contact.name}`}
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>Zalo</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('twin')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-sm"
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>Khám phá 3D Digital Twin</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('location')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs transition-colors shadow-sm"
                >
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                  <span>Bản đồ & Tiện ích</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('studio')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs transition-colors shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Dự toán setup AI</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleCompareProperty(selectedProperty.id)}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs border transition-colors shadow-sm ${
                    isSelectedCompared
                      ? 'bg-purple-50 border-purple-300 text-purple-700'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {isSelectedCompared ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-purple-600" />
                      <span>Đang so sánh ({comparedPropertyIds.length}/3)</span>
                    </>
                  ) : (
                    <>
                      <GitCompare className="w-3.5 h-3.5 text-purple-600" />
                      <span>+ So sánh</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default InteractiveMap;
