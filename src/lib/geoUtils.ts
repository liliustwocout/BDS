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

/**
 * Calculates the shortest signed angular difference between two bearings in [-180, 180] degrees.
 */
export function shortestAngleDiff(fromDeg: number, toDeg: number): number {
  return ((toDeg - fromDeg + 540) % 360) - 180;
}

/**
 * Smoothly interpolates an angle towards a target angle via the shortest path.
 */
export function smoothAngle(currentDeg: number, targetDeg: number, smoothingFactor: number): number {
  const diff = shortestAngleDiff(currentDeg, targetDeg);
  const factor = Math.max(0, Math.min(1, smoothingFactor));
  return (currentDeg + diff * factor + 360) % 360;
}

/**
 * Standard cubic ease in-out for silky camera acceleration and deceleration.
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Fillets sharp corners of a polyline with smooth quadratic bezier curves
 * so camera flight paths have C1 continuity without abrupt vertex pivots.
 */
export function smoothRouteGeometry(
  rawPoints: [number, number][],
  maxFilletRadiusMeters = 8
): [number, number][] {
  if (rawPoints.length < 3) return [...rawPoints];

  const result: [number, number][] = [rawPoints[0]];

  for (let i = 1; i < rawPoints.length - 1; i++) {
    const pPrev = rawPoints[i - 1];
    const pCurr = rawPoints[i];
    const pNext = rawPoints[i + 1];

    const d1 = calculateHaversineMeters(pPrev, pCurr);
    const d2 = calculateHaversineMeters(pCurr, pNext);

    const filletRadius = Math.min(maxFilletRadiusMeters, d1 * 0.42, d2 * 0.42);

    const b1 = calculateBearingDegrees(pPrev, pCurr);
    const b2 = calculateBearingDegrees(pCurr, pNext);
    const turnAngle = Math.abs(shortestAngleDiff(b1, b2));

    // Only fillet if there is a noticeable turn (>= 12 deg) and enough distance
    if (turnAngle >= 12 && filletRadius >= 1.5) {
      const f1 = filletRadius / Math.max(1, d1);
      const f2 = filletRadius / Math.max(1, d2);

      const pEntry: [number, number] = [
        pCurr[0] + (pPrev[0] - pCurr[0]) * f1,
        pCurr[1] + (pPrev[1] - pCurr[1]) * f1,
      ];
      const pExit: [number, number] = [
        pCurr[0] + (pNext[0] - pCurr[0]) * f2,
        pCurr[1] + (pNext[1] - pCurr[1]) * f2,
      ];

      result.push(pEntry);

      // Generate 4 intermediate bezier points across the corner
      const steps = [0.25, 0.5, 0.75];
      for (const u of steps) {
        const oneMinusU = 1 - u;
        const bx =
          oneMinusU * oneMinusU * pEntry[0] +
          2 * oneMinusU * u * pCurr[0] +
          u * u * pExit[0];
        const by =
          oneMinusU * oneMinusU * pEntry[1] +
          2 * oneMinusU * u * pCurr[1] +
          u * u * pExit[1];
        result.push([Number(bx.toFixed(6)), Number(by.toFixed(6))]);
      }

      result.push(pExit);
    } else {
      result.push(pCurr);
    }
  }

  result.push(rawPoints[rawPoints.length - 1]);
  return result;
}

/**
 * Precomputes cumulative distances along a polyline.
 */
export function buildCumulativeDistances(points: [number, number][]): {
  totalDistance: number;
  cumDistances: number[];
} {
  const cumDistances: number[] = [0];
  let totalDistance = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const d = calculateHaversineMeters(points[i], points[i + 1]);
    totalDistance += d;
    cumDistances.push(totalDistance);
  }

  return { totalDistance, cumDistances };
}

/**
 * Samples a continuous [lng, lat] coordinate along a polyline at target distance.
 */
export function samplePointAtDistance(
  points: [number, number][],
  cumDistances: number[],
  targetDist: number
): [number, number] {
  if (points.length === 0) return [0, 0];
  if (points.length === 1 || targetDist <= 0) return points[0];

  const total = cumDistances[cumDistances.length - 1];
  if (targetDist >= total) return points[points.length - 1];

  let segIdx = 0;
  for (let i = 0; i < cumDistances.length - 1; i++) {
    if (targetDist >= cumDistances[i] && targetDist <= cumDistances[i + 1]) {
      segIdx = i;
      break;
    }
  }

  const segStartDist = cumDistances[segIdx];
  const segEndDist = cumDistances[segIdx + 1];
  const segLength = segEndDist - segStartDist;

  if (segLength <= 0.0001) return points[segIdx];

  const t = Math.max(0, Math.min(1, (targetDist - segStartDist) / segLength));
  const p1 = points[segIdx];
  const p2 = points[segIdx + 1];

  return [
    Number((p1[0] + (p2[0] - p1[0]) * t).toFixed(6)),
    Number((p1[1] + (p2[1] - p1[1]) * t).toFixed(6)),
  ];
}
