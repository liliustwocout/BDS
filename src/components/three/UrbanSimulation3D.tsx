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
  Route,
  Trash2,
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

export type FlightTarget = 'school' | 'competitor' | 'bus' | 'residence' | null;

interface FlightPathDef {
  curve: THREE.CatmullRomCurve3;
  targetLook: THREE.Vector3;
}

const FLIGHT_PATHS: Record<Exclude<FlightTarget, null>, FlightPathDef> = {
  school: {
    curve: new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(0, 3.2, 7.5),
        new THREE.Vector3(-4, 3.0, 4.5),
        new THREE.Vector3(-10, 3.2, 4.5),
        new THREE.Vector3(-15, 4.2, 7.5),
        new THREE.Vector3(-18, 5.5, 12.0),
      ],
      false,
      'catmullrom',
      0.4
    ),
    targetLook: new THREE.Vector3(-18, 3.8, 11.5),
  },
  competitor: {
    curve: new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(0, 3.2, 7.5),
        new THREE.Vector3(2.5, 3.0, 5.0),
        new THREE.Vector3(5.0, 3.2, 5.5),
        new THREE.Vector3(6.2, 3.8, 8.5),
      ],
      false,
      'catmullrom',
      0.4
    ),
    targetLook: new THREE.Vector3(6.2, 2.5, 5.6),
  },
  bus: {
    curve: new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(0, 3.2, 7.5),
        new THREE.Vector3(-2.5, 2.5, 4.5),
        new THREE.Vector3(-5.5, 2.2, 5.0),
      ],
      false,
      'catmullrom',
      0.4
    ),
    targetLook: new THREE.Vector3(-5.5, 1.2, 3.4),
  },
  residence: {
    curve: new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(0, 3.2, 7.5),
        new THREE.Vector3(8, 3.8, 4.5),
        new THREE.Vector3(14, 6.0, 8.0),
        new THREE.Vector3(22, 11.0, 16.0),
      ],
      false,
      'catmullrom',
      0.4
    ),
    targetLook: new THREE.Vector3(24, 11.0, 15.0),
  },
};

/**
 * Camera Controller supporting 3 Presets & Cinematic Route Fly-Along
 */
