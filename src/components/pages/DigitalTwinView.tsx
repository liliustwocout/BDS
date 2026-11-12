'use client';

import React, { useState, useMemo } from 'react';
import {
  Box,
  Layers,
  Compass,
  Footprints,
  LayoutGrid,
  Building2,
  Maximize2,
  Columns,
  Armchair,
  Ruler,
  RotateCcw,
  X,
  Check,
  MapPin,
  Sparkles,
  ArrowRight,
  Info,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import { useSpaceVisionStore } from '@/store/useSpaceVisionStore';
import { CameraMode, RoomGeometry, FloorSpec } from '@/types';
import { BUSINESS_TYPE_META, DESIGN_STYLE_META } from '@/lib/aiEngine';
import { BuildingDigitalTwin } from '@/components/three/BuildingDigitalTwin';
import { FloorPlan2D } from '@/components/three/FloorPlan2D';

const CAMERA_MODES: {
  id: CameraMode;
  label: string;
  shortLabel: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'orbit',
    label: 'Orbit 360°',
    shortLabel: 'Orbit',
    desc: 'Xoay tự do quanh tòa nhà và bối cảnh đường phố',
    icon: Compass,
  },
  {
    id: 'walkthrough',
    label: 'Walkthrough',
    shortLabel: 'Walkthrough',
    desc: 'Tầm mắt người đi bộ bên trong không gian',
    icon: Footprints,
  },
  {
    id: 'dollhouse',
    label: 'Dollhouse',
    shortLabel: 'Dollhouse',
    desc: 'Mặt cắt phối cảnh bóc tách tầng',
    icon: Layers,
  },
  {
    id: 'floorplan',
    label: 'Top-down',
    shortLabel: 'Top-down',
    desc: 'Góc nhìn trực giao từ trên xuống',
    icon: LayoutGrid,
  },
  {
    id: 'exterior',
    label: 'Mặt tiền',
    shortLabel: 'Mặt tiền',
    desc: 'Góc nhìn trực diện mặt tiền từ lòng đường',
    icon: Building2,
  },
];

const ROOM_TYPE_META: Record<
  RoomGeometry['type'],
  { label: string; businessSuitability: string; badgeClass: string }
