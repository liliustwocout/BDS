'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sun,
  Cloud,
  CloudRain,
  Moon,
  Sunrise,
  Sunset,
  Lightbulb,
  Compass,
  Clock,
  Calendar,
  Play,
  Pause,
  AlertTriangle,
  Sparkles,
  Umbrella,
  Eye,
  ThermometerSun,
  ShieldCheck,
  PanelRightClose,
  PanelRightOpen,
  ArrowRight,
} from 'lucide-react';
import { useSpaceVisionStore } from '@/store/useSpaceVisionStore';
import { calculateSolarPosition } from '@/lib/solarCalc';
import { WeatherMode } from '@/types';
import { BuildingDigitalTwin } from '@/components/three/BuildingDigitalTwin';

const TIME_PRESETS: {
  id: 'morning' | 'noon' | 'sunset' | 'night';
  label: string;
  timeLabel: string;
  hours: number;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'morning', label: 'Sáng', timeLabel: '08:00', hours: 8.0, icon: Sunrise },
  { id: 'noon', label: 'Trưa', timeLabel: '12:00', hours: 12.0, icon: Sun },
  { id: 'sunset', label: 'Chiều tà', timeLabel: '17:30', hours: 17.5, icon: Sunset },
  { id: 'night', label: 'Tối', timeLabel: '20:00', hours: 20.0, icon: Moon },
];

const SEASON_PRESETS = [
  { id: 'spring', label: 'Xuân phân (21/03)', shortLabel: 'Xuân phân', dayOfYear: 80 },
  { id: 'summer', label: 'Hạ chí (21/06)', shortLabel: 'Hạ chí', dayOfYear: 172 },
  { id: 'autumn', label: 'Thu phân (23/09)', shortLabel: 'Thu phân', dayOfYear: 266 },
  { id: 'winter', label: 'Đông chí (21/12)', shortLabel: 'Đông chí', dayOfYear: 355 },
];

const WEATHER_OPTIONS: {
  id: WeatherMode;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'sunny',
    label: 'Trời nắng',
    desc: 'Bức xạ mặt trời trực tiếp, bóng đổ tự nhiên',
    icon: Sun,
  },
  {
    id: 'cloudy',
    label: 'Nhiều mây',
    desc: 'Ánh sáng tán xạ dịu, không chói gắt',
    icon: Cloud,
  },
  {
    id: 'rainy',
    label: 'Trời mưa',
    desc: 'Hiệu ứng hạt mưa và vỉa hè phản xạ ánh đèn',
    icon: CloudRain,
  },
];

function formatHoursToHHMM(hours: number): string {
  const normalized = ((hours % 24) + 24) % 24;
  const h = Math.floor(normalized);
  const m = Math.round((normalized - h) * 60);
  const finalH = m === 60 ? (h + 1) % 24 : h;
  const finalM = m === 60 ? 0 : m;
  return `${String(finalH).padStart(2, '0')}:${String(finalM).padStart(2, '0')}`;
}

