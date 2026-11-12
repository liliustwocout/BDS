'use client';

import React, { useMemo, useState } from 'react';
import {
  Sparkles,
  RotateCcw,
  Palette,
  Armchair,
  Calculator,
  ShieldAlert,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Move,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Coffee,
  Utensils,
  Scissors,
  ShoppingBag,
  Store,
  Briefcase,
  Award,
  Users,
  Box,
  Grid,
  Columns,
  Ruler,
  ChevronRight,
  Info,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Check,
  Building2,
  Maximize2,
  Phone,
  MessageCircle,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  UserCheck,
} from 'lucide-react';
import {
  BusinessType,
  DesignStyle,
  FurnitureAssetType,
  FurnitureCategory,
  FurnitureItem,
  CameraMode,
} from '@/types';
import { useSpaceVisionStore } from '@/store/useSpaceVisionStore';
import {
  BUSINESS_TYPE_META,
  DESIGN_STYLE_META,
  generateLayoutPresets,
  calculateBudgetSummary,
} from '@/lib/aiEngine';
import { BuildingDigitalTwin } from '@/components/three/BuildingDigitalTwin';
import { FloorPlan2D } from '@/components/three/FloorPlan2D';

const BUSINESS_ICONS: Record<
  BusinessType,
  React.ComponentType<{ className?: string }>
> = {
  coffee_shop: Coffee,
  restaurant: Utensils,
  spa: Scissors,
  fashion_retail: ShoppingBag,
  convenience_store: Store,
  office: Briefcase,
  showroom: Award,
  coworking: Users,
};

