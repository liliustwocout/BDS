import React from 'react';
import {
  Search,
  Filter,
  Building2,
  PhoneCall,
  Box,
  Compass,
  MapPin,
  Navigation,
  Layers,
  Maximize2,
  SunMedium,
  CloudSun,
  Sparkles,
  Palette,
  Calculator,
  FileSpreadsheet,
  Scale,
  BarChart3,
  Trophy,
  Download,
} from 'lucide-react';
import { ActiveTab } from '@/types';

export interface TourStep {
  id: string;
  stepNumber: number;
  totalSteps: number;
  selector: string;
  badge: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  preferredPlacement: 'top' | 'bottom';
  padding: number;
  tabTriggerSelector?: string;
}

export interface PageTourMeta {
  tabId: ActiveTab;
  pageTitle: string;
  steps: TourStep[];
}

export const PAGE_TOUR_CONFIG: Record<ActiveTab, PageTourMeta> = {
  landing: {
    tabId: 'landing',
    pageTitle: 'Trang chủ SpaceVision',
    steps: [
      {
        id: 'search-input',
        stepNumber: 1,
        totalSteps: 5,
        selector: '#tour-search-input',
        badge: 'Bước 1/5 • AI Intent',
        title: 'Tìm kiếm bằng ý tưởng kinh doanh',
        description:
          'Gõ nhu cầu thực tế bằng ngôn ngữ tự nhiên (VD: "Tìm quán cafe acoustic Cầu Giấy dưới 30 triệu"). AI sẽ tự động phân tích ngành nghề, quận và ngân sách.',
        icon: Search,
        preferredPlacement: 'bottom',
        padding: 8,
      },
      {
        id: 'search-cta',
        stepNumber: 2,
        totalSteps: 5,
        selector: '#tour-search-cta',
        badge: 'Bước 2/5 • Bộ lọc & Chấm điểm',
        title: 'Bộ lọc nhanh & Nút Đề xuất AI',
        description:
          'Chọn nhanh mô hình kinh doanh, quận trung tâm hoặc mức giá, sau đó bấm "Tìm kiếm & Đề xuất AI" để hệ thống chấm điểm mức độ phù hợp (% Match).',
        icon: Filter,
        preferredPlacement: 'bottom',
        padding: 8,
      },
      {
        id: 'property-card',
        stepNumber: 3,
        totalSteps: 5,
        selector: '#tour-property-card',
        badge: 'Bước 3/5 • Mặt bằng thực tế',
        title: 'Thẻ mặt bằng & 4 chỉ số cốt lõi',
        description:
          'Mỗi mặt bằng hiển thị 4 chỉ số quan trọng nhất: Giá thuê (triệu/tháng), Diện tích (m²), Mặt tiền (m) và Số tầng, giúp bạn nắm bắt nhanh hiện trạng.',
        icon: Building2,
        preferredPlacement: 'bottom',
        padding: 8,
      },
      {
        id: 'landlord-contact',
        stepNumber: 4,
        totalSteps: 5,
        selector: '#tour-landlord-contact',
        badge: 'Bước 4/5 • Liên hệ chính chủ',
        title: 'Kết nối Chủ nhà & Đặt lịch hẹn xem',
        description:
          'Gọi hotline trực tiếp, chat Zalo 1 chạm hoặc đặt lịch hẹn khảo sát thực địa với chủ nhà hoặc ban quản lý toà nhà mà không qua môi giới trung gian.',
        icon: PhoneCall,
        preferredPlacement: 'top',
        padding: 6,
      },
      {
        id: '3d-actions',
        stepNumber: 5,
        totalSteps: 5,
        selector: '#tour-3d-actions',
        badge: 'Bước 5/5 • Khảo sát 3D',
        title: 'Khảo sát Bản đồ 3D & Không gian 3D Twin',
        description:
          'Bấm "Bản đồ 3D" để xem khối toà nhà lập thể và tiện ích quy hoạch; hoặc "Không gian 3D" để bóc tách từng tầng (Dollhouse) và đo kích thước phòng.',
        icon: Box,
        preferredPlacement: 'top',
        padding: 6,
      },
    ],
  },

  discovery: {
    tabId: 'discovery',
    pageTitle: 'Tìm kiếm & Đề xuất AI',
    steps: [
      {
        id: 'disc-search',
        stepNumber: 1,
        totalSteps: 4,
        selector: '#tour-disc-search',
        badge: 'Bước 1/4 • AI Intent Search',
        title: 'Thanh tìm kiếm ngôn ngữ tự nhiên',
        description:
          'Nhập tự do mọi tiêu chí kinh doanh. Trợ lý AI sẽ trích xuất ngành kinh doanh, diện tích mong muốn và ngân sách tối đa.',
        icon: Search,
        preferredPlacement: 'bottom',
        padding: 8,
      },
      {
        id: 'disc-filters',
        stepNumber: 2,
        totalSteps: 4,
        selector: '#tour-disc-filters',
        badge: 'Bước 2/4 • Bộ lọc đa tiêu chí',
        title: 'Bộ lọc nhanh theo Quận, Giá & Diện tích',
        description:
          'Tinh chỉnh khoảng giá, diện tích tối thiểu và quận huyện để lọc danh sách mặt bằng phù hợp nhất với mô hình của bạn.',
        icon: Filter,
        preferredPlacement: 'bottom',
        padding: 8,
      },
      {
        id: 'disc-card',
        stepNumber: 3,
        totalSteps: 4,
        selector: '#tour-disc-card',
        badge: 'Bước 3/4 • Chấm điểm phù hợp',
        title: 'Thẻ phân tích & Điểm % Match AI',
        description:
          'AI chấm điểm dựa trên lưu lượng khách vãng lai, tỷ lệ chi phí thuê trên doanh thu dự kiến và mức độ phù hợp vỉa hè.',
        icon: Building2,
        preferredPlacement: 'bottom',
        padding: 8,
      },
      {
        id: 'disc-actions',
        stepNumber: 4,
        totalSteps: 4,
        selector: '#tour-disc-actions',
        badge: 'Bước 4/4 • Hành động khảo sát',
        title: 'Khảo sát 3D & Đưa vào đối đầu so sánh',
        description:
          'Bấm chuyển nhanh sang Bản đồ 3D, Không gian 3D Twin hoặc bấm "So sánh" để đưa mặt bằng này vào bảng cân đối đối đầu.',
        icon: Scale,
        preferredPlacement: 'top',
        padding: 6,
      },
    ],
  },

  location: {
    tabId: 'location',
    pageTitle: 'Bản đồ 3D toà nhà & Tiện ích',
    steps: [
      {
        id: 'map-3d-toggle',
        stepNumber: 1,
        totalSteps: 5,
        selector: '#tour-map-3d-toggle',
        badge: 'Bước 1/5 • Góc nhìn 3D',
        title: 'Chuyển đổi góc nhìn 3D Perspective (55°)',
        description:
          'Bật chế độ 3D để quan sát khối lập thể của toà nhà và các công trình xung quanh theo toạ độ thực tế Hà Nội.',
        icon: Compass,
        preferredPlacement: 'bottom',
        padding: 8,
      },
      {
        id: 'map-poi-filters',
        stepNumber: 2,
        totalSteps: 5,
        selector: '#tour-map-poi-filters',
        badge: 'Bước 2/5 • Phân tầng tiện ích',
        title: '3 Nhóm tiện ích quy hoạch',
        description:
          'Bật/tắt các lớp: Khách hàng tiềm năng (Trường học, Toà văn phòng), Đối thủ cạnh tranh trực tiếp, và Hạ tầng giao thông (Bãi đỗ xe, Bus).',
        icon: MapPin,
        preferredPlacement: 'bottom',
        padding: 8,
        tabTriggerSelector: '#tab-location-pois',
      },
      {
        id: 'map-route-list',
        stepNumber: 3,
        totalSteps: 5,
        selector: '#tour-map-route-list',
        badge: 'Bước 3/5 • Lộ trình thực tế',
        title: 'Tuyến đường kết nối OSRM thực tế',
        description:
          'Xem khoảng cách chính xác theo mét và thời gian di chuyển thực tế theo đường phố thay vì đo đường chim bay.',
        icon: Navigation,
        preferredPlacement: 'top',
        padding: 8,
      },
      {
        id: 'map-fly-cam',
        stepNumber: 4,
        totalSteps: 5,
        selector: '#tour-map-fly-cam',
        badge: 'Bước 4/5 • Bay cam điện ảnh',
        title: 'Tính năng Bay cam (Fly-along 60 FPS)',
        description:
          'Bấm "Bay cam" để camera máy bay không người lái tự động lướt dọc theo tuyến đường từ toà nhà đến tiện ích với gia tốc mượt mà.',
        icon: Navigation,
        preferredPlacement: 'top',
        padding: 6,
      },
      {
        id: 'map-recenter',
        stepNumber: 5,
        totalSteps: 5,
        selector: '#tour-map-recenter',
        badge: 'Bước 5/5 • Định vị trung tâm',
        title: 'Nút căn giữa toà nhà chính',
        description:
          'Dễ dàng đưa tầm nhìn camera quay trở lại trọng tâm toà nhà khảo sát sau khi xoay lật hoặc khám phá khu vực xung quanh.',
        icon: Compass,
        preferredPlacement: 'bottom',
        padding: 6,
      },
    ],
  },

  twin: {
    tabId: 'twin',
    pageTitle: 'Không gian 3D Digital Twin',
    steps: [
      {
        id: 'twin-mode',
        stepNumber: 1,
        totalSteps: 4,
        selector: '#tour-twin-mode',
        badge: 'Bước 1/4 • Chế độ xem',
        title: 'Chuyển đổi 3D Dollhouse, 2D & Split View',
        description:
          'Xem mô hình 3D bóc mái (Dollhouse), sơ đồ mặt bằng kỹ thuật 2D hoặc chia đôi màn hình trực quan để đối chiếu đồng thời.',
        icon: Layers,
        preferredPlacement: 'bottom',
        padding: 8,
      },
      {
        id: 'twin-floor',
        stepNumber: 2,
        totalSteps: 4,
        selector: '#tour-twin-floor',
        badge: 'Bước 2/4 • Bóc tách tầng',
        title: 'Bộ chọn bóc tách từng tầng nhà',
        description:
          'Lựa chọn xem từng tầng riêng biệt (Tầng 1, Tầng 2) hoặc toàn bộ khối nhà để đánh giá công năng từng sàn sử dụng.',
        icon: Building2,
        preferredPlacement: 'bottom',
        padding: 8,
      },
      {
        id: 'twin-dimensions',
        stepNumber: 3,
        totalSteps: 4,
        selector: '#tour-twin-dimensions',
        badge: 'Bước 3/4 • Đo đạc không gian',
        title: 'Bật/tắt thước đo kích thước thực tế',
        description:
          'Hiển thị thông số chiều dài mặt tiền, chiều sâu nhà và diện tích từng khu chức năng phục vụ tính toán lắp đặt quầy kệ.',
        icon: Maximize2,
        preferredPlacement: 'bottom',
        padding: 6,
      },
      {
        id: 'twin-canvas',
        stepNumber: 4,
        totalSteps: 4,
        selector: '#tour-twin-canvas',
        badge: 'Bước 4/4 • Tương tác 360°',
        title: 'Không gian xoay lật 360 độ (Orbit 3D)',
        description:
          'Giữ chuột trái để xoay góc nhìn, chuột phải để di chuyển ngang và con lăn chuột để zoom cận cảnh kết cấu dầm cột.',
        icon: Box,
        preferredPlacement: 'top',
        padding: 8,
      },
    ],
  },

  environment: {
    tabId: 'environment',
    pageTitle: 'Mô phỏng Ánh sáng & Mặt trời',
    steps: [
      {
        id: 'env-solar-slider',
        stepNumber: 1,
        totalSteps: 4,
        selector: '#tour-env-solar-slider',
        badge: 'Bước 1/4 • Quỹ đạo mặt trời',
        title: 'Thanh trượt giờ trong ngày (6:00 - 18:00)',
        description:
          'Kéo thanh trượt hoặc bấm nút Play để mô phỏng sự dịch chuyển của bóng nắng chiếu vào mặt tiền toà nhà từ sáng đến chiều.',
        icon: SunMedium,
        preferredPlacement: 'top',
        padding: 8,
      },
      {
        id: 'env-weather',
        stepNumber: 2,
        totalSteps: 4,
        selector: '#tour-env-weather',
        badge: 'Bước 2/4 • Thời tiết vi khí hậu',
        title: 'Mô phỏng điều kiện nắng, mây râm & mưa',
        description:
          'Kiểm tra ánh sáng tự nhiên khi trời nắng gắt, mây râm khuếch tán hoặc khi mưa rào để dự toán chi phí rèm chắn nắng & máy lạnh.',
        icon: CloudSun,
        preferredPlacement: 'bottom',
        padding: 8,
      },
      {
        id: 'env-metrics',
        stepNumber: 3,
        totalSteps: 4,
        selector: '#tour-env-metrics',
        badge: 'Bước 3/4 • Chỉ số ánh sáng',
        title: 'Bảng phân tích độ rọi Lux & nhiệt độ bề mặt',
        description:
          'Xem thông số độ rọi Lux tự nhiên, nguy cơ chói lóa bảng hiệu và đánh giá sự thông thoáng đón gió tự nhiên.',
        icon: SunMedium,
        preferredPlacement: 'bottom',
        padding: 8,
      },
      {
        id: 'env-compass',
        stepNumber: 4,
        totalSteps: 4,
        selector: '#tour-env-compass',
        badge: 'Bước 4/4 • Phương vị nhà',
        title: 'La bàn phương vị & góc đón nắng',
        description:
          'Xác định chính xác hướng mặt tiền (Đông Nam đón gió, Tây nắng chiều) để tối ưu công năng mở cửa kinh doanh.',
        icon: Compass,
        preferredPlacement: 'bottom',
        padding: 6,
      },
    ],
  },

  studio: {
    tabId: 'studio',
    pageTitle: 'Thiết kế AI & Dự toán Chi phí',
    steps: [
      {
        id: 'studio-business',
        stepNumber: 1,
        totalSteps: 4,
        selector: '#tour-studio-business',
        badge: 'Bước 1/4 • Mô hình kinh doanh',
        title: 'Chọn loại hình kinh doanh mục tiêu',
        description:
          'Chuyển đổi giữa Cafe, Nhà hàng, Spa, Thời trang hoặc Văn phòng để AI tự động cấu hình danh mục nội thất chuyên dụng.',
        icon: Sparkles,
        preferredPlacement: 'bottom',
        padding: 8,
        tabTriggerSelector: '#tab-studio-concept',
      },
      {
        id: 'studio-style',
        stepNumber: 2,
        totalSteps: 4,
        selector: '#tour-studio-style',
        badge: 'Bước 2/4 • Phong cách nội thất',
        title: 'Phong cách thiết kế (Bắc Âu, Tối giản, Hiện đại)',
        description:
          'Lựa chọn phong cách thẩm mỹ để hệ thống cập nhật màu sắc, chất liệu bàn ghế, quầy bar và đèn trang trí đồng bộ.',
        icon: Palette,
        preferredPlacement: 'bottom',
        padding: 8,
        tabTriggerSelector: '#tab-studio-concept',
      },
      {
        id: 'studio-budget',
        stepNumber: 3,
        totalSteps: 4,
        selector: '#tour-studio-budget',
        badge: 'Bước 3/4 • Bảng dự toán chi phí',
        title: 'Bóc tách chi phí đầu tư chi tiết theo m²',
        description:
          'Xem dự toán ngân sách trọn gói bao gồm: Cải tạo sàn thô, điện nước, bàn ghế, quầy thu ngân và chi phí dự phòng.',
        icon: Calculator,
        preferredPlacement: 'top',
        padding: 8,
        tabTriggerSelector: '#tour-studio-budget',
      },
      {
        id: 'studio-export',
        stepNumber: 4,
        totalSteps: 4,
        selector: '#tour-studio-export',
        badge: 'Bước 4/4 • Xuất file & Triển khai',
        title: 'Tải file báo giá & Kết nối đơn vị thi công',
        description:
          'Xuất bảng dự toán chi phí dưới dạng bảng tính chi tiết hoặc liên hệ tư vấn setup hoàn thiện trước khi thuê.',
        icon: FileSpreadsheet,
        preferredPlacement: 'top',
        padding: 6,
        tabTriggerSelector: '#tour-studio-budget',
      },
    ],
  },

  comparison: {
    tabId: 'comparison',
    pageTitle: 'Báo cáo So sánh Đối đầu',
    steps: [
      {
        id: 'comp-picker',
        stepNumber: 1,
        totalSteps: 4,
        selector: '#tour-comp-picker',
        badge: 'Bước 1/4 • Chọn mặt bằng',
        title: 'Chọn 2 - 3 mặt bằng tiềm năng để đối đầu',
        description:
          'Thêm hoặc bớt các mặt bằng trong danh sách so sánh để đặt lên bàn cân phân tích toàn diện ưu và nhược điểm.',
        icon: Scale,
        preferredPlacement: 'bottom',
        padding: 8,
      },
      {
        id: 'comp-matrix',
        stepNumber: 2,
        totalSteps: 4,
        selector: '#tour-comp-matrix',
        badge: 'Bước 2/4 • Ma trận so sánh',
        title: 'Bảng đối chiếu thông số & chi phí thực',
        description:
          'So sánh trực diện đơn giá/m², diện tích sử dụng, độ rộng mặt tiền, tỷ lệ lưu lượng khách và chính sách ưu đãi của chủ nhà.',
        icon: BarChart3,
        preferredPlacement: 'bottom',
        padding: 8,
      },
      {
        id: 'comp-radar',
        stepNumber: 3,
        totalSteps: 4,
        selector: '#tour-comp-radar',
        badge: 'Bước 3/4 • Đánh giá đa chiều',
        title: 'Biểu đồ radar & Điểm số tổng hợp',
        description:
          'Trực quan hoá 5 khía cạnh cốt lõi: Vị trí, Khả năng sinh lời, Khách hàng mục tiêu, Độ nhận diện và Mức độ cạnh tranh.',
        icon: Trophy,
        preferredPlacement: 'top',
        padding: 8,
      },
      {
        id: 'comp-export',
        stepNumber: 4,
        totalSteps: 4,
        selector: '#tour-comp-export',
        badge: 'Bước 4/4 • Xuất báo cáo',
        title: 'Tải báo cáo phân tích đối đầu hoàn chỉnh',
        description:
          'Xuất báo cáo tổng hợp chi tiết làm tài liệu trình bày với đối tác, ban quản trị hoặc hội đồng đầu tư.',
        icon: Download,
        preferredPlacement: 'top',
        padding: 6,
      },
    ],
  },
};
