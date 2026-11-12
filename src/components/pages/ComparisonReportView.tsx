'use client';

import React, { useMemo } from 'react';
import {
  GitCompare,
  Printer,
  Plus,
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Building2,
  DollarSign,
  Maximize,
  Car,
  Compass,
  ShieldAlert,
  Award,
  Box,
  Navigation,
  Info,
  FileText,
  MapPin,
  Check,
  Phone,
  UserCheck,
  MessageCircle,
} from 'lucide-react';
import { useSpaceVisionStore } from '@/store/useSpaceVisionStore';
import {
  scorePropertyForIntent,
  generateLocationBIReport,
  generateLayoutPresets,
  calculateBudgetSummary,
  BUSINESS_TYPE_META,
  DESIGN_STYLE_META,
} from '@/lib/aiEngine';
import type { BusinessType, DesignStyle, PropertyItem } from '@/types';

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

const DESIGN_STYLES: DesignStyle[] = [
  'minimalist',
  'scandinavian',
  'japanese',
  'industrial',
  'luxury',
  'modern',
];

function formatVNDMillions(vnd: number): string {
  const millions = vnd / 1_000_000;
  if (millions >= 1000) {
    return `${(millions / 1000).toFixed(2)} tỷ ₫`;
  }
  return `${Math.round(millions).toLocaleString('vi-VN')} triệu ₫`;
}

export function ComparisonReportView() {
  const {
    properties,
    selectedPropertyId,
    comparedPropertyIds,
    parsedIntent,
    selectedBusinessType,
    selectedDesignStyle,
    selectProperty,
    toggleCompareProperty,
    setSelectedBusinessType,
    setSelectedDesignStyle,
    setActiveTab,
  } = useSpaceVisionStore();

  const comparedProperties = useMemo(() => {
    const list = comparedPropertyIds
      .map((id) => properties.find((p) => p.id === id))
      .filter((p): p is PropertyItem => Boolean(p));
    if (list.length > 0) return list;
    return properties.slice(0, 3);
  }, [properties, comparedPropertyIds]);

  const uncomparedProperties = useMemo(
    () => properties.filter((p) => !comparedProperties.some((cp) => cp.id === p.id)),
    [properties, comparedProperties]
  );

  // Compute deterministic metrics, BI, and setup budget for each compared property
  const evaluatedColumns = useMemo(() => {
    return comparedProperties.map((prop) => {
      const match = scorePropertyForIntent(prop, parsedIntent, selectedBusinessType);
      const bi = generateLocationBIReport(prop, selectedBusinessType);
      const presets = generateLayoutPresets(prop, selectedBusinessType, selectedDesignStyle);
      const defaultItems = presets[0]?.items || [];
      const budget = calculateBudgetSummary(
        prop,
        selectedBusinessType,
        selectedDesignStyle,
        defaultItems
      );
      const rentPerSqmK = Math.round(
        (prop.monthlyRentMillionVND * 1_000_000) / Math.max(1, prop.totalAreaSqm) / 1000
      );

      // Count demand generators vs transit POIs
      const demandPOIs = prop.nearbyPOIs.filter((poi) =>
        ['university', 'office', 'apartment', 'mall'].includes(poi.category)
      ).length;
      const transitPOIs = prop.nearbyPOIs.filter((poi) =>
        ['bus_stop', 'parking'].includes(poi.category)
      ).length;

      // Distance to main road calculation or description
      const mainRoadNote =
        prop.roadWidthMeters >= 12
          ? `Mặt tiền trực tiếp lộ giới ${prop.roadWidthMeters}m`
          : `Đường vào ${prop.roadWidthMeters}m (Cách trục lớn ~40-80m)`;

      return {
        property: prop,
        match,
        bi,
        budget,
        presetCapacity: presets[0]?.capacityPersons || 0,
        rentPerSqmK,
        demandPOIs,
        transitPOIs,
        mainRoadNote,
      };
    });
  }, [comparedProperties, parsedIntent, selectedBusinessType, selectedDesignStyle]);

  // Identify comparative leaders
  const bestMatchCol = useMemo(() => {
    if (evaluatedColumns.length === 0) return null;
    return [...evaluatedColumns].sort((a, b) => b.match.overallScore - a.match.overallScore)[0];
  }, [evaluatedColumns]);

  const lowestCostCol = useMemo(() => {
    if (evaluatedColumns.length === 0) return null;
    return [...evaluatedColumns].sort(
      (a, b) =>
        a.property.monthlyRentMillionVND * 6 +
        a.budget.totalEstimateVND / 1_000_000 -
        (b.property.monthlyRentMillionVND * 6 + b.budget.totalEstimateVND / 1_000_000)
    )[0];
  }, [evaluatedColumns]);

  const bestFrontageCol = useMemo(() => {
    if (evaluatedColumns.length === 0) return null;
    return [...evaluatedColumns].sort(
      (a, b) => b.property.frontageMeters - a.property.frontageMeters
    )[0];
  }, [evaluatedColumns]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-slate-50 text-slate-800 p-4 md:p-6 lg:p-8 print:p-6 print:bg-white print:text-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Print-Only Professional Cover / Header */}
        <div className="hidden print:block border-b-2 border-slate-800 pb-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-black tracking-tight text-slate-900 uppercase">
                SpaceVision AI • Báo Cáo Thẩm Định & So Sánh Mặt Bằng Thương Mại
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                Mô hình: {BUSINESS_TYPE_META[selectedBusinessType]?.labelVi} • Phong cách:{' '}
                {DESIGN_STYLE_META[selectedDesignStyle]?.label}
              </div>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div>Bản quyền SpaceVision AI</div>
              <div>Hà Nội, Việt Nam</div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 1. TOP EXECUTIVE HEADER & INTERACTIVE CONTROLS          */}
        {/* ======================================================== */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs print:border-slate-300 print:shadow-none">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold uppercase tracking-wider">
                Báo Cáo So Sánh Mặt Bằng
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                Tối đa 3 Mặt Bằng
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Dự Toán Đầu Tư Tham Khảo
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              Báo Cáo So Sánh & Thẩm Định Phương Án Kinh Doanh
            </h1>
            <p className="text-xs text-slate-600">
              Đối chiếu song song các thông số kỹ thuật, khả năng tiếp cận khách hàng, mật độ đối thủ và tổng dự toán chi phí đầu tư ban đầu.
            </p>
          </div>

          {/* Interactive Parameters & Print Action */}
          <div className="flex flex-wrap items-center gap-3 print:hidden">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Mô hình kinh doanh
              </label>
              <select
                value={selectedBusinessType}
                onChange={(e) => setSelectedBusinessType(e.target.value as BusinessType)}
                className="rounded-xl bg-white border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none shadow-xs"
              >
                {BUSINESS_TYPES.map((bt) => (
                  <option key={bt} value={bt}>
                    {BUSINESS_TYPE_META[bt]?.labelVi || bt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Phong cách thiết kế
              </label>
              <select
                value={selectedDesignStyle}
                onChange={(e) => setSelectedDesignStyle(e.target.value as DesignStyle)}
                className="rounded-xl bg-white border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none shadow-xs"
              >
                {DESIGN_STYLES.map((st) => (
                  <option key={st} value={st}>
                    {DESIGN_STYLE_META[st]?.label || st} (x
                    {DESIGN_STYLE_META[st]?.costMultiplier.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <button
              id="tour-comp-export"
              type="button"
              onClick={handlePrint}
              className="mt-4 sm:mt-5 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In / Xuất Báo Cáo PDF</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. PROPERTY SELECTION & CHIPS BAR (Print:hidden)        */}
        {/* ======================================================== */}
        <div
          id="tour-comp-picker"
          className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <GitCompare className="w-4 h-4 text-blue-600" />
              Đang so sánh ({comparedProperties.length}/3 mặt bằng):
            </span>
            {comparedProperties.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-900 font-medium"
              >
                <span className="text-blue-700 font-bold">{p.code}</span>
                <span className="truncate max-w-[160px] text-slate-700">{p.title}</span>
                {comparedProperties.length > 1 && (
                  <button
                    type="button"
                    onClick={() => toggleCompareProperty(p.id)}
                    className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Bỏ khỏi bảng so sánh"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </span>
            ))}
          </div>

          {comparedProperties.length < 3 && uncomparedProperties.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-500 font-medium">Thêm mặt bằng:</span>
              {uncomparedProperties.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleCompareProperty(p.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-400 text-[11px] font-medium text-slate-700 hover:text-blue-800 transition-colors shadow-xs"
                >
                  <Plus className="w-3 h-3 text-blue-600" />
                  <span>
                    {p.code} ({p.district})
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 3. SIDE-BY-SIDE COMPARISON TABLE (White Card Design)     */}
        {/* ======================================================== */}
        <div
          id="tour-comp-matrix"
          className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs print:border-slate-300 print:shadow-none"
        >
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90 print:bg-slate-100">
                <th className="w-56 p-4 text-xs font-bold uppercase tracking-wider text-slate-500 print:text-slate-700">
                  Tiêu chí đối chiếu
                </th>
                {evaluatedColumns.map(({ property, match }) => {
                  const isBest = bestMatchCol?.property.id === property.id;
                  const isSelected = property.id === selectedPropertyId;
                  return (
                    <th
                      key={property.id}
                      className={`p-4 align-top border-l border-slate-200 min-w-[280px] ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-bold">
                              {property.code}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-600">
                              {property.district}
                            </span>
                            {isBest && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                                <Award className="w-3 h-3" />
                                Phù hợp nhất
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-extrabold text-slate-900 mt-1.5 leading-snug">
                            {property.title}
                          </div>
                          <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                            {property.address}
                          </div>
                        </div>

                        <div className="shrink-0 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                          <div className="text-base font-extrabold text-emerald-700">
                            {Math.round(match.overallScore)}%
                          </div>
                          <div className="text-[9px] text-emerald-800 font-medium">
                            Tương thích
                          </div>
                        </div>
                      </div>

                      {/* Quick Navigation Action Buttons */}
                      <div className="mt-3 flex items-center gap-2 print:hidden">
                        <button
                          type="button"
                          onClick={() => {
                            selectProperty(property.id);
                            setActiveTab('twin');
                          }}
                          className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition-colors shadow-xs"
                        >
                          <Box className="w-3.5 h-3.5" />
                          <span>Xem 3D</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            selectProperty(property.id);
                            setActiveTab('studio');
                          }}
                          className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-[11px] transition-colors shadow-xs"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          <span>Setup Studio</span>
                        </button>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {/* ---------------------------------------------------- */}
              {/* GROUP 1: THÔNG SỐ CỐT LÕI                           */}
              {/* ---------------------------------------------------- */}
              <tr className="bg-slate-100/70">
                <td
                  colSpan={evaluatedColumns.length + 1}
                  className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-700"
                >
                  1. Thông Số Cốt Lõi Mặt Bằng
                </td>
              </tr>

              {/* Row: Giá thuê/tháng & Giá thuê/m² */}
              <tr>
                <td className="p-4 font-semibold text-slate-700 bg-slate-50/50">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <span>Giá thuê & Đơn giá/m²</span>
                  </div>
                </td>
                {evaluatedColumns.map(({ property, rentPerSqmK }) => (
                  <td key={property.id} className="p-4 border-l border-slate-200">
                    <div className="text-sm font-extrabold text-blue-700">
                      {property.monthlyRentMillionVND} triệu / tháng
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      Đơn giá: ~{rentPerSqmK.toLocaleString('vi-VN')}.000 ₫/m²/tháng
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Dự trù 6 tháng: {property.monthlyRentMillionVND * 6} triệu ₫
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row: Tổng diện tích & Số tầng */}
              <tr>
                <td className="p-4 font-semibold text-slate-700 bg-slate-50/50">
                  <div className="flex items-center gap-1.5">
                    <Maximize className="w-4 h-4 text-emerald-600" />
                    <span>Tổng diện tích & Số tầng</span>
                  </div>
                </td>
                {evaluatedColumns.map(({ property, presetCapacity }) => (
                  <td key={property.id} className="p-4 border-l border-slate-200">
                    <div className="font-bold text-slate-900">
                      Tổng {property.totalAreaSqm} m² ({property.floorsCount} tầng)
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      Diện tích mỗi sàn: {property.floorAreaSqm} m² ({property.buildingWidth}m ×{' '}
                      {property.buildingDepth}m)
                    </div>
                    <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                      Sức chứa mẫu: ~{presetCapacity} chỗ ngồi
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row: Mặt tiền & Lộ giới */}
              <tr>
                <td className="p-4 font-semibold text-slate-700 bg-slate-50/50">
                  <div className="flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-amber-600" />
                    <span>Mặt tiền, Lộ giới & Hướng</span>
                  </div>
                </td>
                {evaluatedColumns.map(({ property }) => (
                  <td key={property.id} className="p-4 border-l border-slate-200">
                    <div className="font-bold text-slate-900">
                      Mặt tiền {property.frontageMeters}m • Lòng đường {property.roadWidthMeters}m
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      Hướng cửa: {property.orientationLabel} ({property.orientationAzimuth}°)
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row: Chỗ đỗ xe máy & Ô tô */}
              <tr>
                <td className="p-4 font-semibold text-slate-700 bg-slate-50/50">
                  <div className="flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-purple-600" />
                    <span>Chỗ đỗ xe (Xe máy / Ô tô)</span>
                  </div>
                </td>
                {evaluatedColumns.map(({ property }) => (
                  <td key={property.id} className="p-4 border-l border-slate-200">
                    <div className="font-bold text-slate-900">
                      {property.parkingSpotsMotorbike} xe máy • {property.parkingSpotsCar} ô tô
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      {property.parkingSpotsCar >= 2
                        ? 'Đáp ứng tốt khách hàng đi xe hơi'
                        : 'Ưu tiên khách xe máy hoặc bãi đỗ phụ lân cận'}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row: Đầu mối liên hệ & Khảo sát */}
              <tr className="bg-blue-50/20 print:bg-white">
                <td className="p-4 font-semibold text-slate-700 bg-slate-50/50 print:bg-white print:border-slate-300">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-blue-600 print:text-slate-800" />
                    <span>Đầu mối liên hệ & Khảo sát</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                    Chính chủ & Ưu đãi bàn giao
                  </div>
                </td>
                {evaluatedColumns.map(({ property }) => {
                  const contact = property.contact;
                  return (
                    <td
                      key={property.id}
                      className="p-4 border-l border-slate-200 print:border-slate-300 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          {contact?.name || 'Anh Minh'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200 print:border-slate-300 print:bg-slate-100 print:text-slate-800">
                          {contact?.role || 'Chính chủ'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${(contact?.phone || '0912 345 678').replace(/\s+/g, '')}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors print:text-slate-900"
                        >
                          <Phone className="w-3.5 h-3.5 text-blue-600 print:text-slate-700" />
                          <span>{contact?.phone || '0912 345 678'}</span>
                        </a>

                        {contact?.zaloPhone && (
                          <a
                            href={`https://zalo.me/${contact.zaloPhone.replace(/\s+/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200 hover:bg-emerald-100 print:hidden"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>Zalo</span>
                          </a>
                        )}
                      </div>

                      {contact?.handoverOffer && (
                        <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-[11px] text-emerald-900 leading-snug print:bg-slate-50 print:border-slate-300 print:text-slate-800">
                          <strong className="text-emerald-800 font-semibold print:text-slate-900">
                            Ưu đãi bàn giao:{' '}
                          </strong>
                          {contact.handoverOffer}
                        </div>
                      )}

                      <div className="text-[10px] text-slate-500 leading-tight pt-0.5">
                        <span>Lịch xem: </span>
                        <span className="text-slate-700 font-medium">
                          {contact?.viewingAvailability || '8h - 18h các ngày trong tuần'}
                        </span>
                        {contact?.responseSpeed && (
                          <span className="block text-slate-500 mt-0.5">
                            Tốc độ phản hồi: {contact.responseSpeed}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* ---------------------------------------------------- */}
              {/* GROUP 2: VỊ TRÍ & TIỆN ÍCH                         */}
              {/* ---------------------------------------------------- */}
              <tr className="bg-slate-100/70">
                <td
                  colSpan={evaluatedColumns.length + 1}
                  className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-700"
                >
                  2. Vị Trí & Hệ Sinh Thái Tiện Ích
                </td>
              </tr>

              {/* Row: Tiện ích xung quanh */}
              <tr>
                <td className="p-4 font-semibold text-slate-700 bg-slate-50/50">
                  <div className="flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-blue-600" />
                    <span>Tiện ích lân cận (POI)</span>
                  </div>
                </td>
                {evaluatedColumns.map(({ property, demandPOIs, transitPOIs }) => (
                  <td key={property.id} className="p-4 border-l border-slate-200 space-y-1">
                    <div className="font-bold text-slate-900">
                      {property.nearbyPOIs.length} điểm POI trong bán kính khảo sát
                    </div>
                    <div className="text-[11px] text-slate-600">
                      • {demandPOIs} nguồn tạo khách (Đại học, Văn phòng, TTTM)
                    </div>
                    <div className="text-[11px] text-slate-600">
                      • {transitPOIs} trạm trung chuyển / bãi gửi xe
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row: Khoảng cách đến trục đường chính */}
              <tr>
                <td className="p-4 font-semibold text-slate-700 bg-slate-50/50">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>Trục đường chính & Tiếp cận</span>
                  </div>
                </td>
                {evaluatedColumns.map(({ property, mainRoadNote }) => (
                  <td key={property.id} className="p-4 border-l border-slate-200">
                    <div className="font-bold text-slate-900">{mainRoadNote}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      Lòng đường {property.roadWidthMeters}m, vỉa hè thông thoáng
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row: Đối thủ trong bán kính 500m */}
              <tr>
                <td className="p-4 font-semibold text-slate-700 bg-slate-50/50">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-rose-600" />
                    <span>Đối thủ trong bán kính 500m</span>
                  </div>
                </td>
                {evaluatedColumns.map(({ property, bi }) => (
                  <td key={property.id} className="p-4 border-l border-slate-200 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                          bi.competitorAnalysis.densityLevel === 'High'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : bi.competitorAnalysis.densityLevel === 'Moderate'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {bi.competitorAnalysis.countWithin500m} đối thủ • Mức{' '}
                        {bi.competitorAnalysis.densityLevel === 'High'
                          ? 'Cao'
                          : bi.competitorAnalysis.densityLevel === 'Moderate'
                          ? 'Trung bình'
                          : 'Thấp'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      {bi.competitorAnalysis.summary}
                    </p>
                  </td>
                ))}
              </tr>

              {/* ---------------------------------------------------- */}
              {/* GROUP 3: ĐÁNH GIÁ PHÙ HỢP NGÀNH                    */}
              {/* ---------------------------------------------------- */}
              <tr className="bg-slate-100/70">
                <td
                  colSpan={evaluatedColumns.length + 1}
                  className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-700"
                >
                  3. Đánh Giá Phù Hợp Ngành ({BUSINESS_TYPE_META[selectedBusinessType]?.labelVi})
                </td>
              </tr>

              {/* Row: Điểm phù hợp & Tiêu chí chi tiết */}
              <tr>
                <td className="p-4 font-semibold text-slate-700 bg-slate-50/50">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Điểm tương thích chi tiết</span>
                  </div>
                </td>
                {evaluatedColumns.map(({ property, match }) => (
                  <td key={property.id} className="p-4 border-l border-slate-200 space-y-2">
                    <div className="grid grid-cols-5 gap-1 text-center">
                      {[
                        { k: 'Ngân sách', v: match.budgetScore },
                        { k: 'Diện tích', v: match.areaScore },
                        { k: 'Vị trí', v: match.locationScore },
                        { k: 'Mặt tiền', v: match.frontageScore },
                        { k: 'Đỗ xe', v: match.parkingScore },
                      ].map((item) => (
                        <div
                          key={item.k}
                          className="p-1 rounded bg-slate-50 border border-slate-200"
                        >
                          <div className="text-[9px] text-slate-500 truncate">{item.k}</div>
                          <div className="text-xs font-bold text-blue-700">
                            {Math.round(item.v)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row: Ưu điểm chính */}
              <tr>
                <td className="p-4 font-semibold text-slate-700 bg-slate-50/50">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Ưu điểm nổi bật</span>
                  </div>
                </td>
                {evaluatedColumns.map(({ property, match }) => (
                  <td key={property.id} className="p-4 border-l border-slate-200 space-y-1">
                    {match.reasons.slice(0, 3).map((reason, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-1 text-[11px] text-emerald-800"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </td>
                ))}
              </tr>

              {/* Row: Hạn chế cần lưu ý */}
              <tr>
                <td className="p-4 font-semibold text-slate-700 bg-slate-50/50">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Hạn chế & Rủi ro khảo sát</span>
                  </div>
                </td>
                {evaluatedColumns.map(({ property }) => (
                  <td key={property.id} className="p-4 border-l border-slate-200 space-y-1">
                    {property.risksToSurvey.map((risk, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-1 text-[11px] text-amber-800"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>{risk}</span>
                      </div>
                    ))}
                  </td>
                ))}
              </tr>

              {/* ---------------------------------------------------- */}
              {/* GROUP 4: DỰ TOÁN ĐẦU TƯ DỰ KIẾN                    */}
              {/* ---------------------------------------------------- */}
              <tr className="bg-slate-100/70">
                <td
                  colSpan={evaluatedColumns.length + 1}
                  className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-700"
                >
                  4. Dự Toán Chi Phí Đầu Tư Setup (CAPEX Ước Tính)
                </td>
              </tr>

              {/* Row: Tổng chi phí setup */}
              <tr>
                <td className="p-4 font-semibold text-slate-700 bg-slate-50/50">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Tổng mức đầu tư dự kiến</span>
                  </div>
                </td>
                {evaluatedColumns.map(({ property, budget }) => (
                  <td key={property.id} className="p-4 border-l border-slate-200 space-y-1">
                    <div className="text-sm font-extrabold text-slate-900">
                      ~{formatVNDMillions(budget.totalEstimateVND)}
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Biên độ dao động: {formatVNDMillions(budget.totalMinVND)} –{' '}
                      {formatVNDMillions(budget.totalMaxVND)}
                    </div>
                    <div className="pt-2 space-y-0.5 text-[10px] text-slate-500 border-t border-slate-100">
                      {budget.lines.slice(0, 4).map((line) => (
                        <div key={line.category} className="flex items-center justify-between">
                          <span>{line.label}:</span>
                          <span className="font-semibold text-slate-700">
                            {formatVNDMillions(line.estimateVND)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* ======================================================== */}
        {/* 4. AI COMPARATIVE SYNTHESIS & EXECUTIVE RECOMMENDATION   */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 print:break-inside-avoid">
          {/* Synthesis Cards */}
          <div
            id="tour-comp-radar"
            className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 print:border-slate-300 print:shadow-none"
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 print:bg-slate-100 print:text-slate-800">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Tổng Hợp Nhận Định So Sánh AI (Comparative Synthesis)
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Phân tích đánh đổi (Trade-off) cho mô hình{' '}
                    <strong className="text-blue-700 print:text-slate-900">
                      {BUSINESS_TYPE_META[selectedBusinessType]?.labelVi}
                    </strong>
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 print:border-slate-300 print:bg-slate-100 print:text-slate-800">
                AI Synthesis
              </span>
            </div>

            <div className="space-y-3">
              {evaluatedColumns.map(({ property, match, bi, budget }) => (
                <div
                  key={property.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 print:bg-white print:border-slate-300"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-bold text-slate-900">
                      [{property.code}] {property.title} ({property.district})
                    </div>
                    <span className="text-[11px] font-semibold text-blue-700 print:text-slate-800">
                      Điểm: {Math.round(match.overallScore)}/100 • Setup + 6T thuê: ~
                      {formatVNDMillions(
                        budget.totalEstimateVND + property.monthlyRentMillionVND * 6 * 1_000_000
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong className="text-emerald-800">Lợi thế: </strong>
                    {bi.suitabilitySummary}{' '}
                    <strong className="text-amber-800">Lưu ý: </strong>
                    {property.risksToSurvey[0] ||
                      'Cần kiểm tra kỹ hiện trạng kỹ thuật và hợp đồng thuê thực tế.'}
                  </p>
                  <div className="text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/60 flex items-center justify-between flex-wrap gap-1">
                    <span>
                      Đầu mối khảo sát:{' '}
                      <strong className="text-slate-800">
                        {property.contact?.name || 'Anh Minh'} ({property.contact?.phone || '0912 345 678'})
                      </strong>{' '}
                      • {property.contact?.role || 'Chính chủ'}
                    </span>
                    {property.contact?.handoverOffer && (
                      <span className="text-emerald-700 font-medium text-[10px]">
                        {property.contact.handoverOffer}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strategic Choices Recommendation Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 print:border-slate-300 print:shadow-none">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Award className="w-4 h-4 text-amber-600" />
                <span>Gợi Ý Lựa Chọn Theo Mục Tiêu</span>
              </h3>

              {bestMatchCol && (
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Tối ưu toàn diện nhất cho {BUSINESS_TYPE_META[selectedBusinessType]?.labelVi}
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    [{bestMatchCol.property.code}] {bestMatchCol.property.title}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Đạt {Math.round(bestMatchCol.match.overallScore)}% điểm tương thích đa tiêu chí.
                  </div>
                </div>
              )}

              {lowestCostCol && (
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                    Tối ưu dòng tiền & Chi phí khởi sự
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    [{lowestCostCol.property.code}] {lowestCostCol.property.title}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Thuê {lowestCostCol.property.monthlyRentMillionVND} tr/th • Dự toán setup ~
                    {formatVNDMillions(lowestCostCol.budget.totalEstimateVND)}.
                  </div>
                </div>
              )}

              {bestFrontageCol && (
                <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-purple-800">
                    Mặt tiền & Nhận diện thương hiệu
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    [{bestFrontageCol.property.code}] {bestFrontageCol.property.title}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Mặt tiền {bestFrontageCol.property.frontageMeters}m trên đường rộng{' '}
                    {bestFrontageCol.property.roadWidthMeters}m.
                  </div>
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-slate-600">
              <div className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px]">
                <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Lưu ý khảo sát thực địa</span>
              </div>
              <p className="text-[10px] leading-relaxed">
                Báo cáo tổng hợp từ dữ liệu khảo sát tham khảo và mô hình AI. Nhà đầu tư cần thẩm định thực địa về tiêu chuẩn an toàn PCCC, kết cấu chịu tải và hợp đồng pháp lý trước khi đặt cọc.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComparisonReportView;
