'use client';

import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import {
  Building2,
  Car,
  Footprints,
  Compass,
  Layers,
  Sparkles,
  Phone,
  MessageCircle,
  Clock,
  Eye,
  Maximize2,
  RefreshCw,
  Sun,
  Moon,
  School,
  Store,
  Users,
  Bus,
  ArrowRight,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { PropertyItem, BusinessType } from '@/types';
import { useSpaceVisionStore } from '@/store/useSpaceVisionStore';
import { scorePropertyForIntent, BUSINESS_TYPE_META } from '@/lib/aiEngine';
import { LandlordContactModal } from '@/components/common/LandlordContactCard';

export interface UrbanSimulation3DProps {
  property?: PropertyItem;
  className?: string;
  onOpenContact?: () => void;
  onToggleAnalysis?: () => void;
}

type CameraPreset = 'front' | 'overview' | 'top';

// Animated Car specification
interface CarEntity {
  id: number;
  lane: 'east' | 'west' | 'cross_north' | 'cross_south';
  speed: number;
  initialOffset: number;
  color: string;
  isTruck?: boolean;
}

// Animated Pedestrian specification
interface PedestrianEntity {
  id: number;
  sidewalk: 'north' | 'south' | 'crosswalk';
  speed: number;
  initialOffset: number;
  color: string;
}

/**
 * Procedural low-poly tree mesh
 */
const LowPolyTree = React.memo(function LowPolyTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 0.9, 5]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </mesh>
      {/* Foliage tier 1 */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <coneGeometry args={[0.65, 1.1, 6]} />
        <meshStandardMaterial color="#22c55e" roughness={0.8} />
      </mesh>
      {/* Foliage tier 2 */}
      <mesh position={[0, 1.65, 0]} castShadow>
        <coneGeometry args={[0.48, 0.9, 6]} />
        <meshStandardMaterial color="#16a34a" roughness={0.8} />
      </mesh>
    </group>
  );
});

/**
 * Animated Traffic & Pedestrian System inside the 3D Canvas
 */
