'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  MapPin,
  Building2,
  Box,
  Compass,
  ArrowRight,
  SunMedium,
  CheckCircle2,
  Maximize2,
  Layers,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Phone,
  MessageSquare,
  DollarSign,
  UserCheck,
  HelpCircle,
} from 'lucide-react';
import { useSpaceVisionStore } from '@/store/useSpaceVisionStore';
import { BusinessType, PropertyItem } from '@/types';
import { LandlordContactModal } from '@/components/common/LandlordContactCard';

// Curated filter categories for quick chips
type QuickCategory = 'all' | 'fnb' | 'office' | 'retail' | 'spa';

const QUICK_FILTERS: { id: QuickCategory; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'fnb', label: 'Cà phê & F&B' },
  { id: 'office', label: 'Văn phòng & Coworking' },
  { id: 'retail', label: 'Bán lẻ & Showroom' },
  { id: 'spa', label: 'Spa & Thẩm mỹ' },
];

const DISTRICT_OPTIONS = [
  { id: 'all', label: 'Tất cả quận' },
  { id: 'Cầu Giấy', label: 'Quận Cầu Giấy' },
  { id: 'Đống Đa', label: 'Quận Đống Đa' },
  { id: 'Ba Đình', label: 'Quận Ba Đình' },
  { id: 'Hoàn Kiếm', label: 'Quận Hoàn Kiếm' },
  { id: 'Hai Bà Trưng', label: 'Quận Hai Bà Trưng' },
  { id: 'Tây Hồ', label: 'Quận Tây Hồ' },
];

const BIZ_OPTIONS: { id: string; label: string; bizType?: BusinessType }[] = [
  { id: 'all', label: 'Tất cả mô hình kinh doanh' },
  { id: 'coffee_shop', label: 'Quán Cà phê / Trà sữa', bizType: 'coffee_shop' },
  { id: 'restaurant', label: 'Nhà hàng ẩm thực', bizType: 'restaurant' },
  { id: 'office', label: 'Văn phòng công ty', bizType: 'office' },
  { id: 'coworking', label: 'Coworking Space', bizType: 'coworking' },
  { id: 'fashion_retail', label: 'Cửa hàng Bán lẻ & Thời trang', bizType: 'fashion_retail' },
  { id: 'showroom', label: 'Showroom trưng bày', bizType: 'showroom' },
  { id: 'spa', label: 'Spa & Chăm sóc sắc đẹp', bizType: 'spa' },
  { id: 'convenience_store', label: 'Cửa hàng tiện lợi', bizType: 'convenience_store' },
];

const PRICE_OPTIONS = [
  { id: 'all', label: 'Mọi mức ngân sách', maxRent: 150 },
  { id: 'under_25', label: 'Dưới 25 triệu/tháng', maxRent: 25 },
  { id: '25_40', label: '25 – 40 triệu/tháng', maxRent: 40 },
  { id: '40_60', label: '40 – 60 triệu/tháng', maxRent: 60 },
  { id: 'over_60', label: 'Trên 60 triệu/tháng', maxRent: 150 },
];

