'use client';

import React, { useState, useMemo } from 'react';
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
  Award,
  Box,
  Navigation,
  Info,
  FileText,
  MapPin,
  Check,
  Phone,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Trophy,
  TrendingDown,
  Layers,
  ArrowRight,
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

  // Progressive Disclosure states: collapsed by default for 3-second breathing room
  const [showDetailedMatrix, setShowDetailedMatrix] = useState(false);
  const [showCapexBreakdown, setShowCapexBreakdown] = useState(false);
  const [showRiskDetails, setShowRiskDetails] = useState(false);

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

      const demandPOIs = prop.nearbyPOIs.filter((poi) =>
        ['university', 'office', 'apartment', 'mall'].includes(poi.category)
      ).length;
      const transitPOIs = prop.nearbyPOIs.filter((poi) =>
        ['bus_stop', 'parking'].includes(poi.category)
      ).length;

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

  // Comparative leaders for smart badge calculation
  const bestMatchCol = useMemo(() => {
    if (evaluatedColumns.length === 0) return null;
    return [...evaluatedColumns].sort((a, b) => b.match.overallScore - a.match.overallScore)[0];
  }, [evaluatedColumns]);

  const lowestRentCol = useMemo(() => {
    if (evaluatedColumns.length === 0) return null;
    return [...evaluatedColumns].sort(
      (a, b) => a.property.monthlyRentMillionVND - b.property.monthlyRentMillionVND
    )[0];
  }, [evaluatedColumns]);

  const largestAreaCol = useMemo(() => {
    if (evaluatedColumns.length === 0) return null;
    return [...evaluatedColumns].sort(
      (a, b) => b.property.totalAreaSqm - a.property.totalAreaSqm
    )[0];
  }, [evaluatedColumns]);

  const bestFrontageCol = useMemo(() => {
    if (evaluatedColumns.length === 0) return null;
    return [...evaluatedColumns].sort(
      (a, b) => b.property.frontageMeters - a.property.frontageMeters
    )[0];
  }, [evaluatedColumns]);

  const lowestCapexCol = useMemo(() => {
    if (evaluatedColumns.length === 0) return null;
    return [...evaluatedColumns].sort(
      (a, b) => a.budget.totalEstimateVND - b.budget.totalEstimateVND
    )[0];
  }, [evaluatedColumns]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50 text-slate-800 p-4 md:p-6 lg:p-8 print:h-auto print:overflow-visible print:p-6 print:bg-white print:text-slate-900">
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
        {/* 1. TOP EXECUTIVE HEADER & CONTROLS                       */}
        {/* ======================================================== */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs print:border-slate-300 print:shadow-none">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold uppercase tracking-wider">
                So Sánh Đối Đầu
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {comparedProperties.length} Mặt Bằng
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Quy Tắc 3 Giây
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Báo Cáo So Sánh Đối Đầu & Đánh Giá Phương Án
            </h1>
            <p className="text-xs text-slate-600">
              Đánh giá nhanh trong 3 giây: Xem ngay mặt bằng tối ưu nhất, so sánh số liệu giá thuê, diện tích và mặt tiền phóng to.
            </p>
          </div>

          {/* Interactive Parameters & Print Action */}
          <div className="flex flex-wrap items-center gap-2.5 print:hidden">
            <div>
              <label className="block text-[10px] font-medium text-slate-500 mb-0.5">
                Mô hình kinh doanh:
              </label>
              <select
                value={selectedBusinessType}
                onChange={(e) => setSelectedBusinessType(e.target.value as BusinessType)}
                className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none shadow-2xs"
              >
                {BUSINESS_TYPES.map((bt) => (
                  <option key={bt} value={bt}>
                    {BUSINESS_TYPE_META[bt]?.labelVi || bt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-slate-500 mb-0.5">
                Phong cách thiết kế:
              </label>
              <select
                value={selectedDesignStyle}
                onChange={(e) => setSelectedDesignStyle(e.target.value as DesignStyle)}
                className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none shadow-2xs"
              >
                {DESIGN_STYLES.map((st) => (
                  <option key={st} value={st}>
                    {DESIGN_STYLE_META[st]?.label || st}
                  </option>
                ))}
              </select>
            </div>

            <button
              id="tour-comp-export"
              type="button"
              onClick={handlePrint}
              className="mt-3.5 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Xuất PDF</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. PROPERTY CHIPS & SELECTOR BAR                         */}
        {/* ======================================================== */}
        <div
          id="tour-comp-picker"
          className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <GitCompare className="w-4 h-4 text-blue-600" />
              Đang đối đầu ({comparedProperties.length}/3 mặt bằng):
            </span>
            {comparedProperties.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-900 font-medium"
              >
                <span className="text-blue-700 font-bold">[{p.code}]</span>
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
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-400 text-[11px] font-semibold text-slate-700 hover:text-blue-800 transition-colors shadow-2xs"
                >
                  <Plus className="w-3 h-3 text-blue-600" />
                  <span>
                    [{p.code}] {p.district}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 3. HERO SHOWDOWN CARDS (QUY TẮC 3S ĐẦU - SỐ LIỆU PHÓNG TO) */}
        {/* ======================================================== */}
        <div id="tour-comp-matrix" className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Bảng Đối Đầu Trực Quan • Số Liệu Cốt Lõi
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Nhìn là thấy ngay ưu thế trong 3 giây
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            {evaluatedColumns.map(
              ({
                property,
                match,
                bi,
                budget,
                rentPerSqmK,
                demandPOIs,
                transitPOIs,
              }) => {
                const isBestMatch = bestMatchCol?.property.id === property.id;
                const isLowestRent = lowestRentCol?.property.id === property.id;
                const isLargestArea = largestAreaCol?.property.id === property.id;
                const isBestFrontage = bestFrontageCol?.property.id === property.id;
                const isSelected = property.id === selectedPropertyId;

                return (
                  <div
                    key={property.id}
                    className={`relative rounded-2xl border-2 transition-all flex flex-col justify-between overflow-hidden shadow-xs ${
                      isBestMatch
                        ? 'border-emerald-500 bg-gradient-to-b from-emerald-50/40 via-white to-white ring-2 ring-emerald-500/20'
                        : isSelected
                        ? 'border-blue-500 bg-white'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {/* Winner Banner if Best Match */}
                    {isBestMatch && (
                      <div className="bg-emerald-600 text-white py-1 px-3 text-center text-[11px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs">
                        <Trophy className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                        <span>Đề Xuất Tối Ưu Toàn Diện Nhất</span>
                      </div>
                    )}

                    <div className="p-4 sm:p-5 space-y-4">
                      {/* Property Header & Match Score */}
                      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-extrabold">
                              {property.code}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-500">
                              {property.district}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 mt-1 leading-snug truncate">
                            {property.title}
                          </h3>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {property.address}
                          </p>
                        </div>

                        {/* BIG MATCH SCORE */}
                        <div className="shrink-0 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                          <div className="text-2xl font-black text-emerald-700 leading-tight">
                            {Math.round(match.overallScore)}%
                          </div>
                          <div className="text-[9px] font-bold text-emerald-800 uppercase tracking-tight">
                            Match AI
                          </div>
                        </div>
                      </div>

                      {/* Smart Advantage Badges Row */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isLowestRent && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                            <TrendingDown className="w-3 h-3 text-blue-600" />
                            Giá tốt nhất
                          </span>
                        )}
                        {isLargestArea && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                            <Maximize className="w-3 h-3 text-purple-600" />
                            Diện tích lớn nhất
                          </span>
                        )}
                        {isBestFrontage && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                            <Compass className="w-3 h-3 text-amber-600" />
                            Mặt tiền rộng nhất
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium">
                          {bi.competitorAnalysis.densityLevel === 'High'
                            ? 'Mật độ đối thủ cao'
                            : 'Mật độ đối thủ thấp/vừa'}
                        </span>
                      </div>

                      {/* ============================================== */}
                      {/* 4 PHÓNG TO SỐ LIỆU SO SÁNH (BIG NUMBERS 3S)    */}
                      {/* ============================================== */}
                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        {/* 1. BIG NUMBER: Giá thuê */}
                        <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100/80">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
                            Giá thuê / tháng
                          </span>
                          <div className="text-xl sm:text-2xl font-black text-blue-700 mt-0.5 leading-tight">
                            {property.monthlyRentMillionVND}{' '}
                            <span className="text-xs font-bold text-blue-900">tr/tháng</span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                            ~{rentPerSqmK.toLocaleString('vi-VN')}k / m²
                          </span>
                        </div>

                        {/* 2. BIG NUMBER: Tổng diện tích */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                            Tổng diện tích sàn
                          </span>
                          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 leading-tight">
                            {property.totalAreaSqm}{' '}
                            <span className="text-xs font-bold text-slate-500">m²</span>
                          </div>
                          <span className="text-[11px] text-slate-600 font-medium block mt-0.5">
                            {property.floorsCount} tầng ({property.floorAreaSqm}m²/sàn)
                          </span>
                        </div>

                        {/* 3. BIG NUMBER: Mặt tiền */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                            Mặt tiền & Đường
                          </span>
                          <div className="text-xl font-black text-slate-900 mt-0.5 leading-tight">
                            {property.frontageMeters} m
                          </div>
                          <span className="text-[11px] text-slate-600 font-medium block mt-0.5">
                            Lòng đường {property.roadWidthMeters}m • {property.orientationLabel}
                          </span>
                        </div>

                        {/* 4. BIG NUMBER: Dự toán Setup */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                            Dự toán setup sơ bộ
                          </span>
                          <div className="text-lg font-black text-slate-900 mt-0.5 leading-tight">
                            ~{formatVNDMillions(budget.totalEstimateVND)}
                          </div>
                          <span className="text-[11px] text-slate-600 font-medium block mt-0.5">
                            +6T thuê: ~{property.monthlyRentMillionVND * 6} tr
                          </span>
                        </div>
                      </div>

                      {/* 1 Key AI Verdict Sentence (Breathing room, focused) */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed font-medium">
                        <strong className="text-emerald-800">Đánh giá nhanh: </strong>
                        {bi.suitabilitySummary.split(/(?<=[.!?])\s+/)[0]}
                      </div>

                      {/* Landlord Contact Strip */}
                      {property.contact && (
                        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-100/70 border border-slate-200 text-xs">
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 truncate block">
                              {property.contact.name}{' '}
                              <span className="text-[10px] font-normal text-slate-500">
                                ({property.contact.role})
                              </span>
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                              {property.contact.phone}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 print:hidden">
                            <a
                              href={`tel:${property.contact.phone.replace(/\s+/g, '')}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition"
                              title={`Gọi ${property.contact.name}`}
                            >
                              <Phone className="w-3 h-3" />
                              <span>Gọi</span>
                            </a>
                            <a
                              href={`https://zalo.me/${(property.contact.zaloPhone || property.contact.phone).replace(/\s+/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition"
                              title={`Chat Zalo`}
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>Zalo</span>
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quick Card Actions */}
                    <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2 print:hidden">
                      <button
                        type="button"
                        onClick={() => {
                          selectProperty(property.id);
                          setActiveTab('twin');
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-2xs"
                      >
                        <Box className="w-3.5 h-3.5" />
                        <span>Khảo sát 3D</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          selectProperty(property.id);
                          setActiveTab('studio');
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-semibold transition shadow-2xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>Studio setup</span>
                      </button>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 4. PROGRESSIVE DISCLOSURE ACCORDIONS (ẨN CHI TIẾT THỪA)  */}
        {/* ======================================================== */}
        <div className="space-y-4">
          {/* ACCORDION 1: BẢNG MA TRẬN 12 TIÊU CHÍ KỸ THUẬT */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs print:border-slate-300">
            <button
              type="button"
              onClick={() => setShowDetailedMatrix(!showDetailedMatrix)}
              className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-slate-50 transition-colors print:hidden"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Bảng Đối Chiếu Chi Tiết 12 Tiêu Chí Kỹ Thuật
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {showDetailedMatrix
                      ? 'Bấm để thu gọn bảng đối chiếu chi tiết'
                      : 'Kích thước sàn, chỗ đỗ xe, tiện ích POI, mật độ đối thủ & điểm thành phần'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 shrink-0">
                <span>{showDetailedMatrix ? 'Thu gọn' : 'Xem chi tiết'}</span>
                {showDetailedMatrix ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </button>

            {/* Content: Visible if opened or in print mode */}
            <div className={`${showDetailedMatrix ? 'block' : 'hidden'} print:block border-t border-slate-200`}>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="w-48 sm:w-56 p-3.5 font-bold uppercase tracking-wider text-slate-500 text-[11px]">
                        Tiêu chí kỹ thuật
                      </th>
                      {evaluatedColumns.map(({ property }) => (
                        <th
                          key={property.id}
                          className="p-3.5 border-l border-slate-200 font-bold text-slate-900 text-xs min-w-[220px]"
                        >
                          [{property.code}] {property.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Row: Kích thước từng sàn */}
                    <tr>
                      <td className="p-3.5 font-semibold text-slate-700 bg-slate-50/50">
                        Kích thước sàn (Rộng × Sâu)
                      </td>
                      {evaluatedColumns.map(({ property }) => (
                        <td key={property.id} className="p-3.5 border-l border-slate-200">
                          {property.buildingWidth}m × {property.buildingDepth}m ({property.floorAreaSqm} m²/sàn)
                        </td>
                      ))}
                    </tr>

                    {/* Row: Hướng nhà & La bàn */}
                    <tr>
                      <td className="p-3.5 font-semibold text-slate-700 bg-slate-50/50">
                        Hướng mặt tiền & Góc đón nắng
                      </td>
                      {evaluatedColumns.map(({ property }) => (
                        <td key={property.id} className="p-3.5 border-l border-slate-200">
                          {property.orientationLabel} ({property.orientationAzimuth}°)
                        </td>
                      ))}
                    </tr>

                    {/* Row: Chỗ đỗ xe */}
                    <tr>
                      <td className="p-3.5 font-semibold text-slate-700 bg-slate-50/50">
                        Chỗ đỗ xe thực tế
                      </td>
                      {evaluatedColumns.map(({ property }) => (
                        <td key={property.id} className="p-3.5 border-l border-slate-200">
                          {property.parkingSpotsMotorbike} xe máy • {property.parkingSpotsCar} ô tô
                        </td>
                      ))}
                    </tr>

                    {/* Row: Tiện ích & Nguồn khách POI */}
                    <tr>
                      <td className="p-3.5 font-semibold text-slate-700 bg-slate-50/50">
                        Nguồn khách lân cận (POI)
                      </td>
                      {evaluatedColumns.map(({ property, demandPOIs, transitPOIs }) => (
                        <td key={property.id} className="p-3.5 border-l border-slate-200 space-y-0.5">
                          <div>{demandPOIs} điểm tạo khách (Đại học, Văn phòng, TTTM)</div>
                          <div className="text-[11px] text-slate-500">
                            {transitPOIs} trạm bus & bãi đỗ phụ
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Row: Đối thủ cạnh tranh */}
                    <tr>
                      <td className="p-3.5 font-semibold text-slate-700 bg-slate-50/50">
                        Đối thủ trong bán kính 500m
                      </td>
                      {evaluatedColumns.map(({ property, bi }) => (
                        <td key={property.id} className="p-3.5 border-l border-slate-200">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${
                              bi.competitorAnalysis.densityLevel === 'High'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {bi.competitorAnalysis.countWithin500m} điểm ({bi.competitorAnalysis.densityLevel})
                          </span>
                        </td>
                      ))}
                    </tr>

                    {/* Row: 5 Điểm chấm thành phần AI */}
                    <tr>
                      <td className="p-3.5 font-semibold text-slate-700 bg-slate-50/50">
                        Điểm thành phần (Ngân sách / Vị trí / Mặt tiền / Sàn / Xe)
                      </td>
                      {evaluatedColumns.map(({ property, match }) => (
                        <td key={property.id} className="p-3.5 border-l border-slate-200">
                          <div className="grid grid-cols-5 gap-1 text-center font-mono text-[10px]">
                            <div className="p-1 rounded bg-slate-50 border">
                              <span className="block text-slate-500 text-[9px]">Giá</span>
                              <strong className="text-blue-700">{Math.round(match.budgetScore)}</strong>
                            </div>
                            <div className="p-1 rounded bg-slate-50 border">
                              <span className="block text-slate-500 text-[9px]">Sàn</span>
                              <strong className="text-blue-700">{Math.round(match.areaScore)}</strong>
                            </div>
                            <div className="p-1 rounded bg-slate-50 border">
                              <span className="block text-slate-500 text-[9px]">Vị trí</span>
                              <strong className="text-blue-700">{Math.round(match.locationScore)}</strong>
                            </div>
                            <div className="p-1 rounded bg-slate-50 border">
                              <span className="block text-slate-500 text-[9px]">Mặt tiền</span>
                              <strong className="text-blue-700">{Math.round(match.frontageScore)}</strong>
                            </div>
                            <div className="p-1 rounded bg-slate-50 border">
                              <span className="block text-slate-500 text-[9px]">Đỗ xe</span>
                              <strong className="text-blue-700">{Math.round(match.parkingScore)}</strong>
                            </div>
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ACCORDION 2: SO SÁNH DỰ TOÁN CHI PHÍ SETUP (CAPEX) */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs print:border-slate-300">
            <button
              type="button"
              onClick={() => setShowCapexBreakdown(!showCapexBreakdown)}
              className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-slate-50 transition-colors print:hidden"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Chi Tiết Dự Toán & Phân Bổ Ngân Sách Setup 6 Nhóm
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {showCapexBreakdown
                      ? 'Bấm để thu gọn phân tích ngân sách'
                      : 'Mặt bằng cọc, Xây dựng thô, Nội thất, Thiết bị máy móc, M&E biển hiệu & Dự phòng'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 shrink-0">
                <span>{showCapexBreakdown ? 'Thu gọn' : 'Xem chi tiết'}</span>
                {showCapexBreakdown ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </button>

            {/* Content: Visible if opened or in print mode */}
            <div className={`${showCapexBreakdown ? 'block' : 'hidden'} print:block border-t border-slate-200`}>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="w-48 sm:w-56 p-3.5 font-bold uppercase tracking-wider text-slate-500 text-[11px]">
                        Hạng mục chi phí
                      </th>
                      {evaluatedColumns.map(({ property }) => (
                        <th
                          key={property.id}
                          className="p-3.5 border-l border-slate-200 font-bold text-slate-900 text-xs min-w-[220px]"
                        >
                          [{property.code}] {property.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Rows: 6 category breakdown lines */}
                    {evaluatedColumns[0]?.budget.lines.map((masterLine, idx) => (
                      <tr key={masterLine.category}>
                        <td className="p-3.5 font-semibold text-slate-700 bg-slate-50/50">
                          {masterLine.label}
                        </td>
                        {evaluatedColumns.map(({ property, budget }) => {
                          const line = budget.lines[idx] || masterLine;
                          return (
                            <td key={property.id} className="p-3.5 border-l border-slate-200">
                              <div className="font-bold text-slate-900">
                                {formatVNDMillions(line.estimateVND)}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                ({formatVNDMillions(line.minVND)} – {formatVNDMillions(line.maxVND)})
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                    {/* Total Row */}
                    <tr className="bg-blue-50/40 font-bold">
                      <td className="p-3.5 text-blue-950 font-bold">
                        TỔNG DỰ TOÁN SETUP (ƯỚC TÍNH)
                      </td>
                      {evaluatedColumns.map(({ property, budget }) => (
                        <td key={property.id} className="p-3.5 border-l border-slate-200 text-blue-800 font-black">
                          {formatVNDMillions(budget.totalEstimateVND)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ACCORDION 3: THẨM ĐỊNH THỰC ĐỊA & LƯU Ý PHÁP LÝ */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs print:border-slate-300">
            <button
              type="button"
              onClick={() => setShowRiskDetails(!showRiskDetails)}
              className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-slate-50 transition-colors print:hidden"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-700">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Lưu Ý Khảo Sát Thực Địa & Danh Mục Thẩm Định
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {showRiskDetails
                      ? 'Bấm để thu gọn các lưu ý rủi ro'
                      : 'An toàn PCCC, lối thoát hiểm, kết cấu chịu lực và bàn giao hiện trạng'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 shrink-0">
                <span>{showRiskDetails ? 'Thu gọn' : 'Xem chi tiết'}</span>
                {showRiskDetails ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </button>

            {/* Content: Visible if opened or in print mode */}
            <div className={`${showRiskDetails ? 'block' : 'hidden'} print:block p-4 sm:p-5 border-t border-slate-200 bg-slate-50/50 space-y-3`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {evaluatedColumns.map(({ property }) => (
                  <div
                    key={property.id}
                    className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs"
                  >
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                        {property.code}
                      </span>
                      <span>{property.title}</span>
                    </div>

                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {property.risksToSurvey.map((risk, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span className="leading-snug">{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Khuyến cáo pháp lý:</strong> Báo cáo so sánh được tổng hợp tự động từ mô hình thuật toán và dữ liệu khảo sát sơ bộ. Nhà đầu tư cần thẩm định trực tiếp với kỹ sư chuyên môn về PCCC và kết cấu trước khi ký hợp đồng chính thức.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 5. STRATEGIC CHOICES & SYNTHESIS SUMMARY                 */}
        {/* ======================================================== */}
        <div id="tour-comp-radar" className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 print:border-slate-300">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Tổng Hợp Khuyến Nghị Chiến Lược AI
                </h3>
                <p className="text-[11px] text-slate-500">
                  Gợi ý tối ưu theo 3 mục tiêu đầu tư kinh doanh khác nhau
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              AI Strategic Guidance
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {bestMatchCol && (
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  1. Tối ưu toàn diện nhất
                </div>
                <div className="text-xs font-bold text-slate-900">
                  [{bestMatchCol.property.code}] {bestMatchCol.property.title}
                </div>
                <div className="text-[11px] text-slate-600">
                  Đạt {Math.round(bestMatchCol.match.overallScore)}% điểm tương thích đa tiêu chí.
                </div>
              </div>
            )}

            {lowestRentCol && (
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                  2. Tiết kiệm dòng tiền & Chi phí thuê
                </div>
                <div className="text-xs font-bold text-slate-900">
                  [{lowestRentCol.property.code}] {lowestRentCol.property.title}
                </div>
                <div className="text-[11px] text-slate-600">
                  Giá thuê {lowestRentCol.property.monthlyRentMillionVND} tr/tháng • Dự toán setup ~
                  {formatVNDMillions(lowestRentCol.budget.totalEstimateVND)}.
                </div>
              </div>
            )}

            {bestFrontageCol && (
              <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-purple-800">
                  3. Nhận diện thương hiệu & Vỉa hè
                </div>
                <div className="text-xs font-bold text-slate-900">
                  [{bestFrontageCol.property.code}] {bestFrontageCol.property.title}
                </div>
                <div className="text-[11px] text-slate-600">
                  Mặt tiền {bestFrontageCol.property.frontageMeters}m trên trục đường{' '}
                  {bestFrontageCol.property.roadWidthMeters}m.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComparisonReportView;