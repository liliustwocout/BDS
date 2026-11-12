export type ActiveTab =
  | 'landing'
  | 'discovery'
  | 'location'
  | 'twin'
  | 'environment'
  | 'studio'
  | 'comparison';

export type DataProvenance = 'verified' | 'demo' | 'ai_estimate' | 'user_input';

export type BusinessType =
  | 'coffee_shop'
  | 'restaurant'
  | 'spa'
  | 'fashion_retail'
  | 'convenience_store'
  | 'office'
  | 'showroom'
  | 'coworking';

export type DesignStyle =
  | 'minimalist'
  | 'scandinavian'
  | 'japanese'
  | 'industrial'
  | 'luxury'
  | 'modern';

export type CameraMode =
  | 'orbit'
  | 'walkthrough'
  | 'dollhouse'
  | 'floorplan'
  | 'exterior';

export type WeatherMode = 'sunny' | 'cloudy' | 'rainy';

export type TransportMode = 'foot' | 'bike' | 'car';

export type POICategory =
  | 'university'
  | 'office'
  | 'apartment'
  | 'mall'
  | 'cafe_restaurant'
  | 'competitor'
  | 'parking'
  | 'bus_stop'
  | 'hospital';

export type RoomType =
  | 'retail'
  | 'service_counter'
  | 'storage'
  | 'wc'
  | 'workspace'
  | 'private_room'
  | 'multipurpose'
  | 'utility'
  | 'hallway'
  | 'balcony';

export interface RoomGeometry {
  id: string;
  name: string;
  floor: number;
  type: RoomType;
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  area: number;
  color: string;
  features: string[];
}

export interface FloorSpec {
  level: number;
  name: string;
  elevation: number;
  height: number;
  totalArea: number;
  rooms: RoomGeometry[];
}

export interface POIItem {
  id: string;
  name: string;
  category: POICategory;
  coordinates: [number, number];
  address: string;
  provenance: DataProvenance;
  description: string;
  estimatedFootTraffic?: string;
}

export interface RouteResult {
  poiId: string;
  poiName: string;
  mode: TransportMode;
  distanceMeters: number;
  durationSeconds: number;
  geometry: [number, number][];
  isRealRouting: boolean;
  routingNote: string;
}

export type FurnitureAssetType =
  | 'counter'
  | 'espresso_bar'
  | 'table_2'
  | 'table_4'
  | 'lounge_sofa'
  | 'work_desk'
  | 'shelf_rack'
  | 'spa_bed'
  | 'reception'
  | 'display_island'
  | 'plant_divider'
  | 'storage_cabinet'
  | 'lighting_pendant'
  | 'signage';

export type FurnitureCategory =
  | 'core'
  | 'seating'
  | 'work'
  | 'storage'
  | 'decor'
  | 'signage';

export interface FurnitureItem {
  id: string;
  assetType: FurnitureAssetType;
  name: string;
  category: FurnitureCategory;
  floor: number;
  roomId: string;
  position: [number, number, number];
  rotation: number;
  scale: [number, number, number];
  dimensions: [number, number, number];
  unitCostVND: number;
  visible: boolean;
  color?: string;
}

export interface LayoutPreset {
  id: string;
  name: string;
  businessType: BusinessType;
  description: string;
  capacityPersons: number;
  spaceUtilizationPct: number;
  aisleWidthMeters: number;
  items: FurnitureItem[];
  complianceNotes: string[];
}

export interface BudgetLineItem {
  category:
    | 'furniture'
    | 'equipment'
    | 'decor'
    | 'renovation'
    | 'signage'
    | 'contingency';
  label: string;
  minVND: number;
  maxVND: number;
  estimateVND: number;
  note: string;
  provenance: DataProvenance;
}

export interface BudgetSummary {
  businessType: BusinessType;
  style: DesignStyle;
  areaSqm: number;
  lines: BudgetLineItem[];
  totalMinVND: number;
  totalMaxVND: number;
  totalEstimateVND: number;
  assumptions: string[];
}

export interface MatchBreakdown {
  overallScore: number;
  budgetScore: number;
  areaScore: number;
  locationScore: number;
  frontageScore: number;
  parkingScore: number;
  reasons: string[];
  warnings: string[];
  provenance: DataProvenance;
}

export interface LandlordContact {
  name: string;
  phone: string;
  zaloPhone?: string;
  role: 'Chính chủ' | 'Đại diện ủy quyền' | 'Quản lý tòa nhà';
  responseSpeed: string; // e.g. "Phản hồi trong 15 phút"
  viewingAvailability: string; // e.g. "Xem mặt bằng các ngày trong tuần (8h - 18h)"
  handoverOffer?: string; // e.g. "Hỗ trợ 15 ngày setup miễn phí & bàn giao thô hoàn thiện"
}

export interface PropertyItem {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  district: string;
  city: string;
  address: string;
  coordinates: [number, number];
  monthlyRentMillionVND: number;
  salePriceBillionVND?: number;
  totalAreaSqm: number;
  floorAreaSqm: number;
  floorsCount: number;
  frontageMeters: number;
  roadWidthMeters: number;
  parkingSpotsMotorbike: number;
  parkingSpotsCar: number;
  orientationAzimuth: number;
  orientationLabel: string;
  buildingWidth: number;
  buildingDepth: number;
  provenance: DataProvenance;
  provenanceNote: string;
  tags: string[];
  suitableBusinesses: BusinessType[];
  highlights: string[];
  risksToSurvey: string[];
  contact: LandlordContact;
  floors: FloorSpec[];
  nearbyPOIs: POIItem[];
  defaultMatch?: MatchBreakdown;
}