// Architectural SVG preview for property card
const PropertyArchitecturalIllustration: React.FC<{
  property: PropertyItem;
  accentIndex: number;
}> = ({ property, accentIndex }) => {
  const gradients = [
    'from-slate-100 to-slate-200 border-slate-300',
    'from-sky-50 to-slate-100 border-sky-200',
    'from-blue-50 to-indigo-50 border-blue-200',
    'from-slate-50 to-amber-50/40 border-slate-200',
    'from-cyan-50 to-slate-100 border-cyan-200',
    'from-slate-100 to-emerald-50/40 border-slate-300',
  ];
  const borderGradient = gradients[accentIndex % gradients.length];

  return (
    <div
      className={`relative h-48 w-full overflow-hidden rounded-t-xl border-b bg-gradient-to-b ${borderGradient} p-4 flex flex-col justify-between`}
    >
      {/* Background Architectural Blueprint grid */}
      <div className="absolute inset-0 bg-blueprint-grid opacity-30" />

      {/* Top Badges */}
      <div className="relative z-10 flex items-center justify-between">
        <span className="rounded-md bg-white/90 px-2.5 py-1 font-mono text-xs font-semibold text-slate-800 shadow-sm border border-slate-200/80 backdrop-blur-sm">
          {property.code}
        </span>
        <span className="rounded-md bg-slate-900/85 px-2.5 py-1 text-[11px] font-medium text-white shadow-sm backdrop-blur-sm">
          {property.floorsCount} tầng • {property.totalAreaSqm} m²
        </span>
      </div>

      {/* Architectural Isometric Building Silhouette */}
      <div className="relative z-0 flex items-center justify-center my-auto py-2">
        <svg
          viewBox="0 0 160 80"
          className="h-20 w-auto text-slate-700/80 transition-transform duration-300 group-hover:scale-105"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Base ground plane */}
          <polygon
            points="80,10 145,40 80,75 15,40"
            fill="rgba(241, 245, 249, 0.8)"
            stroke="rgba(148, 163, 184, 0.6)"
            strokeWidth="1"
          />
          {/* Building Left Wall */}
          <polygon
            points="80,25 35,45 35,68 80,48"
            fill="rgba(226, 232, 240, 0.9)"
            stroke="currentColor"
          />
          {/* Building Right Wall */}
          <polygon
            points="80,25 125,45 125,68 80,48"
            fill="rgba(203, 213, 225, 0.95)"
            stroke="currentColor"
          />
          {/* Building Roof */}
          <polygon
            points="80,12 125,32 80,45 35,32"
            fill="rgba(248, 250, 252, 1)"
            stroke="currentColor"
          />
          {/* Architectural floor separation lines */}
          <line
            x1="35"
            y1="53"
            x2="80"
            y2="33"
            stroke="currentColor"
            strokeDasharray="2 2"
          />
          <line
            x1="80"
            y1="33"
            x2="125"
            y2="53"
            stroke="currentColor"
            strokeDasharray="2 2"
          />
          {/* Entrance facade */}
          <line x1="55" y1="58" x2="68" y2="52" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>

      {/* Bottom Architectural Specs Tag */}
      <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-600 font-medium">
        <span className="flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded border border-slate-200">
          <MapPin className="h-3 w-3 text-slate-500" />
          {property.district}
        </span>
        <span className="flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded border border-slate-200">
          <Compass className="h-3 w-3 text-slate-500" />
          {property.orientationLabel}
        </span>
      </div>
    </div>
  );
};

