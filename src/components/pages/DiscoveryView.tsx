'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Sparkles,
  SlidersHorizontal,
  Building2,
  MapPin,
  Box,
  Navigation,
  GitCompare,
  Check,
  AlertTriangle,
  CheckCircle2,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  Car,
  Maximize,
  DollarSign,
  Info,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Phone,
  MessageSquare,
} from 'lucide-react';
import { useSpaceVisionStore } from '@/store/useSpaceVisionStore';
import { scorePropertyForIntent, BUSINESS_TYPE_META } from '@/lib/aiEngine';
import { InteractiveMap, POI_CATEGORY_META } from '@/components/map/InteractiveMap';
import { LandlordContactCard } from '@/components/common/LandlordContactCard';
import type { BusinessType, PropertyItem } from '@/types';

const EXAMPLE_PROMPTS = [
  'Quán cà phê tại Cầu Giấy, 100–150m², ngân sách 20–30 tr/tháng, gần văn phòng',
  'Mặt bằng showroom thời trang tại Hoàn Kiếm, mặt tiền rộng',
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

export function DiscoveryView() {
  const {
    properties,
    selectedPropertyId,
    comparedPropertyIds,
    sidebarCollapsed,
    searchQuery,
    parsedIntent,
    filterDistrict,
    filterMaxRent,
    filterMinArea,
    selectedBusinessType,
    setSidebarCollapsed,
    selectProperty,
    toggleCompareProperty,
    runNaturalLanguageSearch,
    setFilterDistrict,
    setFilterMaxRent,
    setFilterMinArea,
    setSelectedBusinessType,
    setActiveTab,
  } = useSpaceVisionStore();

  const [inputQuery, setInputQuery] = useState(
    searchQuery ||
      'Tìm mặt bằng kinh doanh tại Hà Nội diện tích 100–150m², ngân sách 20–30 triệu/tháng'
  );
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(selectedPropertyId);
  const [expandedScoreCardId, setExpandedScoreCardId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');

  const districts = useMemo(() => {
    const set = new Set<string>();
    properties.forEach((p) => set.add(p.district));
    return ['all', ...Array.from(set)];
  }, [properties]);

  // Score and filter properties deterministically
  const scoredAndFilteredProperties = useMemo(() => {
    const filtered = properties.filter((prop) => {
      if (filterDistrict !== 'all' && prop.district !== filterDistrict) return false;
      if (prop.monthlyRentMillionVND > filterMaxRent) return false;
      if (prop.totalAreaSqm < filterMinArea) return false;
      return true;
    });

    return filtered
      .map((prop) => ({
        property: prop,
        match: scorePropertyForIntent(prop, parsedIntent, selectedBusinessType),
      }))
      .sort((a, b) => b.match.overallScore - a.match.overallScore);
  }, [
    properties,
    filterDistrict,
    filterMaxRent,
    filterMinArea,
    parsedIntent,
    selectedBusinessType,
  ]);

  const filteredPropertyItems = useMemo(
    () => scoredAndFilteredProperties.map((item) => item.property),
    [scoredAndFilteredProperties]
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runNaturalLanguageSearch(inputQuery);
  };

  const handleExampleClick = (prompt: string) => {
    setInputQuery(prompt);
    runNaturalLanguageSearch(prompt);
  };

  const handleResetFilters = () => {
    setFilterDistrict('all');
    setFilterMaxRent(100);
    setFilterMinArea(0);
    setInputQuery('');
    runNaturalLanguageSearch('');
  };

  return (
    <div className="relative flex w-full h-[calc(100vh-3.5rem)] bg-slate-50 text-slate-900 overflow-hidden">
      {/* Collapsible Left Discovery Sidebar */}
      <aside
        className={`relative z-20 flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out ${
          mobileView === 'map' ? 'hidden md:flex' : 'flex'
        } ${
          sidebarCollapsed
            ? 'md:w-0 md:-translate-x-full md:overflow-hidden md:border-r-0'
            : 'w-full md:w-[440px] lg:w-[38%] xl:w-[35%] max-w-[560px] shrink-0'
        }`}
      >
        {/* Sidebar Header & Natural Language Search */}
        <div className="p-4 border-b border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 tracking-tight">
                  Tìm Kiếm Mặt Bằng Thương Mại
                </h1>
                <p className="text-xs text-slate-500">
                  Phân tích nhu cầu tự nhiên & chấm điểm phù hợp mô hình
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSidebarCollapsed(true)}
                title="Thu gọn danh sách"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Natural Language Search Input */}
          <form onSubmit={handleSearchSubmit} className="space-y-2">
            <div className="relative">
              <textarea
                rows={2}
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Nhập yêu cầu kinh doanh của bạn (VD: Tìm quán cà phê 100-150m² ở Cầu Giấy, ngân sách 25 triệu/tháng, gần văn phòng)..."
                className="w-full rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-xs text-slate-900 placeholder-slate-400 p-3 pr-24 resize-none transition-all outline-none"
              />
              <button
                type="submit"
                className="absolute right-2.5 bottom-3 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tìm kiếm</span>
              </button>
            </div>

            {/* Quick Example Queries */}
            <div className="space-y-1">
              <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
                <span>Gợi ý mẫu:</span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors text-[11px]"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Đặt lại</span>
                </button>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {EXAMPLE_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleExampleClick(prompt)}
                    className="shrink-0 max-w-[240px] truncate px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-[11px] transition-all text-left font-medium"
                    title={prompt}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </form>

          {/* AI Parsed Intent Summary */}
          {parsedIntent && (
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Tiêu chí nhận diện từ yêu cầu:
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {parsedIntent.detectedBusiness && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-blue-200 text-xs text-blue-800 font-medium shadow-xs">
                    Ngành: {BUSINESS_TYPE_META[parsedIntent.detectedBusiness]?.labelVi || parsedIntent.detectedBusiness}
                  </span>
                )}
                {parsedIntent.detectedDistrict && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-xs text-emerald-800 font-medium shadow-xs">
                    Khu vực: {parsedIntent.detectedDistrict}
                  </span>
                )}
                {parsedIntent.maxBudgetMillionVND !== undefined && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-amber-200 text-xs text-amber-800 font-medium shadow-xs">
                    Ngân sách: ≤ {parsedIntent.maxBudgetMillionVND} tr/tháng
                  </span>
                )}
                {parsedIntent.minAreaSqm !== undefined && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-purple-200 text-xs text-purple-800 font-medium shadow-xs">
                    Diện tích: ≥ {parsedIntent.minAreaSqm} m²
                    {parsedIntent.maxAreaSqm ? ` – ${parsedIntent.maxAreaSqm} m²` : ''}
                  </span>
                )}
                {parsedIntent.needsParking && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-teal-200 text-xs text-teal-800 font-medium shadow-xs">
                    Đỗ xe: Rộng rãi
                  </span>
                )}
                {parsedIntent.nearCategories &&
                  parsedIntent.nearCategories.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-indigo-200 text-xs text-indigo-800 font-medium shadow-xs"
                    >
                      Gần: {POI_CATEGORY_META[cat]?.shortLabel || cat}
                    </span>
                  ))}
              </div>
              {parsedIntent.summaryExplanation && (
                <p className="text-xs text-slate-600 leading-relaxed">
                  {parsedIntent.summaryExplanation}
                </p>
              )}
            </div>
          )}

          {/* Filter Controls Toggle & Form */}
          <div>
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                <span>Bộ lọc chi tiết (Khu vực, Giá thuê, Diện tích, Mô hình)</span>
              </span>
              {showFilters ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>

            {showFilters && (
              <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                {/* District Filter */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Khu vực / Quận</label>
                  <select
                    value={filterDistrict}
                    onChange={(e) => setFilterDistrict(e.target.value)}
                    className="w-full rounded-lg bg-white border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                  >
                    {districts.map((d) => (
                      <option key={d} value={d}>
                        {d === 'all' ? 'Tất cả Quận (Hà Nội)' : d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Business Type Filter */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Mô hình kinh doanh
                  </label>
                  <select
                    value={selectedBusinessType}
                    onChange={(e) => setSelectedBusinessType(e.target.value as BusinessType)}
                    className="w-full rounded-lg bg-white border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                  >
                    {BUSINESS_TYPES.map((bt) => (
                      <option key={bt} value={bt}>
                        {BUSINESS_TYPE_META[bt]?.labelVi || bt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Max Rent Slider */}
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-600 font-medium">Trần giá thuê:</span>
                    <span className="font-bold text-blue-700">≤ {filterMaxRent} tr/tháng</span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={100}
                    step={5}
                    value={filterMaxRent}
                    onChange={(e) => setFilterMaxRent(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                {/* Min Area Slider */}
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-600 font-medium">Diện tích tối thiểu:</span>
                    <span className="font-bold text-blue-700">≥ {filterMinArea} m²</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={250}
                    step={10}
                    value={filterMinArea}
                    onChange={(e) => setFilterMinArea(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Bar */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-600">
            Tìm thấy{' '}
            <span className="font-bold text-blue-700">{scoredAndFilteredProperties.length}</span> /{' '}
            {properties.length} mặt bằng
          </div>
          {comparedPropertyIds.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('comparison')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-semibold transition-colors"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>So sánh ({comparedPropertyIds.length}/3)</span>
            </button>
          )}
        </div>

        {/* Scrollable Property Cards List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50/50">
          {scoredAndFilteredProperties.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
              <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-sm font-semibold text-slate-800">
                Không tìm thấy mặt bằng phù hợp
              </div>
              <p className="text-xs text-slate-500">
                Thử tăng trần ngân sách hoặc giảm diện tích tối thiểu để xem thêm mặt bằng.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            scoredAndFilteredProperties.map(({ property, match }) => {
              const isSelected = property.id === selectedPropertyId;
              const isCompared = comparedPropertyIds.includes(property.id);
              const isExpanded = expandedCardId === property.id || isSelected;
              const overall = Math.round(match.overallScore);

              const scoreBadgeColor =
                overall >= 85
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : overall >= 70
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200';

              const breakdownBars = [
                { label: 'Ngân sách', score: match.budgetScore },
                { label: 'Diện tích', score: match.areaScore },
                { label: 'Vị trí', score: match.locationScore },
                { label: 'Mặt tiền', score: match.frontageScore },
                { label: 'Đỗ xe', score: match.parkingScore },
              ];

              return (
                <div
                  key={property.id}
                  onClick={() => {
                    selectProperty(property.id);
                    setExpandedCardId(property.id);
                  }}
                  className={`rounded-xl border p-4 transition-all cursor-pointer bg-white ${
                    isSelected
                      ? 'border-blue-600 ring-2 ring-blue-100 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {property.code}
                        </span>
                        <span className="text-xs sm:text-sm text-slate-500 font-medium flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {property.district}
                        </span>
                      </div>
                      <h2 className="text-base font-bold text-slate-900 leading-snug">
                        {property.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500">{property.address}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-lg font-extrabold text-emerald-700 leading-none">
                        {property.monthlyRentMillionVND} <span className="text-xs font-semibold text-slate-600">tr/th</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 font-medium">
                        {property.floorsCount} tầng • {property.totalAreaSqm} m²
                      </div>
                    </div>
                  </div>

                  {/* Core Property Specs */}
                  <div className="grid grid-cols-4 gap-2 my-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-center">
                    <div>
                      <div className="text-xs text-slate-500 font-semibold flex items-center justify-center gap-0.5">
                        <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                        Giá thuê
                      </div>
                      <div className="text-sm font-bold text-blue-700 mt-0.5">
                        {property.monthlyRentMillionVND} tr/th
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-semibold flex items-center justify-center gap-0.5">
                        <Maximize className="w-3.5 h-3.5 text-slate-600" />
                        Diện tích
                      </div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">
                        {property.totalAreaSqm} m²
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-semibold flex items-center justify-center gap-0.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-600" />
                        Mặt tiền
                      </div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">
                        {property.frontageMeters}m
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-semibold flex items-center justify-center gap-0.5">
                        <Car className="w-3.5 h-3.5 text-slate-600" />
                        Đỗ xe
                      </div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5 truncate">
                        {property.parkingSpotsMotorbike}XM • {property.parkingSpotsCar}Ôtô
                      </div>
                    </div>
                  </div>

                  {/* 1 Clean Match Pill with Expand Toggle for Score Breakdown */}
                  <div className="rounded-lg bg-slate-50/80 border border-slate-200/70 p-2.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${scoreBadgeColor}`}
                        >
                          <span>
                            {overall}% Phù hợp {BUSINESS_TYPE_META[selectedBusinessType]?.labelVi || 'mô hình'}
                          </span>
                        </span>
                        <span className="text-[11px] text-slate-500 truncate hidden sm:inline">
                          Điểm vị trí & quy mô
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedScoreCardId((cur) => (cur === property.id ? null : property.id));
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 shrink-0 p-1"
                      >
                        <span>{expandedScoreCardId === property.id ? 'Thu gọn' : 'Chi tiết điểm'}</span>
                        {expandedScoreCardId === property.id ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Expandable detailed score bars (hidden by default) */}
                    {expandedScoreCardId === property.id && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/80 space-y-2 animate-in fade-in duration-150">
                        <div className="grid grid-cols-5 gap-1.5">
                          {breakdownBars.map((bar) => {
                            const val = Math.round(bar.score);
                            const barColor =
                              val >= 80 ? 'bg-emerald-500' : val >= 65 ? 'bg-blue-600' : 'bg-amber-500';
                            return (
                              <div key={bar.label} className="space-y-1">
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="text-slate-500 truncate">{bar.label}</span>
                                  <span className="font-bold text-slate-700">{val}</span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${barColor}`}
                                    style={{ width: `${Math.min(100, Math.max(8, val))}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Reasons & Warnings */}
                        <div className="space-y-1 text-xs pt-1">
                          {match.reasons.slice(0, 2).map((reason, rIdx) => (
                            <div key={rIdx} className="flex items-start gap-1.5 text-slate-700 leading-snug">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" />
                              <span>{reason}</span>
                            </div>
                          ))}
                          {match.warnings.slice(0, 1).map((warn, wIdx) => (
                            <div key={wIdx} className="flex items-start gap-1.5 text-amber-800 leading-snug">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                              <span>{warn}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Landlord Contact Section: Full on Selected Property, Compact on non-selected */}
                  {isSelected ? (
                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-blue-600" />
                          <span>Thông tin liên hệ chủ nhà & Khảo sát</span>
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Chính chủ xác thực
                        </span>
                      </div>
                      <LandlordContactCard
                        property={property}
                        contact={property.contact}
                        variant="full"
                      />
                    </div>
                  ) : (
                    <div className="mt-2.5 flex items-center justify-between text-xs sm:text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2 truncate">
                        <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="truncate">
                          Chủ nhà: <strong className="text-slate-900">{property.contact.name}</strong> •{' '}
                          <span className="font-mono text-slate-700 font-bold">{property.contact.phone}</span>
                        </span>
                      </div>
                      <span className="text-xs text-blue-600 font-bold shrink-0 ml-2">
                        Xem liên hệ &rarr;
                      </span>
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectProperty(property.id);
                        setActiveTab('twin');
                      }}
                      className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
                    >
                      <Box className="w-3.5 h-3.5" />
                      <span>Không gian 3D</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectProperty(property.id);
                        setActiveTab('location');
                      }}
                      className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5 text-blue-600" />
                      <span>Vị trí & Tiện ích</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCompareProperty(property.id);
                      }}
                      className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border font-semibold text-xs transition-colors ${
                        isCompared
                          ? 'bg-purple-50 border-purple-200 text-purple-700'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      {isCompared ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-purple-600" />
                          <span>Đã chọn</span>
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
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="px-4 py-2.5 bg-white border-t border-slate-200 flex items-center gap-2 text-xs text-slate-500">
          <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>
            Thông số mặt bằng và toạ độ mô phỏng đô thị thực tế tại Hà Nội.
          </span>
        </div>
      </aside>

      {/* Center / Right Interactive 3D Map */}
      <main className={`relative flex-1 h-full ${mobileView === 'list' ? 'hidden md:block' : 'block'}`}>
        {sidebarCollapsed && (
          <button
            type="button"
            onClick={() => setSidebarCollapsed(false)}
            className="hidden md:flex absolute top-16 left-3 z-30 items-center gap-1.5 px-3 py-2 rounded-xl bg-white/95 hover:bg-white border border-slate-200 text-xs font-semibold text-slate-800 shadow-md backdrop-blur-md transition-all"
          >
            <PanelLeftOpen className="w-4 h-4 text-blue-600" />
            <span>Mở danh sách mặt bằng ({scoredAndFilteredProperties.length})</span>
          </button>
        )}

        <InteractiveMap mode="discovery" filteredProperties={filteredPropertyItems} />
      </main>

      {/* Mobile Floating Segmented Switcher: List vs Map */}
      <div className="md:hidden fixed bottom-14 left-1/2 -translate-x-1/2 z-40 flex items-center rounded-full bg-slate-900/90 p-1 text-white shadow-xl backdrop-blur-md">
        <button
          type="button"
          onClick={() => setMobileView('list')}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
            mobileView === 'list'
              ? 'bg-white text-slate-900 shadow'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Danh sách ({scoredAndFilteredProperties.length})</span>
        </button>
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
      </div>
    </div>
  );
}

export default DiscoveryView;
