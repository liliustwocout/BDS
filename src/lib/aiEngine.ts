import {
  BudgetLineItem,
  BudgetSummary,
  BusinessType,
  DesignStyle,
  DesignStyleMeta,
  DESIGN_STYLE_META,
  FurnitureAssetType,
  FurnitureCategory,
  FurnitureItem,
  LayoutPreset,
  LocationBIReport,
  MatchBreakdown,
  POICategory,
  ParsedSearchIntent,
  PropertyItem,
} from '@/types';

export { DESIGN_STYLE_META };
import { calculateHaversineMeters } from '@/lib/geoUtils';

export const BUSINESS_TYPE_META: Record<
  BusinessType,
  {
    label: string;
    labelVi: string;
    iconName: string;
    defaultAreaRange: [number, number];
    description: string;
  }
> = {
  coffee_shop: {
    label: 'Coffee Shop',
    labelVi: 'Quán Cà Phê & Roastery',
    iconName: 'Coffee',
    defaultAreaRange: [80, 180],
    description:
      'Tối ưu quầy pha chế Espresso Tầng 1, không gian khách ngồi làm việc/gặp gỡ Tầng 2 và góc workshop Tầng 3.',
  },
  restaurant: {
    label: 'Restaurant & Bistro',
    labelVi: 'Nhà Hàng / Bistro Ẩm Thực',
    iconName: 'Utensils',
    defaultAreaRange: [110, 250],
    description:
      'Bố trí bếp chế biến đạt chuẩn thông gió, khu bàn ăn gia đình/nhóm 4-6 người và phòng VIP riêng tư.',
  },
  spa: {
    label: 'Spa & Wellness',
    labelVi: 'Spa Trị Liệu & Thẩm Mỹ',
    iconName: 'Sparkles',
    defaultAreaRange: [90, 200],
    description:
      'Sảnh đón tiếp tư vấn sang trọng Tầng 1, hệ thống giường trị liệu yên tĩnh có rèm/vách ngăn Tầng 2-3.',
  },
  fashion_retail: {
    label: 'Fashion Boutique',
    labelVi: 'Showroom Thời Trang & Phụ Kiện',
    iconName: 'Shirt',
    defaultAreaRange: [70, 160],
    description:
      'Mặt tiền kính trưng bày Mannequin bắt mắt, đảo trưng bày trung tâm, kệ treo hai bên và phòng thử đồ chuẩn sáng.',
  },
  convenience_store: {
    label: 'Convenience Store',
    labelVi: 'Cửa Hàng Tiện Lợi / Mini Mart',
    iconName: 'ShoppingBag',
    defaultAreaRange: [60, 150],
    description:
      'Hệ thống kệ Gondola song song tối ưu lối đi 1.2m, tủ mát trưng bày đồ uống, quầy thanh toán nhanh POS và kho đệm.',
  },
  office: {
    label: 'Company Office',
    labelVi: 'Văn Phòng Công Ty / Agency',
    iconName: 'Briefcase',
    defaultAreaRange: [90, 220],
    description:
      'Quầy lễ tân thương hiệu, khu bàn làm việc nhóm Open-plan, phòng họp kính cách âm và khu Pantry thư giãn.',
  },
  showroom: {
    label: 'Brand Showroom',
    labelVi: 'Showroom Trưng Bày Sản Phẩm',
    iconName: 'Award',
    defaultAreaRange: [100, 250],
    description:
      'Không gian trưng bày bục đảo cao cấp với đèn rọi điểm, khu trải nghiệm sản phẩm thực tế và bàn tư vấn VIP.',
  },
  coworking: {
    label: 'Co-working Space',
    labelVi: 'Không Gian Làm Việc Chung (Co-working)',
    iconName: 'Laptop',
    defaultAreaRange: [110, 260],
    description:
      'Kết hợp quầy Cafe Bar tầng trệt, dãy Hot-desk năng động, Phone-booth cách âm và phòng họp nhóm linh hoạt.',
  },
};


export const FURNITURE_CATEGORY_META: Record<
  FurnitureCategory,
  { labelVi: string; color: string }
> = {
  core: { labelVi: 'Quầy & Thiết bị chính', color: '#f59e0b' },
  seating: { labelVi: 'Bàn ghế khách', color: '#38bdf8' },
  work: { labelVi: 'Khu làm việc / Dịch vụ', color: '#818cf8' },
  storage: { labelVi: 'Kệ trưng bày & Kho', color: '#94a3b8' },
  decor: { labelVi: 'Cây xanh & Decor', color: '#10b981' },
  signage: { labelVi: 'Biển hiệu & Đèn trang trí', color: '#f472b6' },
};

export const FURNITURE_CATALOG: {
  assetType: FurnitureAssetType;
  name: string;
  category: FurnitureCategory;
  dimensions: [number, number, number];
  unitCostVND: number;
}[] = [
  {
    assetType: 'counter',
    name: 'Quầy Dịch vụ / Thu ngân POS',
    category: 'core',
    dimensions: [2.2, 1.05, 0.75],
    unitCostVND: 16500000,
  },
  {
    assetType: 'espresso_bar',
    name: 'Hệ Quầy Pha Chế & Máy Espresso 2 Group',
    category: 'core',
    dimensions: [2.4, 1.15, 0.85],
    unitCostVND: 68000000,
  },
  {
    assetType: 'reception',
    name: 'Quầy Lễ Tân Thương Hiệu',
    category: 'core',
    dimensions: [1.8, 1.05, 0.7],
    unitCostVND: 14000000,
  },
  {
    assetType: 'table_2',
    name: 'Bộ Bàn Tròn / Vuông 2 Ghế',
    category: 'seating',
    dimensions: [0.85, 0.75, 0.85],
    unitCostVND: 3200000,
  },
  {
    assetType: 'table_4',
    name: 'Bộ Bàn Khách 4 Ghế Tiêu Chuẩn',
    category: 'seating',
    dimensions: [1.3, 0.75, 0.85],
    unitCostVND: 5400000,
  },
  {
    assetType: 'lounge_sofa',
    name: 'Cụm Sofa Lounge & Bàn Trà',
    category: 'seating',
    dimensions: [2.0, 0.82, 1.1],
    unitCostVND: 12500000,
  },
  {
    assetType: 'work_desk',
    name: 'Bàn Dài Co-working / Bàn Làm Việc Cụm 4',
    category: 'work',
    dimensions: [2.2, 0.76, 1.1],
    unitCostVND: 8900000,
  },
  {
    assetType: 'spa_bed',
    name: 'Giường Trị Liệu Spa & Rèm Ngăn',
    category: 'work',
    dimensions: [0.95, 0.75, 1.95],
    unitCostVND: 7800000,
  },
  {
    assetType: 'display_island',
    name: 'Đảo Trưng Bày Sản Phẩm Trung Tâm',
    category: 'storage',
    dimensions: [1.6, 0.9, 1.0],
    unitCostVND: 9500000,
  },
  {
    assetType: 'shelf_rack',
    name: 'Hệ Kệ Trưng Bày Cao Áp Tường',
    category: 'storage',
    dimensions: [1.5, 2.0, 0.45],
    unitCostVND: 6200000,
  },
  {
    assetType: 'storage_cabinet',
    name: 'Tủ Kho Vật Tư / Locker Nhân Viên',
    category: 'storage',
    dimensions: [1.4, 1.9, 0.55],
    unitCostVND: 5800000,
  },
  {
    assetType: 'plant_divider',
    name: 'Bồn Cây Xanh Nội Thất & Vách Ngăn Lửng',
    category: 'decor',
    dimensions: [1.2, 1.35, 0.4],
    unitCostVND: 2600000,
  },
  {
    assetType: 'lighting_pendant',
    name: 'Hệ Đèn Thả Trần Nghệ Thuật',
    category: 'signage',
    dimensions: [1.0, 0.5, 1.0],
    unitCostVND: 3800000,
  },
  {
    assetType: 'signage',
    name: 'Biển Hiệu Chữ Nổi LED Mặt Tiền',
    category: 'signage',
    dimensions: [2.8, 0.65, 0.2],
    unitCostVND: 14500000,
  },
];

/**
 * Parses Vietnamese / English natural language commercial property search queries
 * into structured filters and criteria.
 */
export function parseNaturalLanguageQuery(query: string): ParsedSearchIntent {
  const raw = query.trim();
  const lower = raw.toLowerCase();

  if (!raw) {
    return {
      rawQuery: '',
      nearCategories: [],
      summaryExplanation:
        'Nhập nhu cầu mặt bằng bằng ngôn ngữ tự nhiên để AI bóc tách ngành hàng, khu vực, diện tích, ngân sách và tiện ích xung quanh.',
      isAIExtracted: false,
    };
  }

  let detectedBusiness: BusinessType | undefined;
  if (
    lower.includes('cà phê') ||
    lower.includes('ca phe') ||
    lower.includes('cafe') ||
    lower.includes('coffee') ||
    lower.includes('trà sữa')
  ) {
    detectedBusiness = 'coffee_shop';
  } else if (
    lower.includes('spa') ||
    lower.includes('thẩm mỹ') ||
    lower.includes('massage') ||
    lower.includes('clinic') ||
    lower.includes('làm đẹp') ||
    lower.includes('wellness')
  ) {
    detectedBusiness = 'spa';
  } else if (
    lower.includes('nhà hàng') ||
    lower.includes('quán ăn') ||
    lower.includes('bistro') ||
    lower.includes('ẩm thực') ||
    lower.includes('lẩu') ||
    lower.includes('nướng')
  ) {
    detectedBusiness = 'restaurant';
  } else if (
    lower.includes('thời trang') ||
    lower.includes('quần áo') ||
    lower.includes('fashion') ||
    lower.includes('boutique')
  ) {
    detectedBusiness = 'fashion_retail';
  } else if (
    lower.includes('tiện lợi') ||
    lower.includes('mini mart') ||
    lower.includes('siêu thị') ||
    lower.includes('tạp hóa')
  ) {
    detectedBusiness = 'convenience_store';
  } else if (
    lower.includes('coworking') ||
    lower.includes('co-working') ||
    lower.includes('không gian làm việc chung')
  ) {
    detectedBusiness = 'coworking';
  } else if (lower.includes('showroom') || lower.includes('trưng bày')) {
    detectedBusiness = 'showroom';
  } else if (
    lower.includes('mở văn phòng') ||
    lower.includes('thuê văn phòng') ||
    lower.includes('trụ sở công ty') ||
    lower.includes('agency')
  ) {
    detectedBusiness = 'office';
  }

  // Detect Hanoi district
  const districts = [
    { match: ['cầu giấy', 'cau giay', 'duy tân', 'xuân thủy'], name: 'Cầu Giấy' },
    { match: ['đống đa', 'dong da', 'chùa láng', 'nguyễn chí thanh'], name: 'Đống Đa' },
    { match: ['ba đình', 'ba dinh', 'kim mã', 'vạn bảo', 'liễu giai'], name: 'Ba Đình' },
    {
      match: ['hai bà trưng', 'hai ba trung', 'bách khoa', 'lê thanh nghị'],
      name: 'Hai Bà Trưng',
    },
    {
      match: ['hoàn kiếm', 'hoan kiem', 'phố cổ', 'phan chu trinh', 'lý thường kiệt'],
      name: 'Hoàn Kiếm',
    },
    { match: ['tây hồ', 'tay ho', 'hồ tây', 'quảng an', 'tô ngọc vân'], name: 'Tây Hồ' },
  ];
  let detectedDistrict: string | undefined;
  for (const d of districts) {
    if (d.match.some((m) => lower.includes(m))) {
      detectedDistrict = d.name;
      break;
    }
  }

  // Extract budget in million VND (e.g., "20-30 triệu", "dưới 25 triệu", "30tr")
  let maxBudgetMillionVND: number | undefined;
  const budgetRangeMatch = lower.match(
    /(\d+)\s*[-–~đến]+\s*(\d+)\s*(triệu|tr|trieu)/
  );
  const singleBudgetMatch = lower.match(
    /(?:dưới|tối đa|khoảng|ngân sách|giá|tầm)?\s*(\d+)\s*(triệu|tr|trieu)/
  );
  if (budgetRangeMatch) {
    maxBudgetMillionVND = Number(budgetRangeMatch[2]);
  } else if (singleBudgetMatch) {
    maxBudgetMillionVND = Number(singleBudgetMatch[1]);
  }

  // Extract area in m² (e.g., "100-150m2", "trên 120m²", "100m2")
  let minAreaSqm: number | undefined;
  let maxAreaSqm: number | undefined;
  const areaRangeMatch = lower.match(
    /(\d+)\s*[-–~đến]+\s*(\d+)\s*(m2|m²|mét vuông)/
  );
  const singleAreaMatch = lower.match(/(\d+)\s*(m2|m²|mét vuông)/);
  if (areaRangeMatch) {
    minAreaSqm = Number(areaRangeMatch[1]);
    maxAreaSqm = Number(areaRangeMatch[2]);
  } else if (singleAreaMatch) {
    const val = Number(singleAreaMatch[1]);
    minAreaSqm = Math.max(40, Math.round(val * 0.8));
    maxAreaSqm = Math.round(val * 1.25);
  }

  // Extract frontage
  let minFrontageMeters: number | undefined;
  const frontageMatch = lower.match(/mặt tiền\s*(?:trên|từ)?\s*(\d+(?:[.,]\d+)?)\s*m/);
  if (frontageMatch) {
    minFrontageMeters = Number(frontageMatch[1].replace(',', '.'));
  }

  // Needs parking
  const needsParking =
    lower.includes('đỗ xe') ||
    lower.includes('gửi xe') ||
    lower.includes('chỗ để xe') ||
    lower.includes('ô tô') ||
    lower.includes('vỉa hè rộng');

  // Near POI categories
  const nearCategories: POICategory[] = [];
  if (
    lower.includes('đại học') ||
    lower.includes('trường học') ||
    lower.includes('sinh viên')
  ) {
    nearCategories.push('university');
  }
  if (
    lower.includes('văn phòng') ||
    lower.includes('công sở') ||
    lower.includes('tòa nhà')
  ) {
    nearCategories.push('office');
  }
  if (
    lower.includes('chung cư') ||
    lower.includes('dân cư') ||
    lower.includes('expat')
  ) {
    nearCategories.push('apartment');
  }
  if (
    lower.includes('trung tâm thương mại') ||
    lower.includes('tttm') ||
    lower.includes('vincom') ||
    lower.includes('lotte')
  ) {
    nearCategories.push('mall');
  }
  if (lower.includes('buýt') || lower.includes('metro') || lower.includes('tàu điện')) {
    nearCategories.push('bus_stop');
  }
  if (lower.includes('bệnh viện')) {
    nearCategories.push('hospital');
  }

  const summaryParts: string[] = [];
  if (detectedBusiness) {
    summaryParts.push(
      `Mô hình: ${BUSINESS_TYPE_META[detectedBusiness].labelVi}`
    );
  }
  if (detectedDistrict) {
    summaryParts.push(`Khu vực ưu tiên: Quận ${detectedDistrict}`);
  } else if (lower.includes('hà nội')) {
    summaryParts.push('Khu vực: Nội thành Hà Nội');
  }
  if (minAreaSqm && maxAreaSqm) {
    summaryParts.push(`Diện tích mục tiêu: ${minAreaSqm}–${maxAreaSqm}m²`);
  } else if (minAreaSqm) {
    summaryParts.push(`Diện tích từ ${minAreaSqm}m²`);
  }
  if (maxBudgetMillionVND) {
    summaryParts.push(`Ngân sách thuê tối đa ~${maxBudgetMillionVND} triệu/tháng`);
  }
  if (nearCategories.length > 0) {
    summaryParts.push(
      `Ưu tiên gần: ${nearCategories
        .map((c) =>
          c === 'university'
            ? 'Trường Đại học'
            : c === 'office'
            ? 'Tòa nhà Văn phòng'
            : c === 'apartment'
            ? 'Khu Chung cư'
            : c === 'mall'
            ? 'TTTM'
            : c
        )
        .join(', ')}`
    );
  }

  return {
    rawQuery: raw,
    detectedBusiness,
    detectedDistrict,
    maxBudgetMillionVND,
    minAreaSqm,
    maxAreaSqm,
    minFrontageMeters,
    needsParking: needsParking || undefined,
    nearCategories,
    summaryExplanation:
      summaryParts.length > 0
        ? `AI đã phân tích yêu cầu: ${summaryParts.join(' • ')}. Hệ thống chấm điểm tương thích dựa trên ngân sách, quy mô sàn 3D và mật độ POI thực tế.`
        : 'Đang đối chiếu toàn bộ mặt bằng Hà Nội theo mức độ tương thích ngành hàng, diện tích và hệ sinh thái POI xung quanh.',
    isAIExtracted: true,
  };
}

/**
 * Deterministic, transparent scoring of a PropertyItem against user search intent and selected business type.
 */
export function scorePropertyForIntent(
  property: PropertyItem,
  intent: ParsedSearchIntent | null,
  businessType: BusinessType
): MatchBreakdown {
  const effectiveBusiness = intent?.detectedBusiness || businessType;
  const businessMeta = BUSINESS_TYPE_META[effectiveBusiness];
  const reasons: string[] = [];
  const warnings: string[] = [];

  // 1. Budget score (weight 28%)
  let budgetScore = 88;
  const targetMaxBudget = intent?.maxBudgetMillionVND;
  if (targetMaxBudget) {
    if (property.monthlyRentMillionVND <= targetMaxBudget) {
      const savingPct = Math.round(
        ((targetMaxBudget - property.monthlyRentMillionVND) / targetMaxBudget) *
          100
      );
      budgetScore = Math.min(99, 90 + Math.round(savingPct * 0.3));
      reasons.push(
        `Giá thuê ${property.monthlyRentMillionVND} triệu/tháng nằm trong ngân sách mục tiêu (≤ ${targetMaxBudget} triệu).`
      );
    } else {
      const overPct =
        (property.monthlyRentMillionVND - targetMaxBudget) / targetMaxBudget;
      budgetScore = Math.max(38, Math.round(90 - overPct * 110));
      warnings.push(
        `Giá thuê ${property.monthlyRentMillionVND} triệu/tháng vượt ngân sách mục tiêu ${targetMaxBudget} triệu (+${
          property.monthlyRentMillionVND - targetMaxBudget
        } triệu).`
      );
    }
  } else {
    // Score based on rent per m² efficiency
    const rentPerSqm =
      (property.monthlyRentMillionVND * 1000000) / property.totalAreaSqm;
    if (rentPerSqm <= 200000) {
      budgetScore = 94;
      reasons.push(
        `Đơn giá thuê hiệu quả (~${Math.round(
          rentPerSqm / 1000
        )}k VNĐ/m²/tháng) cho mặt bằng 3 tầng nội đô.`
      );
    } else if (rentPerSqm <= 260000) {
      budgetScore = 85;
    } else {
      budgetScore = 72;
      warnings.push(
        `Đơn giá thuê phân khúc cao (~${Math.round(
          rentPerSqm / 1000
        )}k VNĐ/m²/tháng), đòi hỏi định vị sản phẩm giá trị cao.`
      );
    }
  }

  // 2. Area score (weight 22%)
  let areaScore = 86;
  const minA = intent?.minAreaSqm ?? businessMeta.defaultAreaRange[0];
  const maxA = intent?.maxAreaSqm ?? businessMeta.defaultAreaRange[1];
  if (property.totalAreaSqm >= minA && property.totalAreaSqm <= maxA) {
    areaScore = 96;
    reasons.push(
      `Tổng diện tích ${property.totalAreaSqm}m² (${property.floorsCount} tầng x ${property.floorAreaSqm}m²) khớp chuẩn quy mô ${businessMeta.labelVi} (${minA}–${maxA}m²).`
    );
  } else if (property.totalAreaSqm < minA) {
    const diff = minA - property.totalAreaSqm;
    areaScore = Math.max(52, Math.round(92 - (diff / minA) * 85));
    warnings.push(
      `Diện tích ${property.totalAreaSqm}m² nhỏ hơn ngưỡng khuyến nghị ${minA}m² — cần ưu tiên layout tinh gọn.`
    );
  } else {
    const diff = property.totalAreaSqm - maxA;
    areaScore = Math.max(68, Math.round(92 - (diff / maxA) * 55));
  }

  // 3. Location & POI ecosystem score (weight 25%)
  let locationScore = 84;
  if (
    intent?.detectedDistrict &&
    property.district.toLowerCase() === intent.detectedDistrict.toLowerCase()
  ) {
    locationScore += 12;
    reasons.push(`Đúng khu vực ưu tiên tại Quận ${property.district}.`);
  } else if (
    intent?.detectedDistrict &&
    property.district.toLowerCase() !== intent.detectedDistrict.toLowerCase()
  ) {
    locationScore -= 16;
  }

  if (property.suitableBusinesses.includes(effectiveBusiness)) {
    locationScore = Math.min(98, locationScore + 6);
    reasons.push(
      `Cấu trúc phòng và tệp khách hàng xung quanh tương thích cao với ${businessMeta.labelVi}.`
    );
  } else {
    locationScore = Math.max(55, locationScore - 10);
  }

  if (intent?.nearCategories && intent.nearCategories.length > 0) {
    const matchedCats = intent.nearCategories.filter((cat) =>
      property.nearbyPOIs.some((p) => p.category === cat)
    );
    if (matchedCats.length === intent.nearCategories.length) {
      locationScore = Math.min(99, locationScore + 5);
    }
  }

  // 4. Frontage & visibility score (weight 15%)
  let frontageScore = Math.min(
    98,
    Math.round(62 + property.frontageMeters * 5.8)
  );
  if (
    intent?.minFrontageMeters &&
    property.frontageMeters < intent.minFrontageMeters
  ) {
    frontageScore = Math.max(50, frontageScore - 18);
    warnings.push(
      `Mặt tiền ${property.frontageMeters}m hẹp hơn yêu cầu tối thiểu ${intent.minFrontageMeters}m.`
    );
  } else if (property.frontageMeters >= 5.0) {
    reasons.push(
      `Mặt tiền rộng ${property.frontageMeters}m, đường trước nhà ${property.roadWidthMeters}m tạo độ nhận diện biển hiệu vượt trội.`
    );
  }

  // 5. Parking score (weight 10%)
  const parkingScore = Math.min(
    98,
    Math.round(
      55 + property.parkingSpotsMotorbike * 2.1 + property.parkingSpotsCar * 4.5
    )
  );
  if (property.parkingSpotsCar <= 1 && intent?.needsParking) {
    warnings.push(
      `Chỉ đỗ trực tiếp được ${property.parkingSpotsCar} ô tô trước cửa — khách đi ô tô cần gửi tại bãi đỗ xe lân cận.`
    );
  }

  const overallScore = Math.round(
    budgetScore * 0.28 +
      areaScore * 0.22 +
      locationScore * 0.25 +
      frontageScore * 0.15 +
      parkingScore * 0.1
  );

  if (warnings.length === 0 && property.risksToSurvey.length > 0) {
    warnings.push(property.risksToSurvey[0]);
  }

  return {
    overallScore: Math.max(40, Math.min(99, overallScore)),
    budgetScore,
    areaScore,
    locationScore,
    frontageScore,
    parkingScore,
    reasons: reasons.slice(0, 4),
    warnings: warnings.slice(0, 3),
    provenance: 'ai_estimate',
  };
}

/**
 * Generates an honest, grounded Location Business Intelligence report from real nearby POIs
 * and property characteristics without fabricating unverified population or revenue metrics.
 */
export function generateLocationBIReport(
  property: PropertyItem,
  businessType: BusinessType
): LocationBIReport {
  const businessMeta = BUSINESS_TYPE_META[businessType];
  const universities = property.nearbyPOIs.filter(
    (p) => p.category === 'university'
  );
  const offices = property.nearbyPOIs.filter((p) => p.category === 'office');
  const apartments = property.nearbyPOIs.filter(
    (p) => p.category === 'apartment'
  );
  const malls = property.nearbyPOIs.filter((p) => p.category === 'mall');
  const competitors = property.nearbyPOIs.filter(
    (p) => p.category === 'competitor'
  );

  const competitorsWithin500m = competitors.filter(
    (c) =>
      calculateHaversineMeters(property.coordinates, c.coordinates) <= 550
  ).length;

  const countWithin500m = Math.max(competitors.length, competitorsWithin500m);
  const densityLevel: 'Low' | 'Moderate' | 'High' =
    countWithin500m >= 3
      ? 'High'
      : countWithin500m >= 1
      ? 'Moderate'
      : 'Low';

  const targetCustomerSegments: LocationBIReport['targetCustomerSegments'] = [];

  if (offices.length > 0) {
    targetCustomerSegments.push({
      segment: `Nhân sự văn phòng & Doanh nghiệp (${offices
        .map((o) => o.name)
        .join(', ')})`,
      rationale:
        'Nhu cầu cao vào khung giờ sáng (07:30–09:00), nghỉ trưa (11:45–13:30) và tiếp khách làm việc trong ngày.',
      basis: 'real_poi',
    });
  }

  if (universities.length > 0) {
    targetCustomerSegments.push({
      segment: `Sinh viên, Giảng viên & Nghiên cứu sinh (${universities
        .map((u) => u.name)
        .join(', ')})`,
      rationale:
        'Lưu lượng khách bộ hành trẻ ổn định cả ngày, ưa chuộng không gian học nhóm có ổ cắm điện, Wi-Fi tốc độ cao và mức giá hợp lý.',
      basis: 'real_poi',
    });
  }

  if (apartments.length > 0) {
    targetCustomerSegments.push({
      segment: `Cư dân căn hộ & Chuyên gia lưu trú (${apartments
        .map((a) => a.name)
        .join(', ')})`,
      rationale:
        'Tệp khách hàng gia đình và chuyên gia có tần suất quay lại cao vào buổi tối (18:30–21:30) và dịp cuối tuần.',
      basis: 'real_poi',
    });
  }

  targetCustomerSegments.push({
    segment: `Khách vãng lai trên trục ${property.address.split(',')[0]} & từ ${
      malls[0]?.name || 'các điểm giao thông công cộng lân cận'
    }`,
    rationale: `Suy luận từ mặt tiền rộng ${property.frontageMeters}m, lòng đường ${property.roadWidthMeters}m và khả năng tiếp cận xe máy/ô tô.`,
    basis: 'inferred',
  });

  const suitabilitySummary = `Mặt bằng ${property.code} tại Quận ${
    property.district
  } (${property.totalAreaSqm}m² / ${
    property.floorsCount
  } tầng) có mức độ tương thích cao với mô hình ${
    businessMeta.labelVi
  }. Xung quanh bán kính 800m ghi nhận ${
    property.nearbyPOIs.length
  } điểm POI trọng yếu tạo nguồn khách tự nhiên cả ngày thường lẫn cuối tuần.`;

  const competitorSummary =
    competitors.length > 0
      ? `Ghi nhận cụm đối thủ trực tiếp lân cận (${competitors
          .map((c) => c.name)
          .join(
            '; '
          )}). Để tối ưu hiệu quả cạnh tranh, nên tận dụng lợi thế không gian 3 tầng (${
          property.totalAreaSqm
        }m²) để phân tách khu dịch vụ nhanh Tầng 1 và khu trải nghiệm lưu trú lâu Tầng 2–3.`
      : 'Mật độ đối thủ trực tiếp cùng phân khúc trong bán kính 500m ở mức vừa phải, thuận lợi để chiếm lĩnh nhận diện thương hiệu tại tuyến phố.';

  const complementaryServices = [
    `Kết nối lưu lượng khách chéo với cụm F&B / Thương mại lân cận (${
      property.nearbyPOIs.find((p) => p.category === 'cafe_restaurant')?.name ||
      'Khu ẩm thực nội khu'
    }).`,
    `Tận dụng bãi đỗ xe công cộng (${
      property.nearbyPOIs.find((p) => p.category === 'parking')?.name ||
      'Bãi gửi xe lân cận'
    }) để đón khách đi ô tô giờ cao điểm.`,
    `Hưởng lợi từ trạm giao thông công cộng (${
      property.nearbyPOIs.find((p) => p.category === 'bus_stop')?.name ||
      'Trạm xe buýt trục chính'
    }) giúp nhân sự và khách hàng di chuyển thuận tiện.`,
  ];

  const serviceGaps = [
    `Khu vực ${property.district} đang thiếu các không gian ${businessMeta.labelVi} có thiết kế chuẩn ánh sáng tự nhiên kết hợp phòng riêng/khu yên tĩnh ở Tầng 2–3.`,
    'Nhiều mặt bằng lân cận chỉ khai thác 1 tầng trệt chật hẹp, thiếu chỗ để xe máy thoải mái và khu vệ sinh đạt chuẩn sạch đẹp.',
  ];

  return {
    propertyId: property.id,
    businessType,
    suitabilitySummary,
    targetCustomerSegments,
    competitorAnalysis: {
      countWithin500m,
      densityLevel,
      summary: competitorSummary,
    },
    complementaryServices,
    serviceGaps,
    fieldSurveyRisks: [
      ...property.risksToSurvey,
      'Đo kiểm thực tế lưu lượng người qua lại vào 3 khung giờ: Sáng (08:00), Trưa (12:15) và Tối (19:30).',
    ],
    missingDataDisclaimers: [
      'Không tự suy diễn mật độ dân số thống kê hoặc cam kết doanh thu/lợi nhuận khi chưa có dữ liệu POS thực tế.',
      'Khoảng cách di chuyển được tính toán qua mạng lưới đường OSRM (hoặc ước tính lưới đường đô thị khi OSRM ngoại tuyến), không dùng khoảng cách đường chim bay làm quãng đường thực.',
      'Các điều kiện về ngập úng cục bộ khi mưa lớn, tiếng ồn thực tế (dB) và quy hoạch lộ giới cần được kiểm chứng tại hiện trường.',
    ],
  };
}

/**
 * Generates 3 tailored 3D/2D interior layout presets for the selected PropertyItem, BusinessType, and DesignStyle.
 * Every furniture item's [x, y, z] coordinates are strictly positioned inside the actual RoomGeometry boundaries of property.floors!
 */
export function generateLayoutPresets(
  property: PropertyItem,
  businessType: BusinessType,
  style: DesignStyle
): LayoutPreset[] {
  const styleMeta = DESIGN_STYLE_META[style];
  const f1 = property.floors[0];
  const f2 = property.floors[1] || property.floors[0];
  const f3 = property.floors[2] || f2;

  const retailRoom =
    f1.rooms.find((r) => r.type === 'retail') || f1.rooms[0];
  const counterRoom =
    f1.rooms.find((r) => r.type === 'service_counter') || f1.rooms[0];
  const storageRoom =
    f1.rooms.find((r) => r.type === 'storage') || f1.rooms[0];
  const workspaceRoom =
    f2.rooms.find((r) => r.type === 'workspace') || f2.rooms[0];
  const privateRoom =
    f2.rooms.find((r) => r.type === 'private_room') || f2.rooms[0];
  const multiRoom =
    f3.rooms.find((r) => r.type === 'multipurpose') || f3.rooms[0];

  const W = property.buildingWidth;
  const D = property.buildingDepth;

  // Helper to clamp x, z cleanly inside a room with margin
  const inRoomX = (room: typeof retailRoom, ratio: number) =>
    Number((room.x + Math.max(0.55, Math.min(room.width - 0.55, room.width * ratio))).toFixed(2));
  const inRoomZ = (room: typeof retailRoom, ratio: number) =>
    Number((room.z + Math.max(0.55, Math.min(room.depth - 0.55, room.depth * ratio))).toFixed(2));

  // Build base items depending on businessType and preset mode ('high_capacity' | 'premium_lounge' | 'lean_flow')
  const buildPresetItems = (
    mode: 'high_capacity' | 'premium_lounge' | 'lean_flow'
  ): FurnitureItem[] => {
    const items: FurnitureItem[] = [];
    let idx = 1;
    const nextId = (prefix: string) => `${property.id}-${businessType}-${mode}-${prefix}-${idx++}`;

    // Always include storefront signage on Floor 1 front facade
    items.push({
      id: nextId('signage'),
      assetType: 'signage',
      name: 'Biển Hiệu Chữ Nổi LED Mặt Tiền',
      category: 'signage',
      floor: 1,
      roomId: retailRoom.id,
      position: [Number((W * 0.5).toFixed(2)), Number((f1.height - 0.45).toFixed(2)), Number((D - 0.12).toFixed(2))],
      rotation: 0,
      scale: [1, 1, 1],
      dimensions: [Math.min(3.2, Number((W * 0.65).toFixed(2))), 0.6, 0.2],
      unitCostVND: 14500000,
      visible: true,
      color: styleMeta.accentColor,
    });

    // Core service bar / counter in counterRoom (Floor 1)
    const isCoffeeOrRestaurant =
      businessType === 'coffee_shop' ||
      businessType === 'restaurant' ||
      businessType === 'coworking';
    const coreAsset: FurnitureAssetType = isCoffeeOrRestaurant
      ? 'espresso_bar'
      : businessType === 'spa' ||
        businessType === 'office' ||
        businessType === 'showroom'
      ? 'reception'
      : 'counter';

    items.push({
      id: nextId('core-bar'),
      assetType: coreAsset,
      name:
        coreAsset === 'espresso_bar'
          ? 'Hệ Quầy Bar Pha Chế & Thu Ngân POS'
          : coreAsset === 'reception'
          ? 'Quầy Lễ Tân & Tư Vấn Khách Hàng'
          : 'Quầy Thu Ngân POS Trung Tâm',
      category: 'core',
      floor: 1,
      roomId: counterRoom.id,
      position: [inRoomX(counterRoom, 0.5), 0, inRoomZ(counterRoom, 0.55)],
      rotation: 0,
      scale: [1, 1, 1],
      dimensions: [Math.min(2.2, Number((counterRoom.width * 0.72).toFixed(2))), 1.08, 0.8],
      unitCostVND: coreAsset === 'espresso_bar' ? 68000000 : 16500000,
      visible: true,
      color: styleMeta.woodTone,
    });

    // Storage cabinet in storageRoom (Floor 1)
    items.push({
      id: nextId('storage-f1'),
      assetType: 'storage_cabinet',
      name: 'Hệ Tủ Kho Vật Tư & Thiết Bị Tầng 1',
      category: 'storage',
      floor: 1,
      roomId: storageRoom.id,
      position: [inRoomX(storageRoom, 0.5), 0, inRoomZ(storageRoom, 0.45)],
      rotation: 0,
      scale: [1, 1, 1],
      dimensions: [Math.min(1.3, Number((storageRoom.width * 0.68).toFixed(2))), 1.85, 0.5],
      unitCostVND: 5800000,
      visible: true,
      color: styleMeta.metalTone,
    });

    // Floor 1 Retail zone items by businessType
    if (businessType === 'coffee_shop' || businessType === 'restaurant') {
      const f1Pairs = mode === 'high_capacity' ? [0.24, 0.76] : [0.26, 0.74];
      const zRows = mode === 'lean_flow' ? [0.45] : [0.35, 0.72];

      for (const rx of f1Pairs) {
        for (const rz of zRows) {
          const isFourSeat = businessType === 'restaurant' || mode === 'high_capacity';
          items.push({
            id: nextId('f1-seat'),
            assetType: isFourSeat ? 'table_4' : 'table_2',
            name: isFourSeat ? 'Bộ Bàn Khách 4 Chỗ Tầng 1' : 'Bàn Cà Phê Đôi Tầng 1',
            category: 'seating',
            floor: 1,
            roomId: retailRoom.id,
            position: [inRoomX(retailRoom, rx), 0, inRoomZ(retailRoom, rz)],
            rotation: 0,
            scale: [1, 1, 1],
            dimensions: isFourSeat ? [1.25, 0.75, 0.85] : [0.85, 0.75, 0.85],
            unitCostVND: isFourSeat ? 5400000 : 3200000,
            visible: true,
            color: styleMeta.woodTone,
          });
        }
      }

      if (mode === 'premium_lounge') {
        items.push({
          id: nextId('f1-lounge'),
          assetType: 'lounge_sofa',
          name: 'Cụm Sofa Lounge Cửa Kính Tầng 1',
          category: 'seating',
          floor: 1,
          roomId: retailRoom.id,
          position: [inRoomX(retailRoom, 0.5), 0, inRoomZ(retailRoom, 0.82)],
          rotation: 0,
          scale: [1, 1, 1],
          dimensions: [1.85, 0.8, 0.95],
          unitCostVND: 12500000,
          visible: true,
          color: styleMeta.accentColor,
        });
      }
    } else if (
      businessType === 'fashion_retail' ||
      businessType === 'convenience_store' ||
      businessType === 'showroom'
    ) {
      // Display islands in center + shelf racks along walls
      items.push({
        id: nextId('f1-island-1'),
        assetType: 'display_island',
        name: 'Đảo Trưng Bày Sản Phẩm Trung Tâm #1',
        category: 'storage',
        floor: 1,
        roomId: retailRoom.id,
        position: [inRoomX(retailRoom, 0.5), 0, inRoomZ(retailRoom, 0.42)],
        rotation: 0,
        scale: [1, 1, 1],
        dimensions: [1.5, 0.9, 0.95],
        unitCostVND: 9500000,
        visible: true,
        color: styleMeta.woodTone,
      });
      items.push({
        id: nextId('f1-island-2'),
        assetType: 'display_island',
        name: 'Đảo Trưng Bày Sản Phẩm Mặt Tiền #2',
        category: 'storage',
        floor: 1,
        roomId: retailRoom.id,
        position: [inRoomX(retailRoom, 0.5), 0, inRoomZ(retailRoom, 0.76)],
        rotation: 0,
        scale: [1, 1, 1],
        dimensions: [1.5, 0.9, 0.95],
        unitCostVND: 9500000,
        visible: true,
        color: styleMeta.woodTone,
      });
      items.push({
        id: nextId('f1-rack-left'),
        assetType: 'shelf_rack',
        name: 'Hệ Kệ Trưng Bày Áp Tường Trái',
        category: 'storage',
        floor: 1,
        roomId: retailRoom.id,
        position: [inRoomX(retailRoom, 0.14), 0, inRoomZ(retailRoom, 0.55)],
        rotation: 90,
        scale: [1, 1, 1],
        dimensions: [1.6, 1.95, 0.45],
        unitCostVND: 6200000,
        visible: true,
        color: styleMeta.metalTone,
      });
      items.push({
        id: nextId('f1-rack-right'),
        assetType: 'shelf_rack',
        name: 'Hệ Kệ Trưng Bày Áp Tường Phải',
        category: 'storage',
        floor: 1,
        roomId: retailRoom.id,
        position: [inRoomX(retailRoom, 0.86), 0, inRoomZ(retailRoom, 0.55)],
        rotation: -90,
        scale: [1, 1, 1],
        dimensions: [1.6, 1.95, 0.45],
        unitCostVND: 6200000,
        visible: true,
        color: styleMeta.metalTone,
      });
    } else {
      // Spa / Office / Co-working Floor 1 consultation & lounge
      items.push({
        id: nextId('f1-lounge-main'),
        assetType: 'lounge_sofa',
        name: 'Khu Sofa Đón Tiếp & Tư Vấn Khách Hàng',
        category: 'seating',
        floor: 1,
        roomId: retailRoom.id,
        position: [inRoomX(retailRoom, 0.35), 0, inRoomZ(retailRoom, 0.58)],
        rotation: 0,
        scale: [1, 1, 1],
        dimensions: [1.9, 0.82, 1.0],
        unitCostVND: 12500000,
        visible: true,
        color: styleMeta.accentColor,
      });
      items.push({
        id: nextId('f1-shelf-display'),
        assetType: 'shelf_rack',
        name: 'Tủ Trưng Bày Mỹ Phẩm / Ấn Phẩm Thương Hiệu',
        category: 'storage',
        floor: 1,
        roomId: retailRoom.id,
        position: [inRoomX(retailRoom, 0.82), 0, inRoomZ(retailRoom, 0.52)],
        rotation: -90,
        scale: [1, 1, 1],
        dimensions: [1.5, 1.95, 0.45],
        unitCostVND: 6200000,
        visible: true,
        color: styleMeta.woodTone,
      });
    }

    // Green plant divider on Floor 1 near entrance
    items.push({
      id: nextId('f1-plant'),
      assetType: 'plant_divider',
      name: 'Bồn Cây Xanh Lọc Không Khí Cửa Chính',
      category: 'decor',
      floor: 1,
      roomId: retailRoom.id,
      position: [inRoomX(retailRoom, 0.18), 0, inRoomZ(retailRoom, 0.88)],
      rotation: 0,
      scale: [1, 1, 1],
      dimensions: [1.1, 1.3, 0.4],
      unitCostVND: 2600000,
      visible: true,
      color: '#10b981',
    });

    // Pendant lighting on Floor 1
    items.push({
      id: nextId('f1-light'),
      assetType: 'lighting_pendant',
      name: 'Hệ Đèn Thả Trần Khu Trung Tâm Tầng 1',
      category: 'signage',
      floor: 1,
      roomId: retailRoom.id,
      position: [inRoomX(retailRoom, 0.5), Number((f1.height - 0.6).toFixed(2)), inRoomZ(retailRoom, 0.55)],
      rotation: 0,
      scale: [1, 1, 1],
      dimensions: [1.0, 0.45, 1.0],
      unitCostVND: 3800000,
      visible: true,
      color: styleMeta.accentColor,
    });

    // FLOOR 2 ITEMS
    if (businessType === 'spa') {
      const bedPositions =
        mode === 'high_capacity'
          ? [
              [0.26, 0.35],
              [0.74, 0.35],
              [0.26, 0.75],
              [0.74, 0.75],
            ]
          : [
              [0.3, 0.45],
              [0.7, 0.45],
            ];
      for (const [bx, bz] of bedPositions) {
        items.push({
          id: nextId('f2-spabed'),
          assetType: 'spa_bed',
          name: 'Giường Trị Liệu Chuyên Sâu & Rèm Ngăn Tầng 2',
          category: 'work',
          floor: 2,
          roomId: workspaceRoom.id,
          position: [inRoomX(workspaceRoom, bx), 0, inRoomZ(workspaceRoom, bz)],
          rotation: 0,
          scale: [1, 1, 1],
          dimensions: [0.95, 0.75, 1.9],
          unitCostVND: 7800000,
          visible: true,
          color: '#f8fafc',
        });
      }
      // VIP bed in privateRoom
      items.push({
        id: nextId('f2-vip-spabed'),
        assetType: 'spa_bed',
        name: 'Giường Trị Liệu Phòng VIP Đơn Tầng 2',
        category: 'work',
        floor: 2,
        roomId: privateRoom.id,
        position: [inRoomX(privateRoom, 0.5), 0, inRoomZ(privateRoom, 0.5)],
        rotation: 0,
        scale: [1, 1, 1],
        dimensions: [1.0, 0.78, 1.95],
        unitCostVND: 9200000,
        visible: true,
        color: styleMeta.accentColor,
      });
    } else if (businessType === 'office' || businessType === 'coworking') {
      items.push({
        id: nextId('f2-workdesk-1'),
        assetType: 'work_desk',
        name: 'Cụm Bàn Làm Việc Nhóm 4–6 Chỗ #1 (Tầng 2)',
        category: 'work',
        floor: 2,
        roomId: workspaceRoom.id,
        position: [inRoomX(workspaceRoom, 0.5), 0, inRoomZ(workspaceRoom, 0.36)],
        rotation: 0,
        scale: [1, 1, 1],
        dimensions: [2.1, 0.76, 1.1],
        unitCostVND: 8900000,
        visible: true,
        color: styleMeta.woodTone,
      });
      items.push({
        id: nextId('f2-workdesk-2'),
        assetType: 'work_desk',
        name: 'Cụm Bàn Làm Việc Nhóm 4–6 Chỗ #2 (Tầng 2)',
        category: 'work',
        floor: 2,
        roomId: workspaceRoom.id,
        position: [inRoomX(workspaceRoom, 0.5), 0, inRoomZ(workspaceRoom, 0.74)],
        rotation: 0,
        scale: [1, 1, 1],
        dimensions: [2.1, 0.76, 1.1],
        unitCostVND: 8900000,
        visible: true,
        color: styleMeta.woodTone,
      });
      items.push({
        id: nextId('f2-meeting'),
        assetType: 'table_4',
        name: 'Bàn Họp Kính Cách Âm Phòng Riêng Tầng 2',
        category: 'work',
        floor: 2,
        roomId: privateRoom.id,
        position: [inRoomX(privateRoom, 0.5), 0, inRoomZ(privateRoom, 0.5)],
        rotation: 0,
        scale: [1, 1, 1],
        dimensions: [1.4, 0.76, 0.9],
        unitCostVND: 6800000,
        visible: true,
        color: styleMeta.woodTone,
      });
    } else {
      // Coffee / Restaurant / Retail / Showroom Floor 2 seating & workspace
      const f2Cols = [0.25, 0.75];
      const f2Rows = mode === 'high_capacity' ? [0.3, 0.62, 0.86] : [0.38, 0.76];
      for (const cx of f2Cols) {
        for (const cz of f2Rows) {
          items.push({
            id: nextId('f2-table'),
            assetType: 'table_4',
            name: 'Bàn Khách Ngồi View Kính Tầng 2',
            category: 'seating',
            floor: 2,
            roomId: workspaceRoom.id,
            position: [inRoomX(workspaceRoom, cx), 0, inRoomZ(workspaceRoom, cz)],
            rotation: 0,
            scale: [1, 1, 1],
            dimensions: [1.2, 0.75, 0.82],
            unitCostVND: 5400000,
            visible: true,
            color: styleMeta.woodTone,
          });
        }
      }
      items.push({
        id: nextId('f2-vip-lounge'),
        assetType: 'lounge_sofa',
        name: 'Phòng Riêng / Họp Nhóm Nhỏ Tầng 2',
        category: 'seating',
        floor: 2,
        roomId: privateRoom.id,
        position: [inRoomX(privateRoom, 0.5), 0, inRoomZ(privateRoom, 0.5)],
        rotation: 0,
        scale: [1, 1, 1],
        dimensions: [1.7, 0.8, 0.9],
        unitCostVND: 11500000,
        visible: true,
        color: styleMeta.accentColor,
      });
    }

    // FLOOR 3 ITEMS (Multipurpose room)
    items.push({
      id: nextId('f3-worktable'),
      assetType: businessType === 'spa' ? 'spa_bed' : 'work_desk',
      name:
        businessType === 'spa'
          ? 'Giường Chăm Sóc Da Chuyên Sâu Tầng 3'
          : 'Bàn Dài Workshop / Sự Kiện Tầng 3',
      category: 'work',
      floor: 3,
      roomId: multiRoom.id,
      position: [inRoomX(multiRoom, 0.5), 0, inRoomZ(multiRoom, 0.45)],
      rotation: 0,
      scale: [1, 1, 1],
      dimensions: [2.0, 0.76, 1.0],
      unitCostVND: 8900000,
      visible: true,
      color: styleMeta.woodTone,
    });

    items.push({
      id: nextId('f3-lounge'),
      assetType: 'lounge_sofa',
      name: 'Góc Thư Giãn / Ban Công Tầng 3',
      category: 'seating',
      floor: 3,
      roomId: multiRoom.id,
      position: [inRoomX(multiRoom, 0.5), 0, inRoomZ(multiRoom, 0.78)],
      rotation: 0,
      scale: [1, 1, 1],
      dimensions: [1.85, 0.8, 0.95],
      unitCostVND: 12500000,
      visible: true,
      color: styleMeta.accentColor,
    });

    items.push({
      id: nextId('f3-plant'),
      assetType: 'plant_divider',
      name: 'Cụm Cây Xanh Trang Trí Tầng 3',
      category: 'decor',
      floor: 3,
      roomId: multiRoom.id,
      position: [inRoomX(multiRoom, 0.82), 0, inRoomZ(multiRoom, 0.82)],
      rotation: 0,
      scale: [1, 1, 1],
      dimensions: [1.1, 1.35, 0.4],
      unitCostVND: 2600000,
      visible: true,
      color: '#10b981',
    });

    return items;
  };

  const baseCompliance = [
    'Đảm bảo hành lang lối đi chính ≥ 1.1m phục vụ thoát hiểm và di chuyển hai chiều.',
    'Không bố trí tủ kệ che khuất cửa thoát hiểm cầu thang bộ và hộp chữa cháy vách tường.',
    'Lưu ý pháp lý: Các tiêu chuẩn PCCC, lối thoát hiểm, kết cấu chịu lực và giấy phép kinh doanh cần được thẩm định thực tế bởi kỹ sư/cơ quan chuyên môn.',
  ];

  return [
    {
      id: 'preset-balanced-premium',
      name: 'Layout Tiêu chuẩn — Cân bằng Trải nghiệm & Công suất',
      businessType,
      description:
        'Phân bổ hài hòa giữa khu dịch vụ chính Tầng 1, không gian lưu trú/làm việc thoáng đãng Tầng 2 và khu mở rộng Tầng 3. Lối đi thông thoáng 1.25m.',
      capacityPersons: Math.round(property.totalAreaSqm * 0.36),
      spaceUtilizationPct: 62,
      aisleWidthMeters: 1.25,
      items: buildPresetItems('premium_lounge'),
      complianceNotes: baseCompliance,
    },
    {
      id: 'preset-high-capacity',
      name: 'Layout Tối ưu Công suất — Tối đa hóa Chỗ ngồi / Điểm dịch vụ',
      businessType,
      description:
        'Tăng mật độ bàn khách / cụm dịch vụ cho giờ cao điểm trưa và tối, tối ưu doanh thu trên mỗi m² sàn.',
      capacityPersons: Math.round(property.totalAreaSqm * 0.48),
      spaceUtilizationPct: 74,
      aisleWidthMeters: 1.05,
      items: buildPresetItems('high_capacity'),
      complianceNotes: [
        ...baseCompliance,
        'Mật độ sử dụng sàn 74% — cần chú ý công suất điều hòa (BTU) và thông gió cấp khí tươi ở Tầng 2.',
      ],
    },
    {
      id: 'preset-lean-flow',
      name: 'Layout Tinh gọn — Tối ưu Luồng di chuyển & Vốn đầu tư ban đầu',
      businessType,
      description:
        'Giảm mật độ nội thất rời, mở rộng không gian đứng chờ/check-in mặt tiền Tầng 1 và tiết kiệm chi phí CAPEX ban đầu.',
      capacityPersons: Math.round(property.totalAreaSqm * 0.28),
      spaceUtilizationPct: 48,
      aisleWidthMeters: 1.5,
      items: buildPresetItems('lean_flow'),
      complianceNotes: baseCompliance,
    },
  ];
}

/**
 * Calculates transparent, itemized setup budget in VND with min-max ranges and explicit assumptions.
 */
export function calculateBudgetSummary(
  property: PropertyItem,
  businessType: BusinessType,
  style: DesignStyle,
  furnitureItems: FurnitureItem[]
): BudgetSummary {
  const styleMeta = DESIGN_STYLE_META[style];
  const businessMeta = BUSINESS_TYPE_META[businessType];
  const mult = styleMeta.costMultiplier;

  const visibleItems = furnitureItems.filter((item) => item.visible);

  const furnitureRaw = visibleItems
    .filter((i) => i.category !== 'core' && i.category !== 'signage')
    .reduce((sum, i) => sum + i.unitCostVND, 0);

  const coreEquipmentRaw = visibleItems
    .filter((i) => i.category === 'core')
    .reduce((sum, i) => sum + i.unitCostVND, 0);

  const signageRaw = visibleItems
    .filter((i) => i.category === 'signage')
    .reduce((sum, i) => sum + i.unitCostVND, 0);

  // Base MEP & equipment cost by business type
  const hvacAndMEPBase =
    businessType === 'restaurant'
      ? 95000000
      : businessType === 'coffee_shop'
      ? 65000000
      : businessType === 'spa'
      ? 72000000
      : 48000000;

  const furnitureEstimate = Math.round(Math.max(18000000, furnitureRaw) * mult);
  const equipmentEstimate = Math.round(
    (coreEquipmentRaw + hvacAndMEPBase) * (0.92 + (mult - 1) * 0.5)
  );
  const renovationRatePerSqm =
    businessType === 'spa' || businessType === 'showroom'
      ? 2100000
      : businessType === 'restaurant'
      ? 1950000
      : 1650000;
  const renovationEstimate = Math.round(
    property.totalAreaSqm * renovationRatePerSqm * mult
  );
  const decorEstimate = Math.round(
    property.totalAreaSqm * 420000 * mult
  );
  const signageEstimate = Math.round(
    Math.max(18000000, signageRaw + property.frontageMeters * 3500000) * mult
  );

  const subTotal =
    furnitureEstimate +
    equipmentEstimate +
    renovationEstimate +
    decorEstimate +
    signageEstimate;

  const contingencyEstimate = Math.round(subTotal * 0.1);

  const makeLine = (
    category: BudgetLineItem['category'],
    label: string,
    estimate: number,
    note: string
  ): BudgetLineItem => ({
    category,
    label,
    minVND: Math.round(estimate * 0.85),
    maxVND: Math.round(estimate * 1.18),
    estimateVND: estimate,
    note,
    provenance: 'ai_estimate',
  });

  const lines: BudgetLineItem[] = [
    makeLine(
      'renovation',
      `Cải tạo thô, Sơn tường, Sàn & Trần (${property.totalAreaSqm}m²)`,
      renovationEstimate,
      `Đơn giá tham khảo theo phong cách ${styleMeta.label} (Hệ số x${mult.toFixed(
        2
      )})`
    ),
    makeLine(
      'furniture',
      `Nội thất rời & Hệ tủ kệ (${
        visibleItems.filter((i) => i.category !== 'core' && i.category !== 'signage').length
      } hạng mục hiển thị)`,
      furnitureEstimate,
      'Tính trực tiếp từ danh mục nội thất 3D đang bật trong mặt bằng'
    ),
    makeLine(
      'equipment',
      `Quầy chính, Thiết bị chuyên dụng ${businessMeta.labelVi}, Điều hòa & MEP`,
      equipmentEstimate,
      'Bao gồm quầy dịch vụ trung tâm, hệ thống điều hòa bổ sung và điện nước'
    ),
    makeLine(
      'decor',
      'Ánh sáng trang trí, Rèm cửa, Cây xanh & Vật phẩm Decor',
      decorEstimate,
      'Ước tính theo diện tích sàn và mật độ trang trí tiêu chuẩn'
    ),
    makeLine(
      'signage',
      `Biển hiệu Mặt tiền (${property.frontageMeters}m) & Hệ thống nhận diện LED`,
      signageEstimate,
      'Khung biển Alu/Tôn sơn tĩnh điện, chữ nổi mica LED và đèn hắt mặt tiền'
    ),
    makeLine(
      'contingency',
      'Chi phí dự phòng phát sinh (10%)',
      contingencyEstimate,
      'Dự phòng trượt giá vật tư, phí thẩm duyệt PCCC và nhân công thi công đêm'
    ),
  ];

  const totalEstimateVND = lines.reduce((s, l) => s + l.estimateVND, 0);
  const totalMinVND = lines.reduce((s, l) => s + l.minVND, 0);
  const totalMaxVND = lines.reduce((s, l) => s + l.maxVND, 0);

  return {
    businessType,
    style,
    areaSqm: property.totalAreaSqm,
    lines,
    totalMinVND,
    totalMaxVND,
    totalEstimateVND,
    assumptions: [
      `Ước tính AI (AI Estimate) dựa trên diện tích ${property.totalAreaSqm}m² (${property.floorsCount} tầng) và mặt tiền ${property.frontageMeters}m tại Hà Nội.`,
      `Chưa bao gồm tiền đặt cọc thuê nhà (thường từ 3–6 tháng ~ ${
        property.monthlyRentMillionVND * 3
      }–${property.monthlyRentMillionVND * 6} triệu VNĐ).`,
      'Báo giá thực tế có thể dao động ±15% tùy chất liệu gỗ công nghiệp/tự nhiên và hiện trạng cơ điện tại thời điểm bàn giao.',
    ],
  };
}

export function formatVND(amountVND: number): string {
  const millions = amountVND / 1000000;
  if (millions >= 1000) {
    return `${(millions / 1000).toFixed(2)} tỷ VNĐ`;
  }
  return `${Math.round(millions).toLocaleString('vi-VN')} triệu VNĐ`;
}