function SimulationCameraController({
  preset,
  activeFlight,
  onFlightComplete,
}: {
  preset: CameraPreset;
  activeFlight: FlightTarget;
  onFlightComplete?: () => void;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const targetPos = useRef(new THREE.Vector3(24, 21, 26));
  const targetLook = useRef(new THREE.Vector3(0, 2, 0));
  const flightProgressRef = useRef<number>(0);
  const isFlyingRef = useRef<boolean>(false);

  useEffect(() => {
    if (activeFlight) {
      flightProgressRef.current = 0;
      isFlyingRef.current = true;
    } else {
      isFlyingRef.current = false;
      switch (preset) {
        case 'front':
          // Street-level front perspective: looking directly at commercial building entrance
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
    }
  }, [preset, activeFlight]);

  useFrame((state, delta) => {
    if (activeFlight && isFlyingRef.current) {
      const flightDef = FLIGHT_PATHS[activeFlight];
      if (flightDef) {
        // Smoothly advance camera along path (~4.5s duration)
        flightProgressRef.current = Math.min(1, flightProgressRef.current + delta * 0.22);
        const p = flightProgressRef.current;
        const curPos = flightDef.curve.getPointAt(p);
        const lookPos = p < 0.94 ? flightDef.curve.getPointAt(p + 0.06) : flightDef.targetLook;

        camera.position.lerp(curPos, 0.18);
        if (controlsRef.current) {
          controlsRef.current.target.lerp(lookPos, 0.18);
          controlsRef.current.update();
        }

        if (p >= 1) {
          isFlyingRef.current = false;
          onFlightComplete?.();
        }
      }
    } else {
      camera.position.lerp(targetPos.current, 0.08);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLook.current, 0.08);
        controlsRef.current.update();
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      maxPolarAngle={Math.PI / 2 - 0.04}
      minDistance={4}
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
  const { properties, selectedPropertyId, selectedBusinessType, activeRoutes, clearRoutes } = useSpaceVisionStore();

  const property = useMemo(() => {
    if (propOverride) return propOverride;
    return properties.find((p) => p.id === selectedPropertyId) || properties[0];
  }, [propOverride, properties, selectedPropertyId]);

  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('overview');
  const [isNight, setIsNight] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [activeFlight, setActiveFlight] = useState<FlightTarget>(null);
  const [flightStatusText, setFlightStatusText] = useState<string>('');
  const [showConnectionLines, setShowConnectionLines] = useState<boolean>(true);

  // Sync with global activeRoutes: if routes are cleared, hide connection lines
  useEffect(() => {
    if (activeRoutes.length === 0) {
      setShowConnectionLines(false);
    } else {
      setShowConnectionLines(true);
    }
  }, [activeRoutes.length]);

  const startFlight = (target: FlightTarget) => {
    if (!target) {
      setActiveFlight(null);
      setFlightStatusText('');
      return;
    }
    setActiveFlight(target);
    setShowConnectionLines(true);
    const titles: Record<Exclude<FlightTarget, null>, string> = {
      school: 'Trường học (190 m • ~40 khách/ngày)',
      competitor: 'Đối thủ cùng ngành (300 m)',
      bus: 'Trạm xe buýt (130 m • ~11 khách/ngày)',
      residence: 'Khu dân cư cao tầng (230 m • ~31 khách/ngày)',
    };
    setFlightStatusText(titles[target]);
  };

  const stopFlight = () => {
    setActiveFlight(null);
    setFlightStatusText('');
    setCameraPreset('overview');
  };

  const toggleConnectionLines = () => {
    if (showConnectionLines) {
      setShowConnectionLines(false);
      clearRoutes();
    } else {
      setShowConnectionLines(true);
    }
  };

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
    <div className={`relative w-full h-full min-h-[580px] bg-slate-100 overflow-hidden select-none font-sans ${className}`}>
      {/* 1. TOP-LEFT STATS HUD OVERLAY (SpaceVision Architectural Light Brand Theme) */}
      <div className="absolute top-4 left-4 z-20 pointer-events-auto max-w-sm sm:max-w-md bg-white/95 text-slate-900 rounded-2xl p-4 border border-slate-200/90 shadow-2xl backdrop-blur-md animate-fade-in">
        {/* Category & Title */}
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200">
            HẠNG 1 / 8 • {bizLabel.toUpperCase()}
          </span>
          <span className="text-xs text-slate-500 font-medium truncate">
            {property.district}, {property.city}
          </span>
        </div>

        <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
          {property.title}
        </h2>
        <p className="text-xs text-slate-500 truncate mt-0.5">
          {property.address} • {property.floorAreaSqm} m²/sàn • {property.monthlyRentMillionVND} tr/tháng
        </p>

        {/* Highlights Row */}
        <div className="flex items-center gap-2 my-2.5 py-2 px-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div className="font-extrabold text-blue-600">{overallScore} điểm</div>
          <div className="text-slate-300">•</div>
          <div className="text-slate-700 font-medium">~124 khách/ngày</div>
          <div className="text-slate-300">•</div>
          <div className="text-emerald-600 font-bold">thuê = 12% d.thu</div>
        </div>

        {/* Camera Preset Buttons */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              setActiveFlight(null);
              setCameraPreset('front');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              cameraPreset === 'front' && !activeFlight
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            Mặt tiền
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveFlight(null);
              setCameraPreset('overview');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              cameraPreset === 'overview' && !activeFlight
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            Toàn cảnh
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveFlight(null);
              setCameraPreset('top');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              cameraPreset === 'top' && !activeFlight
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            Từ trên
          </button>

          <span className="ml-auto text-[11px] text-slate-500 font-medium hidden sm:inline">
            ~7.800 người qua/ngày (18% vãng lai)
          </span>
        </div>

        {/* Camera Fly-Along Route Animation Row */}
        <div className="pt-2 mt-2 border-t border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
            <span className="flex items-center gap-1.5 text-blue-600">
              <Compass className="w-3.5 h-3.5" />
              <span>Bay theo đường đi đến tiện ích:</span>
            </span>
            {activeFlight && (
              <button
                type="button"
                onClick={stopFlight}
                className="text-[10px] text-rose-600 hover:text-rose-700 font-bold underline cursor-pointer"
              >
                Dừng bay
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => startFlight('school')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                activeFlight === 'school'
                  ? 'bg-amber-500 text-white border-amber-600 font-extrabold shadow-sm'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
              title="Camera di chuyển dọc tuyến đường từ mặt bằng đến Trường học (190 m)"
            >
              Trường học (190m)
            </button>

            <button
              type="button"
              onClick={() => startFlight('competitor')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                activeFlight === 'competitor'
                  ? 'bg-rose-600 text-white border-rose-700 font-extrabold shadow-sm'
                  : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
              }`}
              title="Camera di chuyển dọc tuyến đường từ mặt bằng đến Đối thủ cùng ngành (300 m)"
            >
              Đối thủ (300m)
            </button>

            <button
              type="button"
              onClick={() => startFlight('bus')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                activeFlight === 'bus'
                  ? 'bg-purple-600 text-white border-purple-700 font-extrabold shadow-sm'
                  : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
              }`}
              title="Camera di chuyển dọc tuyến đường đến Trạm xe buýt (130 m)"
            >
              Trạm Bus (130m)
            </button>

            <button
              type="button"
              onClick={() => startFlight('residence')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                activeFlight === 'residence'
                  ? 'bg-sky-600 text-white border-sky-700 font-extrabold shadow-sm'
                  : 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100'
              }`}
              title="Camera di chuyển dọc tuyến đường đến Khu dân cư cao tầng (230 m)"
            >
              Chung cư (230m)
            </button>
          </div>
        </div>
      </div>

      {/* 2. TOP-RIGHT CONTROLS */}
      <div className="absolute top-4 right-4 z-20 pointer-events-auto flex items-center gap-2">
        {/* Toggle Connection Lines: Hiện / Xoá đường nối */}
        <button
          type="button"
          onClick={toggleConnectionLines}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition shadow-md backdrop-blur-md ${
            showConnectionLines
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white/95 text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
          title={showConnectionLines ? 'Nhấn để xoá toàn bộ đường nối tiện ích' : 'Nhấn để bật hiển thị đường nối tiện ích'}
        >
          <Route className="w-4 h-4" />
          <span className="hidden sm:inline">{showConnectionLines ? 'Đang hiện đường nối' : 'Đã xoá đường nối'}</span>
        </button>

        {onToggleAnalysis && (
          <button
            type="button"
            onClick={onToggleAnalysis}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/95 text-slate-800 border border-slate-200 text-xs font-bold hover:bg-slate-50 transition shadow-md backdrop-blur-md"
            title="Mở bảng phân tích tiện ích & báo cáo vị trí"
          >
            <Layers className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Phân tích</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            stopFlight();
            setCameraPreset('overview');
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/95 text-slate-800 border border-slate-200 text-xs font-bold hover:bg-slate-50 transition shadow-md backdrop-blur-md"
          title="Đặt lại camera về góc nhìn toàn cảnh"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
          <span className="hidden sm:inline">Bắt đầu lại</span>
        </button>

        <button
          type="button"
          onClick={() => setIsNight((n) => !n)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/95 text-slate-800 border border-slate-200 text-xs font-bold hover:bg-slate-50 transition shadow-md backdrop-blur-md"
          title="Chuyển chế độ ngày/đêm"
        >
          {isNight ? (
            <>
              <Sun className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">Chế độ sáng</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Chế độ tối</span>
            </>
          )}
        </button>
      </div>

      {/* 2.5 ACTIVE FLIGHT NOTIFICATION BANNER */}
      {activeFlight && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/95 text-slate-900 border-2 border-blue-500 shadow-2xl backdrop-blur-md animate-fade-in pointer-events-auto">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
          </div>
          <div className="text-xs">
            <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
              <span>Đang bay theo đường đi:</span>
              <span className="text-blue-600">{flightStatusText}</span>
            </div>
            <div className="text-[10px] text-slate-500">
              Camera di chuyển mượt mà dọc theo lộ trình từ mặt bằng đến điểm đích
            </div>
          </div>
          <button
            type="button"
            onClick={stopFlight}
            className="ml-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 border border-slate-200 transition cursor-pointer"
          >
            Dừng / Về toà nhà
          </button>
        </div>
      )}

      {/* 3. BOTTOM METRICS HUD BAR (SpaceVision Architectural Light Palette) */}
      <div className="absolute bottom-4 left-3 right-3 sm:left-4 sm:right-4 z-20 pointer-events-auto flex flex-wrap items-center justify-between gap-3 bg-white/95 text-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-2xl backdrop-blur-lg">
        {/* Core Stats Group */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-center sm:text-left">
          {/* Match Score */}
          <div>
            <div className="text-[11px] text-slate-500 font-semibold">Điểm phù hợp</div>
            <div className="text-base sm:text-lg font-extrabold text-blue-600">
              {overallScore}/100
            </div>
          </div>

          {/* Customers/Day */}
          <div>
            <div className="text-[11px] text-slate-500 font-semibold">Khách/ngày</div>
            <div className="text-base sm:text-lg font-bold text-slate-900">~124</div>
          </div>

          {/* Rent/Revenue Ratio */}
          <div>
            <div className="text-[11px] text-slate-500 font-semibold">Thuê / doanh thu</div>
            <div className="text-base sm:text-lg font-bold text-emerald-600">12%</div>
          </div>

          {/* Foot traffic */}
          <div className="hidden md:block">
            <div className="text-[11px] text-slate-500 font-semibold">Người qua lại</div>
            <div className="text-base sm:text-lg font-bold text-slate-800">~7.800/ngày</div>
          </div>

          {/* Nearest School (Yellow Highlight - Clickable to Fly) */}
          <div
            onClick={() => startFlight('school')}
            className="flex items-center gap-2 pl-2 border-l border-slate-200 cursor-pointer hover:bg-amber-50/70 p-1.5 rounded-xl transition"
            title="Nhấn để camera bay theo đường đi đến Trường học"
          >
            <div className="w-2.5 h-2.5 rounded-sm bg-amber-500 shrink-0"></div>
            <div>
              <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                <span>Trường học gần nhất</span>
                <Compass className="w-3 h-3 text-amber-600" />
              </div>
              <div className="text-sm sm:text-base font-extrabold text-amber-700">
                {schoolPOIs[0] ? '190 m' : '180 m'}
              </div>
            </div>
          </div>

          {/* Competitor count (Red Highlight - Clickable to Fly) */}
          <div
            onClick={() => startFlight('competitor')}
            className="flex items-center gap-2 pl-2 border-l border-slate-200 cursor-pointer hover:bg-rose-50/70 p-1.5 rounded-xl transition"
            title="Nhấn để camera bay theo đường đi đến Đối thủ"
          >
            <div className="w-2.5 h-2.5 rounded-sm bg-rose-600 shrink-0"></div>
            <div>
              <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                <span>Đối thủ cùng ngành</span>
                <Compass className="w-3 h-3 text-rose-600" />
              </div>
              <div className="text-sm sm:text-base font-extrabold text-rose-600">
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
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm transition shadow-lg shadow-blue-500/25"
          >
            <Phone className="w-4 h-4 text-white" />
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
        <color attach="background" args={[isNight ? '#090d16' : '#e8eef5']} />

        <SimulationCameraController
          preset={cameraPreset}
          activeFlight={activeFlight}
          onFlightComplete={() => {}}
        />

        {/* Ambient & Directional Lighting */}
        <ambientLight intensity={isNight ? 0.35 : 0.95} color={isNight ? '#38bdf8' : '#ffffff'} />
        <directionalLight
          position={[25, 40, 20]}
          intensity={isNight ? 0.4 : 1.5}
          color={isNight ? '#93c5fd' : '#ffffff'}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        {/* Ground Terrain Plane - Warm Architectural Canvas Tone */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial
            color={isNight ? '#0f172a' : '#f8fafc'}
            roughness={0.9}
          />
        </mesh>

        {/* Main Boulevard Asphalt (X-axis, width 6.4m, length 80m) */}
        <mesh position={[0, 0.01, 0]} receiveShadow>
          <boxGeometry args={[80, 0.02, 6.4]} />
          <meshStandardMaterial color={isNight ? '#1e293b' : '#475569'} roughness={0.7} />
        </mesh>

        {/* Cross Street Asphalt (Z-axis, width 5.2m, length 60m) */}
        <mesh position={[12.5, 0.015, 0]} receiveShadow>
          <boxGeometry args={[5.2, 0.02, 60]} />
          <meshStandardMaterial color={isNight ? '#1e293b' : '#475569'} roughness={0.7} />
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
              color="#38bdf8"
              roughness={0.1}
              metalness={0.8}
              transparent
              opacity={0.85}
            />
          </mesh>

          {/* Storefront Awning (Mái hiên kinh doanh) */}
          <mesh position={[0, 2.7, -3.7]} rotation={[0.25, 0, 0]} castShadow>
            <boxGeometry args={[4.0, 0.08, 0.9]} />
            <meshStandardMaterial color="#1d4ed8" />
          </mesh>

          {/* Roof Terrace detail */}
          <mesh position={[0, 6.45, 0]}>
            <boxGeometry args={[4.0, 0.1, 6.6]} />
            <meshStandardMaterial color="#1e40af" />
          </mesh>

          {/* Floating 3D Badge: "Mặt bằng • 68 điểm" */}
          <Html position={[0, 7.5, 0]} center distanceFactor={18}>
            <div className="select-none pointer-events-auto px-3.5 py-1.5 rounded-xl bg-blue-600 text-white border-2 border-white shadow-2xl backdrop-blur-md flex items-center gap-2 whitespace-nowrap text-xs font-extrabold animate-pulse">
              <Building2 className="w-3.5 h-3.5 text-white" />
              <span>Mặt bằng • {overallScore} điểm</span>
            </div>
          </Html>
        </group>

        {/* =========================================================================
            2. TRƯỜNG HỌC (SCHOOLS / UNIVERSITIES — TÔNG KIẾN TRÚC VÀNG ẤM VỚI VIỀN ĐIỂM NHẤN)
           ========================================================================= */}
        {/* School 1: Campus at [-18, 0, 11.5] */}
        <group position={[-18, 0, 11.5]}>
          {/* Main School Wing */}
          <mesh position={[0, 3.8, 0]} castShadow receiveShadow>
            <boxGeometry args={[7.5, 7.6, 5.5]} />
            <meshStandardMaterial color="#fef3c7" roughness={0.5} metalness={0.05} />
          </mesh>

          {/* Secondary School Wing */}
          <mesh position={[4.5, 2.5, 1.2]} castShadow receiveShadow>
            <boxGeometry args={[3.5, 5.0, 4.2]} />
            <meshStandardMaterial color="#fde68a" roughness={0.5} metalness={0.05} />
          </mesh>

          {/* Roof Accent Trim */}
          <mesh position={[0, 7.65, 0]}>
            <boxGeometry args={[7.7, 0.15, 5.7]} />
            <meshStandardMaterial color="#f59e0b" />
          </mesh>

          {/* School Yard Catchment Circle on Ground */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[5.2, 5.4, 48]} />
            <meshBasicMaterial color="#f59e0b" transparent opacity={0.6} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
            <circleGeometry args={[5.2, 48]} />
            <meshBasicMaterial color="#fef3c7" transparent opacity={0.3} />
          </mesh>

          {/* Floating Badge (Light Architectural Glassmorphic Pill) */}
          <Html position={[0, 8.8, 0]} center distanceFactor={18}>
            <div className="select-none pointer-events-auto px-3 py-1.5 rounded-xl bg-white/95 text-slate-800 border border-slate-200/90 shadow-xl backdrop-blur-md flex items-center gap-2 whitespace-nowrap text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 ring-2 ring-amber-100"></span>
              <span>Trường học</span>
              <span className="text-slate-300 font-normal">|</span>
              <span className="text-amber-700 font-extrabold">190 m • ~40 khách/ngày • 32%</span>
            </div>
          </Html>
        </group>

        {/* School 2: Further campus at [-30, 0, 12] */}
        <group position={[-30, 0, 12]}>
          <mesh position={[0, 3.2, 0]} castShadow receiveShadow>
            <boxGeometry args={[6.5, 6.4, 5.0]} />
            <meshStandardMaterial color="#fef3c7" roughness={0.5} />
          </mesh>
          <mesh position={[0, 6.45, 0]}>
            <boxGeometry args={[6.7, 0.15, 5.2]} />
            <meshStandardMaterial color="#f59e0b" />
          </mesh>
          <Html position={[0, 7.6, 0]} center distanceFactor={20}>
            <div className="select-none pointer-events-auto px-3 py-1.5 rounded-xl bg-white/95 text-slate-800 border border-slate-200/90 shadow-xl backdrop-blur-md flex items-center gap-2 whitespace-nowrap text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 ring-2 ring-amber-100"></span>
              <span>Trường học</span>
              <span className="text-slate-300 font-normal">|</span>
              <span className="text-amber-700 font-extrabold">380 m • ~20 khách/ngày • 16%</span>
            </div>
          </Html>
        </group>

        {/* =========================================================================
            3. ĐỐI THỦ CÙNG NGÀNH (COMPETITORS — MẶT TIỀN THƯƠNG MẠI CÓ BANNER ĐỎ)
           ========================================================================= */}
        {/* Competitor 1: Adjacent at [6.2, 0, 5.6] */}
        <group position={[6.2, 0, 5.6]}>
          <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[3.6, 5.0, 6.8]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.4} />
          </mesh>
          {/* Competitor signage banner */}
          <mesh position={[0, 3.2, -3.42]}>
            <planeGeometry args={[3.2, 0.6]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
          <mesh position={[0, 4.6, 0]}>
            <boxGeometry args={[3.6, 0.1, 6.8]} />
            <meshStandardMaterial color="#dc2626" />
          </mesh>
          <Html position={[0, 6.2, 0]} center distanceFactor={18}>
            <div className="select-none pointer-events-auto px-3 py-1.5 rounded-xl bg-white/95 text-slate-800 border border-slate-200/90 shadow-xl backdrop-blur-md flex items-center gap-2 whitespace-nowrap text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0 ring-2 ring-rose-100"></span>
              <span>Đối thủ cùng ngành</span>
              <span className="text-slate-300 font-normal">|</span>
              <span className="text-rose-600 font-extrabold">3 trong 300 m</span>
            </div>
          </Html>
        </group>

        {/* Competitor 2: Across the street at [-10.5, 0, -5.6] */}
        <group position={[-10.5, 0, -5.6]}>
          <mesh position={[0, 2.8, 0]} castShadow receiveShadow>
            <boxGeometry args={[3.8, 5.6, 6.5]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.4} />
          </mesh>
          <mesh position={[0, 3.5, 3.26]}>
            <planeGeometry args={[3.4, 0.6]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
        </group>

        {/* =========================================================================
            4. KHU DÂN CƯ / CHUNG CƯ CAO TẦNG (RESIDENTIAL TOWERS — TOÀ NHÀ HIỆN ĐẠI MẶT KÍNH)
           ========================================================================= */}
        {/* Tower 1 */}
        <group position={[20, 0, 14]}>
          <mesh position={[0, 9.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[5.5, 19.0, 5.5]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.3} metalness={0.2} />
          </mesh>
          {/* Glass balcony vertical stripe */}
          <mesh position={[0, 9.5, -2.76]}>
            <planeGeometry args={[1.6, 18.2]} />
            <meshStandardMaterial color="#38bdf8" metalness={0.7} roughness={0.2} />
          </mesh>
        </group>

        {/* Tower 2 */}
        <group position={[28, 0, 16]}>
          <mesh position={[0, 11.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[5.8, 23.0, 5.8]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.3} metalness={0.2} />
          </mesh>
          {/* Glass balcony vertical stripe */}
          <mesh position={[0, 11.5, -2.91]}>
            <planeGeometry args={[1.8, 22.0]} />
            <meshStandardMaterial color="#0284c7" metalness={0.7} roughness={0.2} />
          </mesh>
          <Html position={[0, 24.5, 0]} center distanceFactor={22}>
            <div className="select-none pointer-events-auto px-3 py-1.5 rounded-xl bg-white/95 text-slate-800 border border-slate-200/90 shadow-xl backdrop-blur-md flex items-center gap-2 whitespace-nowrap text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0 ring-2 ring-sky-100"></span>
              <span>Khu dân cư</span>
              <span className="text-slate-300 font-normal">|</span>
              <span className="text-sky-700 font-extrabold">230 m • ~31 khách/ngày • 25%</span>
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
            <div className="select-none pointer-events-auto px-2.5 py-1 rounded-xl bg-white/95 text-slate-800 border border-slate-200/90 shadow-xl backdrop-blur-md flex items-center gap-2 whitespace-nowrap text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0 ring-2 ring-purple-100"></span>
              <span>Trạm xe buýt</span>
              <span className="text-slate-300 font-normal">|</span>
              <span className="text-purple-700 font-extrabold">130 m • ~11 khách/ngày • 9%</span>
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
        {showConnectionLines && (
          <>
            {/* Line to School 1 (Gold) */}
            <Line
              points={[
                [0, 0.4, 3.4],
                [-10, 0.4, 3.4],
                [-18, 0.4, 8.0],
              ]}
              color="#f59e0b"
              lineWidth={activeFlight === 'school' ? 4.5 : 2.5}
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
              lineWidth={activeFlight === 'bus' ? 4.5 : 2.5}
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
              lineWidth={activeFlight === 'competitor' ? 4.5 : 2.5}
              dashed
              dashSize={0.4}
              gapSize={0.2}
            />

            {/* Line to Residence (Sky Blue) */}
            <Line
              points={[
                [0, 0.4, 3.4],
                [8, 0.4, 3.4],
                [13.5, 0.4, 8.0],
                [24, 0.4, 15.0],
              ]}
              color="#38bdf8"
              lineWidth={activeFlight === 'residence' ? 4.5 : 2.5}
              dashed
              dashSize={0.5}
              gapSize={0.3}
            />
          </>
        )}

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
