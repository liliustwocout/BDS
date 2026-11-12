import { POICategory, RouteResult, TransportMode } from '@/types';

const EARTH_RADIUS_METERS = 6371000;

/**
 * Normalizes a coordinate pair into GeoJSON [lng, lat] order (for Vietnam: lng ~ 105.x, lat ~ 21.x)
 */
export function normalizeLngLat(coord: [number, number]): [number, number] {
  if (Math.abs(coord[0]) <= 60 && Math.abs(coord[1]) > 60) {
    return [coord[1], coord[0]];
  }
  return [coord[0], coord[1]];
}

/**
 * Calculates straight-line Haversine distance in meters between two [lng, lat] coordinates.
 */
export function calculateHaversineMeters(
  origin: [number, number],
  destination: [number, number]
): number {
  const [lng1, lat1] = normalizeLngLat(origin);
  const [lng2, lat2] = normalizeLngLat(destination);

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * Estimates urban street-grid distance (Manhattan + Hanoi arterial detour factor ~1.34x)
 * when live OSRM routing is unreachable. Never claims crow-flies as real travel distance.
 */
export function estimateUrbanGridDistanceMeters(
  origin: [number, number],
  destination: [number, number]
): number {
  const [lng1, lat1] = normalizeLngLat(origin);
  const [lng2, lat2] = normalizeLngLat(destination);

  const latDistance = calculateHaversineMeters([lng1, lat1], [lng1, lat2]);
  const lngDistance = calculateHaversineMeters([lng1, lat1], [lng2, lat1]);
  const manhattan = latDistance + lngDistance;
  const haversine = calculateHaversineMeters([lng1, lat1], [lng2, lat2]);

  // Blend Manhattan grid and urban detour coefficient
  return Math.round(Math.max(haversine * 1.32, manhattan * 1.06));
}

/**
 * Generates an L-shaped + stepped street-grid geometry between two [lng, lat] points
 * for honest fallback visualization when OSRM is unavailable.
 */
function buildFallbackStreetGridGeometry(
  origin: [number, number],
  destination: [number, number]
): [number, number][] {
  const [lng1, lat1] = normalizeLngLat(origin);
  const [lng2, lat2] = normalizeLngLat(destination);

  const midLng = Number((lng1 + (lng2 - lng1) * 0.62).toFixed(6));
  const midLat = Number((lat1 + (lat2 - lat1) * 0.38).toFixed(6));

  return [
    [lng1, lat1],
    [midLng, lat1],
    [midLng, midLat],
    [lng2, midLat],
    [lng2, lat2],
  ];
}

function estimateTravelDurationSeconds(
  distanceMeters: number,
  mode: TransportMode
): number {
  // Realistic urban speeds in Hanoi:
  // foot: ~1.3 m/s (~4.7 km/h)
  // bike (motorbike/e-bike in urban traffic): ~6.8 m/s (~24.5 km/h)
  // car (urban traffic + intersections): ~5.6 m/s (~20.2 km/h)
  const speedMap: Record<TransportMode, number> = {
    foot: 1.3,
    bike: 6.8,
    car: 5.6,
  };
  const baseSeconds = distanceMeters / speedMap[mode];
  const intersectionDelay = mode === 'foot' ? 15 : mode === 'bike' ? 35 : 65;
  return Math.max(30, Math.round(baseSeconds + intersectionDelay));
}

/**
 * Fetches real street route from public OSRM API with a 3.5s timeout.
 * Falls back honestly to an estimated urban street-grid route if OSRM times out or fails.
 */
export async function fetchRouteToPOI(
  origin: [number, number],
  destination: [number, number],
  poiId: string,
  poiName: string,
  mode: TransportMode
): Promise<RouteResult> {
  const [lng1, lat1] = normalizeLngLat(origin);
  const [lng2, lat2] = normalizeLngLat(destination);

  // OSRM public demo server supports 'foot', 'bike', 'driving' profiles
  const osrmProfile =
    mode === 'foot' ? 'foot' : mode === 'bike' ? 'bike' : 'driving';
  const url = `https://router.project-osrm.org/route/v1/${osrmProfile}/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OSRM HTTP ${response.status}`);
    }

    const data = await response.json();
    const route = data?.routes?.[0];
    if (
      !route ||
      !route.geometry ||
      !Array.isArray(route.geometry.coordinates) ||
      route.geometry.coordinates.length < 2
    ) {
      throw new Error('Invalid OSRM route payload');
    }

    const distanceMeters = Math.round(Number(route.distance) || 0);
    // OSRM public server sometimes uses car speeds even on foot/bike endpoints; adjust duration realistically for Hanoi urban traffic
    const durationSeconds = estimateTravelDurationSeconds(distanceMeters, mode);

    return {
      poiId,
      poiName,
      mode,
      distanceMeters,
      durationSeconds,
      geometry: route.geometry.coordinates as [number, number][],
      isRealRouting: true,
      routingNote:
        'Tuyến đường thực tế tính toán qua mạng lưới đường giao thông OSRM (OpenStreetMap Routing Machine)',
    };
  } catch {
    clearTimeout(timeoutId);
    const fallbackDistance = estimateUrbanGridDistanceMeters(
      [lng1, lat1],
      [lng2, lat2]
    );
    const fallbackDuration = estimateTravelDurationSeconds(
      fallbackDistance,
      mode
    );
    const fallbackGeometry = buildFallbackStreetGridGeometry(
      [lng1, lat1],
      [lng2, lat2]
    );

    return {
      poiId,
      poiName,
      mode,
      distanceMeters: fallbackDistance,
      durationSeconds: fallbackDuration,
      geometry: fallbackGeometry,
      isRealRouting: false,
      routingNote:
        'Dữ liệu định tuyến OSRM tạm thời không phản hồi — đang hiển thị khoảng cách ước tính theo mạng lưới đường nội đô (không dùng khoảng cách chim bay thuần túy)',
    };
  }
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) {
    return `${mins} phút`;
  }
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hrs} giờ ${remMins} phút` : `${hrs} giờ`;
}

export const POI_CATEGORY_META: Record<
  POICategory,
  {
    label: string;
    labelVi: string;
    color: string;
    bgColor: string;
    iconName: string;
  }
> = {
  university: {
    label: 'University',
    labelVi: 'Trường Đại học / Học viện',
    color: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.15)',
    iconName: 'GraduationCap',
  },
  office: {
    label: 'Office Tower',
    labelVi: 'Tòa nhà Văn phòng',
    color: '#818cf8',
    bgColor: 'rgba(129, 140, 248, 0.15)',
    iconName: 'Building2',
  },
  apartment: {
    label: 'Residential / Apartment',
    labelVi: 'Khu Chung cư / Dân cư',
    color: '#34d399',
    bgColor: 'rgba(52, 211, 153, 0.15)',
    iconName: 'Home',
  },
  mall: {
    label: 'Shopping Mall',
    labelVi: 'Trung tâm Thương mại',
    color: '#f472b6',
    bgColor: 'rgba(244, 114, 182, 0.15)',
    iconName: 'ShoppingBag',
  },
  cafe_restaurant: {
    label: 'F&B Hub',
    labelVi: 'Cụm Ẩm thực / F&B bổ trợ',
    color: '#fbbf24',
    bgColor: 'rgba(251, 191, 36, 0.15)',
    iconName: 'Utensils',
  },
  competitor: {
    label: 'Direct Competitor',
    labelVi: 'Đối thủ cùng phân khúc',
    color: '#f87171',
    bgColor: 'rgba(248, 113, 113, 0.15)',
    iconName: 'AlertTriangle',
  },
  parking: {
    label: 'Public Parking',
    labelVi: 'Bãi đỗ xe công cộng',
    color: '#60a5fa',
    bgColor: 'rgba(96, 165, 250, 0.15)',
    iconName: 'Car',
  },
  bus_stop: {
    label: 'Transit / Bus / Metro',
    labelVi: 'Trạm xe buýt / Ga tàu điện',
    color: '#a78bfa',
    bgColor: 'rgba(167, 139, 250, 0.15)',
    iconName: 'Bus',
  },
  hospital: {
    label: 'Hospital / Clinic',
    labelVi: 'Bệnh viện / Cơ sở Y tế',
    color: '#2dd4bf',
    bgColor: 'rgba(45, 212, 191, 0.15)',
    iconName: 'Cross',
  },
};

/**
 * Calculates compass bearing in degrees (0..360) from origin to destination [lng, lat]
 */
export function calculateBearingDegrees(
  origin: [number, number],
  destination: [number, number]
): number {
  const [lng1, lat1] = normalizeLngLat(origin);
  const [lng2, lat2] = normalizeLngLat(destination);

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaLambda = toRad(lng2 - lng1);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const theta = Math.atan2(y, x);
  const bearing = (theta * 180) / Math.PI;
  return (bearing + 360) % 360;
}
