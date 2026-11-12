# SpaceVision AI — Commercial Real Estate & 3D Digital Twin Platform

Nền tảng PropTech thế hệ mới kết hợp **AI Advisory + GIS Location Intelligence + 3D Building Extrusions + 3D Digital Twin + Business Setup Simulation**.

## Tính năng chính

1. **Trang chủ BĐS Thương mại (Landing Page)**: Giao diện sáng sủa, thanh lịch, tìm kiếm nhu cầu kinh doanh bằng ngôn ngữ tự nhiên.
2. **Bản đồ 3D Toà nhà & Định vị (Location Intelligence)**: Bản đồ MapLibre GL hiển thị khối toà nhà 3D (`fill-extrusion`), tiện ích xung quanh, và định tuyến đa phương tiện OSRM.
3. **Không gian 3D Digital Twin & Mặt bằng 2D (CAD Blueprint)**: Three.js & React Three Fiber với 5 chế độ camera (Orbit, Walkthrough, Dollhouse, Top-down, Exterior), bóc tách từng tầng, kích thước phòng và nội thất.
4. **Mô phỏng Môi trường & Ánh sáng (Environmental Simulation)**: Chu kỳ ngày/đêm 00:00–24:00, tính toán góc chiếu mặt trời theo toạ độ Hà Nội, mô phỏng thời tiết nắng/mây/mưa và đèn buổi tối.
5. **AI Business Setup Studio**: 8 mô hình kinh doanh, 6 phong cách thiết kế, bố trí nội thất 3D theo thời gian thực, kiểm tra hành lang lối đi PCCC và dự toán chi phí đầu tư 6 hạng mục.
6. **So sánh Đa mặt bằng & Xuất báo cáo (Comparison & PDF)**: Bảng đối chiếu song song tối đa 3 mặt bằng và xuất báo cáo in/PDF chuyên nghiệp.

## Công nghệ sử dụng

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide React, Framer Motion
- **3D Graphics**: Three.js, React Three Fiber, React Three Drei
- **Map & GIS**: MapLibre GL, OpenStreetMap, OSRM Routing API, Turf.js
- **State Management**: Zustand

## Hướng dẫn cài đặt và chạy cục bộ

```bash
# Cài đặt thư viện
npm install

# Chạy môi trường phát triển
npm run dev

# Biên dịch sản phẩm
npm run build
npm start
```
