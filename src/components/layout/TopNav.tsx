'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Compass,
  MapPin,
  Box,
  SunMedium,
  Sparkles,
  Scale,
  ChevronDown,
  ShieldCheck,
  Database,
  Cpu,
  UserCheck,
  Building2,
  Info,
  X,
  Check,
  Layers,
  Search,
  Menu,
} from 'lucide-react';
import { ActiveTab, BusinessType } from '@/types';
import { useSpaceVisionStore } from '@/store/useSpaceVisionStore';
import { BUSINESS_TYPE_META } from '@/lib/aiEngine';

export interface NavTabConfig {
  id: ActiveTab;
  step: string;
  label: string;
  shortLabel: string;
  shortcut: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export const NAV_TABS: NavTabConfig[] = [
  {
    id: 'landing',
    step: '00',
    label: 'Trang chủ',
    shortLabel: 'Trang chủ',
    shortcut: 'Alt+0',
    icon: Building2,
    description: 'Cổng thông tin bất động sản thương mại & tìm kiếm',
  },
  {
    id: 'discovery',
    step: '01',
    label: 'Tìm kiếm & Đề xuất',
    shortLabel: 'Tìm kiếm',
    shortcut: 'Alt+1',
    icon: Search,
    description: 'Tìm kiếm mặt bằng theo nhu cầu & chấm điểm AI',
  },
  {
    id: 'location',
    step: '02',
    label: 'Bản đồ 3D toà nhà',
    shortLabel: 'Bản đồ 3D',
    shortcut: 'Alt+2',
    icon: MapPin,
    description: 'Bản đồ toà nhà 3D, tiện ích xung quanh & định tuyến thực tế OSRM',
  },
  {
    id: 'twin',
    step: '03',
    label: 'Không gian 3D',
    shortLabel: '3D Twin',
    shortcut: 'Alt+3',
    icon: Box,
    description: 'Digital Twin 3D tương tác, mặt bằng 2D & thông số kỹ thuật',
  },
  {
    id: 'environment',
    step: '04',
    label: 'Ánh sáng & Môi trường',
    shortLabel: 'Ánh sáng',
    shortcut: 'Alt+4',
    icon: SunMedium,
    description: 'Mô phỏng quỹ đạo mặt trời, ánh sáng tự nhiên theo giờ & thời tiết',
  },
  {
    id: 'studio',
    step: '05',
    label: 'Thiết kế Setup',
    shortLabel: 'Thiết kế',
    shortcut: 'Alt+5',
    icon: Sparkles,
    description: 'Bố trí nội thất AI theo ngành nghề & dự toán chi phí đầu tư',
  },
  {
    id: 'comparison',
    step: '06',
    label: 'So sánh',
    shortLabel: 'So sánh',
    shortcut: 'Alt+6',
    icon: Scale,
    description: 'So sánh đa mặt bằng & xuất báo cáo phân tích đầu tư',
  },
];

export const TopNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    properties,
    selectedPropertyId,
    selectProperty,
    comparedPropertyIds,
    selectedBusinessType,
    setSelectedBusinessType,
  } = useSpaceVisionStore();

  const [propertyDropdownOpen, setPropertyDropdownOpen] = useState(false);
  const [businessDropdownOpen, setBusinessDropdownOpen] = useState(false);
  const [provenanceOpen, setProvenanceOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const propDropdownRef = useRef<HTMLDivElement>(null);
  const bizDropdownRef = useRef<HTMLDivElement>(null);

  const selectedProperty =
    properties.find((p) => p.id === selectedPropertyId) || properties[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        propDropdownRef.current &&
        !propDropdownRef.current.contains(e.target as Node)
      ) {
        setPropertyDropdownOpen(false);
      }
      if (
        bizDropdownRef.current &&
        !bizDropdownRef.current.contains(e.target as Node)
      ) {
        setBusinessDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const businessMeta = BUSINESS_TYPE_META[selectedBusinessType];

  return (
    <>
      <header className="no-print sticky top-0 z-40 h-16 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <div className="mx-auto flex h-full max-w-[1920px] items-center justify-between gap-2 px-3 lg:px-6">
          {/* Left: Brand Identity + Active Property Switcher */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('landing')}
              className="group flex items-center gap-2.5 text-left focus:outline-none"
              title="Về Trang chủ SpaceVision"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm transition group-hover:bg-slate-800">
                <Layers className="h-5 w-5 text-white transition-transform group-hover:scale-105" />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold tracking-tight text-slate-900">
                    SpaceVision
                  </span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-700 border border-slate-200">
                    BĐS 3D
                  </span>
                </div>
                <p className="text-[10px] font-medium tracking-wide text-slate-500">
                  Commercial Real Estate
                </p>
              </div>
            </button>

            <div className="hidden h-6 w-[1px] bg-slate-200 md:block" />

            {/* Active Property Quick-Switcher Dropdown */}
            {selectedProperty && (
              <div className="relative" ref={propDropdownRef}>
                <button
                  onClick={() => setPropertyDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-left transition hover:border-slate-300 hover:bg-slate-100/80"
                  title="Chuyển đổi nhanh mặt bằng đang khảo sát"
                >
                  <Building2 className="h-4 w-4 shrink-0 text-slate-600" />
                  <div className="max-w-[140px] xl:max-w-[200px]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold text-slate-900">
                        {selectedProperty.code}
                      </span>
                      <span className="truncate text-xs font-semibold text-slate-800">
                        {selectedProperty.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <span>{selectedProperty.district}</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-semibold">
                        {selectedProperty.monthlyRentMillionVND} tr/th
                      </span>
                      <span>•</span>
                      <span>{selectedProperty.totalAreaSqm}m²</span>
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-slate-500 transition-transform ${
                      propertyDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {propertyDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50">
                    <div className="mb-1.5 flex items-center justify-between px-2 py-1 border-b border-slate-100">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Chọn mặt bằng khảo sát ({properties.length})
                      </span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 border border-slate-200">
                        Tọa độ thực Hà Nội
                      </span>
                    </div>
                    <div className="max-h-80 space-y-1 overflow-y-auto pr-1">
                      {properties.map((prop) => {
                        const isSelected = prop.id === selectedProperty.id;
                        return (
                          <button
                            key={prop.id}
                            onClick={() => {
                              selectProperty(prop.id);
                              setPropertyDropdownOpen(false);
                            }}
                            className={`flex w-full items-start justify-between gap-2 rounded-lg p-2 text-left transition ${
                              isSelected
                                ? 'bg-slate-100 border border-slate-300 font-semibold'
                                : 'hover:bg-slate-50 border border-transparent'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] font-bold text-slate-900">
                                  {prop.code}
                                </span>
                                <span className="truncate text-xs font-semibold text-slate-900">
                                  {prop.title}
                                </span>
                              </div>
                              <p className="truncate text-[11px] text-slate-500 mt-0.5">
                                {prop.address}
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-600">
                                <span className="text-emerald-700 font-semibold">
                                  {prop.monthlyRentMillionVND} triệu/tháng
                                </span>
                                <span>•</span>
                                <span>
                                  {prop.totalAreaSqm}m² ({prop.floorsCount} tầng)
                                </span>
                                <span>•</span>
                                <span>Mặt tiền {prop.frontageMeters}m</span>
                              </div>
                            </div>
                            {isSelected && (
                              <Check className="h-4 w-4 shrink-0 text-slate-900 mt-1" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Center: Clean Architectural Navigation Tabs (Desktop) */}
          <nav
            aria-label="SpaceVision Navigation"
            className="hidden lg:flex items-center gap-1 overflow-x-auto py-1 no-scrollbar"
          >
            {NAV_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isComparison = tab.id === 'comparison';

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  title={`${tab.label} (${tab.shortcut}) — ${tab.description}`}
                  className={`group relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-900 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-800'
                    }`}
                  />
                  <span className="hidden xl:inline">{tab.label}</span>
                  <span className="inline xl:hidden">{tab.shortLabel}</span>

                  {isComparison && comparedPropertyIds.length > 0 && (
                    <span
                      className={`ml-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 font-mono text-[10px] font-bold ${
                        isActive
                          ? 'bg-white text-slate-900'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {comparedPropertyIds.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Active Business Model Quick Selector, Data Provenance & Mobile Menu Toggle */}
          <div className="flex items-center gap-2">
            {/* Business Model Selector Pill */}
            <div className="relative hidden xl:block" ref={bizDropdownRef}>
              <button
                onClick={() => setBusinessDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 transition hover:border-slate-300 hover:bg-slate-100"
                title="Mô hình kinh doanh mục tiêu"
              >
                <span className="text-[10px] font-medium text-slate-500">
                  Mô hình:
                </span>
                <span className="font-semibold text-slate-900">
                  {businessMeta?.labelVi || selectedBusinessType}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
              </button>

              {businessDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl z-50">
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 mb-1">
                    Mô hình kinh doanh mục tiêu
                  </div>
                  {(Object.keys(BUSINESS_TYPE_META) as BusinessType[]).map(
                    (bType) => {
                      const meta = BUSINESS_TYPE_META[bType];
                      const active = bType === selectedBusinessType;
                      return (
                        <button
                          key={bType}
                          onClick={() => {
                            setSelectedBusinessType(bType);
                            setBusinessDropdownOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                            active
                              ? 'bg-slate-100 text-slate-900 font-semibold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <div>{meta.labelVi}</div>
                            <div className="text-[10px] text-slate-500">
                              Diện tích chuẩn: {meta.defaultAreaRange[0]}–
                              {meta.defaultAreaRange[1]}m²
                            </div>
                          </div>
                          {active && <Check className="h-3.5 w-3.5 text-slate-900" />}
                        </button>
                      );
                    }
                  )}
                </div>
              )}
            </div>

            {/* Data Provenance Legend Trigger */}
            <button
              onClick={() => setProvenanceOpen(true)}
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
              title="Xem chú giải Minh bạch Nguồn Dữ liệu"
            >
              <ShieldCheck className="h-4 w-4 text-slate-600" />
              <span className="hidden md:inline">Nguồn dữ liệu</span>
            </button>

            {/* Mobile / Tablet Menu Button */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="flex items-center justify-center p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 lg:hidden"
              aria-label="Mở menu điều hướng"
              title="Mở danh mục điều hướng"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Drawer Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-200 bg-white/98 px-4 py-3 shadow-xl backdrop-blur-md">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pb-3 border-b border-slate-100">
              {NAV_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 rounded-lg p-2 text-left text-xs transition ${
                      isActive
                        ? 'bg-slate-900 text-white font-bold'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-600'}`} />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Mô hình kinh doanh:</span>
              <select
                value={selectedBusinessType}
                onChange={(e) => setSelectedBusinessType(e.target.value as BusinessType)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-800"
              >
                {(Object.keys(BUSINESS_TYPE_META) as BusinessType[]).map((bType) => (
                  <option key={bType} value={bType}>
                    {BUSINESS_TYPE_META[bType].labelVi}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </header>

      {/* Data Provenance Modal */}
      {provenanceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  <h2 className="text-base font-bold text-slate-900">
                    Minh bạch Nguồn Dữ liệu & Tiêu chuẩn Khảo sát
                  </h2>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  SpaceVision phân tách rõ ràng giữa dữ liệu địa lý toạ độ thực tế, dữ liệu mô hình mặt bằng minh họa và các đề xuất tối ưu từ AI.
                </p>
              </div>
              <button
                onClick={() => setProvenanceOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Dữ liệu Toạ độ Thực tế
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-700">
                  Tọa độ bản đồ Hà Nội (MapLibre/OpenStreetMap), khối toà nhà 3D xung quanh, định tuyến đường đi thực tế qua OSRM API và thuật toán vị trí Mặt Trời thiên văn theo vĩ độ 21.0285°N.
                </p>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                    Mô hình Mặt bằng Minh hoạ
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-700">
                  6 hồ sơ mặt bằng thương mại và cấu trúc 3D Digital Twin / 2D SVG là dữ liệu minh họa chuẩn hóa kỹ thuật, gắn trên tọa độ khu vực thực tế tại Hà Nội.
                </p>
              </div>

              <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-3.5">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-sky-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-800">
                    Ước tính & Đề xuất AI
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-700">
                  Điểm mức độ phù hợp ngành nghề, phân tích đối tượng khách hàng, gợi ý phương án bố trí nội thất 3D và bảng dự toán chi phí đầu tư kèm giả định minh bạch.
                </p>
              </div>

              <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3.5">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-800">
                    Tuỳ chỉnh Người dùng
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-700">
                  Các bộ lọc ngân sách, diện tích, mô hình kinh doanh, phong cách thiết kế và vị trí nội thất do người dùng trực tiếp điều chỉnh trong studio.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 flex items-start gap-2.5">
              <Info className="h-4 w-4 shrink-0 text-slate-600 mt-0.5" />
              <div>
                <strong className="text-slate-800">Lưu ý chuyên môn:</strong>{' '}
                Hệ thống tập trung vào tính trực quan và khả thi sơ bộ. Các yêu cầu về an toàn PCCC, lối thoát hiểm, tải trọng sàn và giấy phép xây dựng/kinh doanh cần được thẩm định thực tế bởi kỹ sư chuyên môn trước khi ký kết.
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setProvenanceOpen(false)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TopNav;
