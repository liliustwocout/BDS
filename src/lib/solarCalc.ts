import { SolarPositionResult } from '@/types';

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * Calculates astronomical solar altitude, azimuth, 3D scene sun vector,
 * and storefront direct exposure for a given latitude/longitude, day of year, and local hour (UTC+7 for Vietnam).
 *
 * Coordinate convention in 3D scene:
 * +X = East, -X = West
 * +Y = Up (Zenith)
 * +Z = South (Frontage default orientation reference or mapped via azimuth), -Z = North
 */
export function calculateSolarPosition(
  rawLat: number,
  rawLng: number,
  dayOfYear: number,
  hours: number,
  buildingAzimuthDeg: number,
  arcRadius: number = 28
): SolarPositionResult {
  // Defensive auto-swap if caller passed [lng, lat] instead of (lat, lng)
  const lat = Math.abs(rawLat) > 60 && Math.abs(rawLng) <= 60 ? rawLng : rawLat;
  const lng = Math.abs(rawLat) > 60 && Math.abs(rawLng) <= 60 ? rawLat : rawLng;
  const clampedDay = Math.max(1, Math.min(365, dayOfYear));
  const normalizedHours = ((hours % 24) + 24) % 24;

  // Fractional year gamma in radians
  const gamma =
    ((2 * Math.PI) / 365) * (clampedDay - 1 + (normalizedHours - 12) / 24);

  // Equation of time (in minutes)
  const eqTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));

  // Solar declination angle (in radians)
  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  // Vietnam timezone offset UTC+7
  const tzOffset = 7;
  const timeOffset = eqTime + 4 * lng - 60 * tzOffset;
  const trueSolarTimeMinutes = normalizedHours * 60 + timeOffset;

  // Hour angle in degrees (-180 to +180)
  const hourAngleDeg = trueSolarTimeMinutes / 4 - 180;
  const hourAngleRad = hourAngleDeg * DEG_TO_RAD;
  const latRad = lat * DEG_TO_RAD;

  // Solar zenith and altitude
  const cosZenith = Math.max(
    -1,
    Math.min(
      1,
      Math.sin(latRad) * Math.sin(decl) +
        Math.cos(latRad) * Math.cos(decl) * Math.cos(hourAngleRad)
    )
  );
  const zenithRad = Math.acos(cosZenith);
  const altitudeDeg = 90 - zenithRad * RAD_TO_DEG;

  // Solar azimuth (0° = North, 90° = East, 180° = South, 270° = West)
  let azimuthDeg = 180;
  const sinZenith = Math.sin(zenithRad);
  if (sinZenith > 0.0001) {
    const cosAzimuth = Math.max(
      -1,
      Math.min(
        1,
        (Math.sin(decl) - Math.sin(latRad) * cosZenith) /
          (Math.cos(latRad) * sinZenith)
      )
    );
    const baseAzimuth = Math.acos(cosAzimuth) * RAD_TO_DEG;
    azimuthDeg = hourAngleDeg > 0 ? (360 - baseAzimuth) % 360 : baseAzimuth;
  }

  // Convert (altitudeDeg, azimuthDeg) to 3D position vector [x, y, z]
  // Note: In our 3D scene, the building storefront faces +Z, and the compass can align relative to buildingAzimuthDeg or true cardinal directions.
  // Using cardinal coordinates: +X = East (sin(az)), +Y = Up (sin(alt)), +Z = South (-cos(az))
  const altRad = altitudeDeg * DEG_TO_RAD;
  const azRad = azimuthDeg * DEG_TO_RAD;

  const x = Number((arcRadius * Math.cos(altRad) * Math.sin(azRad)).toFixed(2));
  const y = Number((arcRadius * Math.sin(altRad)).toFixed(2));
  const z = Number((-arcRadius * Math.cos(altRad) * Math.cos(azRad)).toFixed(2));

  const isDaylight = altitudeDeg > -2;
  const solarIntensity =
    altitudeDeg <= 0
      ? 0
      : Number(Math.min(1, Math.sin(altRad) * 1.15).toFixed(2));

  // Calculate relative angle between sun azimuth and building frontage azimuth
  const rawDiff = Math.abs(((azimuthDeg - buildingAzimuthDeg + 540) % 360) - 180);

  let directFrontageExposure: 'high' | 'moderate' | 'low' | 'none' = 'none';
  let glareWarning = false;

  if (altitudeDeg > 2) {
    if (rawDiff <= 50) {
      directFrontageExposure = altitudeDeg < 68 ? 'high' : 'moderate';
      if (altitudeDeg >= 8 && altitudeDeg <= 45 && rawDiff <= 42) {
        glareWarning = true;
      }
    } else if (rawDiff <= 85) {
      directFrontageExposure = 'moderate';
    } else {
      directFrontageExposure = 'low';
    }
  }

  let summaryVi = '';
  if (!isDaylight) {
    summaryVi =
      'Ban đêm — Mặt bằng không có bức xạ mặt trời trực tiếp. Đề xuất bật hệ thống đèn biển hiệu mặt tiền và ánh sáng ấm nội thất (2700K–3000K) để thu hút tầm nhìn từ trục đường.';
  } else if (glareWarning) {
    summaryVi = `Nắng chiếu xiên trực diện vào mặt tiền (Góc cao ${altitudeDeg.toFixed(
      1
    )}°, phương vị ${azimuthDeg.toFixed(
      0
    )}°). Lưu ý độ chói cao và nhiệt bức xạ qua vách kính Tầng 1 — nên bố trí rèm sáo, lam chắn nắng hoặc phim cách nhiệt.`;
  } else if (directFrontageExposure === 'high') {
    summaryVi = `Ánh sáng tự nhiên dồi dào chiếu trực tiếp vào mặt tiền (Góc cao ${altitudeDeg.toFixed(
      1
    )}°). Rất thuận lợi cho khu vực trưng bày sản phẩm và không gian khách ngồi gần cửa kính.`;
  } else if (directFrontageExposure === 'moderate') {
    summaryVi = `Ánh sáng tự nhiên khuếch tán vừa phải tại mặt tiền (Góc cao ${altitudeDeg.toFixed(
      1
    )}°, phương vị ${azimuthDeg.toFixed(
      0
    )}°). Không gian bên trong mát mẻ, ít bị chói gắt, tiết kiệm tải điều hòa.`;
  } else {
    summaryVi = `Mặt trời nằm phía sau/chéo lưng công trình (Góc cao ${altitudeDeg.toFixed(
      1
    )}°). Mặt tiền râm mát hoàn toàn, phù hợp bố trí chỗ ngồi ngoài hiên hoặc đón khách buổi chiều.`;
  }

  return {
    altitudeDeg: Number(altitudeDeg.toFixed(1)),
    azimuthDeg: Number(azimuthDeg.toFixed(1)),
    sunVector: [x, y, z],
    isDaylight,
    solarIntensity,
    directFrontageExposure,
    glareWarning,
    summaryVi,
  };
}

/**
 * Generates an array of 3D points representing the sun trajectory arc across daytime hours (05:30 to 18:30)
 */
export function calculateSolarArcPoints(
  lat: number,
  lng: number,
  dayOfYear: number,
  buildingAzimuthDeg: number = 180,
  arcRadius: number = 28
): [number, number, number][] {
  const points: [number, number, number][] = [];
  for (let h = 5.5; h <= 18.5; h += 0.5) {
    const pos = calculateSolarPosition(
      lat,
      lng,
      dayOfYear,
      h,
      buildingAzimuthDeg,
      arcRadius
    );
    if (pos.altitudeDeg >= -3) {
      points.push(pos.sunVector);
    }
  }
  return points;
}

export const SEASON_SOLAR_PRESETS = [
  { id: 'spring', label: 'Xuân phân (21/03)', dayOfYear: 80 },
  { id: 'summer', label: 'Hạ chí (21/06)', dayOfYear: 172 },
  { id: 'autumn', label: 'Thu phân (23/09)', dayOfYear: 266 },
  { id: 'winter', label: 'Đông chí (21/12)', dayOfYear: 355 },
] as const;