export const LandingPageView: React.FC = () => {
  const {
    properties,
    setActiveTab,
    searchFromLanding,
    exploreProperty3D,
    viewPropertyOnMap,
    openOnboardingGuide,
  } = useSpaceVisionStore();

  const [searchInput, setSearchInput] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedBizType, setSelectedBizType] = useState('all');
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [activeCategory, setActiveCategory] = useState<QuickCategory>('all');
  const [bookingProperty, setBookingProperty] = useState<PropertyItem | null>(null);

  // Filter properties for the grid based on category chip
  const filteredProperties = useMemo(() => {
    return properties.filter((prop) => {
      if (activeCategory === 'all') return true;
      if (activeCategory === 'fnb') {
        return (
          prop.suitableBusinesses.includes('coffee_shop') ||
          prop.suitableBusinesses.includes('restaurant')
        );
      }
      if (activeCategory === 'office') {
        return (
          prop.suitableBusinesses.includes('office') ||
          prop.suitableBusinesses.includes('coworking')
        );
      }
      if (activeCategory === 'retail') {
        return (
          prop.suitableBusinesses.includes('fashion_retail') ||
          prop.suitableBusinesses.includes('showroom') ||
          prop.suitableBusinesses.includes('convenience_store')
        );
      }
      if (activeCategory === 'spa') {
        return prop.suitableBusinesses.includes('spa');
      }
      return true;
    });
  }, [properties, activeCategory]);

  const handleExecuteSearch = (queryText?: string) => {
    const finalQuery = (queryText !== undefined ? queryText : searchInput).trim();
    const biz = selectedBizType !== 'all' ? (selectedBizType as BusinessType) : undefined;
    const dist = selectedDistrict !== 'all' ? selectedDistrict : undefined;
    searchFromLanding(finalQuery, biz, dist);
  };

  const handleOpen3DTwin = (propertyId: string) => {
    exploreProperty3D(propertyId);
  };

  const handleOpenLocationMap = (propertyId: string) => {
    viewPropertyOnMap(propertyId);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative border-b border-slate-200 bg-white pt-12 pb-16 md:pt-16 md:pb-20">
        <div className="absolute inset-0 bg-dot-grid opacity-35 pointer-events-none" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Top Architectural Badge & Help Guide Trigger */}
          <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100/90 px-3.5 py-1 text-xs font-semibold text-slate-800 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Hệ thống Khảo sát & Tối ưu Không gian Thương mại Hà Nội</span>
            </div>
            <button
              onClick={() => openOnboardingGuide()}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 py-1 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-100 hover:text-slate-900 transition"
              title="Xem hướng dẫn sử dụng từng bước"
            >
              <HelpCircle className="h-3.5 w-3.5 text-slate-600" />
              <span>Hướng dẫn sử dụng</span>
            </button>
          </div>

          {/* Main Headline */}
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl lg:text-[2.75rem] leading-[1.15]">
              Không gian thương mại & Mặt bằng kinh doanh đắc địa
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
              Khám phá bất động sản thương mại với công nghệ Bản đồ 3D Toà nhà, Digital Twin
              và Tư vấn tối ưu không gian kinh doanh trước khi thuê.
            </p>
          </div>

          {/* Central Real Estate Search Box */}
          <div className="mt-8 rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-4 shadow-xl shadow-slate-200/60">
            {/* Natural language idea input */}
            <div className="relative mb-3">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleExecuteSearch();
                }}
                placeholder="Nhập ý tưởng kinh doanh (VD: Mở quán cà phê 120m2 tại Cầu Giấy, ngân sách 30 triệu/tháng)..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400/20"
              />
            </div>

            {/* Quick selectors row & Action CTA */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-4">
              {/* Business Type selector */}
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                  Mô hình kinh doanh
                </label>
                <select
                  value={selectedBizType}
                  onChange={(e) => setSelectedBizType(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-slate-400 focus:outline-none"
                >
                  {BIZ_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* District selector */}
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                  Khu vực / Quận
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-slate-400 focus:outline-none"
                >
                  {DISTRICT_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Budget selector */}
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                  Ngân sách thuê/tháng
                </label>
                <select
                  value={selectedPrice}
                  onChange={(e) => setSelectedPrice(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-slate-400 focus:outline-none"
                >
                  {PRICE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Primary Search CTA */}
              <div className="flex items-end">
                <button
                  onClick={() => handleExecuteSearch()}
                  className="flex h-[38px] w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-bold text-white shadow transition hover:bg-slate-800 active:scale-[0.98]"
                >
                  <Search className="h-4 w-4" />
                  <span>Tìm kiếm & Đề xuất AI</span>
                </button>
              </div>
            </div>

            {/* Quick suggested searches */}
            <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
              <span className="font-medium text-slate-400">Gợi ý nhanh:</span>
              <button
                type="button"
                onClick={() => {
                  setSearchInput('Quán cà phê mặt tiền 5m Duy Tân Cầu Giấy');
                  handleExecuteSearch('Quán cà phê mặt tiền 5m Duy Tân Cầu Giấy');
                }}
                className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition"
              >
                Cà phê Duy Tân Cầu Giấy
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchInput('Văn phòng công ty Đống Đa 150m2');
                  handleExecuteSearch('Văn phòng công ty Đống Đa 150m2');
                }}
                className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition"
              >
                Văn phòng Đống Đa
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchInput('Showroom thời trang Hoàn Kiếm vỉa hè rộng');
                  handleExecuteSearch('Showroom thời trang Hoàn Kiếm vỉa hè rộng');
                }}
                className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition"
              >
                Showroom Hoàn Kiếm
              </button>

              <button
                type="button"
                onClick={() => openOnboardingGuide()}
                className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 transition underline underline-offset-2 decoration-slate-300"
              >
                <HelpCircle className="h-3 w-3 text-slate-500" />
                <span>Xem hướng dẫn 1 phút</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURED COMMERCIAL PROPERTIES SECTION */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-12 sm:pt-14">
        {/* Section Header & Filter Tabs */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Mặt bằng thương mại nổi bật tại Hà Nội
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Các toà nhà thương mại có đầy đủ mô hình toà nhà 3D, Digital Twin đa tầng và thông số kỹ thuật
            </p>
          </div>

          {/* Clean Quick Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {QUICK_FILTERS.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition ${
                  activeCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 6 Curated Property Cards Grid */}
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((prop, index) => (
            <div
              key={prop.id}
              className="group flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md hover:border-slate-300"
            >
              {/* Architectural Preview Render Box */}
              <PropertyArchitecturalIllustration
                property={prop}
                accentIndex={index}
              />

              {/* Property Details Body */}
              <div className="flex flex-1 flex-col p-4">
                {/* Title and Address */}
                <div className="min-h-[48px]">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                    {prop.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                    {prop.address}
                  </p>
                </div>

                {/* Decluttered 4 Key Metrics: Giá thuê, Diện tích, Mặt tiền, Số tầng */}
                <div className="my-3 grid grid-cols-2 gap-2 text-xs border-y border-slate-100 py-3">
                  {/* Metric 1: Giá thuê */}
                  <div className="rounded-lg bg-emerald-50/70 p-2 border border-emerald-100 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <DollarSign className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-500 font-medium">Giá thuê</div>
                      <div className="font-extrabold text-emerald-800 text-sm leading-tight truncate">
                        {prop.monthlyRentMillionVND}{' '}
                        <span className="text-[11px] font-semibold text-emerald-700">tr/th</span>
                      </div>
                    </div>
                  </div>

                  {/* Metric 2: Diện tích */}
                  <div className="rounded-lg bg-slate-50 p-2 border border-slate-100 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-500 font-medium">Diện tích</div>
                      <div className="font-bold text-slate-900 text-sm leading-tight truncate">
                        {prop.totalAreaSqm}{' '}
                        <span className="text-[11px] font-normal text-slate-500">m²</span>
                      </div>
                    </div>
                  </div>

                  {/* Metric 3: Mặt tiền */}
                  <div className="rounded-lg bg-slate-50 p-2 border border-slate-100 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      <Building2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-500 font-medium">Mặt tiền</div>
                      <div className="font-bold text-slate-900 text-sm leading-tight truncate">
                        {prop.frontageMeters}{' '}
                        <span className="text-[11px] font-normal text-slate-500">m</span>
                      </div>
                    </div>
                  </div>

                  {/* Metric 4: Số tầng */}
                  <div className="rounded-lg bg-slate-50 p-2 border border-slate-100 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-500 font-medium">Số tầng</div>
                      <div className="font-bold text-slate-900 text-sm leading-tight truncate">
                        {prop.floorsCount}{' '}
                        <span className="text-[11px] font-normal text-slate-500">tầng</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compact Landlord Contact Badge & Direct Action */}
                <div className="mb-3 flex items-center justify-between gap-1.5 p-2 rounded-lg bg-slate-50/90 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setBookingProperty(prop)}
                    className="flex items-center gap-1.5 min-w-0 text-left hover:text-blue-600 transition group/contact"
                    title="Nhấn để xem liên hệ chủ nhà & đặt lịch khảo sát"
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                      {prop.contact.name.slice(0, 1)}
                    </div>
                    <div className="truncate text-xs">
                      <span className="text-slate-500 text-[11px]">Liên hệ: </span>
                      <strong className="text-slate-800 font-semibold group-hover/contact:text-blue-600">
                        {prop.contact.name}
                      </strong>
                      <span className="text-slate-400 mx-1">•</span>
                      <span className="font-mono text-[11px] text-slate-600">{prop.contact.phone}</span>
                    </div>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={`tel:${prop.contact.phone.replace(/[^\d+]/g, '')}`}
                      title={`Gọi ${prop.contact.phone}`}
                      className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white transition shadow-xs"
                    >
                      <Phone className="w-3 h-3 text-emerald-400" />
                    </a>
                    <a
                      href={`https://zalo.me/${(prop.contact.zaloPhone || prop.contact.phone).replace(/[^\d+]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Nhắn Zalo"
                      className="p-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs"
                    >
                      <MessageSquare className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Handover incentive or Highlights */}
                {prop.contact.handoverOffer ? (
                  <div className="mb-3 rounded bg-amber-50/80 border border-amber-200/70 px-2.5 py-1 text-[11px] font-medium text-amber-900 line-clamp-1">
                    <span className="font-semibold text-amber-950">Ưu đãi:</span> {prop.contact.handoverOffer}
                  </div>
                ) : (
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {prop.tags.slice(0, 2).map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Buttons: 3D Twin & 3D Map */}
                <div className="mt-auto grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleOpen3DTwin(prop.id)}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2 px-2 text-xs font-semibold text-slate-800 hover:border-slate-300 hover:bg-slate-50 transition shadow-sm"
                  >
                    <Box className="h-3.5 w-3.5 text-slate-600" />
                    <span>Không gian 3D</span>
                  </button>

                  <button
                    onClick={() => handleOpenLocationMap(prop.id)}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 py-2 px-2 text-xs font-semibold text-white hover:bg-slate-800 transition shadow-sm"
                  >
                    <MapPin className="h-3.5 w-3.5 text-slate-200" />
                    <span>Bản đồ 3D</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. INTERACTIVE TECHNOLOGY HIGHLIGHTS */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Công nghệ Khảo sát & Đánh giá Mặt bằng Thương mại
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600">
              Quy trình số hoá toàn diện giúp nhà đầu tư và chủ thương hiệu đưa ra quyết định chính xác
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Card 1: 3D Buildings Map */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 transition hover:border-slate-300 hover:bg-slate-50">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <Building2 className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-900">
                Bản đồ 3D Toà nhà & Định vị
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Mô phỏng khối toà nhà 3D đô thị với góc nghiêng trực quan, phân tích đối thủ cạnh tranh trong bán kính và tính toán lộ trình đi bộ/xe máy thực tế.
              </p>
            </div>

            {/* Card 2: 3D Digital Twin */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 transition hover:border-slate-300 hover:bg-slate-50">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                <Box className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-900">
                3D Digital Twin & Mặt bằng 2D
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Khám phá cấu trúc đa tầng, bóc tách mặt bằng 2D chuẩn kỹ thuật, hiển thị diện tích phòng, chiều cao trần và các tiện ích kỹ thuật âm tường.
              </p>
            </div>

            {/* Card 3: Sunlight & Setup Simulation */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 transition hover:border-slate-300 hover:bg-slate-50">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <SunMedium className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-900">
                Mô phỏng Ánh sáng & Setup AI
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Mô phỏng hướng nắng chiếu vào mặt tiền theo từng giờ trong ngày tại tọa độ Hà Nội, gợi ý phương án bố trí nội thất và dự toán ngân sách chi tiết.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MINIMALIST FOOTER */}
      <footer className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-slate-200">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">SpaceVision</span>
              <span>— Commercial Real Estate Spatial Intelligence</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Dữ liệu toạ độ thực tế tại Hà Nội • Mô hình 3D chuẩn kiến trúc minh hoạ
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('discovery')}
              className="hover:text-slate-900 transition"
            >
              Tìm kiếm mặt bằng
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className="hover:text-slate-900 transition"
            >
              Bảng so sánh
            </button>
            <span>Hotline khảo sát: 0912.345.678</span>
          </div>
        </div>
      </footer>

      {/* Landlord Contact & Booking Viewing Modal */}
      {bookingProperty && (
        <LandlordContactModal
          isOpen={!!bookingProperty}
          onClose={() => setBookingProperty(null)}
          property={bookingProperty}
          contact={bookingProperty.contact}
        />
      )}
    </div>
  );
};

export default LandingPageView;
