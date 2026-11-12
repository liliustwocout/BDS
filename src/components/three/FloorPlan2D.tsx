'use client';

import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Compass,
  Move,
  Layers,
  Ruler,
  Armchair,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useSpaceVisionStore } from '@/store/useSpaceVisionStore';
import { FurnitureItem, PropertyItem, RoomGeometry } from '@/types';
import { DESIGN_STYLE_META } from '@/lib/aiEngine';

export interface FloorPlan2DProps {
  property?: PropertyItem;
  floorLevel?: number | 'all';
  floor?: number | 'all';
  editable?: boolean;
  showFurniture?: boolean;
  showDimensions?: boolean;
  showLabels?: boolean;
  className?: string;
  compact?: boolean;
  hideTopBar?: boolean;
  onSelectRoom?: (roomId: string | null) => void;
  onSelectFurniture?: (furnitureId: string | null) => void;
}

const SCALE = 44; // 44 SVG units per 1 meter

export function FloorPlan2D({
  property: propProperty,
  floorLevel,
  floor,
  editable = false,
  showFurniture: propShowFurniture,
  showDimensions: propShowDimensions,
  showLabels: propShowLabels,
  className = '',
  compact = false,
  hideTopBar = false,
  onSelectRoom,
  onSelectFurniture,
}: FloorPlan2DProps) {
  const {
    properties,
    selectedPropertyId,
    selectedFloor,
    selectedRoomId,
    showFurniture: storeShowFurniture,
    showDimensions: storeShowDimensions,
    showLabels: storeShowLabels,
    furnitureItems,
    selectedFurnitureId,
    hiddenFurnitureCategories,
    selectedDesignStyle,
    activeTab,
    setSelectedFloor,
    setSelectedRoomId,
    setShowFurniture,
    setShowDimensions,
    toggleShowLabels,
    selectFurnitureItem,
    updateFurnitureItem,
  } = useSpaceVisionStore();

  const property = useMemo(
    () => propProperty || properties.find((p) => p.id === selectedPropertyId) || properties[0],
    [propProperty, properties, selectedPropertyId]
  );

  const effectiveShowFurniture =
    propShowFurniture !== undefined ? propShowFurniture : storeShowFurniture;
  const effectiveShowDimensions =
    propShowDimensions !== undefined ? propShowDimensions : storeShowDimensions;
  const effectiveShowLabels =
    propShowLabels !== undefined ? propShowLabels : (storeShowLabels ?? true);
  const isEditable = editable || activeTab === 'studio';

  // Determine which floor level to display in 2D
  const activeLevel = useMemo(() => {
    const requested = floorLevel ?? floor ?? selectedFloor;
    if (requested !== 'all' && typeof requested === 'number') {
      return requested;
    }
    if (selectedRoomId && property) {
      const foundFloor = property.floors.find((f) =>
        f.rooms.some((r) => r.id === selectedRoomId)
      );
      if (foundFloor) return foundFloor.level;
    }
    return 1;
  }, [floorLevel, floor, selectedFloor, selectedRoomId, property]);

  const currentFloorSpec = useMemo(() => {
    if (!property) return null;
    return (
      property.floors.find((f) => f.level === activeLevel) || property.floors[0] || null
    );
  }, [property, activeLevel]);

  const [zoom, setZoom] = useState<number>(1);
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Detect whether furniture coordinates are centered [-W/2..W/2] or building-space [0..W, 0..D]
  const isFurnitureCentered = useMemo(() => {
    return furnitureItems.some((item) => item.position[0] < -0.05 || item.position[2] < -0.05);
  }, [furnitureItems]);

  const visibleFloorFurniture = useMemo(() => {
    if (!effectiveShowFurniture || !currentFloorSpec) return [];
    return furnitureItems.filter(
      (item) =>
        item.visible &&
        item.floor === currentFloorSpec.level &&
        !hiddenFurnitureCategories.includes(item.category)
    );
  }, [
    effectiveShowFurniture,
    currentFloorSpec,
    furnitureItems,
    hiddenFurnitureCategories,
  ]);

  const W = property?.buildingWidth || 8;
  const D = property?.buildingDepth || 16;

  // Convert furniture item position to [0..W, 0..D] meters
  const getFurnitureMeterPos = useCallback(
    (item: FurnitureItem): [number, number] => {
      const [px, , pz] = item.position;
      if (isFurnitureCentered) {
        return [px + W / 2, pz + D / 2];
      }
      return [px, pz];
    },
    [isFurnitureCentered, W, D]
  );

  // Convert [0..W, 0..D] meters back to store position convention
  const toStorePosition = useCallback(
    (mx: number, mz: number, currentY: number): [number, number, number] => {
      const clampedX = Number(Math.max(0.4, Math.min(W - 0.4, mx)).toFixed(2));
      const clampedZ = Number(Math.max(0.4, Math.min(D - 0.4, mz)).toFixed(2));
      if (isFurnitureCentered) {
        return [
          Number((clampedX - W / 2).toFixed(2)),
          currentY,
          Number((clampedZ - D / 2).toFixed(2)),
        ];
      }
      return [clampedX, currentY, clampedZ];
    },
    [isFurnitureCentered, W, D]
  );

  // SVG layout margins (in SVG units)
  const marginL = 72;
  const marginT = 68;
  const marginR = 72;
  const marginB = 96; // Extra space at bottom for Storefront + Sidewalk + Street

  const planW = W * SCALE;
  const planD = D * SCALE;
  const viewBoxW = marginL + planW + marginR;
  const viewBoxH = marginT + planD + marginB;

  // Dragging handler on SVG
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!draggingId || !isEditable || !svgRef.current) return;
      const item = furnitureItems.find((f) => f.id === draggingId);
      if (!item) return;

      const svg = svgRef.current;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const transformed = pt.matrixTransform(ctm.inverse());

      const meterX = (transformed.x - marginL) / SCALE;
      const meterZ = (transformed.y - marginT) / SCALE;

      const nextPos = toStorePosition(meterX, meterZ, item.position[1]);
      updateFurnitureItem(draggingId, { position: nextPos });
    },
    [draggingId, isEditable, furnitureItems, marginL, marginT, toStorePosition, updateFurnitureItem]
  );

  const handlePointerUp = useCallback(() => {
    if (draggingId) {
      setDraggingId(null);
    }
  }, [draggingId]);

  if (!property || !currentFloorSpec) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Không có dữ liệu bản vẽ 2D.
      </div>
    );
  }

  const styleMeta = DESIGN_STYLE_META?.[selectedDesignStyle];

  return (
    <div
      className={`relative flex flex-col h-full w-full select-none overflow-hidden bg-slate-50 text-slate-900 ${className}`}
    >
      {/* TOP BAR INSIDE 2D VIEWER (Clean Architectural White Capsule Bar) */}
      {!hideTopBar ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white/95 px-3 py-2 z-10 shadow-sm">
          {/* Floor Selector Tabs */}
          <div className="flex items-center gap-1">
            <span className="mr-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <Layers className="h-3.5 w-3.5 text-slate-600" />
              <span>Mặt bằng:</span>
            </span>
            {property.floors.map((f) => {
              const active = currentFloorSpec.level === f.level;
              return (
                <button
                  key={f.level}
                  onClick={() => setSelectedFloor(f.level)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                    active
                      ? 'bg-slate-900 text-white font-semibold shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Tầng {f.level} ({f.totalArea}m²)
                </button>
              );
            })}
          </div>

          {/* Right Controls: Editable Badge & Zoom */}
          <div className="flex items-center gap-2">
            {isEditable && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                <Move className="h-3 w-3 text-emerald-600" />
                Kéo thả trực tiếp nội thất trên mặt bằng
              </span>
            )}

            {/* Layer toggles: Nhãn chữ, Kích thước, Nội thất */}
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
              <button
                onClick={toggleShowLabels}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                  effectiveShowLabels
                    ? 'bg-amber-50 text-amber-800 font-semibold'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
                title="Bật/tắt nhãn tên phòng (Phím tắt: L)"
              >
                {effectiveShowLabels ? <Eye className="w-3.5 h-3.5 text-amber-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                <span className="hidden md:inline">{effectiveShowLabels ? 'Nhãn chữ' : 'Tắt chữ'}</span>
              </button>

              <button
                onClick={() => setShowDimensions(!effectiveShowDimensions)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                  effectiveShowDimensions
                    ? 'bg-blue-50 text-blue-800 font-semibold'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
                title="Bật/tắt đường gióng kích thước"
              >
                <Ruler className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden md:inline">Kích thước</span>
              </button>

              <button
                onClick={() => setShowFurniture(!effectiveShowFurniture)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                  effectiveShowFurniture
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
                title="Bật/tắt hiển thị nội thất"
              >
                <Armchair className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden md:inline">Nội thất</span>
              </button>
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
              <button
                onClick={() => setZoom((z) => Math.max(0.65, Number((z - 0.15).toFixed(2))))}
                className="rounded p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                title="Thu nhỏ"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="px-1.5 font-mono text-[11px] text-slate-700 font-medium">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(1.8, Number((z + 0.15).toFixed(2))))}
                className="rounded p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                title="Phóng to"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setZoom(1)}
                className="rounded p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                title="Khớp khung hình"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* FLOATING MINIMAL ZOOM DOCK (When embedded with hideTopBar=true) */
        <div className="pointer-events-auto absolute top-16 right-3 z-10 flex items-center gap-1 rounded-xl border border-slate-200/90 bg-white/95 p-1 shadow-md backdrop-blur-md">
          <button
            onClick={() => setZoom((z) => Math.max(0.65, Number((z - 0.15).toFixed(2))))}
            className="rounded p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Thu nhỏ (-)"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-[38px] text-center font-mono text-[11px] text-slate-700 font-bold">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(1.8, Number((z + 0.15).toFixed(2))))}
            className="rounded p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Phóng to (+)"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <div className="h-3.5 w-px bg-slate-200 mx-0.5" />
          <button
            onClick={() => setZoom(1)}
            className="rounded p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Khớp khung hình (100%)"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* MAIN INTERACTIVE SVG BLUEPRINT (Crisp Architectural Light Theme) */}
      <div className="relative flex-1 w-full h-full overflow-auto flex items-center justify-center p-2 bg-slate-100/60">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${viewBoxW} ${viewBoxH}`}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{
            width: `${Math.round(zoom * 100)}%`,
            height: `${Math.round(zoom * 100)}%`,
            maxWidth: zoom === 1 ? '100%' : 'none',
            maxHeight: zoom === 1 ? '100%' : 'none',
          }}
          className="transition-transform duration-150 shadow-sm rounded-lg"
        >
          <defs>
            {/* Architectural Sub-grid (0.5m) */}
            <pattern
              id="blueprint-subgrid"
              width={SCALE / 2}
              height={SCALE / 2}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${SCALE / 2} 0 L 0 0 0 ${SCALE / 2}`}
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="0.6"
              />
            </pattern>
            {/* Architectural Major Grid (1.0m) */}
            <pattern
              id="blueprint-grid"
              width={SCALE}
              height={SCALE}
              patternUnits="userSpaceOnUse"
            >
              <rect width={SCALE} height={SCALE} fill="url(#blueprint-subgrid)" />
              <path
                d={`M ${SCALE} 0 L 0 0 0 ${SCALE}`}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="0.8"
              />
            </pattern>
            {/* Diagonal Hatch for Wet Areas (WC) */}
            <pattern
              id="wc-hatch"
              width="8"
              height="8"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="8" stroke="#0d9488" strokeWidth="1" strokeOpacity="0.3" />
            </pattern>
          </defs>

          {/* Background Blueprint Sheet - Crisp White Paper */}
          <rect
            x={0}
            y={0}
            width={viewBoxW}
            height={viewBoxH}
            fill="#ffffff"
            onClick={() => {
              setSelectedRoomId(null);
              selectFurnitureItem(null);
              onSelectRoom?.(null);
            }}
          />

          {/* Blueprint Grid inside Building Envelope */}
          <g transform={`translate(${marginL}, ${marginT})`}>
            <rect
              x={0}
              y={0}
              width={planW}
              height={planD}
              fill="url(#blueprint-grid)"
            />

            {/* OUTER BUILDING DIMENSION LINES (TOP & LEFT) */}
            {effectiveShowDimensions && effectiveShowLabels && (
              <g className="pointer-events-none">
                {/* Top Overall Width Dimension */}
                <line
                  x1={0}
                  y1={-28}
                  x2={planW}
                  y2={-28}
                  stroke="#475569"
                  strokeWidth={1.2}
                />
                <line x1={0} y1={-36} x2={0} y2={-16} stroke="#1e293b" strokeWidth={1.5} />
                <line
                  x1={planW}
                  y1={-36}
                  x2={planW}
                  y2={-16}
                  stroke="#1e293b"
                  strokeWidth={1.5}
                />
                <rect
                  x={planW / 2 - 48}
                  y={-40}
                  width={96}
                  height={22}
                  rx={4}
                  fill="#ffffff"
                  stroke="#475569"
                  strokeWidth={1}
                />
                <text
                  x={planW / 2}
                  y={-25}
                  textAnchor="middle"
                  fill="#0f172a"
                  fontSize={11}
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  Rộng: {W.toFixed(1)}m
                </text>

                {/* Left Overall Depth Dimension */}
                <line
                  x1={-28}
                  y1={0}
                  x2={-28}
                  y2={planD}
                  stroke="#475569"
                  strokeWidth={1.2}
                />
                <line x1={-36} y1={0} x2={-16} y2={0} stroke="#1e293b" strokeWidth={1.5} />
                <line
                  x1={-36}
                  y1={planD}
                  x2={-16}
                  y2={planD}
                  stroke="#1e293b"
                  strokeWidth={1.5}
                />
                <g transform={`translate(-28, ${planD / 2}) rotate(-90)`}>
                  <rect
                    x={-48}
                    y={-11}
                    width={96}
                    height={22}
                    rx={4}
                    fill="#ffffff"
                    stroke="#475569"
                    strokeWidth={1}
                  />
                  <text
                    x={0}
                    y={4}
                    textAnchor="middle"
                    fill="#0f172a"
                    fontSize={11}
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    Sâu: {D.toFixed(1)}m
                  </text>
                </g>
              </g>
            )}

            {/* REAR SETBACK LABEL (TOP, z = 0) */}
            {effectiveShowLabels && (
              <text
                x={planW / 2}
                y={-8}
                textAnchor="middle"
                fill="#64748b"
                fontSize={9}
                fontWeight="500"
                fontFamily="sans-serif"
              >
                TƯỜNG HẬU & LỐI KỸ THUẬT PHÍA SAU (Z = 0m)
              </text>
            )}

            {/* ROOMS ON CURRENT FLOOR */}
            {currentFloorSpec.rooms.map((room: RoomGeometry) => {
              const rx = room.x * SCALE;
              const rz = room.z * SCALE;
              const rw = room.width * SCALE;
              const rd = room.depth * SCALE;

              const isSelected = selectedRoomId === room.id;
              const isHovered = hoveredRoomId === room.id;

              // Door position logic: place door along interior boundary
              const isFrontRoom = Math.abs(room.z + room.depth - D) < 0.25;
              const doorX = rx + Math.min(rw * 0.22, 32);
              const doorY = isFrontRoom ? rz : rz + rd;
              const doorRadius = Math.min(28, rw * 0.25);

              // Architectural tint by room type
              const getRoomFillColor = () => {
                if (room.type === 'retail') return '#f0fdf4';
                if (room.type === 'service_counter') return '#fffbeb';
                if (room.type === 'workspace') return '#f0f9ff';
                if (room.type === 'private_room') return '#faf5ff';
                if (room.type === 'wc') return '#f0fdfa';
                if (room.type === 'storage' || room.type === 'utility') return '#f8fafc';
                return '#f8fafc';
              };

              return (
                <g
                  key={room.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    const nextId = isSelected ? null : room.id;
                    setSelectedRoomId(nextId);
                    onSelectRoom?.(nextId);
                  }}
                  onMouseEnter={() => setHoveredRoomId(room.id)}
                  onMouseLeave={() => setHoveredRoomId(null)}
                  className="cursor-pointer"
                >
                  {/* Room Base Fill */}
                  <rect
                    x={rx}
                    y={rz}
                    width={rw}
                    height={rd}
                    fill={isSelected ? '#e0f2fe' : isHovered ? '#f1f5f9' : getRoomFillColor()}
                    stroke={isSelected ? '#2563eb' : isHovered ? '#475569' : '#94a3b8'}
                    strokeWidth={isSelected ? 3 : 2}
                  />

                  {/* Hatch Pattern for WC */}
                  {room.type === 'wc' && (
                    <rect
                      x={rx}
                      y={rz}
                      width={rw}
                      height={rd}
                      fill="url(#wc-hatch)"
                      pointerEvents="none"
                    />
                  )}

                  {/* Architectural Inner Wall Offset */}
                  <rect
                    x={rx + 2}
                    y={rz + 2}
                    width={Math.max(0, rw - 4)}
                    height={Math.max(0, rd - 4)}
                    fill="none"
                    stroke={isSelected ? '#60a5fa' : '#cbd5e1'}
                    strokeWidth={0.8}
                    strokeDasharray={room.type === 'balcony' ? '4 3' : undefined}
                    pointerEvents="none"
                  />

                  {/* Architectural Door Swing Symbol */}
                  {!isFrontRoom && (
                    <g pointerEvents="none">
                      {/* Door gap cutout */}
                      <line
                        x1={doorX}
                        y1={doorY}
                        x2={doorX + doorRadius}
                        y2={doorY}
                        stroke="#ffffff"
                        strokeWidth={4}
                      />
                      {/* Door leaf line */}
                      <line
                        x1={doorX}
                        y1={doorY}
                        x2={doorX}
                        y2={doorY - doorRadius}
                        stroke="#1e293b"
                        strokeWidth={1.8}
                      />
                      {/* 90-degree Door Swing Arc */}
                      <path
                        d={`M ${doorX} ${doorY - doorRadius} A ${doorRadius} ${doorRadius} 0 0 1 ${
                          doorX + doorRadius
                        } ${doorY}`}
                        fill="none"
                        stroke="#64748b"
                        strokeWidth={1.1}
                        strokeDasharray="3 2"
                      />
                    </g>
                  )}

                  {/* Room Dimension Tick Lines (Internal) */}
                  {effectiveShowDimensions && effectiveShowLabels && rw > 70 && rd > 55 && (
                    <g pointerEvents="none" opacity={0.85}>
                      {/* Internal Width Label */}
                      <text
                        x={rx + rw / 2}
                        y={rz + 14}
                        textAnchor="middle"
                        fill="#64748b"
                        fontSize={9.5}
                        fontFamily="monospace"
                      >
                        ↔ {room.width}m
                      </text>
                      {/* Internal Depth Label */}
                      <text
                        x={rx + 18}
                        y={rz + rd / 2}
                        textAnchor="start"
                        fill="#64748b"
                        fontSize={9.5}
                        fontFamily="monospace"
                      >
                        ↕ {room.depth}m
                      </text>
                    </g>
                  )}

                  {/* Room Center Label (Clean White Architectural Tag) */}
                  {effectiveShowLabels && (
                    <g
                      transform={`translate(${rx + rw / 2}, ${rz + rd / 2})`}
                      pointerEvents="none"
                    >
                      <rect
                        x={-Math.min(rw * 0.42, 80)}
                        y={-18}
                        width={Math.min(rw * 0.84, 160)}
                        height={36}
                        rx={5}
                        fill="#ffffff"
                        fillOpacity={0.92}
                        stroke={isSelected ? '#2563eb' : '#cbd5e1'}
                        strokeWidth={isSelected ? 1.8 : 1}
                      />
                      <text
                        x={0}
                        y={-3}
                        textAnchor="middle"
                        fill="#0f172a"
                        fontSize={rw < 110 ? 10 : 11}
                        fontWeight="bold"
                      >
                        {room.name.length > 20 ? `${room.name.slice(0, 18)}…` : room.name}
                      </text>
                      <text
                        x={0}
                        y={11}
                        textAnchor="middle"
                        fill={isSelected ? '#2563eb' : '#64748b'}
                        fontSize={9.5}
                        fontFamily="monospace"
                        fontWeight="600"
                      >
                        {room.area}m²
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* ARCHITECTURAL STAIRCASE CORE SYMBOL (Connecting Floors) */}
            <g
              transform={`translate(${planW - 2.1 * SCALE}, ${0.3 * SCALE})`}
              pointerEvents="none"
            >
              <rect
                x={0}
                y={0}
                width={1.8 * SCALE}
                height={2.6 * SCALE}
                fill="#f8fafc"
                stroke="#475569"
                strokeWidth={1.5}
              />
              {Array.from({ length: 8 }).map((_, idx) => (
                <line
                  key={idx}
                  x1={0}
                  y1={(idx + 1) * ((2.6 * SCALE) / 9)}
                  x2={1.8 * SCALE}
                  y2={(idx + 1) * ((2.6 * SCALE) / 9)}
                  stroke="#94a3b8"
                  strokeWidth={1.1}
                />
              ))}
              {/* Stair direction arrow */}
              <line
                x1={0.9 * SCALE}
                y1={2.2 * SCALE}
                x2={0.9 * SCALE}
                y2={0.4 * SCALE}
                stroke="#2563eb"
                strokeWidth={1.5}
              />
              <polygon
                points={`${0.9 * SCALE},${0.28 * SCALE} ${0.72 * SCALE},${0.55 * SCALE} ${
                  1.08 * SCALE
                },${0.55 * SCALE}`}
                fill="#2563eb"
              />
              {effectiveShowLabels && (
                <text
                  x={0.9 * SCALE}
                  y={2.48 * SCALE}
                  textAnchor="middle"
                  fill="#475569"
                  fontSize={8.5}
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  THANG BỘ
                </text>
              )}
            </g>

            {/* OUTER ENVELOPE WALLS & STOREFRONT GLAZING (at z = D) */}
            <rect
              x={0}
              y={0}
              width={planW}
              height={planD}
              fill="none"
              stroke="#1e293b"
              strokeWidth={4.5}
              pointerEvents="none"
            />

            {/* Storefront Glass Curtain Wall & Double Entrance Door along Bottom Edge (y = planD) */}
            <g transform={`translate(0, ${planD})`} pointerEvents="none">
              {/* Glass Façade Line */}
              <line
                x1={8}
                y1={0}
                x2={planW - 8}
                y2={0}
                stroke="#0284c7"
                strokeWidth={5}
              />
              {/* Main Double Glass Entrance Door at Center of Storefront */}
              <rect
                x={planW / 2 - 36}
                y={-3}
                width={72}
                height={6}
                fill="#ffffff"
              />
              <path
                d={`M ${planW / 2 - 36} 0 A 36 36 0 0 0 ${planW / 2} -36`}
                fill="none"
                stroke="#0284c7"
                strokeWidth={1.3}
                strokeDasharray="3 2"
              />
              <path
                d={`M ${planW / 2 + 36} 0 A 36 36 0 0 1 ${planW / 2} -36`}
                fill="none"
                stroke="#0284c7"
                strokeWidth={1.3}
                strokeDasharray="3 2"
              />
              <line
                x1={planW / 2 - 36}
                y1={0}
                x2={planW / 2 - 36}
                y2={-36}
                stroke="#0284c7"
                strokeWidth={1.8}
              />
              <line
                x1={planW / 2 + 36}
                y1={0}
                x2={planW / 2 + 36}
                y2={-36}
                stroke="#0284c7"
                strokeWidth={1.8}
              />
            </g>

            {/* FURNITURE FOOTPRINTS ON CURRENT FLOOR */}
            {visibleFloorFurniture.map((item) => {
              const [mx, mz] = getFurnitureMeterPos(item);
              const fw = Math.max(0.4, item.dimensions[0] * (item.scale?.[0] || 1)) * SCALE;
              const fd = Math.max(0.4, item.dimensions[2] * (item.scale?.[2] || 1)) * SCALE;
              const cx = mx * SCALE;
              const cz = mz * SCALE;
              const isSelected = selectedFurnitureId === item.id;
              const itemColor =
                item.color || styleMeta?.woodTone || '#d6b48a';

              return (
                <g
                  key={item.id}
                  transform={`translate(${cx}, ${cz}) rotate(${item.rotation || 0})`}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    selectFurnitureItem(item.id);
                    onSelectFurniture?.(item.id);
                    if (isEditable) {
                      setDraggingId(item.id);
                    }
                  }}
                  className={isEditable ? 'cursor-move' : 'cursor-pointer'}
                >
                  {/* Selection Halo */}
                  {isSelected && (
                    <rect
                      x={-fw / 2 - 4}
                      y={-fd / 2 - 4}
                      width={fw + 8}
                      height={fd + 8}
                      rx={5}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth={2}
                      strokeDasharray="4 2"
                    />
                  )}

                  {/* Furniture Body */}
                  <rect
                    x={-fw / 2}
                    y={-fd / 2}
                    width={fw}
                    height={fd}
                    rx={
                      item.assetType === 'table_2' || item.assetType === 'lighting_pendant'
                        ? Math.min(fw, fd) / 2
                        : 4
                    }
                    fill={isSelected ? '#dbeafe' : itemColor}
                    fillOpacity={0.85}
                    stroke={isSelected ? '#2563eb' : '#334155'}
                    strokeWidth={1.2}
                  />

                  {/* Architectural Symbol Detail by AssetType */}
                  {(item.assetType === 'table_2' || item.assetType === 'table_4') && (
                    <>
                      <circle
                        cx={-fw / 2 - 4}
                        cy={0}
                        r={4}
                        fill="#f1f5f9"
                        stroke="#334155"
                        strokeWidth={1}
                      />
                      <circle
                        cx={fw / 2 + 4}
                        cy={0}
                        r={4}
                        fill="#f1f5f9"
                        stroke="#334155"
                        strokeWidth={1}
                      />
                    </>
                  )}

                  {item.assetType === 'plant_divider' && (
                    <circle cx={0} cy={0} r={Math.min(fw, fd) * 0.35} fill="#16a34a" />
                  )}

                  {/* Furniture Short Label - Only when selected */}
                  {isSelected && effectiveShowLabels && (
                    <text
                      x={0}
                      y={3}
                      textAnchor="middle"
                      fill="#0f172a"
                      fontSize={8.5}
                      fontWeight="bold"
                      pointerEvents="none"
                    >
                      {item.name.length > 12 ? `${item.name.slice(0, 10)}..` : item.name}
                    </text>
                  )}
                </g>
              );
            })}

            {/* STOREFRONT SIDEWALK & STREET ORIENTATION BANNER (Bottom y > planD) */}
            <g transform={`translate(0, ${planD + 12})`} pointerEvents="none">
              <rect
                x={-24}
                y={0}
                width={planW + 48}
                height={58}
                rx={8}
                fill="#f8fafc"
                stroke="#cbd5e1"
                strokeWidth={1.2}
              />
              {/* Road center dashed line */}
              <line
                x1={-12}
                y1={44}
                x2={planW + 12}
                y2={44}
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="10 6"
              />
              <text
                x={planW / 2}
                y={18}
                textAnchor="middle"
                fill="#0f172a"
                fontSize={11}
                fontWeight="bold"
              >
                MẶT TIỀN CHÍNH ({property.frontageMeters}m) — HƯỚNG{' '}
                {property.orientationLabel.toUpperCase()} ({property.orientationAzimuth}°)
              </text>
              <text
                x={planW / 2}
                y={33}
                textAnchor="middle"
                fill="#64748b"
                fontSize={9.5}
              >
                Vỉa hè & lòng đường trước nhà {property.roadWidthMeters}m • {property.parkingSpotsMotorbike} xe máy / {property.parkingSpotsCar} ô tô
              </text>
            </g>
          </g>

          {/* COMPASS ROSE IN TOP-RIGHT CORNER OF SVG */}
          <g transform={`translate(${viewBoxW - 38}, 36)`} pointerEvents="none">
            <circle
              cx={0}
              cy={0}
              r={22}
              fill="#ffffff"
              stroke="#cbd5e1"
              strokeWidth={1.5}
            />
            <g transform={`rotate(${180 - property.orientationAzimuth})`}>
              <polygon points="0,-16 -5,4 0,0 5,4" fill="#ef4444" />
              <polygon points="0,16 -5,-4 0,0 5,-4" fill="#64748b" />
            </g>
            <text
              x={0}
              y={-25}
              textAnchor="middle"
              fill="#475569"
              fontSize={8.5}
              fontWeight="bold"
            >
              BẮC (N)
            </text>
          </g>
        </svg>
      </div>

      {/* BOTTOM ARCHITECTURAL LEGEND & SCALE BAR */}
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white/95 px-3 py-1.5 text-[11px] text-slate-600 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-5 rounded-sm bg-sky-500 inline-block" />
              <span>Vách kính mặt tiền</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400 inline-block" />
              <span>Quầy dịch vụ</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500 inline-block" />
              <span>Khu khách / Làm việc</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-teal-500 inline-block" />
              <span>WC & Kỹ thuật</span>
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500">
            <span>Tỷ lệ chuẩn 1:1 với 3D</span>
            <span>•</span>
            <span>Ô lưới = 1.0m × 1.0m</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default FloorPlan2D;