> = {
  retail: {
    label: 'Khu vực Bán lẻ / Trưng bày',
    businessSuitability: 'Rất phù hợp: Showroom thời trang, cửa hàng bán lẻ, khu đón tiếp khách',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  service_counter: {
    label: 'Quầy Dịch vụ / Pha chế',
    businessSuitability: 'Rất phù hợp: Quầy bar café, quầy thu ngân, quầy tiếp đón dịch vụ',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  workspace: {
    label: 'Không gian Làm việc / Bàn ghế khách',
    businessSuitability: 'Rất phù hợp: Bàn làm việc nhóm, khu ghế café, văn phòng mở',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  private_room: {
    label: 'Phòng Riêng / VIP / Trị liệu',
    businessSuitability: 'Rất phù hợp: Phòng họp kín, phòng spa / chăm sóc sắc đẹp, văn phòng giám đốc',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  multipurpose: {
    label: 'Không gian Đa năng',
    businessSuitability: 'Rất phù hợp: Studio sáng tạo, phòng hội thảo nhỏ, khu trưng bày linh hoạt',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
  },
  storage: {
    label: 'Kho Lưu trữ / Kỹ thuật',
    businessSuitability: 'Phù hợp: Kho nguyên vật liệu, phòng máy chủ, phòng phụ trợ',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  wc: {
    label: 'Khu Vệ sinh (WC)',
    businessSuitability: 'Hệ thống vệ sinh tiện ích hoàn chỉnh, thông gió kỹ thuật',
    badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-200',
  },
  utility: {
    label: 'Khu Phụ trợ / M&E',
    businessSuitability: 'Tủ điện kỹ thuật, cấp thoát nước, điều hòa trung tâm',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  hallway: {
    label: 'Sảnh & Hành lang di chuyển',
    businessSuitability: 'Lối lưu thông chính giữa các phòng và cầu thang bộ',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  balcony: {
    label: 'Ban công / Logia thoáng',
    businessSuitability: 'Không gian mở ngoài trời, đón ánh sáng tự nhiên',
    badgeClass: 'bg-lime-50 text-lime-800 border-lime-200',
  },
};

export function DigitalTwinView() {
  const {
    properties,
    selectedPropertyId,
    selectedFloor,
    selectedRoomId,
    cameraMode,
    showFurniture,
    showDimensions,
    view2D3DMode,
    selectedBusinessType,
    selectedDesignStyle,
    furnitureItems,
    selectedFurnitureId,
    setSelectedFloor,
    setSelectedRoomId,
    setCameraMode,
    setShowFurniture,
    setShowDimensions,
    setView2D3DMode,
    setActiveTab,
    selectFurnitureItem,
  } = useSpaceVisionStore();

  const [resetCounter, setResetCounter] = useState(0);

  const property = useMemo(
    () => properties.find((p) => p.id === selectedPropertyId) || properties[0],
    [properties, selectedPropertyId]
  );

  const allRooms = useMemo(() => {
    if (!property) return [];
    return property.floors.flatMap((f) => f.rooms);
  }, [property]);

  const selectedRoom = useMemo(() => {
    if (!selectedRoomId) return null;
    return allRooms.find((r) => r.id === selectedRoomId) || null;
  }, [allRooms, selectedRoomId]);

  const activeFloorSpec: FloorSpec | null = useMemo(() => {
    if (!property) return null;
    if (selectedFloor === 'all') {
      if (selectedRoom) {
        return property.floors.find((f) => f.level === selectedRoom.floor) || property.floors[0];
      }
      return property.floors[0];
    }
    return property.floors.find((f) => f.level === selectedFloor) || property.floors[0];
  }, [property, selectedFloor, selectedRoom]);

  const roomFurniture = useMemo(() => {
    if (!selectedRoom) return [];
    return furnitureItems.filter(
      (item) => item.visible && (item.roomId === selectedRoom.id || item.floor === selectedRoom.floor)
    );
  }, [furnitureItems, selectedRoom]);

  const handleResetCamera = () => {
    setCameraMode('orbit');
    setSelectedFloor('all');
    setSelectedRoomId(null);
    selectFurnitureItem(null);
    setResetCounter((c) => c + 1);
  };

  if (!property) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 text-slate-500">
        Đang tải mô hình không gian...
      </div>
    );
  }

  const businessMeta = BUSINESS_TYPE_META?.[selectedBusinessType];
  const styleMeta = DESIGN_STYLE_META?.[selectedDesignStyle];

  return (
    <div className="relative flex h-[calc(100vh-3.5rem)] w-full overflow-hidden bg-slate-100 text-slate-900">
      {/* 80%+ HERO 3D / 2D VIEWPORT */}
      <div className="relative flex-1 flex flex-col h-full overflow-hidden">
        {/* TOP FLOATING ARCHITECTURAL TOOLBAR (Clean Minimalist White Capsules) */}
        <div className="pointer-events-none absolute top-3 left-3 right-3 z-20 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1">
          {/* Camera Modes Pill */}
          <div className="pointer-events-auto flex shrink-0 items-center gap-1 rounded-xl border border-slate-200/90 bg-white/90 p-1 shadow-sm backdrop-blur-md">
            {CAMERA_MODES.map((mode) => {
              const Icon = mode.icon;
              const active = cameraMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setCameraMode(mode.id)}
                  title={mode.desc}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                    active
                      ? 'bg-slate-900 text-white font-semibold shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden lg:inline">{mode.label}</span>
                  <span className="lg:hidden">{mode.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* View Mode Switcher (3D Twin / 2D Blueprint / Split) */}
          <div className="pointer-events-auto flex shrink-0 items-center gap-1 rounded-xl border border-slate-200/90 bg-white/90 p-1 shadow-sm backdrop-blur-md">
            <button
              onClick={() => setView2D3DMode('3d')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                view2D3DMode === '3d'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Box className="h-3.5 w-3.5" />
              <span>3D Twin</span>
            </button>
            <button
              onClick={() => setView2D3DMode('2d')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                view2D3DMode === '2d'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>2D Blueprint</span>
            </button>
            <button
              onClick={() => setView2D3DMode('split')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                view2D3DMode === 'split'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Columns className="h-3.5 w-3.5" />
              <span>Split 2D + 3D</span>
            </button>
          </div>

          {/* Feature Toggles & Reset Camera */}
          <div className="pointer-events-auto flex shrink-0 items-center gap-1 rounded-xl border border-slate-200/90 bg-white/90 p-1 shadow-sm backdrop-blur-md">
            <button
              onClick={() => setShowFurniture(!showFurniture)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                showFurniture
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Bật/tắt hiển thị nội thất"
            >
              <Armchair className="h-3.5 w-3.5 text-slate-700" />
              <span>Nội thất</span>
            </button>

            <button
              onClick={() => setShowDimensions(!showDimensions)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                showDimensions
                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Bật/tắt đường gióng kích thước (m)"
            >
              <Ruler className="h-3.5 w-3.5 text-slate-700" />
              <span>Kích thước</span>
            </button>

            <button
              onClick={handleResetCamera}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
              title="Đặt lại góc nhìn camera"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* FLOATING BOTTOM BAR: FLOOR SELECTOR DOCK (Clean White Capsule) */}
        <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3">
          {/* Horizontal Floor Selector: "Toàn bộ toà nhà", "Tầng 1", "Tầng 2", "Tầng 3" */}
          <div className="pointer-events-auto flex items-center gap-1.5 rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 shadow-md backdrop-blur-md">
            <button
              onClick={() => setSelectedFloor('all')}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                selectedFloor === 'all'
                  ? 'bg-slate-900 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              Toàn bộ toà nhà
            </button>

            {property.floors.map((floor) => {
              const isSelected = selectedFloor === floor.level;
              return (
                <button
                  key={floor.level}
                  onClick={() => setSelectedFloor(floor.level)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white font-semibold shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>Tầng {floor.level}</span>
                  <span className="text-[10px] text-slate-400">({floor.totalArea}m²)</span>
                </button>
              );
            })}
          </div>

          {/* Right Status Pill / Model Notice */}
          <div className="pointer-events-auto hidden md:flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-1.5 text-xs text-slate-600 shadow-sm backdrop-blur-md">
            <ShieldAlert className="h-3.5 w-3.5 text-slate-500" />
            <span>Mô hình không gian 3D tương tác • Nhấp vào phòng để xem thông số chi tiết</span>
          </div>
        </div>

        {/* 3D / 2D VIEWPORT AREA */}
        <div className="relative flex-1 w-full h-full flex overflow-hidden">
          {view2D3DMode === '3d' && (
            <div className="relative w-full h-full">
              <BuildingDigitalTwin
                property={property}
                mode="twin"
                resetTrigger={resetCounter}
              />
            </div>
          )}

          {view2D3DMode === '2d' && (
            <div className="relative w-full h-full bg-slate-50">
              <FloorPlan2D
                property={property}
                floorLevel={selectedFloor === 'all' ? activeFloorSpec?.level || 1 : selectedFloor}
                editable={false}
              />
            </div>
          )}

          {view2D3DMode === 'split' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 w-full h-full divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
              <div className="relative w-full h-full overflow-hidden">
                <BuildingDigitalTwin
                  property={property}
                  mode="twin"
                  resetTrigger={resetCounter}
                />
                <div className="pointer-events-none absolute bottom-16 left-3 rounded-lg bg-white/90 border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-800 shadow-sm backdrop-blur-sm">
                  3D Digital Twin
                </div>
              </div>
              <div className="relative w-full h-full overflow-hidden bg-slate-50">
                <FloorPlan2D
                  property={property}
                  floorLevel={selectedFloor === 'all' ? activeFloorSpec?.level || 1 : selectedFloor}
                  editable={false}
                />
                <div className="pointer-events-none absolute bottom-16 left-3 rounded-lg bg-white/90 border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-800 shadow-sm backdrop-blur-sm">
                  2D Architectural Blueprint
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SLIDE-OUT ROOM INSPECTOR (Appears seamlessly when a room is clicked) */}
      {selectedRoom && (
        <aside className="absolute inset-y-0 right-0 sm:relative w-full sm:w-[380px] lg:w-[410px] shrink-0 border-l border-slate-200 bg-white flex flex-col h-full shadow-xl z-30 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="inline-flex items-center rounded-md bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[11px] font-semibold text-blue-800">
                Tầng {selectedRoom.floor} • Chi tiết phòng
              </span>
              <button
                onClick={() => setSelectedRoomId(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                title="Đóng thông tin phòng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">{selectedRoom.name}</h2>
            <div className="mt-1 text-xs text-slate-500">
              Công trình: <span className="font-medium text-slate-700">{property.title}</span>
            </div>
          </div>

          {/* Inspector Content */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {/* Quick Geometric Metrics */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center">
                <div className="text-[10px] font-medium text-slate-500">Diện tích thông thủy</div>
                <div className="text-base font-bold text-blue-600 mt-0.5">{selectedRoom.area} m²</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center">
                <div className="text-[10px] font-medium text-slate-500">Kích thước (R×S)</div>
                <div className="text-sm font-bold text-slate-800 mt-0.5">
                  {selectedRoom.width}×{selectedRoom.depth}m
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center">
                <div className="text-[10px] font-medium text-slate-500">Chiều cao trần</div>
                <div className="text-base font-bold text-slate-800 mt-0.5">{selectedRoom.height} m</div>
              </div>
            </div>

            {/* Phù hợp mô hình kinh doanh */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
              <div className="text-xs font-semibold text-slate-700">Công năng & Khuyến nghị kinh doanh</div>
              <span
                className={`inline-block rounded-md border px-2.5 py-1 text-xs font-medium ${
                  ROOM_TYPE_META[selectedRoom.type]?.badgeClass || 'bg-slate-100 text-slate-800'
                }`}
              >
                {ROOM_TYPE_META[selectedRoom.type]?.label || selectedRoom.type}
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                {ROOM_TYPE_META[selectedRoom.type]?.businessSuitability}
              </p>
            </div>

            {/* Hạ tầng kỹ thuật */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700">Đặc điểm kỹ thuật phòng</div>
              <div className="grid grid-cols-1 gap-1.5">
                {selectedRoom.features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 shadow-2xs"
                  >
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Nội thất hiện tại */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Nội thất bố trí ({roomFurniture.length} món)</span>
                <span className="text-[10px] font-normal text-slate-500">
                  Phong cách: {styleMeta?.label || selectedDesignStyle}
                </span>
              </div>
              {roomFurniture.length > 0 ? (
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                  {roomFurniture.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => selectFurnitureItem(item.id)}
                      className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs cursor-pointer transition-colors ${
                        selectedFurnitureId === item.id
                          ? 'bg-blue-50 border border-blue-300 text-blue-900 font-medium'
                          : 'bg-slate-50 border border-slate-200/80 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate">{item.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                        {item.dimensions[0]}×{item.dimensions[2]}m
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 p-2.5 text-center text-xs text-slate-400">
                  Chưa có nội thất bố trí tại phòng này.
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action Footer with CTA */}
          <div className="border-t border-slate-200 p-4 bg-slate-50/50 space-y-2">
            <button
              onClick={() => setActiveTab('studio')}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-all"
            >
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>Setup phòng này trong AI Studio</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSelectedRoomId(null)}
              className="w-full text-center py-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              Đóng và tiếp tục xem toàn cảnh
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}

export default DigitalTwinView;