export interface ParsedSearchIntent {
  rawQuery: string;
  detectedBusiness?: BusinessType;
  detectedDistrict?: string;
  maxBudgetMillionVND?: number;
  minAreaSqm?: number;
  maxAreaSqm?: number;
  minFrontageMeters?: number;
  needsParking?: boolean;
  nearCategories: POICategory[];
  summaryExplanation: string;
  isAIExtracted: boolean;
}

export interface LocationBIReport {
  propertyId: string;
  businessType: BusinessType;
  suitabilitySummary: string;
  targetCustomerSegments: {
    segment: string;
    rationale: string;
    basis: 'real_poi' | 'inferred';
  }[];
  competitorAnalysis: {
    countWithin500m: number;
    densityLevel: 'Low' | 'Moderate' | 'High';
    summary: string;
  };
  complementaryServices: string[];
  serviceGaps: string[];
  fieldSurveyRisks: string[];
  missingDataDisclaimers: string[];
}

export interface SolarPositionResult {
  altitudeDeg: number;
  azimuthDeg: number;
  sunVector: [number, number, number];
  isDaylight: boolean;
  solarIntensity: number;
  directFrontageExposure: 'high' | 'moderate' | 'low' | 'none';
  glareWarning: boolean;
  summaryVi: string;
}

export interface Building3DFootprint {
  id: string;
  name: string;
  type:
    | 'commercial'
    | 'office'
    | 'residential'
    | 'retail'
    | 'landmark'
    | 'hotel'
    | 'cultural'
    | 'shophouse';
  coordinates: [number, number][]; // Closed ring of [lng, lat]
  height: number; // Height in meters (12m - 75m)
  minHeight?: number; // Base height offset (default 0)
  color?: string; // Hex color for MapLibre extrusion
  roofColor?: string;
  floors?: number;
  description?: string;
  propertyId?: string;
  isSubjectProperty?: boolean;
}

export interface DesignStyleMeta {
  label: string;
  wallColor: string;
  floorColor: string;
  accentColor: string;
  woodTone: string;
  metalTone: string;
  costMultiplier: number;
  description: string;
}

export const DESIGN_STYLE_META: Record<DesignStyle, DesignStyleMeta> = {
  minimalist: {
    label: 'Minimalist (Tối giản Đương đại)',
    wallColor: '#f8fafc',
    floorColor: '#e2e8f0',
    accentColor: '#0284c7',
    woodTone: '#e2d9cc',
    metalTone: '#64748b',
    costMultiplier: 0.95,
    description:
      'Đường nét thanh thoát, tường thạch cao trắng kem kết hợp sàn bê tông mài sáng và điểm nhấn kim loại satin trang nhã.',
  },
  scandinavian: {
    label: 'Scandinavian (Bắc Âu Tươi sáng)',
    wallColor: '#fafaf9',
    floorColor: '#f1ede4',
    accentColor: '#0ea5e9',
    woodTone: '#dfcfbe',
    metalTone: '#94a3b8',
    costMultiplier: 1.0,
    description:
      'Gỗ sồi sáng màu tự nhiên, tường sơn trắng ấm, đón trọn ánh sáng ban ngày và tối ưu năng lượng.',
  },
  japanese: {
    label: 'Japandi / Zen (Nhật Bản Tinh tế)',
    wallColor: '#faf8f5',
    floorColor: '#eadecb',
    accentColor: '#059669',
    woodTone: '#cbb69d',
    metalTone: '#57534e',
    costMultiplier: 1.12,
    description:
      'Không gian tĩnh tại với gỗ sáng mộc mạc, vách nan thanh lịch, sỏi trắng và ánh sáng tự nhiên dịu nhẹ.',
  },
  industrial: {
    label: 'Modern Industrial (Công nghiệp Tinh giản)',
    wallColor: '#f1f5f9',
    floorColor: '#cbd5e1',
    accentColor: '#d97706',
    woodTone: '#b59a7a',
    metalTone: '#475569',
    costMultiplier: 1.04,
    description:
      'Trần mở sơn sáng, sàn vi xi măng phẳng mịn, điểm nhấn khung nhôm đen satin và đèn rọi thanh lịch.',
  },
  luxury: {
    label: 'Modern Luxury (Sang trọng Đương đại)',
    wallColor: '#f8fafc',
    floorColor: '#f1f5f9',
    accentColor: '#ca8a04',
    woodTone: '#a38162',
    metalTone: '#d97706',
    costMultiplier: 1.38,
    description:
      'Đá Marble sáng vân mây, nẹp viền đồng satin chải xước, kính cường lực siêu trong và nội thất da cao cấp.',
  },
  modern: {
    label: 'Modern Commercial (Thương mại Hiện đại)',
    wallColor: '#f8fafc',
    floorColor: '#e2e8f0',
    accentColor: '#2563eb',
    woodTone: '#d4c5b3',
    metalTone: '#64748b',
    costMultiplier: 1.08,
    description:
      'Bố cục mở linh hoạt, vật liệu cách âm cao cấp, màu sắc trung tính tươi sáng phù hợp đa dạng mô hình kinh doanh.',
  },
};
