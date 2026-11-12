'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  Navigation,
  Route,
  Footprints,
  Bike,
  Car,
  Sparkles,
  Users,
  ShieldAlert,
  Target,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Building2,
  Box,
  Compass,
  Info,
  Loader2,
  MapPin,
  ChevronRight,
  PanelRightClose,
  PanelRightOpen,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { useSpaceVisionStore } from '@/store/useSpaceVisionStore';
import { generateLocationBIReport, BUSINESS_TYPE_META } from '@/lib/aiEngine';
import { InteractiveMap, POI_CATEGORY_META } from '@/components/map/InteractiveMap';
import type { BusinessType, POICategory, TransportMode } from '@/types';

export interface POIBucket {
  id: string;
  name: string;
  desc: string;
  categories: POICategory[];
}

export const POI_BUCKETS: POIBucket[] = [
  {
    id: 'target_customers',
    name: 'Khách hàng mục tiêu',
    desc: 'Trường học, Văn phòng, Chung cư',
    categories: ['university', 'office', 'apartment'],
  },
  {
    id: 'competitors_services',
    name: 'Đối thủ & Dịch vụ',
    desc: 'Café & F&B, TTTM, Đối thủ ngành',
    categories: ['cafe_restaurant', 'mall', 'competitor'],
  },
  {
    id: 'transport_utilities',
    name: 'Giao thông & Tiện ích',
    desc: 'Bãi đỗ xe, Tuyến Bus, Bệnh viện',
    categories: ['parking', 'bus_stop', 'hospital'],
  },
];

const ALL_POI_CATEGORIES: POICategory[] = [
  'university',
  'office',
  'apartment',
  'mall',
  'cafe_restaurant',
  'competitor',
  'parking',
  'bus_stop',
  'hospital',
];

const BUSINESS_TYPES: BusinessType[] = [
  'coffee_shop',
  'restaurant',
  'spa',
  'fashion_retail',
  'convenience_store',
  'office',
  'showroom',
  'coworking',
];

const TRANSPORT_OPTIONS: { mode: TransportMode; label: string; speedNote: string }[] = [
  { mode: 'foot', label: 'Đi bộ', speedNote: '~4.8 km/h' },
  { mode: 'bike', label: 'Xe máy', speedNote: '~22 km/h' },
  { mode: 'car', label: 'Ô tô', speedNote: '~18 km/h' },
];

