# Mô Hình Dữ Liệu & API (Data Models & API Reference)

Tài liệu này mô tả chi tiết hệ thống kiểu dữ liệu TypeScript, cấu trúc thực thể mặt bằng BĐS Thương mại, và các API tích hợp trong hệ thống **SpaceVision BDS AI**.

---

## 1. Nguồn Gốc Dữ Liệu (Data Provenance)

Mỗi trường dữ liệu và chỉ số trong hệ thống đều được gắn nhãn nguồn gốc (`DataProvenance`) để đảm bảo tính minh bạch đối với nhà đầu tư và cơ quan thẩm định:

```typescript
export type DataProvenance = 
  | 'verified'      // Dữ liệu đo đạc thực tế từ sổ hồng / bản vẽ hoàn công / khảo sát hiện trường
  | 'demo'          // Dữ liệu mô phỏng minh họa
  | 'ai_estimate'   // Chỉ số ước tính từ thuật toán AI phân tích không gian
  | 'user_input';   // Dữ liệu do người dùng tùy biến hoặc nhập liệu
```

---

## 2. Thực Thể Mặt Bằng BĐS (`PropertyItem`)

Đây là cấu trúc dữ liệu cốt lõi đại diện cho một bất động sản thương mại:

```typescript
export interface PropertyItem {
  id: string;                      // Mã định danh nội bộ (vd: 'prop-cau-giay-01')
  code: string;                    // Mã hiển thị công khai (vd: 'SV-CG-101')
  title: string;                   // Tiêu đề thương mại mặt bằng
  address: string;                 // Địa chỉ chi tiết (số nhà, đường, phường, quận)
  district: string;                // Quận / Khu vực (vd: 'Cầu Giấy', 'Hoàn Kiếm')
  coordinates: [number, number];   // Tọa độ địa lý [Kinh độ (Lng), Vĩ độ (Lat)]
  
  // Thông số tài chính & quy mô
  monthlyRentMillionVND: number;   // Giá thuê hàng tháng (triệu VNĐ)
  depositMonths: number;           // Số tháng tiền cọc
  leaseTermYears: number;          // Thời hạn hợp đồng thuê (năm)
  totalUsableArea: number;         // Tổng diện tích sử dụng (m²)
  floorsCount: number;             // Số tầng toà nhà
  frontageMeters: number;          // Chiều rộng mặt tiền tiếp giáp đường (m)
  roadWidthMeters: number;         // Chiều rộng lòng đường & vỉa hè trước nhà (m)
  
  // Hướng & Giao thông
  orientationLabel: string;        // Hướng nhà (vd: 'Đông Nam', 'Tây Bắc')
  orientationAzimuth: number;      // Góc phương vị la bàn (0° - 360°)
  parkingSpotsMotorbike: number;   // Sức chứa xe máy tối đa
  parkingSpotsCar: number;         // Sức chứa ô tô tối đa
  
  // Không gian & Tầng bóc tách
  floors: FloorSpec[];             // Danh sách cấu trúc từng tầng
  buildingHeightMeters: number;    // Chiều cao tổng thể khối toà nhà (m)
  
  // Đánh giá AI
  aiSuitabilityScore: number;      // Điểm tương thích kinh doanh (0 - 100)
  suitableBusinessTypes: BusinessType[]; // Danh sách ngành nghề tối ưu nhất
  
  // Thông tin liên hệ chính chủ
  contact?: {
    name: string;                  // Tên người đại diện / chủ nhà
    role: string;                  // Vai trò ('Chính chủ', 'Ban quản lý toà nhà')
    phone: string;                 // Số điện thoại liên hệ
    zaloPhone?: string;            // Số điện thoại kết nối Zalo
  };
}
```

---

## 3. Cấu Trúc Tầng & Hình Học Phòng (`FloorSpec` & `RoomGeometry`)