function TrafficAndPedestrians({ isNight }: { isNight: boolean }) {
  const carsGroupRef = useRef<THREE.Group>(null);
  const pedsGroupRef = useRef<THREE.Group>(null);

  // Generate realistic traffic pool
  const cars = useMemo<CarEntity[]>(() => {
    const colors = ['#f8fafc', '#ef4444', '#3b82f6', '#f59e0b', '#64748b', '#ffffff', '#10b981'];
    return [
      { id: 1, lane: 'east', speed: 8.5, initialOffset: 0.05, color: colors[0] },
      { id: 2, lane: 'east', speed: 9.0, initialOffset: 0.35, color: colors[1] },
      { id: 3, lane: 'east', speed: 8.0, initialOffset: 0.70, color: colors[2] },
      { id: 4, lane: 'west', speed: 8.2, initialOffset: 0.15, color: colors[3] },
      { id: 5, lane: 'west', speed: 9.4, initialOffset: 0.48, color: colors[4] },
      { id: 6, lane: 'west', speed: 7.8, initialOffset: 0.82, color: colors[5] },
      { id: 7, lane: 'cross_north', speed: 6.5, initialOffset: 0.20, color: colors[6] },
      { id: 8, lane: 'cross_south', speed: 6.8, initialOffset: 0.65, color: colors[1] },
    ];
  }, []);

  // Generate realistic pedestrian pool
  const pedestrians = useMemo<PedestrianEntity[]>(() => {
    const shirtColors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#0ea5e9'];
    return [
      { id: 1, sidewalk: 'south', speed: 1.4, initialOffset: 0.1, color: shirtColors[0] },
      { id: 2, sidewalk: 'south', speed: 1.6, initialOffset: 0.3, color: shirtColors[1] },
      { id: 3, sidewalk: 'south', speed: 1.3, initialOffset: 0.6, color: shirtColors[2] },
      { id: 4, sidewalk: 'north', speed: 1.5, initialOffset: 0.2, color: shirtColors[3] },
      { id: 5, sidewalk: 'north', speed: 1.7, initialOffset: 0.5, color: shirtColors[4] },
      { id: 6, sidewalk: 'north', speed: 1.3, initialOffset: 0.8, color: shirtColors[5] },
      { id: 7, sidewalk: 'crosswalk', speed: 1.2, initialOffset: 0.15, color: shirtColors[0] },
      { id: 8, sidewalk: 'crosswalk', speed: 1.2, initialOffset: 0.65, color: shirtColors[2] },
    ];
  }, []);

  // Refs for tracking position in loop
  const carPositionsRef = useRef<number[]>(cars.map((c) => c.initialOffset));
  const pedPositionsRef = useRef<number[]>(pedestrians.map((p) => p.initialOffset));

  useFrame((state, delta) => {
    // 1. Move Cars
    if (carsGroupRef.current) {
      cars.forEach((car, idx) => {
        carPositionsRef.current[idx] = (carPositionsRef.current[idx] + (car.speed * delta) / 70) % 1;
        const progress = carPositionsRef.current[idx];
        const carMesh = carsGroupRef.current?.children[idx];
        if (carMesh) {
          if (car.lane === 'east') {
            // Driving along main avenue from -35 to +35
            const x = -35 + progress * 70;
            const z = 1.6; // Eastbound lane
            carMesh.position.set(x, 0.22, z);
            carMesh.rotation.y = 0;
          } else if (car.lane === 'west') {
            // Driving westbound from +35 to -35
            const x = 35 - progress * 70;
            const z = -1.6; // Westbound lane
            carMesh.position.set(x, 0.22, z);
            carMesh.rotation.y = Math.PI;
          } else if (car.lane === 'cross_north') {
            // Driving cross street northbound
            const x = 11.5;
            const z = 30 - progress * 60;
            carMesh.position.set(x, 0.22, z);
            carMesh.rotation.y = -Math.PI / 2;
          } else if (car.lane === 'cross_south') {
            // Driving cross street southbound
            const x = 13.5;
            const z = -30 + progress * 60;
            carMesh.position.set(x, 0.22, z);
            carMesh.rotation.y = Math.PI / 2;
          }
        }
      });
    }

    // 2. Move Pedestrians
    if (pedsGroupRef.current) {
      pedestrians.forEach((ped, idx) => {
        pedPositionsRef.current[idx] = (pedPositionsRef.current[idx] + (ped.speed * delta) / 40) % 1;
        const progress = pedPositionsRef.current[idx];
        const pedMesh = pedsGroupRef.current?.children[idx];
        if (pedMesh) {
          if (ped.sidewalk === 'south') {
            const x = -28 + progress * 56;
            const z = 3.6;
            pedMesh.position.set(x, 0.35 + Math.sin(state.clock.elapsedTime * 6) * 0.03, z);
          } else if (ped.sidewalk === 'north') {
            const x = 28 - progress * 56;
            const z = -3.6;
            pedMesh.position.set(x, 0.35 + Math.sin(state.clock.elapsedTime * 6) * 0.03, z);
          } else if (ped.sidewalk === 'crosswalk') {
            const x = -2.5;
            const z = -3.5 + progress * 7.0;
            pedMesh.position.set(x, 0.35 + Math.sin(state.clock.elapsedTime * 6) * 0.03, z);
          }
        }
      });
    }
  });

  return (
    <>
      {/* 3D Moving Cars */}
      <group ref={carsGroupRef}>
        {cars.map((car) => (
          <group key={car.id}>
            {/* Car body */}
            <mesh castShadow position={[0, 0, 0]}>
              <boxGeometry args={[1.5, 0.42, 0.78]} />
              <meshStandardMaterial color={car.color} roughness={0.3} metalness={0.4} />
            </mesh>
            {/* Cabin/Windows */}
            <mesh position={[-0.1, 0.32, 0]}>
              <boxGeometry args={[0.78, 0.32, 0.7]} />
              <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.8} />
            </mesh>
            {/* Headlights */}
            <mesh position={[0.76, 0.05, 0.24]}>
              <boxGeometry args={[0.04, 0.1, 0.16]} />
              <meshBasicMaterial color={isNight ? '#fef08a' : '#ffffff'} />
            </mesh>
            <mesh position={[0.76, 0.05, -0.24]}>
              <boxGeometry args={[0.04, 0.1, 0.16]} />
              <meshBasicMaterial color={isNight ? '#fef08a' : '#ffffff'} />
            </mesh>
            {/* Night Headlight Beams */}
            {isNight && (
              <spotLight
                position={[0.8, 0.1, 0]}
                target-position={[6, 0, 0]}
                angle={0.4}
                penumbra={0.5}
                intensity={4}
                distance={12}
                color="#fef08a"
              />
            )}
          </group>
        ))}
      </group>

      {/* 3D Moving Pedestrians */}
      <group ref={pedsGroupRef}>
        {pedestrians.map((ped) => (
          <group key={ped.id}>
            {/* Torso/Shirt */}
            <mesh castShadow position={[0, 0.18, 0]}>
              <cylinderGeometry args={[0.1, 0.12, 0.36, 6]} />
              <meshStandardMaterial color={ped.color} roughness={0.7} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 0.44, 0]}>
              <sphereGeometry args={[0.1, 6, 6]} />
              <meshStandardMaterial color="#fcd34d" roughness={0.6} />
            </mesh>
            {/* Legs */}
            <mesh position={[0, -0.12, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.28, 5]} />
              <meshStandardMaterial color="#1e293b" roughness={0.8} />
            </mesh>
          </group>
        ))}
      </group>
    </>
  );
}