export function LocationIntelView() {
  const {
    properties,
    selectedPropertyId,
    selectedBusinessType,
    activePOICategories,
    selectedPOIIds,
    transportMode,
    activeRoutes,
    isRoutingLoading,
    selectProperty,
    setSelectedBusinessType,
    togglePOICategory,
    toggleSelectPOI,
    routeKeyNearbyPOIs,
    clearRoutes,
    setTransportMode,
    setActiveTab,
  } = useSpaceVisionStore();

  const [panelTab, setPanelTab] = useState<'bi' | 'pois'>('pois');
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [mobileView, setMobileView] = useState<'map' | 'panel'>('map');
  const [flyTargetRouteId, setFlyTargetRouteId] = useState<string | null>(null);

  const userClearedRoutesRef = useRef(false);
  const initialRoutedPropertyRef = useRef<string | null>(null);

  const selectedProperty = useMemo(
    () => properties.find((p) => p.id === selectedPropertyId) || properties[0],
    [properties, selectedPropertyId]
  );

  // Auto-route ONCE on initial load only if user hasn't explicitly cleared routes
  React.useEffect(() => {
    if (userClearedRoutesRef.current) return;
    if (initialRoutedPropertyRef.current === selectedPropertyId) return;
    initialRoutedPropertyRef.current = selectedPropertyId;

    if (activeRoutes.length === 0) {
      const timer = setTimeout(() => {
        if (!userClearedRoutesRef.current) {
          routeKeyNearbyPOIs();
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [selectedPropertyId, routeKeyNearbyPOIs]);

  const handleClearRoutes = () => {
    userClearedRoutesRef.current = true;
    setFlyTargetRouteId(null);
    clearRoutes();
  };

  const handleRouteKeyPOIs = () => {
    userClearedRoutesRef.current = false;
    routeKeyNearbyPOIs();
  };

  const handleTogglePOI = async (poiId: string) => {
    userClearedRoutesRef.current = false;
    await toggleSelectPOI(poiId);
  };

  const biReport = useMemo(() => {
    if (!selectedProperty) return null;
    return generateLocationBIReport(selectedProperty, selectedBusinessType);
  }, [selectedProperty, selectedBusinessType]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ALL_POI_CATEGORIES.forEach((c) => {
      counts[c] = 0;
    });
    if (selectedProperty) {
      selectedProperty.nearbyPOIs.forEach((poi) => {
        counts[poi.category] = (counts[poi.category] || 0) + 1;
      });
    }
    return counts;
  }, [selectedProperty]);

  const filteredPOIs = useMemo(() => {
    if (!selectedProperty) return [];
    return selectedProperty.nearbyPOIs.filter((poi) =>
      activePOICategories.includes(poi.category)
    );
  }, [selectedProperty, activePOICategories]);

  const routeMap = useMemo(() => {
    const map = new Map<string, (typeof activeRoutes)[number]>();
    activeRoutes.forEach((r) => map.set(r.poiId, r));
    return map;
  }, [activeRoutes]);

  if (!selectedProperty) return null;

  return (
    <div className="relative flex w-full h-[calc(100vh-3.5rem)] bg-slate-100 text-slate-900 overflow-hidden">
      {/* Center/Left: Large Interactive 3D Map */}
      <main className={`relative flex-1 h-full ${mobileView === 'panel' ? 'hidden md:block' : 'block'}`}>
        {panelCollapsed && (
          <button
            type="button"
            onClick={() => setPanelCollapsed(false)}
            className="hidden md:flex absolute top-3 right-3 z-30 items-center gap-1.5 px-3 py-2 rounded-xl bg-white/95 hover:bg-white border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 shadow-md backdrop-blur-md transition-all pointer-events-auto"
          >
            <PanelRightOpen className="w-4 h-4 text-blue-600" />
            <span>Mở bảng phân tích vị trí</span>
          </button>
        )}

        <InteractiveMap
          mode="location"
          flyToRouteId={flyTargetRouteId}
          onClearFlyToRoute={() => setFlyTargetRouteId(null)}
          extraControls={
            <div className="flex items-center bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg p-1 shadow-sm">
              <button
                id="tour-map-key-pois"
                type="button"
                onClick={() => handleRouteKeyPOIs()}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded-md transition-all active:scale-95"
                title="Tự động vẽ và tạo hiệu ứng đường đi ra các tiện ích trọng điểm gần nhất"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
                <span>Khảo sát tiện ích tiêu biểu</span>
              </button>

              {activeRoutes.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleClearRoutes()}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors ml-0.5"
                  title="Xoá tất cả lộ trình"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Xoá đường</span>
                </button>
              )}
            </div>
          }
        />
      </main>

      {/* Right Collapsible Panel: Location Intelligence & POIs */}
      <aside
        className={`relative z-20 flex flex-col bg-white border-l border-slate-200 transition-all duration-300 ease-in-out ${
          mobileView === 'map' ? 'hidden md:flex' : 'flex'
        } ${
          panelCollapsed
            ? 'md:w-0 md:translate-x-full md:overflow-hidden md:border-l-0'
            : 'w-full md:w-[460px] lg:w-[440px] xl:w-[480px] max-w-[560px] shrink-0'
        }`}
      >
        {/* Panel Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900">
                  Phân Tích Vị Trí & Tiện Ích
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  Bán kính 500m & định tuyến đa phương tiện OSRM
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPanelCollapsed(true)}
              title="Thu gọn bảng"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          </div>

          {/* Property Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mặt bằng đang khảo sát:
            </label>
            <select
              value={selectedProperty.id}
              onChange={(e) => selectProperty(e.target.value)}
              className="w-full rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.code}] {p.title} ({p.district} • {p.monthlyRentMillionVND} tr/th)
                </option>
              ))}
            </select>
          </div>

          {/* Business Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mô hình kinh doanh đánh giá:
            </label>
            <select
              value={selectedBusinessType}
              onChange={(e) => setSelectedBusinessType(e.target.value as BusinessType)}
              className="w-full rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm font-semibold text-blue-700 focus:bg-white focus:border-blue-500 focus:outline-none"
            >
              {BUSINESS_TYPES.map((bt) => (
                <option key={bt} value={bt}>
                  {BUSINESS_TYPE_META[bt]?.labelVi || bt}
                </option>
              ))}
            </select>
          </div>

          {/* Compact Landlord Contact Block */}
          {selectedProperty.contact && (
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-blue-800 uppercase tracking-wide">
                    {selectedProperty.contact.role || 'Chủ nhà'}
                  </span>
                  {selectedProperty.contact.responseSpeed && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {selectedProperty.contact.responseSpeed}
                    </span>
                  )}
                </div>
                {selectedProperty.contact.viewingAvailability && (
                  <span
                    className="text-xs text-slate-500 truncate max-w-[180px]"
                    title={selectedProperty.contact.viewingAvailability}
                  >
                    {selectedProperty.contact.viewingAvailability}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 leading-tight truncate">
                    {selectedProperty.contact.name}
                  </div>
                  <div className="text-xs font-mono text-slate-600">
                    {selectedProperty.contact.phone}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={`tel:${selectedProperty.contact.phone.replace(/\s+/g, '')}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs"
                    title={`Gọi ngay cho ${selectedProperty.contact.name}`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Gọi ngay</span>
                  </a>
                  <a
                    href={`https://zalo.me/${(selectedProperty.contact.zaloPhone || selectedProperty.contact.phone).replace(/\s+/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
                    title={`Chat Zalo với ${selectedProperty.contact.name}`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Zalo</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Focused Tab Switcher */}
          <div className="flex p-1 rounded-xl bg-slate-100 text-sm">
            <button
              type="button"
              onClick={() => setPanelTab('bi')}
              className={`flex-1 py-2 text-center font-bold rounded-lg transition-all ${
                panelTab === 'bi'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đánh Giá Kinh Doanh AI
            </button>
            <button
              type="button"
              onClick={() => setPanelTab('pois')}
              className={`flex-1 py-2 text-center font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                panelTab === 'pois'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Tiện Ích & Tuyến Đường</span>
              {activeRoutes.length > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
              )}
            </button>
          </div>
        </div>

        {/* Tab 1: AI Business Intelligence Analysis */}
        {panelTab === 'bi' && biReport && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
            {/* 1. Suitability Summary - Clean Concise Bullets */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-blue-600" />
                  Đánh giá vị trí ({BUSINESS_TYPE_META[selectedBusinessType]?.labelVi})
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  AI Khảo Sát
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {biReport.suitabilitySummary
                  .split(/(?<=[.!?])\s+/)
                  .map((s) => s.trim())
                  .filter((s) => s.length > 8)
                  .map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span className="leading-snug">{bullet}</span>
                    </li>
                  ))}
              </ul>
            </div>

            {/* 2. Target Customer Segments - Concise Cards */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Tệp khách hàng trọng tâm
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {biReport.targetCustomerSegments.length} nhóm đối tượng
                </span>
              </div>
              <div className="space-y-2">
                {biReport.targetCustomerSegments.map((seg, idx) => {
                  const isRealPOI = seg.basis === 'real_poi';
                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800">{seg.segment}</div>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                          {seg.rationale}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          isRealPOI
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}
                      >
                        {isRealPOI ? 'Dữ liệu thực' : 'Ước lượng'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Competitor Density - Concise Bullets */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-rose-600" />
                  Mật độ đối thủ xung quanh (≤ 500m)
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold border ${
                    biReport.competitorAnalysis.densityLevel === 'High'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : biReport.competitorAnalysis.densityLevel === 'Moderate'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {biReport.competitorAnalysis.countWithin500m} đối thủ • Mức{' '}
                  {biReport.competitorAnalysis.densityLevel === 'High'
                    ? 'Cao'
                    : biReport.competitorAnalysis.densityLevel === 'Moderate'
                    ? 'Vừa phải'
                    : 'Thấp'}
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {biReport.competitorAnalysis.summary
                  .split(/(?<=[.!?])\s+/)
                  .map((s) => s.trim())
                  .filter((s) => s.length > 5)
                  .map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                      <span className="leading-snug">{bullet}</span>
                    </li>
                  ))}
              </ul>
            </div>

            {/* 4. Field Survey Risks Checklist */}
            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 shadow-xs space-y-2">
              <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Danh mục rủi ro cần khảo sát thực địa
              </div>
              <ul className="space-y-1.5 text-xs text-amber-950">
                {biReport.fieldSurveyRisks.map((risk, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Next Action: Move to 3D Twin */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('twin')}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
              >
                <Box className="w-4 h-4" />
                <span>Tiếp tục: Xem Không gian 3D Digital Twin</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: POI Categories & Route Planner */}
        {panelTab === 'pois' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
            {/* Quick Action Banner: Khảo sát tiện ích tiêu biểu */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-indigo-50/90 border border-blue-200/90 flex items-center justify-between gap-2 shadow-xs">
              <div className="min-w-0">
                <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                  </span>
                  <span>Khảo sát tiện ích tiêu biểu</span>
                </div>
                <p className="text-[11px] text-blue-700/80 mt-0.5 truncate">
                  Tự động kết nối 3 tiện ích gần nhất
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleRouteKeyPOIs()}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-xs active:scale-95"
                >
                  Vẽ lộ trình
                </button>
                {activeRoutes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleClearRoutes()}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Xoá tất cả lộ trình"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Transport Mode Bar */}
            <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-800 font-semibold flex items-center gap-1">
                  <Route className="w-3.5 h-3.5 text-blue-600" />
                  Phương tiện di chuyển:
                </span>
                {isRoutingLoading && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-blue-600">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Đang tính toán tuyến...
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {TRANSPORT_OPTIONS.map((opt) => {
                  const isActive = transportMode === opt.mode;
                  const Icon =
                    opt.mode === 'foot' ? Footprints : opt.mode === 'bike' ? Bike : Car;
                  return (
                    <button
                      key={opt.mode}
                      type="button"
                      onClick={() => setTransportMode(opt.mode)}
                      className={`flex flex-col items-center justify-center py-2 px-2 rounded-lg border text-xs transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Icon className="w-3.5 h-3.5" />
                        <span>{opt.label}</span>
                      </div>
                      <span
                        className={`text-[10px] mt-0.5 ${
                          isActive ? 'text-blue-100' : 'text-slate-500'
                        }`}
                      >
                        {opt.speedNote}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3 Decluttered POI Buckets */}
            <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-3 shadow-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  Nhóm tiện ích phân loại (3 nhóm):
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  {filteredPOIs.length}/{selectedProperty.nearbyPOIs.length} điểm hiển thị
                </span>
              </div>

              <div id="tour-map-poi-filters" className="space-y-2.5">
                {POI_BUCKETS.map((bucket) => {
                  const bucketPOICount = bucket.categories.reduce(
                    (sum, cat) => sum + (categoryCounts[cat] || 0),
                    0
                  );
                  const isAllActive = bucket.categories.every((cat) =>
                    activePOICategories.includes(cat)
                  );
                  const isAnyActive = bucket.categories.some((cat) =>
                    activePOICategories.includes(cat)
                  );

                  const handleToggleBucket = () => {
                    if (isAllActive) {
                      bucket.categories.forEach((cat) => {
                        if (activePOICategories.includes(cat)) {
                          togglePOICategory(cat);
                        }
                      });
                    } else {
                      bucket.categories.forEach((cat) => {
                        if (!activePOICategories.includes(cat)) {
                          togglePOICategory(cat);
                        }
                      });
                    }
                  };

                  return (
                    <div
                      key={bucket.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">
                              {bucket.name}
                            </span>
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-700">
                              {bucketPOICount}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">{bucket.desc}</p>
                        </div>

                        <button
                          type="button"
                          onClick={handleToggleBucket}
                          className={`shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-all ${
                            isAllActive
                              ? 'bg-slate-900 text-white border-slate-900'
                              : isAnyActive
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isAllActive
                            ? 'Đang bật cả nhóm'
                            : isAnyActive
                            ? 'Bật một phần'
                            : 'Bật nhóm'}
                        </button>
                      </div>

                      {/* Sub-chips for each category inside bucket */}
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {bucket.categories.map((cat) => {
                          const meta = POI_CATEGORY_META[cat];
                          const isEnabled = activePOICategories.includes(cat);
                          const count = categoryCounts[cat] || 0;
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => togglePOICategory(cat)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium border transition-all ${
                                isEnabled
                                  ? 'bg-white text-slate-900 border-slate-400 font-semibold shadow-2xs'
                                  : 'bg-slate-100/80 text-slate-400 border-slate-200 hover:bg-slate-200/60'
                              }`}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: meta.bgHex }}
                              />
                              <span>{meta.shortLabel}</span>
                              <span className="text-[10px] opacity-75 font-normal">
                                ({count})
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* POI List & Route Actions */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-900">
                  Địa điểm tiện ích lân cận ({filteredPOIs.length})
                </span>
                {activeRoutes.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearRoutes}
                    className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xoá {activeRoutes.length} tuyến</span>
                  </button>
                )}
              </div>

              {filteredPOIs.map((poi) => {
                const meta = POI_CATEGORY_META[poi.category];
                const isSelected = selectedPOIIds.includes(poi.id);
                const route = routeMap.get(poi.id);

                return (
                  <div
                    key={poi.id}
                    onClick={() => void handleTogglePOI(poi.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer bg-white ${
                      isSelected
                        ? 'border-blue-600 ring-2 ring-blue-100 shadow-md'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: meta.bgHex }}
                          />
                          <span className="text-sm font-bold text-slate-900">{poi.name}</span>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {poi.address}
                        </p>
                        <p className="text-xs text-slate-600 leading-relaxed">{poi.description}</p>
                      </div>

                      <span
                        className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected ? 'Đang nối' : '+ Nối tuyến'}
                      </span>
                    </div>

                    {/* Route Details if connected */}
                    {route && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                          <div className="font-bold text-blue-700 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                            <span>
                              {route.distanceMeters >= 1000
                                ? `${(route.distanceMeters / 1000).toFixed(2)} km`
                                : `${Math.round(route.distanceMeters)} m`}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span>~{Math.max(1, Math.round(route.durationSeconds / 60))} phút</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFlyTargetRouteId(route.poiId);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition shadow-2xs cursor-pointer"
                              title="Camera bay dọc theo tuyến đường OSRM đến tiện ích này"
                            >
                              <Compass className="w-3.5 h-3.5 text-blue-600" />
                              <span>Bay camera</span>
                            </button>

                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${
                                route.isRealRouting
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {route.isRealRouting ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                                  <span>OSRM</span>
                                </>
                              ) : (
                                <span>Ước lượng</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Panel Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Minh bạch dữ liệu: Dữ liệu POI thực tế tại Hà Nội</span>
          <span className="font-semibold text-slate-700">{selectedProperty.district}</span>
        </div>
      </aside>

      {/* Mobile Floating Segmented Switcher: Map vs Analysis */}
      <div className="md:hidden fixed bottom-14 left-1/2 -translate-x-1/2 z-40 flex items-center rounded-full bg-slate-900/90 p-1 text-white shadow-xl backdrop-blur-md">
        <button
          type="button"
          onClick={() => setMobileView('map')}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
            mobileView === 'map'
              ? 'bg-white text-slate-900 shadow'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Bản đồ 3D</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileView('panel')}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
            mobileView === 'panel'
              ? 'bg-white text-slate-900 shadow'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Phân tích & Tiện ích</span>
        </button>
      </div>
    </div>
  );
}

export default LocationIntelView;
