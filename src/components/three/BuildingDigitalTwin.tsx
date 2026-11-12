'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useSpaceVisionStore } from '@/store/useSpaceVisionStore';
import {
  CameraMode,
  DesignStyle,
  FloorSpec,
  FurnitureItem,
  PropertyItem,
  RoomGeometry,
  WeatherMode,
} from '@/types';
import {
  calculateSolarPosition,
  calculateSolarArcPoints,
} from '@/lib/solarCalc';
import { DESIGN_STYLE_META } from '@/lib/aiEngine';

export interface BuildingDigitalTwinProps {
  property?: PropertyItem;
  mode?: 'twin' | 'environment' | 'studio';
  showSolarArc?: boolean;
  studioMode?: boolean;
  editable?: boolean;
  resetTrigger?: number;
  className?: string;
}

const DEFAULT_STYLE_PALETTE = {
  label: 'Scandinavian',
  wallColor: '#f8fafc',
  floorColor: '#e8d8c3',
  accentColor: '#0284c7',
  woodTone: '#d6b48a',
  metalTone: '#334155',
  costMultiplier: 1.0,
  description: '',
};

/**
 * Camera Rig that smoothly transitions to target position/lookAt when cameraMode,
 * selectedFloor, selectedRoomId, or resetTrigger changes, then yields control to OrbitControls.
 */