/**
 * Camera Controller supporting 3 Presets: Mặt tiền, Toàn cảnh, Từ trên
 */
function SimulationCameraController({ preset }: { preset: CameraPreset }) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const targetPos = useRef(new THREE.Vector3(26, 22, 28));
  const targetLook = useRef(new THREE.Vector3(0, 2, 0));

  useEffect(() => {
    switch (preset) {
      case 'front':
        // Street-level front perspective: looking directly at the commercial building entrance
        targetPos.current.set(0, 3.8, 14);
        targetLook.current.set(0, 2.5, 4.5);
        break;
      case 'overview':
        // Isometric Bird's-Eye View (matching user reference image)
        targetPos.current.set(24, 21, 26);
        targetLook.current.set(0, 2.0, 0);
        break;
      case 'top':
        // Orthogonal Top-Down Plan view
        targetPos.current.set(0, 38, 0.1);
        targetLook.current.set(0, 0, 0);
        break;
    }
  }, [preset]);

  useFrame(() => {
    camera.position.lerp(targetPos.current, 0.08);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLook.current, 0.08);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      maxPolarAngle={Math.PI / 2 - 0.04}
      minDistance={6}
      maxDistance={65}
    />
  );
}

/**
 * Main 3D Urban Simulation Component
 */
export function UrbanSimulation3D({
  property: propOverride,
  className = '',
  onOpenContact,
  onToggleAnalysis,
}: UrbanSimulation3DProps) {
  const { properties, selectedPropertyId, selectedBusinessType } = useSpaceVisionStore();

  const property = useMemo(() => {
    if (propOverride) return propOverride;
    return properties.find((p) => p.id === selectedPropertyId) || properties[0];
  }, [propOverride, properties, selectedPropertyId]);

  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('overview');
  const [isNight, setIsNight] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Dynamic Score Calculation
  const scoreData = useMemo(() => {
    return scorePropertyForIntent(property, null, selectedBusinessType);
  }, [property, selectedBusinessType]);

  const overallScore = Math.round(scoreData.overallScore || 68);
  const bizLabel = BUSINESS_TYPE_META[selectedBusinessType]?.labelVi || 'Cà phê & Trà sữa';

  // Find representative POIs
  const schoolPOIs = useMemo(
    () => property.nearbyPOIs.filter((p) => p.category === 'university'),
    [property]
  );
  const competitorPOIs = useMemo(
    () => property.nearbyPOIs.filter((p) => p.category === 'competitor'),
    [property]
  );
  const residentialPOIs = useMemo(
    () => property.nearbyPOIs.filter((p) => p.category === 'apartment' || p.category === 'office'),
    [property]
  );
  const busPOIs = useMemo(
    () => property.nearbyPOIs.filter((p) => p.category === 'bus_stop' || p.category === 'parking'),
    [property]
  );

  return (
    <div className={`relative w-full h-full min-h-[580px] bg-slate-900 overflow-hidden select-none font-sans ${className}`}>
      {/* 1. TOP-LEFT STATS HUD OVERLAY (Matches reference design) */}
      <div className="absolute top-4 left-4 z-20 pointer-events-auto max-w-sm sm:max-w-md bg-slate-900/90 text-white rounded-2xl p-4 border border-slate-700/80 shadow-2xl backdrop-blur-md animate-fade-in">
        {/* Category & Title */}
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-sky-500/20 text-sky-300 border border-sky-400/30">
            HẠNG 1 / 8 • {bizLabel.toUpperCase()}
          </span>
          <span className="text-xs text-slate-400 font-medium truncate">
            {property.district}, {property.city}
          </span>
        </div>

        <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">
          {property.title}
        </h2>
        <p className="text-xs text-slate-400 truncate mt-0.5">
          {property.address} • {property.floorAreaSqm} m²/sàn • {property.monthlyRentMillionVND} tr/tháng
        </p>

        {/* Highlights Row */}
        <div className="flex items-center gap-2 my-2.5 py-2 px-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
          <div className="font-extrabold text-sky-400">{overallScore} điểm</div>
          <div className="text-slate-500">•</div>
          <div className="text-slate-300">~124 khách/ngày</div>
          <div className="text-slate-500">•</div>
          <div className="text-emerald-400 font-semibold">thuê = 12% d.thu</div>
        </div>

        {/* Camera Preset Buttons */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setCameraPreset('front')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              cameraPreset === 'front'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Mặt tiền
          </button>
          <button
            type="button"
            onClick={() => setCameraPreset('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              cameraPreset === 'overview'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Toàn cảnh
          </button>
          <button
            type="button"
            onClick={() => setCameraPreset('top')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              cameraPreset === 'top'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Từ trên
          </button>

          <span className="ml-auto text-[11px] text-slate-400 font-medium hidden sm:inline">
            ~7.800 người qua/ngày (18% vãng lai)
          </span>
        </div>
      </div>

      {/* 2. TOP-RIGHT CONTROLS (Matches reference image: [Phân tích] [Bắt đầu lại] [Chế độ sáng]) */}
      <div className="absolute top-4 right-4 z-20 pointer-events-auto flex items-center gap-2">
        {onToggleAnalysis && (
          <button
            type="button"
            onClick={onToggleAnalysis}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 text-white border border-slate-700 text-xs font-bold hover:bg-slate-800 transition shadow-lg backdrop-blur-md"
            title="Mở bảng phân tích tiện ích & báo cáo vị trí"
          >
            <Layers className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Phân tích</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setCameraPreset('overview')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 text-white border border-slate-700 text-xs font-bold hover:bg-slate-800 transition shadow-lg backdrop-blur-md"
          title="Đặt lại camera về góc nhìn toàn cảnh"
        >
          <RefreshCw className="w-4 h-4 text-slate-400" />
          <span className="hidden sm:inline">Bắt đầu lại</span>
        </button>

        <button
          type="button"
          onClick={() => setIsNight((n) => !n)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 text-white border border-slate-700 text-xs font-bold hover:bg-slate-800 transition shadow-lg backdrop-blur-md"
          title="Chuyển chế độ ngày/đêm"
        >
          {isNight ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Chế độ sáng</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-sky-300" />
              <span className="hidden sm:inline">Chế độ tối</span>
            </>
          )}
        </button>
      </div>

      {/* 3. BOTTOM METRICS HUD BAR (Matches reference image) */}
      <div className="absolute bottom-4 left-3 right-3 sm:left-4 sm:right-4 z-20 pointer-events-auto flex flex-wrap items-center justify-between gap-3 bg-slate-900/95 text-white rounded-2xl p-3 sm:p-4 border border-slate-700 shadow-2xl backdrop-blur-lg">
        {/* Core Stats Group */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-center sm:text-left">
          {/* Match Score */}
          <div>
            <div className="text-[11px] text-slate-400 font-semibold">Điểm phù hợp</div>
            <div className="text-base sm:text-lg font-extrabold text-sky-400">
              {overallScore}/100
            </div>
          </div>

          {/* Customers/Day */}
          <div>
            <div className="text-[11px] text-slate-400 font-semibold">Khách/ngày</div>
            <div className="text-base sm:text-lg font-bold text-white">~124</div>
          </div>

          {/* Rent/Revenue Ratio */}
          <div>
            <div className="text-[11px] text-slate-400 font-semibold">Thuê / doanh thu</div>
            <div className="text-base sm:text-lg font-bold text-emerald-400">12%</div>
          </div>

          {/* Foot traffic */}
          <div className="hidden md:block">
            <div className="text-[11px] text-slate-400 font-semibold">Người qua lại</div>
            <div className="text-base sm:text-lg font-bold text-slate-200">~7.800/ngày</div>
          </div>

          {/* Nearest School (Yellow Highlight) */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-2.5 h-2.5 rounded-sm bg-amber-400 shrink-0"></div>
            <div>
              <div className="text-[11px] text-slate-400 font-semibold">Trường học gần nhất</div>
              <div className="text-sm sm:text-base font-extrabold text-amber-300">
                {schoolPOIs[0] ? '190 m' : '180 m'}
              </div>
            </div>
          </div>

          {/* Competitor count (Red Highlight) */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-2.5 h-2.5 rounded-sm bg-rose-500 shrink-0"></div>
            <div>
              <div className="text-[11px] text-slate-400 font-semibold">Đối thủ cùng ngành</div>
              <div className="text-sm sm:text-base font-extrabold text-rose-400">
                {competitorPOIs.length > 0 ? competitorPOIs.length : 3}
              </div>
            </div>
          </div>
        </div>

        {/* Primary Contact CTA */}
        <div className="w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              if (onOpenContact) onOpenContact();
              else setIsBookingOpen(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-[0.98] text-slate-950 font-extrabold text-xs sm:text-sm transition shadow-lg"
          >
            <Phone className="w-4 h-4 text-slate-900" />
            <span>Chi tiết và liên hệ</span>
          </button>
        </div>
      </div>

      {/* 4. THREE.JS 3D CANVAS VIEWPORT */}
      <Canvas
        shadows
        camera={{ position: [24, 21, 26], fov: 42 }}
        className="w-full h-full"
      >
        <SimulationCameraController preset={cameraPreset} />

        {/* Ambient & Directional Lighting */}
        <ambientLight intensity={isNight ? 0.35 : 0.85} color={isNight ? '#38bdf8' : '#ffffff'} />
        <directionalLight
          position={[25, 40, 20]}
          intensity={isNight ? 0.4 : 1.4}
          color={isNight ? '#93c5fd' : '#fffbeb'}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        {/* Ground Terrain Plane - Warm Architectural Canvas Tone */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial
            color={isNight ? '#090d16' : '#faf9f5'}
            roughness={0.9}
          />
        </mesh>

        {/* Main Boulevard Asphalt (X-axis, width 6.4m, length 80m) */}
        <mesh position={[0, 0.01, 0]} receiveShadow>
          <boxGeometry args={[80, 0.02, 6.4]} />
          <meshStandardMaterial color={isNight ? '#1e293b' : '#64748b'} roughness={0.7} />
        </mesh>

        {/* Cross Street Asphalt (Z-axis, width 5.2m, length 60m) */}
        <mesh position={[12.5, 0.015, 0]} receiveShadow>
          <boxGeometry args={[5.2, 0.02, 60]} />
          <meshStandardMaterial color={isNight ? '#1e293b' : '#64748b'} roughness={0.7} />
        </mesh>

        {/* White Center Dashed Lane Divider on Main Avenue */}
        {Array.from({ length: 20 }).map((_, i) => (
          <mesh key={i} position={[-38 + i * 4, 0.025, 0]}>
            <planeGeometry args={[2.0, 0.16]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        ))}

        {/* Zebra Crosswalk in front of Subject Property */}
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={`cross-${i}`} position={[-2.5, 0.025, -2.6 + i * 0.74]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.42, 1.8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        ))}

        {/* Sidewalk North (Behind Buildings) */}
        <mesh position={[0, 0.08, -5.2]} receiveShadow>
          <boxGeometry args={[80, 0.14, 4.0]} />
          <meshStandardMaterial color={isNight ? '#0f172a' : '#e2e8f0'} roughness={0.8} />
        </mesh>

        {/* Sidewalk South (In front of Commercial Storefronts) */}
        <mesh position={[0, 0.08, 5.2]} receiveShadow>
          <boxGeometry args={[80, 0.14, 4.0]} />
          <meshStandardMaterial color={isNight ? '#0f172a' : '#e2e8f0'} roughness={0.8} />
        </mesh>

        {/* Roadside Decorative Trees */}
        {[-32, -24, -16, -8, 4, 20, 28, 34].map((tx) => (
          <React.Fragment key={tx}>
            <LowPolyTree position={[tx, 0.14, 4.2]} />
            <LowPolyTree position={[tx + 4, 0.14, -4.2]} />
          </React.Fragment>
        ))}

        {/* =========================================================================
            1. SUBJECT COMMERCIAL PROPERTY (MẶT BẰNG ĐANG CHỌN — MÀU XANH DƯƠNG NỔI BẬT)
           ========================================================================= */}
        <group position={[0, 0, 5.6]}>
          {/* Main 3-floor building body */}
          <mesh position={[0, 3.2, 0]} castShadow receiveShadow>
            <boxGeometry args={[4.2, 6.4, 6.8]} />
            <meshStandardMaterial color="#2563eb" roughness={0.3} metalness={0.3} />
          </mesh>

          {/* Storefront Glass & Entrance Façade */}
          <mesh position={[0, 1.4, -3.42]}>
            <planeGeometry args={[3.8, 2.6]} />
            <meshStandardMaterial
              color="#0ea5e9"
              roughness={0.1}
              metalness={0.8}
              transparent
              opacity={0.85}
            />
          </mesh>

          {/* Storefront Awning (Mái hiên kinh doanh) */}
          <mesh position={[0, 2.7, -3.7]} rotation={[0.25, 0, 0]} castShadow>
            <boxGeometry args={[4.0, 0.08, 0.9]} />
            <meshStandardMaterial color="#0284c7" />
          </mesh>

          {/* Roof Terrace detail */}
          <mesh position={[0, 6.45, 0]}>
            <boxGeometry args={[4.0, 0.1, 6.6]} />
            <meshStandardMaterial color="#1e3a8a" />
          </mesh>

          {/* Floating 3D Badge: "Mặt bằng • 68 điểm" */}
          <Html position={[0, 7.5, 0]} center distanceFactor={18}>
            <div className="select-none pointer-events-auto px-3 py-1.5 rounded-xl bg-blue-600 text-white border-2 border-white shadow-2xl backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap text-xs font-extrabold animate-pulse">
              <Building2 className="w-3.5 h-3.5 text-white" />
              <span>Mặt bằng • {overallScore} điểm</span>
            </div>
          </Html>
        </group>

        {/* =========================================================================
            2. TRƯỜNG HỌC (SCHOOLS / UNIVERSITIES — MÀU VÀNG CAM NỔI BẬT + VÒNG BÁN KÍNH)
           ========================================================================= */}
        {/* School 1: Golden Campus at [-18, 0, 12] */}
        <group position={[-18, 0, 11.5]}>
          {/* Main School Wing */}
          <mesh position={[0, 3.8, 0]} castShadow receiveShadow>
            <boxGeometry args={[7.5, 7.6, 5.5]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.4} metalness={0.1} />
          </mesh>

          {/* Secondary School Wing */}
          <mesh position={[4.5, 2.5, 1.2]} castShadow receiveShadow>
            <boxGeometry args={[3.5, 5.0, 4.2]} />
            <meshStandardMaterial color="#fbbf24" roughness={0.4} metalness={0.1} />
          </mesh>

          {/* School Yard Catchment Circle on Ground */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[5.2, 5.4, 48]} />
            <meshBasicMaterial color="#f59e0b" transparent opacity={0.7} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
            <circleGeometry args={[5.2, 48]} />
            <meshBasicMaterial color="#fef3c7" transparent opacity={0.25} />
          </mesh>

          {/* Floating Badge */}
          <Html position={[0, 8.8, 0]} center distanceFactor={18}>
            <div className="select-none pointer-events-auto px-2.5 py-1 rounded-lg bg-slate-900/95 text-white border-2 border-amber-400 shadow-xl backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 shrink-0"></span>
              <span>Trường học</span>
              <span className="text-slate-400 font-normal">|</span>
              <span className="text-amber-300 font-extrabold">190 m • ~40 khách/ngày • 32%</span>
            </div>
          </Html>
        </group>

        {/* School 2: Further campus at [-30, 0, 12] */}
        <group position={[-30, 0, 12]}>
          <mesh position={[0, 3.2, 0]} castShadow receiveShadow>
            <boxGeometry args={[6.5, 6.4, 5.0]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.4} />
          </mesh>
          <Html position={[0, 7.4, 0]} center distanceFactor={20}>
            <div className="select-none pointer-events-auto px-2.5 py-1 rounded-lg bg-slate-900/95 text-white border border-amber-400 shadow-xl backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 shrink-0"></span>
              <span>Trường học</span>
              <span className="text-slate-400 font-normal">|</span>
              <span className="text-amber-300">380 m • ~20 khách/ngày • 16%</span>
            </div>
          </Html>
        </group>

        {/* =========================================================================
            3. ĐỐI THỦ CÙNG NGÀNH (COMPETITORS — MÀU ĐỎ/CORAL NỔI BẬT)
           ========================================================================= */}
        {/* Competitor 1: Right adjacent 2 doors down at [6.5, 0, 5.6] */}
        <group position={[6.2, 0, 5.6]}>
          <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[3.6, 5.0, 6.8]} />
            <meshStandardMaterial color="#ef4444" roughness={0.35} />
          </mesh>
          {/* Competitor signage banner */}
          <mesh position={[0, 3.2, -3.42]}>
            <planeGeometry args={[3.2, 0.6]} />
            <meshStandardMaterial color="#b91c1c" />
          </mesh>
          <Html position={[0, 6.2, 0]} center distanceFactor={18}>
            <div className="select-none pointer-events-auto px-2.5 py-1 rounded-lg bg-slate-900/95 text-white border-2 border-rose-500 shadow-xl backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 shrink-0"></span>
              <span>Đối thủ cùng ngành • 3 trong 300 m</span>
            </div>
          </Html>
        </group>

        {/* Competitor 2: Across the street at [-10, 0, -5.6] */}
        <group position={[-10.5, 0, -5.6]}>
          <mesh position={[0, 2.8, 0]} castShadow receiveShadow>
            <boxGeometry args={[3.8, 5.6, 6.5]} />
            <meshStandardMaterial color="#ef4444" roughness={0.35} />
          </mesh>
        </group>

        {/* =========================================================================
            4. KHU DÂN CƯ / CHUNG CƯ CAO TẦNG (RESIDENTIAL TOWERS — MÀU XANH LAM CAO VÚT)
           ========================================================================= */}
        {/* Tower 1 */}
        <group position={[20, 0, 14]}>
          <mesh position={[0, 9.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[5.5, 19.0, 5.5]} />
            <meshStandardMaterial color="#3b82f6" roughness={0.25} metalness={0.4} />
          </mesh>
          {/* Glass balcony vertical stripe */}
          <mesh position={[0, 9.5, -2.76]}>
            <planeGeometry args={[1.6, 18.2]} />
            <meshStandardMaterial color="#93c5fd" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>

        {/* Tower 2 */}
        <group position={[28, 0, 16]}>
          <mesh position={[0, 11.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[5.8, 23.0, 5.8]} />
            <meshStandardMaterial color="#2563eb" roughness={0.25} metalness={0.4} />
          </mesh>
          <Html position={[0, 24.5, 0]} center distanceFactor={22}>
            <div className="select-none pointer-events-auto px-2.5 py-1 rounded-lg bg-slate-900/95 text-white border-2 border-sky-400 shadow-xl backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-400 shrink-0"></span>
              <span>Khu dân cư</span>
              <span className="text-slate-400 font-normal">|</span>
              <span className="text-sky-300 font-extrabold">230 m • ~31 khách/ngày • 25%</span>
            </div>
          </Html>
        </group>

        {/* =========================================================================
            5. TRẠM XE BUÝT / GIAO THÔNG (BUS STOP — MÀU TÍM)
           ========================================================================= */}
        <group position={[-5.5, 0, 3.4]}>
          {/* Shelter glass roof */}
          <mesh position={[0, 1.4, 0]}>
            <boxGeometry args={[2.0, 0.08, 0.8]} />
            <meshStandardMaterial color="#8b5cf6" roughness={0.3} />
          </mesh>
          {/* Shelter pillars */}
          <mesh position={[-0.8, 0.7, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 1.4]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          <mesh position={[0.8, 0.7, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 1.4]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          <Html position={[0, 2.4, 0]} center distanceFactor={16}>
            <div className="select-none pointer-events-auto px-2 py-0.5 rounded-lg bg-slate-900/95 text-white border border-purple-400 shadow-xl backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap text-xs font-bold">
              <span className="w-2 h-2 rounded-sm bg-purple-400 shrink-0"></span>
              <span>Trạm xe buýt</span>
              <span className="text-slate-400 font-normal">|</span>
              <span className="text-purple-300">130 m • ~11 khách/ngày • 9%</span>
            </div>
          </Html>
        </group>

        {/* =========================================================================
            6. SURROUNDING TOWNHOUSES / WHITE BLOCKS (KHU PHỐ LIỀN KỀ MINH HOẠ)
           ========================================================================= */}
        {/* Row 1 (South side along subject building) */}
        {[-14, -10, -6, 11, 15].map((bx, idx) => (
          <mesh key={`town-s-${bx}`} position={[bx, 2.2, 5.6]} castShadow receiveShadow>
            <boxGeometry args={[3.4, 4.4 + (idx % 2) * 0.6, 6.8]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.7} />
          </mesh>
        ))}

        {/* Row 2 (North side across the avenue) */}
        {[-28, -24, -20, -15, -5, 0, 5, 20, 25].map((bx, idx) => (
          <mesh key={`town-n-${bx}`} position={[bx, 2.4, -5.6]} castShadow receiveShadow>
            <boxGeometry args={[3.6, 4.8 + (idx % 3) * 0.5, 6.5]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.7} />
          </mesh>
        ))}

        {/* =========================================================================
            7. DASHED BEACON CONNECTION LINES (LỘ TRÌNH KẾT NỐI MẶT BẰNG ĐẾN CÁC TIỆN ÍCH)
           ========================================================================= */}
        {/* Line to School 1 (Gold) */}
        <Line
          points={[
            [0, 0.4, 3.4],
            [-10, 0.4, 3.4],
            [-18, 0.4, 8.0],
          ]}
          color="#f59e0b"
          lineWidth={2.5}
          dashed
          dashSize={0.5}
          gapSize={0.3}
        />

        {/* Line to Bus Stop (Purple) */}
        <Line
          points={[
            [0, 0.3, 3.4],
            [-5.5, 0.3, 3.4],
          ]}
          color="#a855f7"
          lineWidth={2.5}
          dashed
          dashSize={0.4}
          gapSize={0.2}
        />

        {/* Line to Competitor (Red) */}
        <Line
          points={[
            [0, 0.3, 3.4],
            [6.2, 0.3, 3.4],
          ]}
          color="#f43f5e"
          lineWidth={2.5}
          dashed
          dashSize={0.4}
          gapSize={0.2}
        />

        {/* =========================================================================
            8. ANIMATED CARS & PEDESTRIANS TRAFFIC
           ========================================================================= */}
        <TrafficAndPedestrians isNight={isNight} />
      </Canvas>

      {/* Booking Viewing Modal */}
      {isBookingOpen && (
        <LandlordContactModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          property={property}
          contact={property.contact}
        />
      )}
    </div>
  );
}

export default UrbanSimulation3D;