Mỗi toà nhà gồm nhiều tầng, và mỗi tầng được cấu thành từ các khối không gian phòng chức năng:

```typescript
export interface FloorSpec {
  level: number;                   // Số tầng (1, 2, 3...)
  name: string;                    // Tên hiển thị (vd: 'Tầng 1 - Mặt tiền thương mại')
  elevation: number;               // Cao độ sàn theo trục Y trong 3D (m)
  height: number;                  // Chiều cao trần thông thuỷ (m)
  totalArea: number;               // Diện tích mặt bằng tầng (m²)
  rooms: RoomGeometry[];           // Các phòng / phân khu chức năng bên trong
}

export interface RoomGeometry {
  id: string;                      // Mã định danh phòng (vd: 'cg-f1-r1')
  name: string;                    // Tên phân khu (vd: 'Sảnh Đón Khách & Quầy Bar')
  floor: number;                   // Thuộc tầng nào
  type: RoomType;                  // Loại phân khu chức năng (retail, service_counter...)
  
  // Tọa độ cục bộ (Local CAD Coordinates - mét)
  x: number;                       // Vị trí trục hoành tính từ mép trái toà nhà
  z: number;                       // Vị trí trục tung tính từ mép sau toà nhà
  width: number;                   // Bề ngang phòng (m)
  depth: number;                   // Chiều sâu phòng (m)
  height: number;                  // Chiều cao phòng (m)
  area: number;                    // Diện tích phòng (m²)
  color: string;                   // Màu sắc hiển thị trong bản vẽ kiến trúc
  features: string[];              // Đặc điểm kỹ thuật (vd: 'Vách kính cường lực', 'Ống hút mùi')
}
```

---

## 4. Thực Thể Nội Thất 3D (`FurnitureItem`)

Đại diện cho các đồ đạc nội thất được xếp đặt trong studio 3D/2D:

```typescript
export interface FurnitureItem {
  id: string;                      // Mã đồ nội thất
  name: string;                    // Tên gọi (vd: 'Bàn Trà Đôi Scandinavian')
  category: 'seating' | 'table' | 'counter' | 'storage' | 'equipment' | 'decor' | 'lighting';
  assetType: string;               // Mã asset 3D / SVG
  floor: number;                   // Tầng đặt đồ nội thất
  position: [number, number, number]; // Tọa độ [X, Y, Z] trong không gian 3D
  rotation: [number, number, number]; // Góc xoay [Rx, Ry, Rz]
  dimensions: [number, number, number]; // Kích thước phủ bì [Rộng, Cao, Sâu] (m)
  unitCostMillionVND: number;      // Đơn giá thiết bị (triệu VNĐ)
  quantity: number;                // Số lượng
}
```

---

## 5. Các Dịch Vụ API (API Routes & Integrations)

### 5.1. Route Xử lý AI Nội Bộ (`/api/ai`)
- **Method**: `POST`
- **Payload**:
  ```json
  {
    "query": "Tìm mặt bằng mở quán café 35m2 tại Cầu Giấy",
    "propertyId": "prop-cau-giay-01"
  }
  ```
- **Response**: Trả về dữ liệu gợi ý phân tích, điểm match và lý do đề xuất dựa trên mô hình NLP.

### 5.2. Open Source Routing Machine (OSRM API)
- **URL**: `https://router.project-osrm.org/route/v1/{profile}/{coordinates}?overview=full&geometries=geojson`
- **Profile hỗ trợ**:
  - `foot`: Đi bộ
  - `bike`: Xe đạp / Xe máy
  - `car`: Ô tô
- **Response**: Tuyến đường GeoJSON Polyline cùng thời gian di chuyển (`duration`) và quãng đường chính xác (`distance`).

### 5.3. MapLibre GL Tile Services
- Sử dụng chuẩn Vector Tiles OpenStreetMap / Carto Basemaps để render bản đồ nền tốc độ cao không phụ thuộc API key trả phí.