export function EnvironmentSimView() {
  const {
    properties,
    selectedPropertyId,
    timeOfDayHours,
    dayOfYear,
    weatherMode,
    autoInteriorLights,
    setTimeOfDayHours,
    setDayOfYear,
    setWeatherMode,
    setAutoInteriorLights,
    applyTimePreset,
    setActiveTab,
  } = useSpaceVisionStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);

  const property = useMemo(
    () => properties.find((p) => p.id === selectedPropertyId) || properties[0],
    [properties, selectedPropertyId]
  );

  // Time-lapse animation loop when Play is active
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTimeOfDayHours((timeOfDayHours + 0.15) % 24);
    }, 80);
    return () => clearInterval(interval);
  }, [isPlaying, timeOfDayHours, setTimeOfDayHours]);

  const solarResult = useMemo(() => {
    if (!property) {
      return calculateSolarPosition(21.0285, 105.8542, dayOfYear, timeOfDayHours, 180);
    }
    const [lat, lng] = property.coordinates;
    return calculateSolarPosition(
      lat,
      lng,
      dayOfYear,
      timeOfDayHours,
      property.orientationAzimuth
    );
  }, [property, dayOfYear, timeOfDayHours]);

  // Derived business environment metrics based on astronomical state + weather + property specs
  const businessEnvAnalysis = useMemo(() => {
    if (!property) return null;

    const isNightOrDusk = !solarResult.isDaylight || solarResult.altitudeDeg < 8;
    const isRainy = weatherMode === 'rainy';
    const isCloudy = weatherMode === 'cloudy';
    const lightsActive = autoInteriorLights || isNightOrDusk || isRainy;

    // 1. Storefront Sunlight Exposure label & badge
    let frontageLabel = 'Không có nắng trực tiếp (Ban đêm)';
    let frontageColor = 'text-slate-700 bg-slate-100 border-slate-200';
    if (solarResult.isDaylight) {
      if (isRainy) {
        frontageLabel = 'Bầu trời mưa ẩm — Bức xạ tự nhiên thấp';
        frontageColor = 'text-blue-800 bg-blue-50 border-blue-200';
      } else if (isCloudy) {
        frontageLabel = 'Ánh sáng khuếch tán — Dịu mắt, không chói';
        frontageColor = 'text-slate-700 bg-slate-100 border-slate-200';
      } else if (solarResult.directFrontageExposure === 'high') {
        frontageLabel = 'Nắng chiếu trực diện mặt tiền';
        frontageColor = 'text-amber-800 bg-amber-50 border-amber-200';
      } else if (solarResult.directFrontageExposure === 'moderate') {
        frontageLabel = 'Nắng chiếu xiên nhẹ';
        frontageColor = 'text-emerald-800 bg-emerald-50 border-emerald-200';
      } else {
        frontageLabel = 'Mặt tiền râm mát (Nắng phía lưng nhà)';
        frontageColor = 'text-teal-800 bg-teal-50 border-teal-200';
      }
    }

    // 2. Display Zone Brightness (Tầng 1)
    const naturalLuxPct =
      !solarResult.isDaylight
        ? 5
        : isRainy
        ? Math.round(solarResult.solarIntensity * 35)
        : isCloudy
        ? Math.round(solarResult.solarIntensity * 60)
        : Math.round(
            solarResult.solarIntensity *
              (solarResult.directFrontageExposure === 'high' ? 95 : 75)
          );
    const totalDisplayBrightnessPct = Math.min(
      100,
      naturalLuxPct + (lightsActive ? 55 : 0)
    );

    // 3. Evening Signage Visibility
    const signageVisibility =
      !solarResult.isDaylight || isRainy
        ? lightsActive
          ? {
              level: 'Rất nổi bật (Tương phản cao)',
              desc: `Mặt tiền ${property.frontageMeters}m trên trục đường ${property.roadWidthMeters}m kết hợp đèn bảng hiệu giúp tăng nhận diện thương hiệu từ cự ly 60–100m.`,
              badge: 'text-emerald-800 bg-emerald-50 border-emerald-200',
            }
          : {
              level: 'Chưa tối ưu (Đèn đang tắt)',
              desc: 'Hệ thống đèn nội thất & biển hiệu đang tắt. Khuyến nghị bật đèn tự động để đảm bảo nhận diện vào buổi tối.',
              badge: 'text-rose-800 bg-rose-50 border-rose-200',
            }
        : {
            level: 'Hiển thị ban ngày tiêu chuẩn',
            desc: `Độ tương phản tự nhiên của mặt tiền ${property.frontageMeters}m hướng ${property.orientationLabel}.`,
            badge: 'text-blue-800 bg-blue-50 border-blue-200',
          };

    // 4. Rainy Customer Drop-off & Shelter evaluation
    const shelterEvaluation =
      property.parkingSpotsCar > 0 || property.frontageMeters >= 6
        ? {
            status: 'Thuận lợi lắp mái hiên & sảnh đón',
            detail: `Mặt tiền ${property.frontageMeters}m và bãi đỗ xe (${property.parkingSpotsMotorbike} xe máy, ${property.parkingSpotsCar} ô tô) giúp khách dừng đỗ và đón trả thuận tiện.`,
          }
        : {
            status: 'Cần bổ sung mái che cuốn sảnh',
            detail: `Mặt tiền ${property.frontageMeters}m tiếp giáp vỉa hè; khi trời mưa nên bố trí mái che cuốn và vị trí để dù ngay cửa đón khách.`,
          };

    return {
      frontageLabel,
      frontageColor,
      naturalLuxPct,
      totalDisplayBrightnessPct,
      lightsActive,
      signageVisibility,
      shelterEvaluation,
    };
  }, [property, solarResult, weatherMode, autoInteriorLights]);

  if (!property) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 text-slate-500">
        Đang tải mô phỏng môi trường...
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-slate-100 text-slate-900">
      {/* MAIN 3D ENVIRONMENTAL VIEWPORT */}
      <div className="relative flex-1 flex flex-col h-full overflow-hidden">
        {/* TOP FLOATING CONTROLS: WEATHER + SEASON + AUTO LIGHTS */}
        <div className="pointer-events-none absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2">
          {/* Weather Selector */}
          <div
            id="tour-env-weather"
            className="pointer-events-auto flex items-center gap-1 rounded-xl border border-slate-200/90 bg-white/90 p-1 shadow-sm backdrop-blur-md"
          >
            {WEATHER_OPTIONS.map((w) => {
              const Icon = w.icon;
              const active = weatherMode === w.id;
              return (
                <button
                  key={w.id}
                  onClick={() => setWeatherMode(w.id)}
                  title={w.desc}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    active
                      ? 'bg-slate-900 text-white font-semibold shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{w.label}</span>
                </button>
              );
            })}
          </div>

          {/* Season Selector */}
          <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-slate-200/90 bg-white/90 p-1 shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-1 px-2 text-[11px] text-slate-500">
              <Calendar className="h-3.5 w-3.5 text-slate-600" />
              <span className="hidden md:inline">Mùa:</span>
            </div>
            {SEASON_PRESETS.map((season) => {
              const active = Math.abs(dayOfYear - season.dayOfYear) <= 15;
              return (
                <button
                  key={season.id}
                  onClick={() => setDayOfYear(season.dayOfYear)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                    active
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="hidden xl:inline">{season.label}</span>
                  <span className="xl:hidden">{season.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Auto Lighting Toggle + Panel Toggle */}
          <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/90 p-1 shadow-sm backdrop-blur-md">
            <button
              onClick={() => setAutoInteriorLights(!autoInteriorLights)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                autoInteriorLights
                  ? 'bg-amber-50 text-amber-800 border border-amber-300'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Tự động bật hệ thống đèn nội thất & biển hiệu khi trời tối hoặc mưa"
            >
              <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
              <span>Đèn tự động: {autoInteriorLights ? 'BẬT' : 'TẮT'}</span>
            </button>

            <button
              onClick={() => setPanelOpen(!panelOpen)}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              title={panelOpen ? 'Thu gọn bảng phân tích' : 'Mở bảng phân tích'}
            >
              {panelOpen ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRightOpen className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* 3D SCENE CANVAS */}
        <div id="tour-env-compass" className="relative flex-1 w-full h-full">
          <BuildingDigitalTwin
            property={property}
            mode="environment"
            showSolarArc={true}
          />
        </div>

        {/* BOTTOM TIMELINE SCRUBBER (Clean Minimalist White Card) */}
        <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-20 flex justify-center">
          <div
            id="tour-env-solar-slider"
            className="pointer-events-auto w-full max-w-4xl rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 shadow-lg backdrop-blur-md"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
              {/* Play / Pause & Time Readout */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm transition-all ${
                    isPlaying
                      ? 'bg-slate-900 text-white'
                      : 'bg-blue-600 text-white hover:bg-blue-500'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-3.5 w-3.5 fill-current" />
                      <span>Tạm dừng</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Chạy 24h</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-600" />
                  <span className="font-mono text-lg font-bold text-slate-900">
                    {formatHoursToHHMM(timeOfDayHours)}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    {solarResult.isDaylight ? 'Ban ngày' : 'Ban đêm'} (Hà Nội, UTC+7)
                  </span>
                </div>
              </div>

              {/* Quick Time Presets: "Sáng 08:00", "Trưa 12:00", "Chiều tà 17:30", "Tối 20:00" */}
              <div className="flex flex-wrap items-center gap-1.5">
                {TIME_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const isCurrent = Math.abs(timeOfDayHours - preset.hours) < 0.4;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setIsPlaying(false);
                        applyTimePreset(preset.id);
                      }}
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-50 text-blue-900 font-semibold'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 text-slate-500" />
                      <span>{preset.label}</span>
                      <span className="font-mono text-[10px] text-slate-400">{preset.timeLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Range Slider 00:00 - 24:00 */}
            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={24}
                step={0.1}
                value={timeOfDayHours}
                onChange={(e) => {
                  setIsPlaying(false);
                  setTimeOfDayHours(parseFloat(e.target.value));
                }}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400 px-0.5">
                <span>00:00</span>
                <span>06:00 (Bình minh)</span>
                <span>08:00</span>
                <span>12:00 (Trưa)</span>
                <span>15:00</span>
                <span>17:30 (Hoàng hôn)</span>
                <span>20:00</span>
                <span>24:00</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COMPACT SUNLIGHT & BUSINESS ANALYSIS CARD */}
      {panelOpen && (
        <aside
          id="tour-env-metrics"
          className="absolute inset-y-0 right-0 sm:relative w-full sm:w-[370px] lg:w-[410px] shrink-0 border-l border-slate-200 bg-white flex flex-col h-full shadow-xl overflow-y-auto z-30 animate-in slide-in-from-right duration-200"
        >
          {/* Header */}
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="inline-flex items-center rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700 uppercase tracking-wide">
                Mô phỏng Môi trường • Hà Nội
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-500">
                  Ngày {dayOfYear}/365
                </span>
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  className="rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 sm:hidden"
                  title="Đóng bảng"
                >
                  <PanelRightClose className="h-4 w-4" />
                </button>
              </div>
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Chiếu sáng & Thích ứng Thời tiết
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {property.title} — Mặt tiền hướng {property.orientationLabel} ({property.orientationAzimuth}°)
            </p>
          </div>

          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {/* Solar Azimuth / Altitude Telemetry */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-2">
                <span>Toạ độ Mặt trời Hà Nội</span>
                <span className="font-mono">
                  {property.coordinates[0].toFixed(2)}°N, {property.coordinates[1].toFixed(2)}°E
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-white border border-slate-200 p-2 text-center">
                  <div className="text-[10px] text-slate-500">Góc cao (Altitude)</div>
                  <div className="text-base font-bold text-slate-900">{solarResult.altitudeDeg}°</div>
                </div>
                <div className="rounded-lg bg-white border border-slate-200 p-2 text-center">
                  <div className="text-[10px] text-slate-500">Phương vị (Azimuth)</div>
                  <div className="text-base font-bold text-slate-900">{solarResult.azimuthDeg}°</div>
                </div>
              </div>
            </div>

            {/* Storefront Natural Light Rating */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <ThermometerSun className="h-4 w-4 text-amber-500" />
                  Độ chiếu sáng mặt tiền
                </span>
              </div>

              <div>
                <span
                  className={`inline-block rounded-md border px-2.5 py-1 text-xs font-semibold ${businessEnvAnalysis?.frontageColor}`}
                >
                  {businessEnvAnalysis?.frontageLabel}
                </span>
              </div>

              {solarResult.glareWarning && weatherMode === 'sunny' && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <strong>Cảnh báo chói nắng:</strong> Tia nắng chiếu xiên góc thấp vào vách kính mặt tiền. Khuyến nghị lắp rèm cuốn xuyên sáng hoặc phim cách nhiệt.
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-600 leading-relaxed">
                {solarResult.summaryVi}
              </p>
            </div>

            {/* Display Zone Brightness */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-blue-600" />
                  Độ sáng không gian Tầng 1
                </span>
                <span className="text-xs font-bold text-blue-600">
                  {businessEnvAnalysis?.totalDisplayBrightnessPct}%
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span>Ánh sáng tự nhiên qua vách kính</span>
                    <span className="text-slate-800 font-medium">
                      {businessEnvAnalysis?.naturalLuxPct}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all duration-300"
                      style={{ width: `${businessEnvAnalysis?.naturalLuxPct}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span>Hệ thống đèn nội thất</span>
                    <span className="text-slate-800 font-medium">
                      {businessEnvAnalysis?.lightsActive ? 'Đang bật (+55%)' : 'Đang tắt'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: businessEnvAnalysis?.lightsActive ? '75%' : '0%' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Evening Visibility Score */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Nhận diện biển hiệu buổi tối
                </span>
              </div>
              <div>
                <span
                  className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold ${businessEnvAnalysis?.signageVisibility.badge}`}
                >
                  {businessEnvAnalysis?.signageVisibility.level}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {businessEnvAnalysis?.signageVisibility.desc}
              </p>
            </div>

            {/* Drop-off Shelter Evaluation */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Umbrella className="h-4 w-4 text-teal-600" />
                  Đón khách & che mưa
                </span>
                <span className="text-[11px] text-slate-500">
                  {property.parkingSpotsMotorbike} xe máy • {property.parkingSpotsCar} ô tô
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-800">
                {businessEnvAnalysis?.shelterEvaluation.status}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {businessEnvAnalysis?.shelterEvaluation.detail}
              </p>
            </div>

            {/* Scientific Transparency Notice */}
            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Minh bạch tính toán thiên văn</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Quỹ đạo mặt trời được tính toán theo tọa độ địa lý Hà Nội ({property.coordinates[0].toFixed(2)}°N) và góc phương vị mặt tiền {property.orientationAzimuth}°.
              </p>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="border-t border-slate-200 p-4 bg-slate-50/50">
            <button
              onClick={() => setActiveTab('studio')}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-all"
            >
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>Chuyển sang AI Business Setup Studio</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}

export default EnvironmentSimView;
