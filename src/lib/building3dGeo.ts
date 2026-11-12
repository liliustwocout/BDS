import { Building3DFootprint } from '@/types';

export interface BuildingGeoJSONProperties {
  id: string;
  name: string;
  type: string;
  height: number;
  minHeight: number;
  baseHeight: number;
  color: string;
  roofColor: string;
  floors: number;
  description: string;
  propertyId: string;
  isSubjectProperty: boolean;
}

export interface BuildingGeoJSONFeature {
  type: 'Feature';
  id: string;
  properties: BuildingGeoJSONProperties;
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

export interface BuildingFeatureCollection {
  type: 'FeatureCollection';
  features: BuildingGeoJSONFeature[];
}

/**
 * Utility to convert local meter offsets [dx, dy] to geographic coordinates [lng, lat]
 * around Hanoi (latitude ~21.03° N).
 */
export function metersToCoordinates(
  center: [number, number],
  dxMeters: number,
  dyMeters: number
): [number, number] {
  const [lng, lat] = center;
  const latOffset = dyMeters / 111139;
  const lngOffset = dxMeters / (111139 * Math.cos((lat * Math.PI) / 180));
  return [
    Number((lng + lngOffset).toFixed(6)),
    Number((lat + latOffset).toFixed(6)),
  ];
}

/**
 * Creates a closed 5-point polygon ring [lng, lat] for a rectangular building footprint
 * oriented at bearingDeg degrees clockwise from North.
 */
export function createBuildingPolygon(
  center: [number, number],
  widthMeters: number,
  depthMeters: number,
  bearingDeg: number = 0
): [number, number][] {
  const halfW = widthMeters / 2;
  const halfD = depthMeters / 2;
  const rad = (bearingDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const localCorners: [number, number][] = [
    [-halfW, -halfD],
    [halfW, -halfD],
    [halfW, halfD],
    [-halfW, halfD],
    [-halfW, -halfD], // close ring
  ];

  return localCorners.map(([dx, dy]) => {
    const rotX = dx * cos - dy * sin;
    const rotY = dx * sin + dy * cos;
    return metersToCoordinates(center, rotX, rotY);
  });
}

export const ALL_BUILDING_FOOTPRINTS: Building3DFootprint[] = [
  // ==========================================
  // 1. CẦU GIẤY — DUY TÂN CLUSTER (prop-cau-giay-01)
  // Coordinates: [105.7836, 21.0312]
  // ==========================================
  {
    id: 'bldg-cg-subject',
    propertyId: 'prop-cau-giay-01',
    name: 'Mặt bằng Thương mại 76 Duy Tân (Đang chọn)',
    type: 'commercial',
    coordinates: createBuildingPolygon([105.7836, 21.0312], 12, 16, 15),
    height: 12,
    minHeight: 0,
    color: '#0284c7',
    roofColor: '#38bdf8',
    floors: 3,
    description: 'Bất động sản thương mại 3 tầng mặt tiền phố Duy Tân.',
    isSubjectProperty: true,
  },
  {
    id: 'bldg-cg-cmc',
    propertyId: 'prop-cau-giay-01',
    name: 'Tòa nhà CMC Tower Duy Tân',
    type: 'office',
    coordinates: createBuildingPolygon([105.7829, 21.0304], 38, 32, 20),
    height: 72,
    minHeight: 0,
    color: '#cbd5e1',
    roofColor: '#94a3b8',
    floors: 19,
    description: 'Tháp văn phòng Hạng A tập trung các doanh nghiệp công nghệ cao.',
  },
  {
    id: 'bldg-cg-fpt',
    propertyId: 'prop-cau-giay-01',
    name: 'Tòa nhà FPT Cầu Giấy',
    type: 'office',
    coordinates: createBuildingPolygon([105.7832, 21.0298], 34, 28, 20),
    height: 62,
    minHeight: 0,
    color: '#e2e8f0',
    roofColor: '#cbd5e1',
    floors: 16,
    description: 'Tổ hợp công nghệ thông tin và văn phòng làm việc tập đoàn FPT.',
  },
  {
    id: 'bldg-cg-viettel',
    propertyId: 'prop-cau-giay-01',
    name: 'Viettel R&D Post Center',
    type: 'office',
    coordinates: createBuildingPolygon([105.7848, 21.0302], 40, 35, 10),
    height: 58,
    minHeight: 0,
    color: '#dbeafe',
    roofColor: '#bfdbfe',
    floors: 15,
    description: 'Trung tâm nghiên cứu và công nghệ bưu chính Viettel Post.',
  },
  {
    id: 'bldg-cg-vcb',
    propertyId: 'prop-cau-giay-01',
    name: 'Vietcombank Tower Duy Tân',
    type: 'commercial',
    coordinates: createBuildingPolygon([105.7844, 21.0319], 30, 26, 15),
    height: 52,
    minHeight: 0,
    color: '#e2e8f0',
    roofColor: '#cbd5e1',
    floors: 14,
    description: 'Chi nhánh giao dịch ngân hàng Vietcombank và văn phòng cho thuê.',
  },
  {
    id: 'bldg-cg-iph-a',
    propertyId: 'prop-cau-giay-01',
    name: 'Indochina Plaza Hanoi (IPH) Tower',
    type: 'residential',
    coordinates: createBuildingPolygon([105.7822, 21.0358], 45, 35, 0),
    height: 75,
    minHeight: 0,
    color: '#cbd5e1',
    roofColor: '#94a3b8',
    floors: 25,
    description: 'Tổ hợp căn hộ cao cấp và văn phòng hạng sang khu vực Cầu Giấy.',
  },
  {
    id: 'bldg-cg-theloop',
    propertyId: 'prop-cau-giay-01',
    name: 'TTTM The Loop Shopping Center',
    type: 'retail',
    coordinates: createBuildingPolygon([105.7825, 21.0352], 55, 40, 0),
    height: 26,
    minHeight: 0,
    color: '#f1f5f9',
    roofColor: '#e2e8f0',
    floors: 5,
    description: 'Khối đế trung tâm thương mại đa chức năng ẩm thực và giải trí.',
  },
  {
    id: 'bldg-cg-shop-1',
    propertyId: 'prop-cau-giay-01',
    name: 'Dãy Shophouse Dịch Vọng Hậu Phía Đông',
    type: 'shophouse',
    coordinates: createBuildingPolygon([105.7840, 21.0314], 28, 15, 15),
    height: 18,
    minHeight: 0,
    color: '#f8fafc',
    roofColor: '#e2e8f0',
    floors: 5,
    description: 'Dãy nhà phố kinh doanh F&B và dịch vụ ăn uống văn phòng.',
  },
  {
    id: 'bldg-cg-shop-2',
    propertyId: 'prop-cau-giay-01',
    name: 'Dãy Shophouse Dịch Vọng Hậu Phía Tây',
    type: 'shophouse',
    coordinates: createBuildingPolygon([105.7831, 21.0316], 25, 14, 15),
    height: 16,
    minHeight: 0,
    color: '#f1f5f9',
    roofColor: '#e2e8f0',
    floors: 4,
    description: 'Cụm nhà phố thương mại liền kề mặt tiền phố Duy Tân.',
  },
  {
    id: 'bldg-cg-vnu',
    propertyId: 'prop-cau-giay-01',
    name: 'Giảng đường ĐH Quốc Gia Hà Nội',
    type: 'cultural',
    coordinates: createBuildingPolygon([105.7824, 21.0368], 48, 30, 0),
    height: 28,
    minHeight: 0,
    color: '#e2e8f0',
    roofColor: '#cbd5e1',
    floors: 7,
    description: 'Khu giảng đường và viện nghiên cứu Đại học Quốc gia.',
  },
  {
    id: 'bldg-cg-tech',
    propertyId: 'prop-cau-giay-01',
    name: 'Duy Tân Innovation Hub Plaza',
    type: 'office',
    coordinates: createBuildingPolygon([105.7842, 21.0307], 32, 26, 18),
    height: 46,
    minHeight: 0,
    color: '#cbd5e1',
    roofColor: '#94a3b8',
    floors: 12,
    description: 'Tòa nhà văn phòng khởi nghiệp công nghệ thông tin.',
  },

  // ==========================================
  // 2. ĐỐNG ĐA — CHÙA LÁNG CLUSTER (prop-dong-da-02)
  // Coordinates: [105.8038, 21.0238]
  // ==========================================
  {
    id: 'bldg-dd-subject',
    propertyId: 'prop-dong-da-02',
    name: 'Mặt bằng Phố Chùa Láng (Đang chọn)',
    type: 'commercial',
    coordinates: createBuildingPolygon([105.8038, 21.0238], 10, 15, 30),
    height: 12,
    minHeight: 0,
    color: '#0284c7',
    roofColor: '#38bdf8',
    floors: 3,
    description: 'Nhà phố thương mại 3 tầng trung tâm sinh viên và thời trang Chùa Láng.',
    isSubjectProperty: true,
  },
  {
    id: 'bldg-dd-vincom',
    propertyId: 'prop-dong-da-02',
    name: 'Vincom Center Nguyễn Chí Thanh',
    type: 'commercial',
    coordinates: createBuildingPolygon([105.8052, 21.0210], 55, 48, 45),
    height: 75,
    minHeight: 0,
    color: '#cbd5e1',
    roofColor: '#94a3b8',
    floors: 24,
    description: 'Tổ hợp căn hộ cao cấp và TTTM biểu tượng quận Đống Đa.',
  },
  {
    id: 'bldg-dd-tnr',
    propertyId: 'prop-dong-da-02',
    name: 'TNR Tower Nguyễn Chí Thanh',
    type: 'office',
    coordinates: createBuildingPolygon([105.8048, 21.0215], 48, 40, 45),
    height: 72,
    minHeight: 0,
    color: '#e2e8f0',
    roofColor: '#cbd5e1',
    floors: 22,
    description: 'Tháp văn phòng Hạng A Nguyễn Chí Thanh với ngân hàng MSB.',
  },
  {
    id: 'bldg-dd-dav',
    propertyId: 'prop-dong-da-02',
    name: 'Học viện Ngoại Giao New Tower',
    type: 'cultural',
    coordinates: createBuildingPolygon([105.8028, 21.0250], 36, 28, 30),
    height: 38,
    minHeight: 0,
    color: '#e2e8f0',
    roofColor: '#cbd5e1',
    floors: 10,
    description: 'Tòa nhà học tập hiện đại Học viện Ngoại Giao Việt Nam.',
  },
  {
    id: 'bldg-dd-ftu',
    propertyId: 'prop-dong-da-02',
    name: 'Đại học Ngoại Thương (Nhà A)',
    type: 'cultural',
    coordinates: createBuildingPolygon([105.8018, 21.0242], 42, 30, 30),
    height: 48,
    minHeight: 0,
    color: '#cbd5e1',
    roofColor: '#94a3b8',
    floors: 12,
    description: 'Tòa nhà đa năng điều hành và giảng đường Đại học Ngoại Thương.',
  },
  {
    id: 'bldg-dd-shop-e',
    propertyId: 'prop-dong-da-02',
    name: 'Dãy Thời trang Chùa Láng Phía Đông',
    type: 'shophouse',
    coordinates: createBuildingPolygon([105.8042, 21.0236], 28, 14, 30),
    height: 18,
    minHeight: 0,
    color: '#f8fafc',
    roofColor: '#e2e8f0',
    floors: 5,
    description: 'Tập trung các thương hiệu thời trang thiết kế và mỹ phẩm.',
  },
  {
    id: 'bldg-dd-shop-w',
    propertyId: 'prop-dong-da-02',
    name: 'Dãy Cafe & Ăn uống Chùa Láng',
    type: 'shophouse',
    coordinates: createBuildingPolygon([105.8033, 21.0240], 26, 14, 30),
    height: 16,
    minHeight: 0,
    color: '#f1f5f9',
    roofColor: '#e2e8f0',
    floors: 4,
    description: 'Chuỗi trà sữa, quán ăn vặt sinh viên tấp nập khách trẻ.',
  },
  {
    id: 'bldg-dd-nhi',
    propertyId: 'prop-dong-da-02',
    name: 'Bệnh viện Nhi Trung Ương',
    type: 'landmark',
    coordinates: createBuildingPolygon([105.8078, 21.0235], 50, 36, 0),
    height: 48,
    minHeight: 0,
    color: '#e2e8f0',
    roofColor: '#cbd5e1',
    floors: 12,
    description: 'Bệnh viện chuyên khoa tuyến đầu với lưu lượng người rất cao.',
  },
  {
    id: 'bldg-dd-baoson',
    propertyId: 'prop-dong-da-02',
    name: 'Khách sạn Bảo Sơn International',
    type: 'hotel',
    coordinates: createBuildingPolygon([105.8015, 21.0205], 36, 30, 45),
    height: 52,
    minHeight: 0,
    color: '#cbd5e1',
    roofColor: '#94a3b8',
    floors: 13,
    description: 'Khách sạn tiêu chuẩn 4 sao lâu đời trục Nguyễn Chí Thanh.',
  },
  {
    id: 'bldg-dd-corner',
    propertyId: 'prop-dong-da-02',
    name: 'Chùa Láng Commercial Corner',
    type: 'retail',
    coordinates: createBuildingPolygon([105.8045, 21.0244], 20, 20, 30),
    height: 22,
    minHeight: 0,
    color: '#f1f5f9',
    roofColor: '#e2e8f0',
    floors: 6,
    description: 'Tòa nhà góc 2 mặt tiền cho thuê showroom và phòng khám.',
  },

  // ==========================================
  // 3. BA ĐÌNH — KIM MÃ - VẠN BẢO CLUSTER (prop-ba-dinh-03)
  // Coordinates: [105.8142, 21.0324]
  // ==========================================
  {
    id: 'bldg-bd-subject',
    propertyId: 'prop-ba-dinh-03',
    name: 'Mặt bằng Phố Kim Mã - Vạn Bảo (Đang chọn)',
    type: 'commercial',
    coordinates: createBuildingPolygon([105.8142, 21.0324], 14, 16, 25),
    height: 14,
    minHeight: 0,
    color: '#0284c7',
    roofColor: '#38bdf8',
    floors: 3,
    description: 'Tòa nhà thương mại 3 tầng mặt tiền 6.0m khu Ngoại Giao Đoàn.',
    isSubjectProperty: true,
  },
  {
    id: 'bldg-bd-lotte',
    propertyId: 'prop-ba-dinh-03',
    name: 'Lotte Center Hanoi Landmark',
    type: 'landmark',
    coordinates: createBuildingPolygon([105.8122, 21.0345], 55, 50, 40),
    height: 75,
    minHeight: 0,
    color: '#cbd5e1',
    roofColor: '#94a3b8',
    floors: 25,
    description: 'Tòa tháp biểu tượng 65 tầng kết hợp khách sạn 5 sao, văn phòng Hạng A và TTTM Lotte.',
  },
  {
    id: 'bldg-bd-capital',
    propertyId: 'prop-ba-dinh-03',
    name: 'Capital Place Liễu Giai Twin Towers',
    type: 'office',
    coordinates: createBuildingPolygon([105.8135, 21.0360], 52, 44, 40),
    height: 75,
    minHeight: 0,
    color: '#e2e8f0',
    roofColor: '#cbd5e1',
    floors: 25,
    description: 'Tòa tháp đôi văn phòng Hạng A tiêu chuẩn LEED Gold cao cấp bậc nhất Hà Nội.',
  },
  {
    id: 'bldg-bd-daewoo',
    propertyId: 'prop-ba-dinh-03',
    name: 'Khách sạn Hà Nội Daewoo',
    type: 'hotel',
    coordinates: createBuildingPolygon([105.8105, 21.0332], 60, 45, 40),
    height: 68,
    minHeight: 0,
    color: '#cbd5e1',
    roofColor: '#94a3b8',
    floors: 18,
    description: 'Khách sạn 5 sao đón tiếp các đoàn ngoại giao quốc tế.',
  },
  {
    id: 'bldg-bd-embassy-jp',
    propertyId: 'prop-ba-dinh-03',
    name: 'Đại sứ quán Nhật Bản',
    type: 'landmark',
    coordinates: createBuildingPolygon([105.8140, 21.0348], 45, 38, 25),
    height: 24,
    minHeight: 0,
    color: '#e2e8f0',
    roofColor: '#cbd5e1',
    floors: 6,
    description: 'Khu phức hợp ngoại giao Đại sứ quán Nhật Bản tại Việt Nam.',
  },
  {
    id: 'bldg-bd-vanbao',
    propertyId: 'prop-ba-dinh-03',
    name: 'Khu Ngoại Giao Đoàn Vạn Bảo',
    type: 'office',
    coordinates: createBuildingPolygon([105.8132, 21.0315], 38, 30, 25),
    height: 22,
    minHeight: 0,
    color: '#f1f5f9',
    roofColor: '#e2e8f0',
    floors: 6,
    description: 'Văn phòng các tổ chức phi chính phủ và phái đoàn ngoại giao.',
  },
  {
    id: 'bldg-bd-km-1',
    propertyId: 'prop-ba-dinh-03',
    name: 'Dãy Phố Nhật Bản Kim Mã 1',
    type: 'commercial',
    coordinates: createBuildingPolygon([105.8148, 21.0321], 30, 16, 25),
    height: 18,
    minHeight: 0,
    color: '#f8fafc',
    roofColor: '#e2e8f0',
    floors: 5,
    description: 'Chuỗi ẩm thực Izakaya, Ramen và siêu thị hàng Nhật nội địa.',
  },
  {
    id: 'bldg-bd-km-2',
    propertyId: 'prop-ba-dinh-03',
    name: 'Dãy Phố Nhật Bản Kim Mã 2',
    type: 'commercial',
    coordinates: createBuildingPolygon([105.8138, 21.0328], 32, 18, 25),
    height: 20,
    minHeight: 0,
    color: '#f1f5f9',
    roofColor: '#e2e8f0',
    floors: 6,
    description: 'Khu spa dưỡng sinh phong cách Onsen Nhật Bản và văn phòng đại diện.',
  },
  {
    id: 'bldg-bd-tid',
    propertyId: 'prop-ba-dinh-03',
    name: 'Tòa nhà TID Centre Liễu Giai',
    type: 'office',
    coordinates: createBuildingPolygon([105.8162, 21.0352], 32, 28, 40),
    height: 55,
    minHeight: 0,
    color: '#e2e8f0',
    roofColor: '#cbd5e1',
    floors: 15,
    description: 'Tòa nhà văn phòng tài chính và công ty kiểm toán quốc tế.',
  },
  {
    id: 'bldg-bd-vanphuc',
    propertyId: 'prop-ba-dinh-03',
    name: 'Khu Biệt thự Ngoại Giao Vạn Phúc',
    type: 'residential',
    coordinates: createBuildingPolygon([105.8155, 21.0318], 40, 32, 25),
    height: 24,
    minHeight: 0,
    color: '#e2e8f0',
    roofColor: '#cbd5e1',
    floors: 6,
    description: 'Khu biệt thự ngoại giao xanh yên tĩnh trung tâm Ba Đình.',
  },

  // ==========================================
  // 4. HAI BÀ TRƯNG — LÊ THANH NGHỊ - BÁCH KHOA (prop-hai-ba-trung-04)
  // Coordinates: [105.8472, 21.0028]
  // ==========================================
  {
    id: 'bldg-hbt-subject',
    propertyId: 'prop-hai-ba-trung-04',
    name: 'Mặt bằng Phố Lê Thanh Nghị (Đang chọn)',
    type: 'commercial',
    coordinates: createBuildingPolygon([105.8472, 21.0028], 10, 14, 10),
    height: 12,
    minHeight: 0,
    color: '#0284c7',
    roofColor: '#38bdf8',
    floors: 3,
    description: 'Nhà phố thương mại 3 tầng vị trí vàng ngã ba Bách - Kinh - Xây.',
    isSubjectProperty: true,
  },
  {
    id: 'bldg-hbt-hust-lib',
    propertyId: 'prop-hai-ba-trung-04',
    name: 'Thư viện Tạ Quang Bửu (ĐH Bách Khoa)',
    type: 'cultural',
    coordinates: createBuildingPolygon([105.8450, 21.0045], 50, 40, 0),
    height: 45,
    minHeight: 0,
    color: '#cbd5e1',
    roofColor: '#94a3b8',
    floors: 10,
    description: 'Biểu tượng học thuật với sức chứa hàng nghìn sinh viên công nghệ.',
  },
  {
    id: 'bldg-hbt-neu',
    propertyId: 'prop-hai-ba-trung-04',
    name: 'ĐH Kinh tế Quốc dân (Tòa Nhà Thế Kỷ)',
    type: 'cultural',
    coordinates: createBuildingPolygon([105.8468, 21.0002], 55, 42, 0),
    height: 58,
    minHeight: 0,
    color: '#e2e8f0',
    roofColor: '#cbd5e1',
    floors: 14,
    description: 'Tòa nhà giảng đường hiện đại bậc nhất khối trường kinh tế.',
  },
  {
    id: 'bldg-hbt-nuce',
    propertyId: 'prop-hai-ba-trung-04',
    name: 'ĐH Xây Dựng (Nhà Thí Nghiệm H1)',
    type: 'cultural',
    coordinates: createBuildingPolygon([105.8445, 21.0025], 46, 34, 0),
    height: 40,
    minHeight: 0,
    color: '#cbd5e1',
    roofColor: '#94a3b8',
    floors: 9,
    description: 'Khu giảng đường thực hành kỹ thuật Đại học Xây Dựng Hà Nội.',
  },
  {
    id: 'bldg-hbt-shop-1',
    propertyId: 'prop-hai-ba-trung-04',
    name: 'Dãy Phố Công Nghệ Lê Thanh Nghị',
    type: 'shophouse',
    coordinates: createBuildingPolygon([105.8478, 21.0025], 32, 16, 10),
    height: 18,
    minHeight: 0,
    color: '#f8fafc',
    roofColor: '#e2e8f0',
    floors: 5,
    description: 'Phố linh kiện máy tính, phụ kiện công nghệ và sửa chữa đồ điện tử.',
  },
  {
    id: 'bldg-hbt-shop-2',
    propertyId: 'prop-hai-ba-trung-04',
    name: 'Dãy Cafe Học Nhóm & Trà Chanh Sinh Viên',
    type: 'shophouse',
    coordinates: createBuildingPolygon([105.8465, 21.0031], 28, 15, 10),
    height: 16,
    minHeight: 0,
    color: '#f1f5f9',
    roofColor: '#e2e8f0',
    floors: 4,
    description: 'Chuỗi quán trà và không gian học bài đông đúc cả ngày lẫn đêm.',
  },
  {
    id: 'bldg-hbt-bachmai',
    propertyId: 'prop-hai-ba-trung-04',
    name: 'Bệnh viện Bạch Mai (Khu Khám Bệnh Mới)',
    type: 'landmark',
    coordinates: createBuildingPolygon([105.8432, 21.0005], 60, 48, 0),
    height: 52,
    minHeight: 0,
    color: '#e2e8f0',
    roofColor: '#cbd5e1',
    floors: 12,
    description: 'Bệnh viện đa khoa quốc gia tuyến cuối lớn nhất miền Bắc.',
  },
  {
    id: 'bldg-hbt-market',
    propertyId: 'prop-hai-ba-trung-04',
    name: 'Tổ hợp Thương mại Chợ Bách Khoa',
    type: 'retail',
    coordinates: createBuildingPolygon([105.8485, 21.0035], 35, 25, 10),
    height: 16,
    minHeight: 0,
    color: '#f1f5f9',
    roofColor: '#e2e8f0',
    floors: 4,
    description: 'Tụ điểm mua sắm quần áo giá rẻ và đồ gia dụng cho sinh viên.',
  },
  {
    id: 'bldg-hbt-dorm',
    propertyId: 'prop-hai-ba-trung-04',
    name: 'Ký Túc Xá Sinh Viên Bách Khoa B7',
    type: 'residential',
    coordinates: createBuildingPolygon([105.8458, 21.0050], 40, 20, 0),
    height: 28,
    minHeight: 0,
    color: '#e2e8f0',
    roofColor: '#cbd5e1',
    floors: 7,
    description: 'Cụm ký túc xá tập trung hàng ngàn sinh viên nội trú.',
  },

  // ==========================================
  // 5. HOÀN KIẾM — LÝ THƯỜNG KIỆT - PHAN CHU TRINH (prop-hoan-kiem-05)
  // Coordinates: [105.8562, 21.0218]
  // ==========================================
  {
    id: 'bldg-hk-subject',
    propertyId: 'prop-hoan-kiem-05',
    name: 'Mặt bằng Phố Lý Thường Kiệt (Đang chọn)',
    type: 'commercial',
    coordinates: createBuildingPolygon([105.8562, 21.0218], 12, 18, 55),
    height: 14,
    minHeight: 0,
    color: '#0284c7',
    roofColor: '#38bdf8',
    floors: 3,
    description: 'Biệt thự phố kiến trúc Pháp cổ 3 tầng đối diện trung tâm tài chính Hoàn Kiếm.',
    isSubjectProperty: true,
  },
  {
    id: 'bldg-hk-opera',
    propertyId: 'prop-hoan-kiem-05',
    name: 'Nhà Hát Lớn Hà Nội (Hanoi Opera House)',
    type: 'landmark',
    coordinates: createBuildingPolygon([105.8578, 21.0245], 48, 42, 55),
    height: 28,
    minHeight: 0,
    color: '#fef3c7',
    roofColor: '#fde68a',
    floors: 4,
    description: 'Di sản kiến trúc Pháp cổ điển biểu tượng văn hóa thủ đô.',
  },
  {
    id: 'bldg-hk-cornerstone',
    propertyId: 'prop-hoan-kiem-05',
    name: 'CornerStone Building Phan Chu Trinh',
    type: 'office',
    coordinates: createBuildingPolygon([105.8560, 21.0230], 44, 38, 55),
    height: 62,
    minHeight: 0,
    color: '#cbd5e1',
    roofColor: '#94a3b8',
    floors: 15,
    description: 'Tháp văn phòng Hạng A quy tụ các định chế tài chính và quỹ đầu tư quốc tế.',
  },
  {
    id: 'bldg-hk-pacific',
    propertyId: 'prop-hoan-kiem-05',
    name: 'Pacific Place Lý Thường Kiệt',
    type: 'commercial',
    coordinates: createBuildingPolygon([105.8525, 21.0222], 48, 42, 55),
    height: 75,
    minHeight: 0,
    color: '#e2e8f0',
    roofColor: '#cbd5e1',
    floors: 19,
    description: 'Tổ hợp văn phòng hạng sang, căn hộ dịch vụ và nhà hàng fine-dining.',
  },
  {
    id: 'bldg-hk-bidv',
    propertyId: 'prop-hoan-kiem-05',
    name: 'BIDV Tower Trần Quang Khải',
    type: 'office',
    coordinates: createBuildingPolygon([105.8585, 21.0255], 45, 38, 30),
    height: 75,
    minHeight: 0,
    color: '#cbd5e1',
    roofColor: '#94a3b8',
    floors: 25,
    description: 'Trụ sở chính Ngân hàng Thương mại Cổ phần Đầu tư và Phát triển Việt Nam.',
  },
  {
    id: 'bldg-hk-metropole',
    propertyId: 'prop-hoan-kiem-05',
    name: 'Sofitel Legend Metropole Hanoi',
    type: 'hotel',
    coordinates: createBuildingPolygon([105.8558, 21.0258], 55, 45, 55),
    height: 28,
    minHeight: 0,
    color: '#f8fafc',
    roofColor: '#e2e8f0',
    floors: 6,
    description: 'Khách sạn lịch sử 5 sao đẳng cấp quốc tế lâu đời nhất Hà Nội.',
  },
  {
    id: 'bldg-hk-mof',
    propertyId: 'prop-hoan-kiem-05',
    name: 'Trụ sở Bộ Tài Chính',
    type: 'landmark',
    coordinates: createBuildingPolygon([105.8578, 21.0198], 50, 35, 55),
    height: 24,
    minHeight: 0,
    color: '#e2e8f0',
    roofColor: '#cbd5e1',
    floors: 5,
    description: 'Cơ quan hành chính nhà nước khu vực trung tâm quận Hoàn Kiếm.',
  },
  {
    id: 'bldg-hk-french-1',
    propertyId: 'prop-hoan-kiem-05',
    name: 'Dãy Nhà Phố Pháp Cổ Phan Chu Trinh',
    type: 'shophouse',
    coordinates: createBuildingPolygon([105.8555, 21.0212], 30, 18, 55),
    height: 18,
    minHeight: 0,
    color: '#f1f5f9',
    roofColor: '#e2e8f0',
    floors: 4,
    description: 'Showroom đồng hồ xa xỉ, phòng tranh nghệ thuật và tiệm trang sức cao cấp.',
  },
  {
    id: 'bldg-hk-french-2',
    propertyId: 'prop-hoan-kiem-05',
    name: 'Dãy Biệt Thự Thương Mại Lý Thường Kiệt',
    type: 'shophouse',
    coordinates: createBuildingPolygon([105.8568, 21.0224], 28, 16, 55),
    height: 16,
    minHeight: 0,
    color: '#f8fafc',
    roofColor: '#e2e8f0',
    floors: 4,
    description: 'Nhà hàng Âu cổ điển, hầm rượu vang và quán cafe sang trọng.',
  },
  {
    id: 'bldg-hk-pharm',
    propertyId: 'prop-hoan-kiem-05',
    name: 'Đại học Dược Hà Nội',
    type: 'cultural',
    coordinates: createBuildingPolygon([105.8590, 21.0225], 42, 36, 55),
    height: 25,
    minHeight: 0,
    color: '#e2e8f0',
    roofColor: '#cbd5e1',
    floors: 4,
    description: 'Tòa nhà kiến trúc Đông Dương trường Đại học Dược.',
  },

  // ==========================================
  // 6. TÂY HỒ — QUẢNG AN - TÔ NGỌC VÂN CLUSTER (prop-tay-ho-06)
  // Coordinates: [105.8246, 21.0642]
  // ==========================================
  {
    id: 'bldg-th-subject',
    propertyId: 'prop-tay-ho-06',
    name: 'Mặt bằng Phố Quảng An - Tô Ngọc Vân (Đang chọn)',
    type: 'commercial',
    coordinates: createBuildingPolygon([105.8246, 21.0642], 12, 16, 120),
    height: 13,
    minHeight: 0,
    color: '#0284c7',
    roofColor: '#38bdf8',
    floors: 3,
    description: 'Biệt thự thương mại view hồ Tây 3 tầng, sân vườn phong cách resort.',
    isSubjectProperty: true,
  },
  {
    id: 'bldg-th-fraser',
    propertyId: 'prop-tay-ho-06',
    name: 'Fraser Suites Hanoi Westlake',
    type: 'residential',
    coordinates: createBuildingPolygon([105.8272, 21.0638], 48, 38, 30),
    height: 75,
    minHeight: 0,
    color: '#cbd5e1',
    roofColor: '#94a3b8',
    floors: 24,
    description: 'Tháp căn hộ dịch vụ quốc tế hạng sang với cộng đồng chuyên gia Expat.',
  },
  {
    id: 'bldg-th-somerset',
    propertyId: 'prop-tay-ho-06',
    name: 'Somerset West Point Hanoi',
    type: 'hotel',
    coordinates: createBuildingPolygon([105.8282, 21.0615], 52, 40, 30),
    height: 75,
    minHeight: 0,
    color: '#e2e8f0',
    roofColor: '#cbd5e1',
    floors: 25,
    description: 'Tòa nhà khách sạn căn hộ dịch vụ cao cấp tầm nhìn panorama mặt nước hồ Tây.',
  },
  {
    id: 'bldg-th-syrena',
    propertyId: 'prop-tay-ho-06',
    name: 'Syrena Shopping Center Xuân Diệu',
    type: 'retail',
    coordinates: createBuildingPolygon([105.8228, 21.0620], 45, 38, 45),
    height: 28,
    minHeight: 0,
    color: '#e2e8f0',
    roofColor: '#cbd5e1',
    floors: 5,
    description: 'Trung tâm mua sắm, siêu thị ngoại nhập Annam Gourmet và nhà hàng Âu Á.',
  },
  {
    id: 'bldg-th-villa-1',
    propertyId: 'prop-tay-ho-06',
    name: 'Cụm Biệt thự Boutique Tô Ngọc Vân 1',
    type: 'commercial',
    coordinates: createBuildingPolygon([105.8252, 21.0648], 30, 20, 120),
    height: 16,
    minHeight: 0,
    color: '#f8fafc',
    roofColor: '#e2e8f0',
    floors: 4,
    description: 'Nhà hàng Pizza củi Ý, phòng triển lãm tranh nghệ thuật và tiệm bánh artisan.',
  },
  {
    id: 'bldg-th-villa-2',
    propertyId: 'prop-tay-ho-06',
    name: 'Cụm Biệt thự Boutique Tô Ngọc Vân 2',
    type: 'commercial',
    coordinates: createBuildingPolygon([105.8238, 21.0636], 28, 18, 120),
    height: 15,
    minHeight: 0,
    color: '#f1f5f9',
    roofColor: '#e2e8f0',
    floors: 3,
    description: 'Trung tâm yoga, thiền chuông xoay Tây Tạng và spa thảo mộc quốc tế.',
  },
  {
    id: 'bldg-th-lake-res-1',
    propertyId: 'prop-tay-ho-06',
    name: 'Quảng An Lakeside Apartments 1',
    type: 'residential',
    coordinates: createBuildingPolygon([105.8240, 21.0652], 35, 24, 60),
    height: 22,
    minHeight: 0,
    color: '#e2e8f0',
    roofColor: '#cbd5e1',
    floors: 6,
    description: 'Căn hộ view hồ Tây yên bình với ban công tràn kính.',
  },
  {
    id: 'bldg-th-lake-res-2',
    propertyId: 'prop-tay-ho-06',
    name: 'Quảng An Lakeside Apartments 2',
    type: 'residential',
    coordinates: createBuildingPolygon([105.8258, 21.0634], 32, 22, 60),
    height: 20,
    minHeight: 0,
    color: '#f1f5f9',
    roofColor: '#e2e8f0',
    floors: 5,
    description: 'Khu cư trú cao cấp của nhân sự đại sứ quán và gia đình chuyên gia.',
  },
  {
    id: 'bldg-th-daluva',
    propertyId: 'prop-tay-ho-06',
    name: 'Lakeside Dining & Lounge Compound',
    type: 'retail',
    coordinates: createBuildingPolygon([105.8232, 21.0645], 25, 18, 120),
    height: 14,
    minHeight: 0,
    color: '#f8fafc',
    roofColor: '#e2e8f0',
    floors: 3,
    description: 'Tổ hợp ẩm thực Địa Trung Hải ngoài trời thoáng mát bên bờ sóng hồ.',
  },
  {
    id: 'bldg-th-peninsula',
    propertyId: 'prop-tay-ho-06',
    name: 'Khu Biệt Thự Bán Đảo Quảng Khánh',
    type: 'residential',
    coordinates: createBuildingPolygon([105.8220, 21.0665], 32, 25, 45),
    height: 16,
    minHeight: 0,
    color: '#e2e8f0',
    roofColor: '#cbd5e1',
    floors: 3,
    description: 'Khu biệt thự sinh thái biệt lập đẳng cấp hàng đầu Hà Nội.',
  },
];

/**
 * Filter 3D building footprints for a specific property.
 * If propertyId is not found, returns the first property's cluster.
 */
export function getBuildingFootprintsForProperty(
  propertyId: string
): Building3DFootprint[] {
  const filtered = ALL_BUILDING_FOOTPRINTS.filter(
    (b) => b.propertyId === propertyId
  );
  if (filtered.length > 0) {
    return filtered;
  }
  return ALL_BUILDING_FOOTPRINTS.filter(
    (b) => b.propertyId === 'prop-cau-giay-01'
  );
}

/**
 * Returns a standard GeoJSON FeatureCollection formatted for MapLibre GL
 * fill-extrusion layers.
 *
 * @param propertyId Optional propertyId to filter by. If omitted, returns all buildings.
 */
export function getBuildingFootprintsGeoJSON(
  propertyId?: string
): BuildingFeatureCollection {
  const list = propertyId
    ? getBuildingFootprintsForProperty(propertyId)
    : ALL_BUILDING_FOOTPRINTS;

  const features: BuildingGeoJSONFeature[] = list.map((bldg) => ({
    type: 'Feature',
    id: bldg.id,
    properties: {
      id: bldg.id,
      name: bldg.name,
      type: bldg.type,
      height: bldg.height,
      minHeight: bldg.minHeight ?? 0,
      baseHeight: bldg.minHeight ?? 0,
      color: bldg.color ?? '#e2e8f0',
      roofColor: bldg.roofColor ?? '#cbd5e1',
      floors: bldg.floors ?? Math.max(1, Math.round(bldg.height / 3.5)),
      description: bldg.description ?? '',
      propertyId: bldg.propertyId ?? '',
      isSubjectProperty: Boolean(bldg.isSubjectProperty),
    },
    geometry: {
      type: 'Polygon',
      coordinates: [bldg.coordinates],
    },
  }));

  return {
    type: 'FeatureCollection',
    features,
  };
}

export const BUILDINGS_GEOJSON: BuildingFeatureCollection =
  getBuildingFootprintsGeoJSON();