function CameraController({
  cameraMode,
  selectedFloor,
  selectedRoom,
  buildingWidth,
  buildingDepth,
  totalHeight,
  floors,
  resetTrigger,
}: {
  cameraMode: CameraMode;
  selectedFloor: number | 'all';
  selectedRoom: RoomGeometry | null;
  buildingWidth: number;
  buildingDepth: number;
  totalHeight: number;
  floors: FloorSpec[];
  resetTrigger: number;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const targetPos = useRef(new THREE.Vector3(16, 14, 22));
  const targetLookAt = useRef(new THREE.Vector3(0, 4, 0));
  const isTransitioning = useRef(true);

  const floorElevation = useMemo(() => {
    if (selectedFloor === 'all') return totalHeight * 0.4;
    const f = floors.find((fl) => fl.level === selectedFloor);
    return f ? f.elevation + f.height * 0.4 : 1.5;
  }, [selectedFloor, floors, totalHeight]);

  useEffect(() => {
    const W = buildingWidth;
    const D = buildingDepth;

    // If a specific room is selected, compute its 3D world center
    if (selectedRoom) {
      const f = floors.find((fl) => fl.level === selectedRoom.floor);
      const elev = f ? f.elevation : (selectedRoom.floor - 1) * 3.4;
      const rx = selectedRoom.x + selectedRoom.width / 2 - W / 2;
      const rz = selectedRoom.z + selectedRoom.depth / 2 - D / 2;
      const ry = elev + selectedRoom.height * 0.45;

      targetLookAt.current.set(rx, ry, rz);
      if (cameraMode === 'floorplan') {
        targetPos.current.set(rx, elev + 16, rz + 0.01);
      } else if (cameraMode === 'walkthrough') {
        targetPos.current.set(rx, elev + 1.65, rz + Math.min(2.2, selectedRoom.depth * 0.35));
        targetLookAt.current.set(rx, elev + 1.55, rz - 2.0);
      } else {
        targetPos.current.set(rx + 7, elev + 7.5, rz + 8.5);
      }
      isTransitioning.current = true;
      return;
    }

    switch (cameraMode) {
      case 'orbit':
        targetPos.current.set(W * 1.45 + 6, Math.max(11, totalHeight * 1.15), D * 1.25 + 6);
        targetLookAt.current.set(0, floorElevation, 0);
        break;
      case 'dollhouse':
        targetPos.current.set(W * 1.35 + 5, Math.max(13, totalHeight * 1.35), D * 1.05 + 4);
        targetLookAt.current.set(0, floorElevation, 0);
        break;
      case 'floorplan':
        targetPos.current.set(0, Math.max(22, Math.max(W, D) * 1.65), 0.05);
        targetLookAt.current.set(0, floorElevation, 0);
        break;
      case 'walkthrough': {
        const walkY =
          selectedFloor === 'all'
            ? 1.7
            : (floors.find((fl) => fl.level === selectedFloor)?.elevation || 0) + 1.7;
        targetPos.current.set(0, walkY, D * 0.35);
        targetLookAt.current.set(0, walkY - 0.1, -D * 0.35);
        break;
      }
      case 'exterior':
        targetPos.current.set(0, Math.max(3.2, totalHeight * 0.42), D * 0.5 + 14);
        targetLookAt.current.set(0, totalHeight * 0.45, D * 0.2);
        break;
    }
    isTransitioning.current = true;
  }, [
    cameraMode,
    selectedFloor,
    selectedRoom,
    buildingWidth,
    buildingDepth,
    totalHeight,
    floorElevation,
    floors,
    resetTrigger,
  ]);

  useFrame((_, delta) => {
    if (!isTransitioning.current) return;
    const step = Math.min(1, delta * 4.5);
    camera.position.lerp(targetPos.current, step);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAt.current, step);
      controlsRef.current.update();
    }
    if (
      camera.position.distanceTo(targetPos.current) < 0.15 &&
      (!controlsRef.current ||
        controlsRef.current.target.distanceTo(targetLookAt.current) < 0.15)
    ) {
      isTransitioning.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={1.5}
      maxDistance={65}
      maxPolarAngle={Math.PI / 2 - 0.02}
      onStart={() => {
        isTransitioning.current = false;
      }}
    />
  );
}

/**
 * GPU-friendly Rain Particle System for WeatherMode === 'rainy'
 */
function RainParticles({ active }: { active: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 1100;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 48;
      arr[i * 3 + 1] = Math.random() * 28;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 48;
    }
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    if (!active || !pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const array = posAttr.array as Float32Array;
    const fallSpeed = 22 * delta;
    for (let i = 0; i < count; i++) {
      array[i * 3 + 1] -= fallSpeed;
      if (array[i * 3 + 1] < 0) {
        array[i * 3 + 1] = 26 + Math.random() * 4;
      }
    }
    posAttr.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#7dd3fc"
        size={0.14}
        transparent
        opacity={0.65}
        depthWrite={false}
      />
    </points>
  );
}

/**
 * 3D Procedural Furniture Mesh Generator for all 14 FurnitureAssetTypes
 */
function ProceduralFurnitureMesh({
  item,
  worldPos,
  stylePalette,
  isSelected,
  onSelect,
}: {
  item: FurnitureItem;
  worldPos: [number, number, number];
  stylePalette: typeof DEFAULT_STYLE_PALETTE;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  const w = Math.max(0.35, item.dimensions[0] * (item.scale?.[0] || 1));
  const h = Math.max(0.25, item.dimensions[1] * (item.scale?.[1] || 1));
  const d = Math.max(0.35, item.dimensions[2] * (item.scale?.[2] || 1));
  const rotRad = ((item.rotation || 0) * Math.PI) / 180;

  const primaryColor = item.color || stylePalette.woodTone || '#d6b48a';
  const accentColor = stylePalette.accentColor || '#0ea5e9';
  const metalColor = stylePalette.metalTone || '#475569';

  return (
    <group
      position={worldPos}
      rotation={[0, -rotRad, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Selection / Hover Outline Box */}
      {(isSelected || hovered) && (
        <mesh position={[0, h / 2, 0]}>
          <boxGeometry args={[w + 0.12, h + 0.12, d + 0.12]} />
          <meshBasicMaterial
            color={isSelected ? '#38bdf8' : '#f8fafc'}
            wireframe
            transparent
            opacity={isSelected ? 0.95 : 0.45}
          />
        </mesh>
      )}

      {/* Switch by 14 Furniture Asset Types */}
      {(() => {
        switch (item.assetType) {
          case 'counter':
          case 'reception':
            return (
              <group>
                {/* Main Counter Body */}
                <mesh position={[0, h * 0.45, 0]} castShadow receiveShadow>
                  <boxGeometry args={[w, h * 0.9, d * 0.9]} />
                  <meshStandardMaterial color={primaryColor} roughness={0.55} />
                </mesh>
                {/* Countertop Overhang */}
                <mesh position={[0, h * 0.94, 0.03]} castShadow receiveShadow>
                  <boxGeometry args={[w + 0.08, h * 0.12, d + 0.08]} />
                  <meshStandardMaterial color="#f8fafc" roughness={0.25} metalness={0.1} />
                </mesh>
                {/* Accent Front Panel */}
                <mesh position={[0, h * 0.45, d * 0.46]}>
                  <boxGeometry args={[w * 0.92, h * 0.72, 0.03]} />
                  <meshStandardMaterial color={accentColor} roughness={0.4} />
                </mesh>
                {/* POS Screen */}
                <mesh position={[w * 0.25, h + 0.16, 0]} rotation={[-0.25, 0, 0]}>
                  <boxGeometry args={[0.32, 0.24, 0.04]} />
                  <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.2} />
                </mesh>
              </group>
            );

          case 'espresso_bar':
            return (
              <group>
                {/* Base Bar Counter */}
                <mesh position={[0, h * 0.42, 0]} castShadow receiveShadow>
                  <boxGeometry args={[w, h * 0.84, d]} />
                  <meshStandardMaterial color={primaryColor} roughness={0.5} />
                </mesh>
                {/* Stainless Steel Top */}
                <mesh position={[0, h * 0.87, 0]}>
                  <boxGeometry args={[w + 0.04, 0.06, d + 0.04]} />
                  <meshStandardMaterial color="#cbd5e1" metalness={0.75} roughness={0.2} />
                </mesh>
                {/* Espresso Machine Body */}
                <mesh position={[-w * 0.15, h + 0.22, 0]} castShadow>
                  <boxGeometry args={[Math.min(0.85, w * 0.45), 0.44, d * 0.65]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.18} />
                </mesh>
                {/* 2 Coffee Grinder Towers */}
                <mesh position={[w * 0.25, h + 0.26, 0]} castShadow>
                  <cylinderGeometry args={[0.09, 0.11, 0.52, 12]} />
                  <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.3} />
                </mesh>
              </group>
            );

          case 'table_2':
            return (
              <group>
                {/* Round / Square Café Tabletop */}
                <mesh position={[0, h - 0.03, 0]} castShadow receiveShadow>
                  <cylinderGeometry args={[w * 0.48, w * 0.48, 0.05, 20]} />
                  <meshStandardMaterial color={primaryColor} roughness={0.45} />
                </mesh>
                {/* Central Pedestal */}
                <mesh position={[0, h / 2, 0]} castShadow>
                  <cylinderGeometry args={[0.05, 0.05, h - 0.06, 10]} />
                  <meshStandardMaterial color={metalColor} metalness={0.7} roughness={0.3} />
                </mesh>
                {/* Base Disc */}
                <mesh position={[0, 0.02, 0]}>
                  <cylinderGeometry args={[w * 0.28, w * 0.28, 0.04, 16]} />
                  <meshStandardMaterial color={metalColor} metalness={0.7} roughness={0.3} />
                </mesh>
                {/* 2 Chairs */}
                {[-1, 1].map((dir) => (
                  <group key={dir} position={[dir * (w * 0.45), 0, 0]}>
                    <mesh position={[0, 0.44, 0]} castShadow>
                      <boxGeometry args={[0.42, 0.05, 0.42]} />
                      <meshStandardMaterial color={accentColor} roughness={0.6} />
                    </mesh>
                    <mesh position={[dir * 0.18, 0.68, 0]} castShadow>
                      <boxGeometry args={[0.05, 0.44, 0.4]} />
                      <meshStandardMaterial color={primaryColor} roughness={0.5} />
                    </mesh>
                  </group>
                ))}
              </group>
            );

          case 'table_4':
            return (
              <group>
                {/* Rectangular Tabletop */}
                <mesh position={[0, h - 0.04, 0]} castShadow receiveShadow>
                  <boxGeometry args={[w, 0.06, d * 0.72]} />
                  <meshStandardMaterial color={primaryColor} roughness={0.4} />
                </mesh>
                {/* 4 Table Legs */}
                {[-1, 1].map((lx) =>
                  [-1, 1].map((lz) => (
                    <mesh
                      key={`${lx}-${lz}`}
                      position={[lx * (w * 0.42), h / 2, lz * (d * 0.28)]}
                    >
                      <cylinderGeometry args={[0.035, 0.035, h - 0.06, 8]} />
                      <meshStandardMaterial color={metalColor} metalness={0.6} />
                    </mesh>
                  ))
                )}
                {/* 4 Chairs */}
                {[-1, 1].map((cx) =>
                  [-1, 1].map((cz) => (
                    <group
                      key={`chair-${cx}-${cz}`}
                      position={[cx * (w * 0.26), 0, cz * (d * 0.46)]}
                    >
                      <mesh position={[0, 0.45, 0]} castShadow>
                        <boxGeometry args={[0.42, 0.05, 0.42]} />
                        <meshStandardMaterial color={accentColor} roughness={0.6} />
                      </mesh>
                      <mesh position={[0, 0.7, cz * 0.18]} castShadow>
                        <boxGeometry args={[0.42, 0.45, 0.05]} />
                        <meshStandardMaterial color={primaryColor} roughness={0.5} />
                      </mesh>
                    </group>
                  ))
                )}
              </group>
            );

          case 'lounge_sofa':
            return (
              <group>
                {/* Seat Base */}
                <mesh position={[0, h * 0.28, 0]} castShadow receiveShadow>
                  <boxGeometry args={[w, h * 0.45, d]} />
                  <meshStandardMaterial color={primaryColor} roughness={0.75} />
                </mesh>
                {/* Backrest */}
                <mesh position={[0, h * 0.65, -d * 0.38]} castShadow>
                  <boxGeometry args={[w, h * 0.65, d * 0.24]} />
                  <meshStandardMaterial color={primaryColor} roughness={0.75} />
                </mesh>
                {/* Left & Right Armrests */}
                <mesh position={[-w * 0.44, h * 0.48, 0]} castShadow>
                  <boxGeometry args={[w * 0.12, h * 0.55, d]} />
                  <meshStandardMaterial color={accentColor} roughness={0.7} />
                </mesh>
                <mesh position={[w * 0.44, h * 0.48, 0]} castShadow>
                  <boxGeometry args={[w * 0.12, h * 0.55, d]} />
                  <meshStandardMaterial color={accentColor} roughness={0.7} />
                </mesh>
              </group>
            );

          case 'work_desk':
            return (
              <group>
                {/* Desk Surface */}
                <mesh position={[0, 0.74, 0]} castShadow receiveShadow>
                  <boxGeometry args={[w, 0.05, d]} />
                  <meshStandardMaterial color={primaryColor} roughness={0.4} />
                </mesh>
                {/* Side Metal Frame Legs */}
                <mesh position={[-w * 0.45, 0.37, 0]}>
                  <boxGeometry args={[0.05, 0.74, d * 0.85]} />
                  <meshStandardMaterial color={metalColor} metalness={0.7} />
                </mesh>
                <mesh position={[w * 0.45, 0.37, 0]}>
                  <boxGeometry args={[0.05, 0.74, d * 0.85]} />
                  <meshStandardMaterial color={metalColor} metalness={0.7} />
                </mesh>
                {/* Monitor */}
                <mesh position={[0, 0.98, -d * 0.22]} castShadow>
                  <boxGeometry args={[Math.min(0.65, w * 0.45), 0.36, 0.04]} />
                  <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.2} />
                </mesh>
                {/* Office Chair */}
                <mesh position={[0, 0.46, d * 0.42]} castShadow>
                  <boxGeometry args={[0.48, 0.06, 0.46]} />
                  <meshStandardMaterial color="#334155" />
                </mesh>
                <mesh position={[0, 0.78, d * 0.62]} castShadow>
                  <boxGeometry args={[0.46, 0.58, 0.06]} />
                  <meshStandardMaterial color="#1e293b" />
                </mesh>
              </group>
            );

          case 'shelf_rack':
          case 'storage_cabinet':
            return (
              <group>
                {/* 4 Vertical Posts or Side Panels */}
                <mesh position={[-w * 0.46, h / 2, 0]} castShadow>
                  <boxGeometry args={[0.06, h, d]} />
                  <meshStandardMaterial color={metalColor} metalness={0.5} />
                </mesh>
                <mesh position={[w * 0.46, h / 2, 0]} castShadow>
                  <boxGeometry args={[0.06, h, d]} />
                  <meshStandardMaterial color={metalColor} metalness={0.5} />
                </mesh>
                {/* 4 Horizontal Shelves */}
                {[0.12, 0.38, 0.65, 0.92].map((ratio, idx) => (
                  <mesh key={idx} position={[0, h * ratio, 0]} castShadow receiveShadow>
                    <boxGeometry args={[w, 0.04, d]} />
                    <meshStandardMaterial color={primaryColor} roughness={0.5} />
                  </mesh>
                ))}
                {/* Merch Boxes on Shelves */}
                <mesh position={[-w * 0.2, h * 0.48, 0]}>
                  <boxGeometry args={[w * 0.28, h * 0.16, d * 0.65]} />
                  <meshStandardMaterial color={accentColor} roughness={0.6} />
                </mesh>
                <mesh position={[w * 0.22, h * 0.75, 0]}>
                  <boxGeometry args={[w * 0.3, h * 0.16, d * 0.65]} />
                  <meshStandardMaterial color="#f8fafc" roughness={0.5} />
                </mesh>
              </group>
            );

          case 'spa_bed':
            return (
              <group>
                {/* Wood Bed Frame */}
                <mesh position={[0, h * 0.35, 0]} castShadow>
                  <boxGeometry args={[w * 0.88, h * 0.5, d * 0.88]} />
                  <meshStandardMaterial color={stylePalette.woodTone} roughness={0.55} />
                </mesh>
                {/* Plush White/Cream Mattress */}
                <mesh position={[0, h * 0.72, 0]} castShadow receiveShadow>
                  <boxGeometry args={[w, h * 0.28, d]} />
                  <meshStandardMaterial color="#f8fafc" roughness={0.7} />
                </mesh>
                {/* Head Pillow / Face Cradle */}
                <mesh position={[0, h * 0.9, -d * 0.36]}>
                  <boxGeometry args={[w * 0.55, 0.1, d * 0.18]} />
                  <meshStandardMaterial color={accentColor} roughness={0.6} />
                </mesh>
              </group>
            );

          case 'display_island':
            return (
              <group>
                {/* Lower Podium */}
                <mesh position={[0, h * 0.3, 0]} castShadow receiveShadow>
                  <boxGeometry args={[w, h * 0.6, d]} />
                  <meshStandardMaterial color={primaryColor} roughness={0.4} />
                </mesh>
                {/* Upper Tier */}
                <mesh position={[0, h * 0.75, 0]} castShadow receiveShadow>
                  <boxGeometry args={[w * 0.68, h * 0.3, d * 0.68]} />
                  <meshStandardMaterial color="#f8fafc" roughness={0.25} />
                </mesh>
                {/* Display Items */}
                <mesh position={[0, h * 0.98, 0]} castShadow>
                  <boxGeometry args={[w * 0.35, 0.22, d * 0.35]} />
                  <meshStandardMaterial color={accentColor} metalness={0.3} roughness={0.3} />
                </mesh>
              </group>
            );

          case 'plant_divider':
            return (
              <group>
                {/* Planter Trough */}
                <mesh position={[0, h * 0.22, 0]} castShadow receiveShadow>
                  <boxGeometry args={[w, h * 0.44, d]} />
                  <meshStandardMaterial color={primaryColor} roughness={0.6} />
                </mesh>
                {/* Lush Greenery Clusters */}
                {[-0.28, 0, 0.28].map((offset, idx) => (
                  <mesh
                    key={idx}
                    position={[offset * w, h * (0.65 + (idx % 2) * 0.12), 0]}
                    castShadow
                  >
                    <sphereGeometry args={[Math.min(w, d) * 0.45, 12, 12]} />
                    <meshStandardMaterial color="#10b981" roughness={0.8} />
                  </mesh>
                ))}
              </group>
            );

          case 'lighting_pendant':
            return (
              <group position={[0, 2.2, 0]}>
                {/* Suspension Cord */}
                <mesh position={[0, 0.45, 0]}>
                  <cylinderGeometry args={[0.015, 0.015, 0.9, 8]} />
                  <meshStandardMaterial color="#1e293b" />
                </mesh>
                {/* Glowing Lamp Shade */}
                <mesh position={[0, 0, 0]}>
                  <coneGeometry args={[w * 0.5, 0.32, 16]} />
                  <meshStandardMaterial
                    color="#fef3c7"
                    emissive="#f59e0b"
                    emissiveIntensity={0.9}
                  />
                </mesh>
              </group>
            );

          case 'signage':
            return (
              <group position={[0, 2.4, 0]}>
                <mesh castShadow>
                  <boxGeometry args={[w, Math.max(0.65, h), Math.max(0.18, d * 0.4)]} />
                  <meshStandardMaterial
                    color="#0f172a"
                    metalness={0.6}
                    roughness={0.3}
                  />
                </mesh>
                <mesh position={[0, 0, Math.max(0.1, d * 0.22)]}>
                  <boxGeometry args={[w * 0.92, Math.max(0.5, h * 0.78), 0.04]} />
                  <meshStandardMaterial
                    color="#38bdf8"
                    emissive="#0ea5e9"
                    emissiveIntensity={1.25}
                  />
                </mesh>
              </group>
            );

          default:
            return (
              <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[w, h, d]} />
                <meshStandardMaterial color={primaryColor} roughness={0.5} />
              </mesh>
            );
        }
      })()}

      {/* Floating Label when Furniture Item is Selected */}
      {isSelected && (
        <Html position={[0, h + 0.55, 0]} center distanceFactor={14}>
          <div className="pointer-events-none whitespace-nowrap rounded-md border border-sky-400 bg-slate-900/95 px-2 py-0.5 text-[10px] font-semibold text-sky-200 shadow-lg">
            {item.name} ({item.dimensions[0]}×{item.dimensions[2]}m)
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * Renders a single RoomGeometry in 3D with floor tile, walls with doorway cutouts,
 * hover/selection highlight, and floating architectural label.
 */
function Room3DMesh({
  room,
  floorElevation,
  buildingWidth,
  buildingDepth,
  isSelected,
  showDimensions,
  wallOpacity,
  stylePalette,
  onSelectRoom,
}: {
  room: RoomGeometry;
  floorElevation: number;
  buildingWidth: number;
  buildingDepth: number;
  isSelected: boolean;
  showDimensions: boolean;
  wallOpacity: number;
  stylePalette: typeof DEFAULT_STYLE_PALETTE;
  onSelectRoom: (id: string | null) => void;
}) {
  const [hovered, setHovered] = useState(false);

  const W = buildingWidth;
  const D = buildingDepth;

  // Room center in 3D world space
  const cx = room.x + room.width / 2 - W / 2;
  const cz = room.z + room.depth / 2 - D / 2;
  const rw = room.width;
  const rd = room.depth;
  const rh = room.height;

  const isFrontEdge = Math.abs(room.z + room.depth - D) < 0.25;
  const isBackEdge = room.z < 0.25;
  const isLeftEdge = room.x < 0.25;
  const isRightEdge = Math.abs(room.x + room.width - W) < 0.25;

  const wallThickness = 0.12;
  const doorWidth = Math.min(1.1, rw * 0.35);
  const doorHeight = Math.min(2.15, rh * 0.72);

  return (
    <group position={[cx, floorElevation, cz]}>
      {/* Room Floor Surface */}
      <mesh
        position={[0, 0.06, 0]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onSelectRoom(isSelected ? null : room.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[rw - 0.06, 0.08, rd - 0.06]} />
        <meshStandardMaterial
          color={
            isSelected
              ? '#bae6fd'
              : hovered
              ? '#e2e8f0'
              : stylePalette.floorColor || '#e8d8c3'
          }
          roughness={0.5}
          metalness={0.05}
        />
      </mesh>

      {/* Selected Room Highlight Frame */}
      {isSelected && (
        <mesh position={[0, rh / 2, 0]}>
          <boxGeometry args={[rw, rh, rd]} />
          <meshBasicMaterial color="#2563eb" wireframe transparent opacity={0.75} />
        </mesh>
      )}

      {/* Back Wall (z = -rd/2) */}
      <mesh
        position={[0, rh / 2, -rd / 2 + wallThickness / 2]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[rw, rh, wallThickness]} />
        <meshStandardMaterial
          color={stylePalette.wallColor}
          roughness={0.8}
          transparent={wallOpacity < 1}
          opacity={isBackEdge ? Math.min(1, wallOpacity + 0.15) : wallOpacity}
        />
      </mesh>

      {/* Left Wall (x = -rw/2) */}
      <mesh
        position={[-rw / 2 + wallThickness / 2, rh / 2, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[wallThickness, rh, rd]} />
        <meshStandardMaterial
          color={stylePalette.wallColor}
          roughness={0.8}
          transparent={wallOpacity < 1}
          opacity={isLeftEdge ? Math.min(1, wallOpacity + 0.15) : wallOpacity}
        />
      </mesh>

      {/* Right Wall (x = +rw/2) */}
      <mesh
        position={[rw / 2 - wallThickness / 2, rh / 2, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[wallThickness, rh, rd]} />
        <meshStandardMaterial
          color={stylePalette.wallColor}
          roughness={0.8}
          transparent={wallOpacity < 1}
          opacity={isRightEdge ? Math.min(1, wallOpacity + 0.15) : wallOpacity}
        />
      </mesh>

      {/* Front Wall or Storefront Glass Curtain Wall (z = +rd/2) */}
      {isFrontEdge ? (
        room.floor === 1 ? (
          // Floor 1 Glass Storefront with Entrance Door Cutout & Mullions
          <group position={[0, 0, rd / 2 - 0.04]}>
            {/* Left & Right Glass Panels */}
            <mesh position={[-rw * 0.3, rh / 2, 0]}>
              <boxGeometry args={[rw * 0.36, rh - 0.15, 0.06]} />
              <meshPhysicalMaterial
                color="#e0f2fe"
                transparent
                opacity={0.22}
                roughness={0.05}
                metalness={0.15}
              />
            </mesh>
            <mesh position={[rw * 0.3, rh / 2, 0]}>
              <boxGeometry args={[rw * 0.36, rh - 0.15, 0.06]} />
              <meshPhysicalMaterial
                color="#e0f2fe"
                transparent
                opacity={0.22}
                roughness={0.05}
                metalness={0.15}
              />
            </mesh>
            {/* Transom Glass Above Entrance */}
            <mesh position={[0, rh - (rh - doorHeight) / 2, 0]}>
              <boxGeometry args={[rw * 0.28, rh - doorHeight, 0.06]} />
              <meshPhysicalMaterial
                color="#e0f2fe"
                transparent
                opacity={0.25}
                roughness={0.05}
                metalness={0.15}
              />
            </mesh>
            {/* Storefront Aluminum Frame Header & Mullions */}
            <mesh position={[0, rh - 0.08, 0]}>
              <boxGeometry args={[rw, 0.16, 0.14]} />
              <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
            </mesh>
          </group>
        ) : (
          // Upper Floor Façade Window + Balcony Parapet
          <group position={[0, 0, rd / 2 - 0.05]}>
            {/* Lower Parapet Wall */}
            <mesh position={[0, 0.5, 0]} castShadow>
              <boxGeometry args={[rw, 1.0, 0.12]} />
              <meshStandardMaterial
                color={stylePalette.wallColor}
                transparent={wallOpacity < 1}
                opacity={wallOpacity}
              />
            </mesh>
            {/* Upper Panoramic Window Glass */}
            <mesh position={[0, 1.0 + (rh - 1.2) / 2, 0]}>
              <boxGeometry args={[rw * 0.86, rh - 1.2, 0.06]} />
              <meshPhysicalMaterial
                color="#e0f2fe"
                transparent
                opacity={0.24}
                roughness={0.05}
                metalness={0.12}
              />
            </mesh>
          </group>
        )
      ) : (
        // Interior Partition Wall with Doorway Cutout
        <group position={[0, 0, rd / 2 - wallThickness / 2]}>
          <mesh position={[-rw * 0.28, rh / 2, 0]} castShadow>
            <boxGeometry args={[Math.max(0.2, rw - doorWidth - 0.4), rh, wallThickness]} />
            <meshStandardMaterial
              color={stylePalette.wallColor}
              roughness={0.8}
              transparent={wallOpacity < 1}
              opacity={wallOpacity}
            />
          </mesh>
          {/* Lintel above interior doorway */}
          <mesh position={[rw * 0.25, doorHeight + (rh - doorHeight) / 2, 0]}>
            <boxGeometry args={[doorWidth + 0.4, rh - doorHeight, wallThickness]} />
            <meshStandardMaterial
              color={stylePalette.wallColor}
              roughness={0.8}
              transparent={wallOpacity < 1}
              opacity={wallOpacity}
            />
          </mesh>
        </group>
      )}

      {/* Room Dimension Lines when showDimensions is true */}
      {showDimensions && (
        <group position={[0, 0.14, 0]}>
          <Line
            points={[
              [-rw / 2 + 0.15, 0, rd / 2 - 0.15],
              [rw / 2 - 0.15, 0, rd / 2 - 0.15],
            ]}
            color={isSelected ? '#38bdf8' : '#94a3b8'}
            lineWidth={isSelected ? 2 : 1}
          />
          <Line
            points={[
              [-rw / 2 + 0.15, 0, -rd / 2 + 0.15],
              [-rw / 2 + 0.15, 0, rd / 2 - 0.15],
            ]}
            color={isSelected ? '#38bdf8' : '#94a3b8'}
            lineWidth={isSelected ? 2 : 1}
          />
        </group>
      )}

      {/* Floating Room Label (Html from @react-three/drei) */}
      <Html
        position={[0, isSelected ? rh * 0.55 : 0.45, 0]}
        center
        distanceFactor={18}
        zIndexRange={[10, 0]}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            onSelectRoom(isSelected ? null : room.id);
          }}
          className={`cursor-pointer select-none rounded-lg border px-2.5 py-1 text-center shadow-sm backdrop-blur-sm transition-all ${
            isSelected
              ? 'border-blue-600 bg-blue-600 text-white shadow-md ring-2 ring-blue-400/40 scale-105'
              : 'border-slate-200 bg-white/95 text-slate-800 hover:border-blue-500 hover:shadow-md'
          }`}
        >
          <div className="text-[10px] font-semibold leading-tight whitespace-nowrap">
            {room.name.length > 22 ? `${room.name.slice(0, 20)}…` : room.name}
          </div>
          <div
            className={`text-[9px] font-mono ${
              isSelected ? 'text-blue-100' : 'text-slate-500'
            }`}
          >
            {room.area}m² {showDimensions ? `(${room.width}×${room.depth}m)` : ''}
          </div>
        </div>
      </Html>
    </group>
  );
}

/**
 * Urban Context: Street, Sidewalk, Road Markings, Neighboring Building Silhouettes,
 * Street Lamps, Trees, and Compass Rose.
 */
function UrbanStreetContext({
  property,
  weatherMode,
  lightsActive,
  showDimensions,
}: {
  property: PropertyItem;
  weatherMode: WeatherMode;
  lightsActive: boolean;
  showDimensions: boolean;
}) {
  const W = property.buildingWidth;
  const D = property.buildingDepth;
  const roadW = Math.max(6, property.roadWidthMeters);
  const sidewalkD = 3.2;
  const isWet = weatherMode === 'rainy';

  const streetCenterZ = D / 2 + sidewalkD + roadW / 2;

  return (
    <group>
      {/* Ground Base Plane - Architectural Studio Light Grey */}
      <mesh position={[0, -0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[110, 110]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.95} />
      </mesh>

      {/* Sidewalk along Storefront (+Z) */}
      <mesh
        position={[0, 0.02, D / 2 + sidewalkD / 2]}
        receiveShadow
      >
        <boxGeometry args={[W + 28, 0.12, sidewalkD]} />
        <meshStandardMaterial
          color={isWet ? '#cbd5e1' : '#f8fafc'}
          roughness={isWet ? 0.25 : 0.8}
          metalness={isWet ? 0.3 : 0.02}
        />
      </mesh>

      {/* Main Asphalt Street in Front of Property */}
      <mesh
        position={[0, -0.01, streetCenterZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[W + 44, roadW]} />
        <meshStandardMaterial
          color={isWet ? '#64748b' : '#94a3b8'}
          roughness={isWet ? 0.15 : 0.85}
          metalness={isWet ? 0.5 : 0.05}
        />
      </mesh>

      {/* White Dashed Center Road Markings */}
      {Array.from({ length: 9 }).map((_, idx) => {
        const dashX = (idx - 4) * 5.2;
        return (
          <mesh
            key={idx}
            position={[dashX, 0.01, streetCenterZ]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[2.6, 0.22]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        );
      })}

      {/* Street Lamps along Sidewalk */}
      {[-W / 2 - 3.5, W / 2 + 3.5].map((lx, idx) => (
        <group key={idx} position={[lx, 0, D / 2 + sidewalkD - 0.4]}>
          {/* Pole */}
          <mesh position={[0, 2.8, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.1, 5.6, 10]} />
            <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Lamp Arm */}
          <mesh position={[0, 5.5, 0.6]}>
            <boxGeometry args={[0.1, 0.1, 1.3]} />
            <meshStandardMaterial color="#475569" metalness={0.7} />
          </mesh>
          {/* Bulb Head */}
          <mesh position={[0, 5.4, 1.1]}>
            <sphereGeometry args={[0.22, 12, 12]} />
            <meshStandardMaterial
              color={lightsActive ? '#fef08a' : '#cbd5e1'}
              emissive={lightsActive ? '#f59e0b' : '#000000'}
              emissiveIntensity={lightsActive ? 2.2 : 0}
            />
          </mesh>
          {lightsActive && (
            <pointLight
              position={[0, 5.1, 1.1]}
              color="#fbbf24"
              intensity={14}
              distance={18}
              decay={2}
            />
          )}
        </group>
      ))}

      {/* Street Trees along Sidewalk */}
      {[-W / 2 - 6.5, W / 2 + 6.5].map((tx, idx) => (
        <group key={idx} position={[tx, 0, D / 2 + 1.4]}>
          <mesh position={[0, 1.1, 0]} castShadow>
            <cylinderGeometry args={[0.14, 0.2, 2.2, 8]} />
            <meshStandardMaterial color="#78350f" roughness={0.9} />
          </mesh>
          <mesh position={[0, 2.8, 0]} castShadow>
            <coneGeometry args={[1.35, 2.6, 10]} />
            <meshStandardMaterial color="#15803d" roughness={0.8} />
          </mesh>
          <mesh position={[0, 3.8, 0]} castShadow>
            <coneGeometry args={[1.0, 2.0, 10]} />
            <meshStandardMaterial color="#16a34a" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Neighboring Urban Building Silhouettes (Clean Architectural White Massing Volumes) */}
      <mesh position={[-W / 2 - 5.2, 5.5, -0.5]} receiveShadow>
        <boxGeometry args={[7.5, 11, D * 0.92]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} transparent opacity={0.65} />
      </mesh>
      <mesh position={[W / 2 + 5.2, 6.5, -0.5]} receiveShadow>
        <boxGeometry args={[7.5, 13, D * 0.92]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} transparent opacity={0.65} />
      </mesh>
      <mesh position={[0, 7, -D / 2 - 6.5]} receiveShadow>
        <boxGeometry args={[W + 22, 14, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} transparent opacity={0.55} />
      </mesh>

      {/* 3D Compass Rose & Azimuth Indicator */}
      <group position={[W / 2 + 4.8, 0.05, D / 2 + 1.5]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.1, 1.35, 32]} />
          <meshBasicMaterial color="#0284c7" side={THREE.DoubleSide} />
        </mesh>
        <Html position={[0, 0.25, 0]} center distanceFactor={20}>
          <div className="pointer-events-none rounded-md border border-slate-200 bg-white/95 px-2.5 py-1 text-[10px] font-sans font-medium text-slate-800 shadow-sm whitespace-nowrap">
            Hướng {property.orientationLabel} ({property.orientationAzimuth}°)
          </div>
        </Html>
      </group>

      {/* Overall Building Footprint Dimension Lines on Ground */}
      {showDimensions && (
        <group position={[0, 0.08, 0]}>
          {/* Frontage Width Line */}
          <Line
            points={[
              [-W / 2, 0, D / 2 + 0.65],
              [W / 2, 0, D / 2 + 0.65],
            ]}
            color="#2563eb"
            lineWidth={2}
          />
          <Html position={[0, 0.2, D / 2 + 0.65]} center distanceFactor={18}>
            <div className="pointer-events-none rounded bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm whitespace-nowrap">
              Mặt tiền: {W}m
            </div>
          </Html>

          {/* Building Depth Line */}
          <Line
            points={[
              [-W / 2 - 0.65, 0, -D / 2],
              [-W / 2 - 0.65, 0, D / 2],
            ]}
            color="#0284c7"
            lineWidth={2}
          />
          <Html position={[-W / 2 - 0.65, 0.2, 0]} center distanceFactor={18}>
            <div className="pointer-events-none rounded bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm whitespace-nowrap">
              Chiều sâu: {D}m
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}

/**
 * 3D Solar Trajectory Arc & Sun Sphere for Environmental Simulation
 */
function SolarTrajectoryArc({
  lat,
  lng,
  dayOfYear,
  buildingAzimuthDeg,
  sunVector,
  isDaylight,
  altitudeDeg,
}: {
  lat: number;
  lng: number;
  dayOfYear: number;
  buildingAzimuthDeg: number;
  sunVector: [number, number, number];
  isDaylight: boolean;
  altitudeDeg: number;
}) {
  const arcPoints = useMemo(
    () => calculateSolarArcPoints(lat, lng, dayOfYear, buildingAzimuthDeg, 26),
    [lat, lng, dayOfYear, buildingAzimuthDeg]
  );

  const hourMarkers = useMemo(() => {
    return [7, 10, 12, 15, 17].map((h) => {
      const pos = calculateSolarPosition(lat, lng, dayOfYear, h, buildingAzimuthDeg, 26);
      return { hour: h, vec: pos.sunVector, alt: pos.altitudeDeg };
    });
  }, [lat, lng, dayOfYear, buildingAzimuthDeg]);

  return (
    <group>
      {arcPoints.length >= 2 && (
        <Line
          points={arcPoints}
          color="#f59e0b"
          lineWidth={2.2}
          dashed
          dashSize={0.8}
          gapSize={0.4}
        />
      )}

      {/* Hour Markers along Solar Arc */}
      {hourMarkers.map(
        (m) =>
          m.alt > 0 && (
            <group key={m.hour} position={m.vec}>
              <mesh>
                <sphereGeometry args={[0.28, 12, 12]} />
                <meshBasicMaterial color="#fde047" />
              </mesh>
              <Html position={[0, 0.6, 0]} center distanceFactor={28}>
                <span className="pointer-events-none rounded bg-slate-900/90 border border-amber-500/40 px-1.5 py-0.5 font-mono text-[9px] text-amber-300">
                  {String(m.hour).padStart(2, '0')}:00
                </span>
              </Html>
            </group>
          )
      )}

      {/* Active Sun / Moon Sphere */}
      <group position={sunVector}>
        <mesh>
          <sphereGeometry args={[1.15, 24, 24]} />
          <meshBasicMaterial
            color={isDaylight ? (altitudeDeg < 14 ? '#fb923c' : '#fde047') : '#818cf8'}
          />
        </mesh>
        {/* Outer Corona Glow */}
        <mesh>
          <sphereGeometry args={[1.75, 20, 20]} />
          <meshBasicMaterial
            color={isDaylight ? '#f59e0b' : '#6366f1'}
            transparent
            opacity={0.28}
          />
        </mesh>
      </group>
    </group>
  );
}

export function BuildingDigitalTwin({
  property: propProperty,
  mode = 'twin',
  showSolarArc = false,
  resetTrigger = 0,
  className = '',
}: BuildingDigitalTwinProps) {
  const {
    properties,
    selectedPropertyId,
    selectedFloor,
    selectedRoomId,
    cameraMode,
    showFurniture,
    showDimensions,
    timeOfDayHours,
    dayOfYear,
    weatherMode,
    autoInteriorLights,
    selectedDesignStyle,
    furnitureItems,
    selectedFurnitureId,
    hiddenFurnitureCategories,
    setSelectedRoomId,
    selectFurnitureItem,
  } = useSpaceVisionStore();

  const property = useMemo(
    () => propProperty || properties.find((p) => p.id === selectedPropertyId) || properties[0],
    [propProperty, properties, selectedPropertyId]
  );

  const stylePalette = useMemo(
    () =>
      (DESIGN_STYLE_META && DESIGN_STYLE_META[selectedDesignStyle as DesignStyle]) ||
      DEFAULT_STYLE_PALETTE,
    [selectedDesignStyle]
  );

  const solar = useMemo(() => {
    if (!property) {
      return calculateSolarPosition(21.0285, 105.8542, dayOfYear, timeOfDayHours, 180, 26);
    }
    return calculateSolarPosition(
      property.coordinates[0],
      property.coordinates[1],
      dayOfYear,
      timeOfDayHours,
      property.orientationAzimuth,
      26
    );
  }, [property, dayOfYear, timeOfDayHours]);

  const selectedRoom = useMemo(() => {
    if (!property || !selectedRoomId) return null;
    for (const f of property.floors) {
      const r = f.rooms.find((rm) => rm.id === selectedRoomId);
      if (r) return r;
    }
    return null;
  }, [property, selectedRoomId]);

  const totalHeight = useMemo(() => {
    if (!property) return 10;
    return property.floors.reduce((acc, f) => Math.max(acc, f.elevation + f.height), 0);
  }, [property]);

  // Detect whether furniture coordinates are centered or [0..W, 0..D]
  const isFurnitureCentered = useMemo(
    () => furnitureItems.some((item) => item.position[0] < -0.05 || item.position[2] < -0.05),
    [furnitureItems]
  );

  if (!property) {
    return null;
  }

  const W = property.buildingWidth;
  const D = property.buildingDepth;

  const isNightOrDusk = !solar.isDaylight || solar.altitudeDeg < 8;
  const lightsActive = autoInteriorLights || isNightOrDusk || weatherMode === 'rainy';

  // Sky / background color based on solar altitude & weather (Architectural Light Theme)
  const skyBgColor = !solar.isDaylight
    ? '#1e293b'
    : weatherMode === 'rainy'
    ? '#cbd5e1'
    : weatherMode === 'cloudy'
    ? '#e2e8f0'
    : solar.altitudeDeg < 14
    ? '#ffedd5'
    : '#f1f5f9';

  const sunLightColor = !solar.isDaylight
    ? '#94a3b8'
    : solar.altitudeDeg < 15
    ? '#fed7aa'
    : '#ffffff';

  const sunLightIntensity = !solar.isDaylight
    ? 0.3
    : weatherMode === 'rainy'
    ? 0.65
    : weatherMode === 'cloudy'
    ? 0.95
    : Math.max(0.9, solar.solarIntensity * 2.4);

  return (
    <div className={`relative h-full w-full bg-slate-100 ${className}`}>
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [16, 14, 22], fov: 45, near: 0.2, far: 200 }}
        onPointerMissed={() => {
          selectFurnitureItem(null);
        }}
      >
        <color attach="background" args={[skyBgColor]} />
        <fog attach="fog" args={[skyBgColor, 45, 120]} />

        <CameraController
          cameraMode={cameraMode}
          selectedFloor={selectedFloor}
          selectedRoom={selectedRoom}
          buildingWidth={W}
          buildingDepth={D}
          totalHeight={totalHeight}
          floors={property.floors}
          resetTrigger={resetTrigger}
        />

        {/* Ambient & Hemisphere Lighting */}
        <ambientLight
          intensity={
            !solar.isDaylight ? 0.35 : weatherMode === 'rainy' ? 0.65 : 0.88
          }
          color="#ffffff"
        />
        <hemisphereLight
          args={[
            !solar.isDaylight ? '#334155' : '#ffffff',
            '#e2e8f0',
            !solar.isDaylight ? 0.35 : 0.65,
          ]}
        />

        {/* Astronomical Directional Sun Light */}
        <directionalLight
          position={
            solar.isDaylight
              ? solar.sunVector
              : [12, 20, 14]
          }
          color={sunLightColor}
          intensity={sunLightIntensity}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-24}
          shadow-camera-right={24}
          shadow-camera-top={24}
          shadow-camera-bottom={-24}
          shadow-bias={-0.0005}
        />

        {/* Visible Solar Arc in Environment Mode */}
        {(mode === 'environment' || showSolarArc) && (
          <SolarTrajectoryArc
            lat={property.coordinates[0]}
            lng={property.coordinates[1]}
            dayOfYear={dayOfYear}
            buildingAzimuthDeg={property.orientationAzimuth}
            sunVector={solar.sunVector}
            isDaylight={solar.isDaylight}
            altitudeDeg={solar.altitudeDeg}
          />
        )}

        {/* GPU Rain Particles when Rainy */}
        <RainParticles active={weatherMode === 'rainy'} />

        {/* Urban Street, Sidewalk, Lamps, Trees & Neighboring Buildings */}
        <UrbanStreetContext
          property={property}
          weatherMode={weatherMode}
          lightsActive={lightsActive}
          showDimensions={showDimensions}
        />

        {/* MULTI-FLOOR PROCEDURAL DIGITAL TWIN BUILDING */}
        <group>
          {property.floors.map((floorSpec) => {
            // Hide floors above selectedFloor so user can inspect interior cleanly
            const isAboveSelectedFloor =
              selectedFloor !== 'all' && floorSpec.level > selectedFloor;
            if (isAboveSelectedFloor) {
              return null;
            }

            const wallOpacity =
              cameraMode === 'dollhouse' || cameraMode === 'floorplan'
                ? 0.32
                : selectedFloor !== 'all' && floorSpec.level === selectedFloor
                ? 0.55
                : 0.78;

            const floorFurniture = showFurniture
              ? furnitureItems.filter(
                  (f) =>
                    f.visible &&
                    f.floor === floorSpec.level &&
                    !hiddenFurnitureCategories.includes(f.category)
                )
              : [];

            return (
              <group key={floorSpec.level}>
                {/* Structural Floor Slab - Architectural Light Tone */}
                <mesh
                  position={[0, floorSpec.elevation, 0]}
                  receiveShadow
                  castShadow
                >
                  <boxGeometry args={[W + 0.16, 0.14, D + 0.16]} />
                  <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
                </mesh>

                {/* Interior Warm Point Light per Floor (active at night/rain or autoInteriorLights) */}
                {lightsActive && (
                  <pointLight
                    position={[0, floorSpec.elevation + floorSpec.height - 0.35, D * 0.15]}
                    color="#ffedd5"
                    intensity={12}
                    distance={16}
                    decay={2}
                  />
                )}

                {/* Rooms on this Floor */}
                {floorSpec.rooms.map((room) => (
                  <Room3DMesh
                    key={room.id}
                    room={room}
                    floorElevation={floorSpec.elevation}
                    buildingWidth={W}
                    buildingDepth={D}
                    isSelected={selectedRoomId === room.id}
                    showDimensions={showDimensions}
                    wallOpacity={wallOpacity}
                    stylePalette={stylePalette}
                    onSelectRoom={setSelectedRoomId}
                  />
                ))}

                {/* 3D Staircase Connecting to Next Floor */}
                {floorSpec.level < property.floors.length && (
                  <group
                    position={[
                      W / 2 - 1.15,
                      floorSpec.elevation,
                      -D / 2 + 1.6,
                    ]}
                  >
                    {Array.from({ length: 10 }).map((_, stepIdx) => {
                      const stepY = ((stepIdx + 1) / 10) * floorSpec.height;
                      const stepZ = (stepIdx - 4.5) * 0.24;
                      return (
                        <mesh
                          key={stepIdx}
                          position={[0, stepY, stepZ]}
                          castShadow
                          receiveShadow
                        >
                          <boxGeometry args={[1.3, 0.1, 0.26]} />
                          <meshStandardMaterial
                            color={stylePalette.woodTone}
                            roughness={0.5}
                          />
                        </mesh>
                      );
                    })}
                  </group>
                )}

                {/* 3D Procedural Furniture Items on this Floor */}
                {floorFurniture.map((item) => {
                  const [px, py, pz] = item.position;
                  const worldX = isFurnitureCentered ? px : px - W / 2;
                  const worldZ = isFurnitureCentered ? pz : pz - D / 2;
                  const worldY = floorSpec.elevation + 0.1 + (py || 0);

                  return (
                    <ProceduralFurnitureMesh
                      key={item.id}
                      item={item}
                      worldPos={[worldX, worldY, worldZ]}
                      stylePalette={stylePalette}
                      isSelected={selectedFurnitureId === item.id}
                      onSelect={(id) => selectFurnitureItem(id)}
                    />
                  );
                })}
              </group>
            );
          })}

          {/* Illuminated Exterior Storefront Brand Signage on Floor 1 Façade */}
          <group position={[0, property.floors[0]?.height || 3.5, D / 2 + 0.12]}>
            <mesh castShadow>
              <boxGeometry args={[W * 0.72, 0.72, 0.16]} />
              <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0, 0.09]}>
              <planeGeometry args={[W * 0.68, 0.54]} />
              <meshStandardMaterial
                color={lightsActive ? '#38bdf8' : '#0284c7'}
                emissive={lightsActive ? '#0ea5e9' : '#000000'}
                emissiveIntensity={lightsActive ? 1.4 : 0}
              />
            </mesh>
          </group>
        </group>
      </Canvas>
    </div>
  );
}

export default BuildingDigitalTwin;