const FURNITURE_CATEGORIES: {
  id: FurnitureCategory;
  label: string;
  badgeColor: string;
}[] = [
  {
    id: 'core',
    label: 'Quầy & Thiết bị chính',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  {
    id: 'seating',
    label: 'Bàn ghế khách',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 'work',
    label: 'Khu làm việc',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    id: 'storage',
    label: 'Kệ & Kho',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  {
    id: 'decor',
    label: 'Cây xanh & Decor',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  {
    id: 'signage',
    label: 'Biển hiệu & Đèn',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
  },
];

const FURNITURE_CATALOG: {
  assetType: FurnitureAssetType;
  name: string;
  category: FurnitureCategory;
  dimensions: [number, number, number];
  unitCostVND: number;
}[] = [
  {
    assetType: 'espresso_bar',
    name: 'Quầy Pha Chế & Máy Espresso',
    category: 'core',
    dimensions: [2.8, 1.1, 0.9],
    unitCostVND: 68_000_000,
  },
  {
    assetType: 'counter',
    name: 'Quầy Thu Ngân & POS',
    category: 'core',
    dimensions: [1.8, 1.05, 0.75],
    unitCostVND: 18_500_000,
  },
  {
    assetType: 'reception',
    name: 'Quầy Lễ Tân Đón Khách',
    category: 'core',
    dimensions: [2.0, 1.1, 0.75],
    unitCostVND: 22_000_000,
  },
  {
    assetType: 'table_2',
    name: 'Bộ Bàn Đôi (2 Khách)',
    category: 'seating',
    dimensions: [0.8, 0.75, 0.8],
    unitCostVND: 4_200_000,
  },
  {
    assetType: 'table_4',
    name: 'Bộ Bàn Nhóm (4 Khách)',
    category: 'seating',
    dimensions: [1.4, 0.75, 0.85],
    unitCostVND: 7_800_000,
  },
  {
    assetType: 'lounge_sofa',
    name: 'Sofa Lounge & Bàn Trà',
    category: 'seating',
    dimensions: [2.1, 0.85, 0.95],
    unitCostVND: 16_500_000,
  },
  {
    assetType: 'work_desk',
    name: 'Cụm Bàn Làm Việc / Co-working',
    category: 'work',
    dimensions: [2.4, 0.75, 1.2],
    unitCostVND: 12_000_000,
  },
  {
    assetType: 'spa_bed',
    name: 'Giường Trị Liệu Spa & Rèm',
    category: 'core',
    dimensions: [2.0, 0.8, 0.85],
    unitCostVND: 14_500_000,
  },
  {
    assetType: 'display_island',
    name: 'Đảo Trưng Bày Sản Phẩm Trung Tâm',
    category: 'storage',
    dimensions: [2.2, 0.95, 1.1],
    unitCostVND: 19_000_000,
  },
  {
    assetType: 'shelf_rack',
    name: 'Hệ Kệ Trưng Bày Áp Tường',
    category: 'storage',
    dimensions: [2.0, 2.1, 0.45],
    unitCostVND: 11_500_000,
  },
  {
    assetType: 'storage_cabinet',
    name: 'Tủ Lưu Trữ Vật Tư & Kho',
    category: 'storage',
    dimensions: [1.5, 1.9, 0.55],
    unitCostVND: 9_200_000,
  },
  {
    assetType: 'plant_divider',
    name: 'Vách Cây Xanh Phân Khu',
    category: 'decor',
    dimensions: [1.6, 1.4, 0.45],
    unitCostVND: 4_800_000,
  },
  {
    assetType: 'lighting_pendant',
    name: 'Hệ Đèn Thả Trần Nghệ Thuật',
    category: 'signage',
    dimensions: [1.2, 0.5, 1.2],
    unitCostVND: 6_500_000,
  },
  {
    assetType: 'signage',
    name: 'Biển Hiệu LED Nhận Diện Thương Hiệu',
    category: 'signage',
    dimensions: [2.6, 0.7, 0.2],
    unitCostVND: 18_000_000,
  },
];

function formatVND(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(2)} tỷ ₫`;
  }
  return `${Math.round(amount / 1_000_000).toLocaleString('vi-VN')} triệu ₫`;
}

function formatFullVND(amount: number): string {
  return `${Math.round(amount).toLocaleString('vi-VN')} ₫`;
}

export const BusinessSetupView: React.FC = () => {
  const {
    properties,
    selectedPropertyId,
    selectedBusinessType,
    setSelectedBusinessType,
    selectedDesignStyle,
    setSelectedDesignStyle,
    selectedFloor,
    setSelectedFloor,
    selectedRoomId,
    cameraMode,
    setCameraMode,
    showFurniture,
    setShowFurniture,
    showDimensions,
    setShowDimensions,
    view2D3DMode,
    setView2D3DMode,
    activePresetId,
    selectLayoutPreset,
    furnitureItems,
    selectedFurnitureId,
    selectFurnitureItem,
    updateFurnitureItem,
    hiddenFurnitureCategories,
    toggleFurnitureCategory,
    resetStudioLayout,
    setActiveTab,
  } = useSpaceVisionStore();

  const [studioTab, setStudioTab] = useState<'concept' | 'furniture' | 'budget'>('concept');
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [showAdvancedTune, setShowAdvancedTune] = useState(false);

  const selectedProperty = useMemo(
    () => properties.find((p) => p.id === selectedPropertyId) || properties[0],
    [properties, selectedPropertyId]
  );

  const layoutPresets = useMemo(() => {
    if (!selectedProperty) return [];
    return generateLayoutPresets(
      selectedProperty,
      selectedBusinessType,
      selectedDesignStyle
    );
  }, [selectedProperty, selectedBusinessType, selectedDesignStyle]);

  const activePreset = useMemo(
    () => layoutPresets.find((p) => p.id === activePresetId) || layoutPresets[0],
    [layoutPresets, activePresetId]
  );

  const selectedFurniture = useMemo(
    () => furnitureItems.find((item) => item.id === selectedFurnitureId) || null,
    [furnitureItems, selectedFurnitureId]
  );

  // Filter furniture items for display in list
  const floorFilteredFurniture = useMemo(() => {
    return furnitureItems.filter((item) => {
      if (selectedFloor !== 'all' && item.floor !== selectedFloor) return false;
      return true;
    });
  }, [furnitureItems, selectedFloor]);

  // Visible furniture items for budget & spatial metrics
  const effectiveVisibleFurniture = useMemo(() => {
    return furnitureItems.filter(
      (item) => item.visible && !hiddenFurnitureCategories.includes(item.category)
    );
  }, [furnitureItems, hiddenFurnitureCategories]);

  // Budget calculation
  const budgetSummary = useMemo(() => {
    if (!selectedProperty) return null;
    return calculateBudgetSummary(
      selectedProperty,
      selectedBusinessType,
      selectedDesignStyle,
      effectiveVisibleFurniture
    );
  }, [selectedProperty, selectedBusinessType, selectedDesignStyle, effectiveVisibleFurniture]);

  // Spatial utilization & constraint verification
  const spatialAudit = useMemo(() => {
    if (!selectedProperty) {
      return {
        footprintSqm: 0,
        usableFloorSqm: 100,
        utilizationPct: 0,
        minAisleMeters: 1.4,
        doorwayClear: true,
        staircaseClear: true,
        estimatedCapacity: 24,
      };
    }

    const footprintSqm = effectiveVisibleFurniture.reduce((acc, item) => {
      const [w, , d] = item.dimensions;
      const [sx, , sz] = item.scale || [1, 1, 1];
      return acc + w * sx * (d * sz);
    }, 0);

    const usableFloorSqm = Math.max(selectedProperty.totalAreaSqm * 0.78, 30);
    const utilizationPct = Math.min(
      Math.round((footprintSqm / usableFloorSqm) * 100),
      95
    );

    // Check if any item is too close to front entrance
    const doorwayBlocked = effectiveVisibleFurniture.some(
      (item) =>
        item.floor === 1 &&
        item.assetType !== 'signage' &&
        item.position[2] < 0.85 &&
        Math.abs(item.position[0] - selectedProperty.buildingWidth / 2) < 1.5
    );

    // Check if any item is overlapping rear staircase zone
    const staircaseBlocked = effectiveVisibleFurniture.some(
      (item) =>
        item.position[2] > selectedProperty.buildingDepth - 1.4 &&
        item.position[0] > selectedProperty.buildingWidth - 2.2
    );

    const minAisleMeters =
      utilizationPct > 55
        ? 0.95
        : utilizationPct > 42
        ? 1.25
        : activePreset?.aisleWidthMeters || 1.5;

    const seatingCapacity = effectiveVisibleFurniture.reduce((sum, item) => {
      if (item.assetType === 'table_2') return sum + 2;
      if (item.assetType === 'table_4') return sum + 4;
      if (item.assetType === 'lounge_sofa') return sum + 4;
      if (item.assetType === 'work_desk') return sum + 4;
      if (item.assetType === 'spa_bed') return sum + 1;
      return sum;
    }, 0);

    return {
      footprintSqm: Number(footprintSqm.toFixed(1)),
      usableFloorSqm: Math.round(usableFloorSqm),
      utilizationPct,
      minAisleMeters: Number(minAisleMeters.toFixed(2)),
      doorwayClear: !doorwayBlocked,
      staircaseClear: !staircaseBlocked,
      estimatedCapacity:
        seatingCapacity > 0 ? seatingCapacity : activePreset?.capacityPersons || 20,
    };
  }, [selectedProperty, effectiveVisibleFurniture, activePreset]);

  // Add new item from catalog
  const handleAddFurnitureFromCatalog = (
    catalogEntry: (typeof FURNITURE_CATALOG)[number]
  ) => {
    if (!selectedProperty) return;
    const targetFloor = selectedFloor === 'all' ? 1 : selectedFloor;
    const floorObj =
      selectedProperty.floors.find((f) => f.level === targetFloor) ||
      selectedProperty.floors[0];
    const targetRoom =
      floorObj.rooms.find((r) => r.id === selectedRoomId) || floorObj.rooms[0];

    const centerX = targetRoom
      ? Number((targetRoom.x + targetRoom.width / 2).toFixed(2))
      : Number((selectedProperty.buildingWidth / 2).toFixed(2));
    const centerZ = targetRoom
      ? Number((targetRoom.z + targetRoom.depth / 2).toFixed(2))
      : Number((selectedProperty.buildingDepth / 2).toFixed(2));

    const stylePalette = DESIGN_STYLE_META[selectedDesignStyle];
    const newItem: FurnitureItem = {
      id: `custom-${catalogEntry.assetType}-${Date.now()}`,
      assetType: catalogEntry.assetType,
      name: `${catalogEntry.name} (Mới)`,
      category: catalogEntry.category,
      floor: floorObj.level,
      roomId: targetRoom ? targetRoom.id : floorObj.rooms[0]?.id || 'f1-r1',
      position: [centerX, 0, centerZ],
      rotation: 0,
      scale: [1, 1, 1],
      dimensions: catalogEntry.dimensions,
      unitCostVND: catalogEntry.unitCostVND,
      visible: true,
      color:
        catalogEntry.category === 'core' || catalogEntry.category === 'signage'
          ? stylePalette.accentColor
          : stylePalette.woodTone,
    };

    useSpaceVisionStore.setState((state) => ({
      furnitureItems: [...state.furnitureItems, newItem],
      selectedFurnitureId: newItem.id,
    }));
    setCatalogOpen(false);
    setStudioTab('furniture');
  };

  const handleDeleteFurniture = (id: string) => {
    useSpaceVisionStore.setState((state) => ({
      furnitureItems: state.furnitureItems.filter((item) => item.id !== id),
      selectedFurnitureId:
        state.selectedFurnitureId === id ? null : state.selectedFurnitureId,
    }));
  };

  const handleNudgeSelected = (dx: number, dz: number) => {
    if (!selectedFurniture || !selectedProperty) return;
    const nextX = Math.max(
      0.4,
      Math.min(
        selectedProperty.buildingWidth - 0.4,
        Number((selectedFurniture.position[0] + dx).toFixed(2))
      )
    );
    const nextZ = Math.max(
      0.4,
      Math.min(
        selectedProperty.buildingDepth - 0.4,
        Number((selectedFurniture.position[2] + dz).toFixed(2))
      )
    );
    updateFurnitureItem(selectedFurniture.id, {
      position: [nextX, selectedFurniture.position[1], nextZ],
    });
  };

  if (!selectedProperty) return null;

  const activeStyleMeta = DESIGN_STYLE_META[selectedDesignStyle];
  const activeBusinessMeta = BUSINESS_TYPE_META[selectedBusinessType];
  const contactName = selectedProperty.contact?.name || 'Anh Minh';
  const contactPhone = selectedProperty.contact?.phone || '0912 345 678';
  const contactRole = selectedProperty.contact?.role || 'Chính chủ';
  const handoverOffer =
    selectedProperty.contact?.handoverOffer ||
    'Hỗ trợ 15 ngày setup miễn phí & bàn giao thô hoàn thiện';

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full flex-col lg:flex-row overflow-hidden bg-slate-100">
      {/* ======================================================== */}
      {/* LEFT: 65% Interactive 3D / 2D Space Preview Viewport     */}
      {/* ======================================================== */}
      <div className="relative flex flex-1 flex-col h-[42vh] sm:h-[48vh] lg:h-full lg:w-[62%] xl:w-[65%] overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-100">
        {/* Top Floating Viewport Control Bar */}
        <div className="pointer-events-none absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2">
          {/* Active Business Model & Floor Switcher */}
          <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/95 p-1.5 shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200/80">
              <Building2 className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-xs font-bold text-blue-950">
                {selectedProperty.code}
              </span>
              <span className="text-[11px] text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-700">
                {activeBusinessMeta?.labelVi}
              </span>
            </div>

            <div className="h-4 w-px bg-slate-200 mx-0.5" />

            {/* Floor Tabs */}
            <button
              type="button"
              onClick={() => setSelectedFloor('all')}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedFloor === 'all'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              Tất cả tầng
            </button>
            {selectedProperty.floors.map((fl) => (
              <button
                key={fl.level}
                type="button"
                onClick={() => setSelectedFloor(fl.level)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedFloor === fl.level
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                Tầng {fl.level}
              </button>
            ))}
          </div>

          {/* 3D / 2D Modes & Visual Overlays */}
          <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/95 p-1.5 shadow-sm backdrop-blur-md">
            <div className="flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200">
              <button
                type="button"
                onClick={() => setView2D3DMode('3d')}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  view2D3DMode === '3d'
                    ? 'bg-white text-blue-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Box className="h-3.5 w-3.5" />
                <span>3D Studio</span>
              </button>
              <button
                type="button"
                onClick={() => setView2D3DMode('2d')}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  view2D3DMode === '2d'
                    ? 'bg-white text-blue-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid className="h-3.5 w-3.5" />
                <span>2D CAD</span>
              </button>
              <button
                type="button"
                onClick={() => setView2D3DMode('split')}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  view2D3DMode === 'split'
                    ? 'bg-white text-blue-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Columns className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Song song</span>
              </button>
            </div>

            {/* Camera angle dropdown */}
            <select
              value={cameraMode}
              onChange={(e) => setCameraMode(e.target.value as CameraMode)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
              title="Góc nhìn Camera 3D"
            >
              <option value="orbit">Góc nhìn Orbit 3D</option>
              <option value="dollhouse">Mặt cắt Dollhouse</option>
              <option value="floorplan">Top-down Mặt bằng</option>
              <option value="walkthrough">Góc nhìn Khách hàng</option>
              <option value="exterior">Mặt tiền & Biển hiệu</option>
            </select>

            {/* Overlay Toggles */}
            <button
              type="button"
              onClick={() => setShowFurniture(!showFurniture)}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium border transition-colors ${
                showFurniture
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
              title="Bật/Tắt hiển thị nội thất"
            >
              <Armchair className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">Nội thất</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDimensions(!showDimensions)}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium border transition-colors ${
                showDimensions
                  ? 'border-blue-300 bg-blue-50 text-blue-800'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
              title="Bật/Tắt kích thước"
            >
              <Ruler className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">Kích thước</span>
            </button>
          </div>
        </div>

        {/* 3D / 2D Canvas Area */}
        <div className="relative flex flex-1 w-full h-full overflow-hidden">
          {(view2D3DMode === '3d' || view2D3DMode === 'urban' || view2D3DMode === 'split') && (
            <div
              className={`relative h-full ${
                view2D3DMode === 'split'
                  ? 'w-1/2 border-r border-slate-700'
                  : 'w-full'
              }`}
            >
              <BuildingDigitalTwin property={selectedProperty} mode="studio" />
            </div>
          )}

          {(view2D3DMode === '2d' || view2D3DMode === 'split') && (
            <div
              className={`relative h-full bg-slate-950 ${
                view2D3DMode === 'split' ? 'w-1/2' : 'w-full'
              }`}
            >
              <FloorPlan2D
                property={selectedProperty}
                floorLevel={selectedFloor === 'all' ? 1 : selectedFloor}
                editable={true}
              />
            </div>
          )}
        </div>

        {/* Bottom Floating KPI & Metrics Bar */}
        <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2">
          <div className="pointer-events-auto hidden sm:flex flex-wrap items-center gap-3 lg:gap-4 rounded-xl border border-slate-200/90 bg-white/95 px-3 lg:px-4 py-2 lg:py-2.5 shadow-md backdrop-blur-md">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Sức chứa phục vụ
              </div>
              <div className="text-xs font-bold text-slate-900">
                ~{spatialAudit.estimatedCapacity} chỗ ngồi
              </div>
            </div>

            <div className="h-6 w-px bg-slate-200" />

            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Mật độ chiếm chỗ
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-xs font-bold ${
                    spatialAudit.utilizationPct > 60
                      ? 'text-amber-700'
                      : 'text-emerald-700'
                  }`}
                >
                  {spatialAudit.utilizationPct}%
                </span>
                <span className="text-[10px] text-slate-500">
                  ({spatialAudit.footprintSqm}m² / {spatialAudit.usableFloorSqm}m²)
                </span>
              </div>
            </div>

            <div className="h-6 w-px bg-slate-200" />

            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Lối đi nội bộ
              </div>
              <div className="flex items-center gap-1">
                <span
                  className={`text-xs font-bold ${
                    spatialAudit.minAisleMeters >= 1.2
                      ? 'text-emerald-700'
                      : 'text-amber-700'
                  }`}
                >
                  {spatialAudit.minAisleMeters}m
                </span>
                <span className="text-[10px] text-slate-500">
                  {spatialAudit.minAisleMeters >= 1.2 ? '(Đạt chuẩn)' : '(Hẹp)'}
                </span>
              </div>
            </div>

            {budgetSummary && (
              <>
                <div className="h-6 w-px bg-slate-200" />
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Dự toán Setup ước tính
                  </div>
                  <div className="text-xs font-bold text-blue-700">
                    {formatVND(budgetSummary.totalMinVND)} –{' '}
                    {formatVND(budgetSummary.totalMaxVND)}
                  </div>
                </div>
              </>
            )}

            <div className="h-6 w-px bg-slate-200" />
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Chủ nhà khảo sát
              </div>
              <a
                href={`tel:${contactPhone.replace(/\s+/g, '')}`}
                className="text-xs font-bold text-slate-900 hover:text-blue-700 flex items-center gap-1 transition-colors"
                title="Gọi liên hệ chủ nhà"
              >
                <Phone className="h-3 w-3 text-emerald-600" />
                <span>{contactName} ({contactPhone})</span>
              </a>
            </div>
          </div>

          {/* Quick Transform Nudge Controls for Selected Furniture */}
          {selectedFurniture && (
            <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-blue-200 bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-md">
              <div className="text-xs">
                <span className="text-slate-500 mr-1">Đang chọn:</span>
                <strong className="text-blue-900 font-semibold">
                  {selectedFurniture.name}
                </strong>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <button
                  type="button"
                  onClick={() => handleNudgeSelected(-0.25, 0)}
                  className="rounded bg-slate-100 p-1 text-slate-700 hover:bg-blue-600 hover:text-white transition-colors"
                  title="Dịch trái (-0.25m X)"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleNudgeSelected(0.25, 0)}
                  className="rounded bg-slate-100 p-1 text-slate-700 hover:bg-blue-600 hover:text-white transition-colors"
                  title="Dịch phải (+0.25m X)"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleNudgeSelected(0, -0.25)}
                  className="rounded bg-slate-100 p-1 text-slate-700 hover:bg-blue-600 hover:text-white transition-colors"
                  title="Dịch ra trước (-0.25m Z)"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleNudgeSelected(0, 0.25)}
                  className="rounded bg-slate-100 p-1 text-slate-700 hover:bg-blue-600 hover:text-white transition-colors"
                  title="Dịch vào trong (+0.25m Z)"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateFurnitureItem(selectedFurniture.id, {
                      rotation: (selectedFurniture.rotation + 45) % 360,
                    })
                  }
                  className="rounded bg-slate-100 px-1.5 py-1 text-[11px] font-mono text-blue-700 hover:bg-blue-600 hover:text-white flex items-center gap-1 transition-colors"
                  title="Xoay +45°"
                >
                  <RotateCw className="h-3 w-3" />
                  {selectedFurniture.rotation}°
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* RIGHT: 35% Focused Configuration & Cost Estimation Panel */}
      {/* ======================================================== */}
      <aside className="flex w-full lg:w-[35%] xl:w-[35%] shrink-0 flex-col h-[50vh] lg:h-full bg-white border-l border-slate-200 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="border-b border-slate-200 px-5 py-3.5 bg-slate-50/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900">
                  AI Business Setup Studio
                </h1>
                <p className="text-[11px] text-slate-500">
                  Mô phỏng bố trí không gian, nội thất & dự toán đầu tư
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={resetStudioLayout}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-xs"
              title="Khôi phục bố cục nội thất mặc định của AI"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
              <span>Reset</span>
            </button>
          </div>

          {/* 3 Clean, Uncluttered Studio Navigation Tabs */}
          <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-slate-200/70 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setStudioTab('concept')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all ${
                studioTab === 'concept'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Palette className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <span className="truncate">1. Mô hình & Style</span>
            </button>
            <button
              type="button"
              onClick={() => setStudioTab('furniture')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all ${
                studioTab === 'furniture'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Armchair className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <span className="truncate">2. Xem 3D & Nội thất</span>
            </button>
            <button
              type="button"
              onClick={() => setStudioTab('budget')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all ${
                studioTab === 'budget'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calculator className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <span className="truncate">3. Dự toán & Chủ nhà</span>
            </button>
          </div>
        </div>

        {/* Scrollable Configuration Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* ==================================================== */}
          {/* TAB 1: BỐ TRÍ & PHONG CÁCH (Concept, Presets & Style) */}
          {/* ==================================================== */}
          {studioTab === 'concept' && (
            <>
              {/* Step 1: Chọn mô hình kinh doanh (8 options) */}
              <section className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                      Bước 1 / 3 • Mô hình kinh doanh
                    </span>
                    <h2 className="text-xs font-bold text-slate-900">
                      Chọn Mô Hình Kinh Doanh (8 Ngành Nghề)
                    </h2>
                  </div>
                  <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-200">
                    Auto Layout 3D
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(BUSINESS_TYPE_META) as BusinessType[]).map(
                    (bType) => {
                      const meta = BUSINESS_TYPE_META[bType];
                      const Icon = BUSINESS_ICONS[bType] || Store;
                      const isSelected = selectedBusinessType === bType;
                      const isRecommended =
                        selectedProperty.suitableBusinesses.includes(bType);

                      return (
                        <button
                          key={bType}
                          type="button"
                          onClick={() => setSelectedBusinessType(bType)}
                          className={`flex flex-col text-left rounded-xl border p-2.5 transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <span
                              className={`truncate text-xs font-semibold ${
                                isSelected ? 'text-blue-950 font-bold' : 'text-slate-800'
                              }`}
                            >
                              {meta.labelVi}
                            </span>
                          </div>

                          <div className="mt-2 text-[10px] text-slate-500">
                            Chuẩn: {meta.defaultAreaRange[0]}–{meta.defaultAreaRange[1]}m²
                          </div>

                          {isRecommended && (
                            <div className="mt-1.5 flex items-center gap-1 text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 self-start">
                              <Check className="h-2.5 w-2.5" />
                              <span>Phù hợp mặt bằng</span>
                            </div>
                          )}
                        </button>
                      );
                    }
                  )}
                </div>
              </section>

              {/* Step 2a: Chọn phương án bố trí mặt bằng (AI Layout Presets) */}
              <section className="space-y-2.5 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                      Bước 1 / 3 • Phương án mặt bằng
                    </span>
                    <h2 className="text-xs font-bold text-slate-900">
                      Phương Án Bố Trí Mặt Bằng (AI Layout Presets)
                    </h2>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {layoutPresets.length} phương án
                  </span>
                </div>

                <div className="space-y-2">
                  {layoutPresets.map((preset) => {
                    const isSelected = activePreset?.id === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => selectLayoutPreset(preset.id)}
                        className={`w-full rounded-xl border p-3 text-left transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600/30'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {preset.name}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {preset.items.length} hạng mục
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                          {preset.description}
                        </p>
                        <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[10px] text-slate-500 pt-2 border-t border-slate-100">
                          <span>
                            Sức chứa:{' '}
                            <strong className="text-slate-800">
                              {preset.capacityPersons} người
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            Mật độ:{' '}
                            <strong className="text-emerald-700">
                              {preset.spaceUtilizationPct}%
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            Lối đi:{' '}
                            <strong className="text-blue-700">
                              {preset.aisleWidthMeters}m
                            </strong>
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Step 2b: Phong cách thiết kế & Bảng vật liệu 3D */}
              <section className="space-y-2.5 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                      Bước 1 / 3 • Phong cách thiết kế
                    </span>
                    <h2 className="text-xs font-bold text-slate-900">
                      Phong Cách Thiết Kế (Design Style)
                    </h2>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Cập nhật vật liệu & chi phí
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(DESIGN_STYLE_META) as DesignStyle[]).map(
                    (styleKey) => {
                      const sMeta = DESIGN_STYLE_META[styleKey];
                      const isSelected = selectedDesignStyle === styleKey;
                      return (
                        <button
                          key={styleKey}
                          type="button"
                          onClick={() => setSelectedDesignStyle(styleKey)}
                          className={`flex flex-col justify-between rounded-xl border p-2.5 text-left transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-slate-900">
                                {sMeta.label}
                              </span>
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                                x{sMeta.costMultiplier.toFixed(2)}
                              </span>
                            </div>
                            <p className="mt-1 line-clamp-2 text-[10px] text-slate-500">
                              {sMeta.description}
                            </p>
                          </div>

                          {/* Color Palette Preview Dots */}
                          <div className="mt-2.5 flex items-center gap-1.5 pt-2 border-t border-slate-100">
                            <span
                              className="h-3.5 w-3.5 rounded-full border border-slate-300 shadow-xs"
                              style={{ backgroundColor: sMeta.wallColor }}
                              title={`Tường: ${sMeta.wallColor}`}
                            />
                            <span
                              className="h-3.5 w-3.5 rounded-full border border-slate-300 shadow-xs"
                              style={{ backgroundColor: sMeta.floorColor }}
                              title={`Sàn: ${sMeta.floorColor}`}
                            />
                            <span
                              className="h-3.5 w-3.5 rounded-full border border-slate-300 shadow-xs"
                              style={{ backgroundColor: sMeta.woodTone }}
                              title={`Gỗ: ${sMeta.woodTone}`}
                            />
                            <span
                              className="h-3.5 w-3.5 rounded-full border border-slate-300 shadow-xs"
                              style={{ backgroundColor: sMeta.metalTone }}
                              title={`Kim loại: ${sMeta.metalTone}`}
                            />
                            <span
                              className="h-3.5 w-3.5 rounded-full border border-slate-300 shadow-xs"
                              style={{ backgroundColor: sMeta.accentColor }}
                              title={`Điểm nhấn: ${sMeta.accentColor}`}
                            />
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              </section>

              {/* Next Step Action Button */}
              <button
                type="button"
                onClick={() => setStudioTab('furniture')}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-xs"
              >
                <span>Tiếp tục: Bước 2 - Xem 3D & Danh Mục Nội Thất</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}

          {/* ==================================================== */}
          {/* TAB 2: DANH SÁCH NỘI THẤT (Furniture & 3D Placement) */}
          {/* ==================================================== */}
          {studioTab === 'furniture' && (
            <>
              {/* Category Filter Toggles */}
              <section className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                      Bước 2 / 3 • Phân loại nội thất
                    </span>
                    <h2 className="text-xs font-bold text-slate-900">
                      Bật / Tắt Nhóm Hạng Mục
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCatalogOpen((prev) => !prev)}
                    className="flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Thêm nội thất</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {FURNITURE_CATEGORIES.map((cat) => {
                    const isHidden = hiddenFurnitureCategories.includes(cat.id);
                    const count = furnitureItems.filter(
                      (i) => i.category === cat.id
                    ).length;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleFurnitureCategory(cat.id)}
                        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all ${
                          isHidden
                            ? 'border-slate-200 bg-slate-100 text-slate-400 line-through'
                            : cat.badgeColor
                        }`}
                      >
                        {isHidden ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                        <span>{cat.label}</span>
                        <span className="font-mono text-[10px] opacity-75">
                          ({count})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Add Furniture Catalog Drawer */}
              {catalogOpen && (
                <section className="rounded-xl border border-blue-200 bg-blue-50/40 p-3.5 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900">
                      Thư viện Nội Thất & Thiết Bị (Chọn để thêm vào mặt bằng)
                    </span>
                    <button
                      type="button"
                      onClick={() => setCatalogOpen(false)}
                      className="text-[11px] text-slate-500 hover:text-slate-900 font-medium"
                    >
                      Đóng
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                    {FURNITURE_CATALOG.map((entry) => (
                      <button
                        key={entry.assetType}
                        type="button"
                        onClick={() => handleAddFurnitureFromCatalog(entry)}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2 text-left hover:border-blue-500 hover:bg-blue-50/50 transition-colors shadow-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="truncate text-xs font-semibold text-slate-900">
                            {entry.name}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {entry.dimensions[0]}m × {entry.dimensions[2]}m •{' '}
                            <span className="text-emerald-700 font-medium">
                              {formatVND(entry.unitCostVND)}
                            </span>
                          </div>
                        </div>
                        <Plus className="h-4 w-4 shrink-0 text-blue-600" />
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Selected Item Detail Inspector & Coordinates Controls */}
              {selectedFurniture ? (
                <section className="rounded-xl border border-blue-200 bg-blue-50/30 p-3.5 space-y-3 shadow-xs">
                  <div className="flex items-start justify-between gap-2 border-b border-blue-100 pb-2.5">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                        Đang chỉnh sửa tọa độ
                      </span>
                      <h3 className="text-xs font-bold text-slate-900 mt-0.5">
                        {selectedFurniture.name}
                      </h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Kích thước: {selectedFurniture.dimensions[0]}m (Rộng) ×{' '}
                        {selectedFurniture.dimensions[2]}m (Sâu) • Đơn giá:{' '}
                        <span className="text-emerald-700 font-semibold">
                          {formatFullVND(selectedFurniture.unitCostVND)}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          updateFurnitureItem(selectedFurniture.id, {
                            visible: !selectedFurniture.visible,
                          })
                        }
                        className={`rounded-lg p-1.5 text-xs border transition-colors ${
                          selectedFurniture.visible
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-slate-100 text-slate-400'
                        }`}
                        title="Ẩn / Hiện hạng mục này"
                      >
                        {selectedFurniture.visible ? (
                          <Eye className="h-3.5 w-3.5" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFurniture(selectedFurniture.id)}
                        className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-700 hover:bg-rose-100 transition-colors"
                        title="Xóa khỏi mặt bằng"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Floor Placement Level */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-600 font-medium">
                      Bố trí tại tầng:
                    </span>
                    <div className="flex items-center gap-1">
                      {selectedProperty.floors.map((fl) => (
                        <button
                          key={fl.level}
                          type="button"
                          onClick={() =>
                            updateFurnitureItem(selectedFurniture.id, {
                              floor: fl.level,
                              roomId: fl.rooms[0]?.id || selectedFurniture.roomId,
                            })
                          }
                          className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                            selectedFurniture.floor === fl.level
                              ? 'bg-blue-600 text-white font-semibold'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          Tầng {fl.level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Collapsible Fine-Tuning Section: Tùy chỉnh nâng cao */}
                  <div className="rounded-xl border border-blue-200/80 bg-white overflow-hidden shadow-xs">
                    <button
                      type="button"
                      onClick={() => setShowAdvancedTune((prev) => !prev)}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600" />
                        <span>Tùy chỉnh nâng cao (Tọa độ X/Z & Góc xoay)</span>
                      </div>
                      {showAdvancedTune ? (
                        <ChevronUp className="h-4 w-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-500" />
                      )}
                    </button>

                    {showAdvancedTune && (
                      <div className="p-3 space-y-3 border-t border-slate-200 bg-slate-50/40">
                        {/* Position X / Z Sliders */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="flex justify-between text-[11px] mb-1">
                              <span className="text-slate-600 flex items-center gap-1 font-medium">
                                <Move className="h-3 w-3 text-blue-600" /> Tọa độ ngang (X)
                              </span>
                              <span className="font-mono text-blue-700 font-bold">
                                {selectedFurniture.position[0].toFixed(2)}m
                              </span>
                            </div>
                            <input
                              type="range"
                              min={0.4}
                              max={Math.max(selectedProperty.buildingWidth - 0.4, 2)}
                              step={0.1}
                              value={selectedFurniture.position[0]}
                              onChange={(e) =>
                                updateFurnitureItem(selectedFurniture.id, {
                                  position: [
                                    parseFloat(e.target.value),
                                    selectedFurniture.position[1],
                                    selectedFurniture.position[2],
                                  ],
                                })
                              }
                              className="w-full"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-[11px] mb-1">
                              <span className="text-slate-600 flex items-center gap-1 font-medium">
                                <Move className="h-3 w-3 text-blue-600" /> Tọa độ sâu (Z)
                              </span>
                              <span className="font-mono text-blue-700 font-bold">
                                {selectedFurniture.position[2].toFixed(2)}m
                              </span>
                            </div>
                            <input
                              type="range"
                              min={0.4}
                              max={Math.max(selectedProperty.buildingDepth - 0.4, 2)}
                              step={0.1}
                              value={selectedFurniture.position[2]}
                              onChange={(e) =>
                                updateFurnitureItem(selectedFurniture.id, {
                                  position: [
                                    selectedFurniture.position[0],
                                    selectedFurniture.position[1],
                                    parseFloat(e.target.value),
                                  ],
                                })
                              }
                              className="w-full"
                            />
                          </div>
                        </div>

                        {/* Rotation Angle Buttons */}
                        <div>
                          <div className="flex items-center justify-between text-[11px] mb-1.5">
                            <span className="text-slate-600 flex items-center gap-1 font-medium">
                              <RotateCw className="h-3 w-3 text-blue-600" /> Góc xoay (Rotation)
                            </span>
                            <span className="font-mono text-blue-700 font-bold">
                              {selectedFurniture.rotation}°
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {[0, 45, 90, 180, 270].map((angle) => (
                              <button
                                key={angle}
                                type="button"
                                onClick={() =>
                                  updateFurnitureItem(selectedFurniture.id, {
                                    rotation: angle,
                                  })
                                }
                                className={`rounded-lg px-2 py-1 font-mono text-[10px] border transition-colors ${
                                  selectedFurniture.rotation === angle
                                    ? 'border-blue-600 bg-blue-600 text-white font-bold'
                                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                }`}
                              >
                                {angle}°
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-center text-xs text-slate-500">
                  Nhấp vào một món nội thất trong danh sách bên dưới hoặc trên mô hình để điều chỉnh vị trí X/Z và góc xoay.
                </div>
              )}

              {/* Items List Filtered by Floor */}
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-slate-900">
                    Danh Sách Hạng Mục Nội Thất ({floorFilteredFurniture.length})
                  </h2>
                  <span className="text-[10px] text-slate-500">
                    {selectedFloor === 'all'
                      ? 'Tất cả tầng'
                      : `Đang lọc Tầng ${selectedFloor}`}
                  </span>
                </div>

                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {floorFilteredFurniture.map((item) => {
                    const isSelected = item.id === selectedFurnitureId;
                    const catHidden = hiddenFurnitureCategories.includes(item.category);
                    const effectiveVis = item.visible && !catHidden;

                    return (
                      <div
                        key={item.id}
                        onClick={() => selectFurnitureItem(item.id)}
                        className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl border p-2.5 transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        } ${!effectiveVis ? 'opacity-50' : ''}`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-700">
                              T{item.floor}
                            </span>
                            <span className="truncate text-xs font-semibold text-slate-900">
                              {item.name}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                            <span>X:{item.position[0].toFixed(1)}m</span>
                            <span>Z:{item.position[2].toFixed(1)}m</span>
                            <span>•</span>
                            <span className="text-emerald-700 font-medium">
                              {formatVND(item.unitCostVND)}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateFurnitureItem(item.id, {
                              visible: !item.visible,
                            });
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                          title={item.visible ? 'Ẩn hạng mục' : 'Hiện hạng mục'}
                        >
                          {effectiveVis ? (
                            <Eye className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Next Button */}
              <button
                type="button"
                onClick={() => setStudioTab('budget')}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-xs"
              >
                <span>Tiếp tục: Bước 3 - Dự Toán Tổng & Liên Hệ Chủ Nhà</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}

          {/* ==================================================== */}
          {/* TAB 3: 3. DỰ TOÁN TỔNG & LIÊN HỆ CHỦ NHÀ              */}
          {/* ==================================================== */}
          {studioTab === 'budget' && budgetSummary && (
            <>
              {/* Owner Contact & Renovation Agreement Banner */}
              <section className="rounded-2xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-50/90 via-sky-50/30 to-white p-4 shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="rounded-md bg-blue-600 text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-xs">
                        {contactRole} • Kết Nối Trực Tiếp
                      </span>
                      <span className="text-[11px] font-medium text-slate-500">
                        {selectedProperty.contact?.responseSpeed || 'Phản hồi trong 15 phút'}
                      </span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                      Trao đổi phương án cải tạo & xin phép sửa chữa với chủ nhà ({contactName} - {contactPhone})
                    </h3>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {selectedProperty.contact?.handoverOffer ||
                        'Hỗ trợ 15 ngày setup miễn phí & bàn giao thô hoàn thiện, tạo điều kiện thuận lợi thẩm duyệt cải tạo.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={`tel:${contactPhone.replace(/\s+/g, '')}`}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 px-3 text-xs font-bold text-white transition-colors shadow-xs"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>Gọi {contactPhone}</span>
                  </a>
                  <a
                    href={`https://zalo.me/${(selectedProperty.contact?.zaloPhone || contactPhone).replace(/\s+/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 px-3 text-xs font-bold text-white transition-colors shadow-xs"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>Nhắn Zalo</span>
                  </a>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-blue-100/80">
                  <span>Khung giờ xem mặt bằng:</span>
                  <span className="font-semibold text-slate-700">
                    {selectedProperty.contact?.viewingAvailability || 'Các ngày trong tuần (8h - 18h)'}
                  </span>
                </div>
              </section>

              {/* Step 3: Total Summary Card */}
              <section className="space-y-4">
                <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/70 via-white to-slate-50 p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                      Bước 3 / 3 • Tổng Dự Toán Chi Phí Setup
                    </span>
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
                      AI Estimate
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-baseline gap-2">
                    <span className="text-xl font-extrabold text-slate-900">
                      {formatVND(budgetSummary.totalMinVND)} –{' '}
                      {formatVND(budgetSummary.totalMaxVND)}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    Khuyến nghị dự trù trung bình:{' '}
                    <strong className="text-emerald-700 font-semibold">
                      {formatFullVND(budgetSummary.totalEstimateVND)}
                    </strong>
                  </div>

                  <div className="mt-3.5 grid grid-cols-3 gap-2 pt-3 border-t border-slate-200 text-[10px]">
                    <div>
                      <span className="text-slate-500 block">Diện tích sàn</span>
                      <strong className="text-slate-800">
                        {budgetSummary.areaSqm} m² ({selectedProperty.floorsCount} tầng)
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Phong cách</span>
                      <strong className="text-slate-800">
                        {activeStyleMeta.label}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Tiền thuê tham chiếu</span>
                      <strong className="text-blue-700">
                        {selectedProperty.monthlyRentMillionVND} tr/tháng
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 6 Category Breakdown List */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Phân Bổ Ngân Sách 6 Nhóm Hạng Mục
                  </h3>
                  <div className="space-y-2">
                    {budgetSummary.lines.map((line) => {
                      const pct = Math.round(
                        (line.estimateVND /
                          Math.max(budgetSummary.totalEstimateVND, 1)) *
                          100
                      );
                      return (
                        <div
                          key={line.category}
                          className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-900">
                              {line.label}
                            </span>
                            <span className="font-mono text-xs font-bold text-blue-700">
                              {formatVND(line.minVND)} – {formatVND(line.maxVND)}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                            <span>{line.note}</span>
                            <span className="font-mono text-slate-700 font-semibold">
                              ~{pct}%
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-blue-600"
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Spatial Constraints & Safety Checks */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Kiểm Tra Không Gian & Lối Đi
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                      {spatialAudit.minAisleMeters >= 1.2 ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                      )}
                      <div>
                        <div className="text-xs font-semibold text-slate-900">
                          Lối đi nội bộ: {spatialAudit.minAisleMeters}m
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-600">
                          {spatialAudit.minAisleMeters >= 1.2
                            ? 'Đạt chuẩn khuyến nghị (>= 1.2m) cho luồng di chuyển khách và nhân viên.'
                            : 'Hơi hẹp (< 1.2m). Nên bố trí khoảng lùi hợp lý để tránh ùn ứ giờ cao điểm.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                      {spatialAudit.doorwayClear ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                      )}
                      <div>
                        <div className="text-xs font-semibold text-slate-900">
                          Độ thông thoáng cửa chính mặt tiền
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-600">
                          {spatialAudit.doorwayClear
                            ? 'Khu vực sảnh đón mặt tiền hoàn toàn thông suốt, tầm nhìn mở.'
                            : 'Cảnh báo: Có vật dụng đặt quá gần cửa chính Tầng 1.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mandatory Regulatory & Legal Notice Card */}
                <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" />
                    <div>
                      <span className="inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900 border border-amber-200 mb-1">
                        Lưu Ý Pháp Lý & Thẩm Duyệt Chuyên Môn
                      </span>
                      <p className="text-xs font-medium leading-relaxed text-amber-900">
                        Lưu ý pháp lý: Các tiêu chuẩn PCCC, lối thoát hiểm, kết cấu chịu lực và giấy phép kinh doanh cần được thẩm định thực tế bởi kỹ sư/cơ quan chuyên môn.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Forward to Comparison Page CTA */}
                <button
                  type="button"
                  onClick={() => setActiveTab('comparison')}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <span>Chuyển sang Bảng So Sánh & Xuất Báo Cáo PDF</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </section>
            </>
          )}
        </div>
      </aside>
    </div>
  );
};

export default BusinessSetupView;
