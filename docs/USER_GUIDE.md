# Hướng Dẫn Sử Dụng Nền Tảng SpaceVision BDS AI (User Guide)

Tài liệu này cung cấp hướng dẫn chi tiết từng bước cho người dùng (Chủ mặt bằng, Môi giới BĐS Thương mại, và Khách thuê doanh nghiệp) nhằm khai thác tối đa các công cụ khảo sát và thẩm định của **SpaceVision BDS AI**.

---

## 1. Tổng Quan Quy Trình Khảo Sát 6 Bước

SpaceVision BDS AI được thiết kế theo hành trình khép kín gồm 6 bước chuyên sâu:

```
[1. Tìm kiếm Thông minh] ➔ [2. Bản đồ 3D Vị trí] ➔ [3. Không gian 3D & 2D] ➔ [4. Mô phỏng Ánh sáng] ➔ [5. Setup Kinh doanh] ➔ [6. So sánh & Báo cáo]
```

---

## 2. Chi Tiết Từng Bước Sử Dụng

### Bước 1: Khám Phá & Tìm Kiếm Mặt Bằng (Discovery)
- **Truy cập**: Thanh điều hướng trên cùng chọn **"Tìm kiếm"** (hoặc truy cập `/discovery`).
- **Thanh tìm kiếm AI thông minh**:
  - Nhập nhu cầu kinh doanh bằng tiếng Việt tự nhiên.
  - *Ví dụ mẫu*: *"Tìm mặt bằng mở quán café vỉa hè rộng tại Cầu Giấy dưới 50 triệu"* hoặc *"Cần mặt bằng mở showroom thời trang phố cổ Hoàn Kiếm"*.
  - AI sẽ tự động phân tích và trích xuất: Ngành nghề, Quận mục tiêu, Khoảng giá, và Tiêu chí không gian.
- **Thẻ mặt bằng thông minh (Property Cards)**:
  - Xem ngay các chỉ số nhanh: Điểm phù hợp AI (AI Match Score %), Giá thuê/tháng, Diện tích sử dụng, Chiều rộng mặt tiền.
  - Nhấn nút **"Xem liên hệ chủ nhà"** để hiển thị số điện thoại, nút gọi điện trực tiếp hoặc mở chat Zalo.
  - Nhấn **"Khảo sát vị trí 3D"** để bắt đầu quy trình thẩm định sâu.

---

### Bước 2: Bản Đồ 3D Toà Nhà & Định Vị Vị Trí (Location Intel)
- **Truy cập**: Chọn **"Bản đồ 3D"** (hoặc `/location`).
- **Khối toà nhà 3D (3D Extrusion)**:
  - Mô hình toà nhà nổi bật trên bản đồ với khối màu cam/xanh trực quan theo chiều cao thực tế.
  - Sử dụng chuột phải để nghiêng góc nhìn (pitch) và xoay bản đồ 360 độ.
- **Khảo sát Bán kính Phục vụ (Catchment Area)**:
  - Lựa chọn nhanh bán kính: **500m** (vùng đi bộ cốt lõi), **1km** (vùng phục vụ chính), hoặc **2km** (vùng vệ tinh).
- **Bộ lọc Tiện ích Xung quanh (Amenities)**:
  - Danh sách tiện ích được tối giản mặc định: chỉ hiển thị 2 tiện ích tiêu biểu kèm khoảng cách.
  - Nhấn nút **"Xem thêm X địa điểm khác"** để mở rộng danh sách chi tiết.
  - Nhấn vào từng nhóm (Trường đại học, Văn phòng, Chung cư, Bãi đỗ xe...) để lọc nhanh trên bản đồ.
- **Định tuyến Giao thông Thực tế (Route Simulation)**:
  - Chọn một điểm tiện ích bất kỳ và bấm **"Chỉ đường"**.
  - Hệ thống OSRM sẽ tính toán tuyến đường ngắn nhất và thời gian di chuyển theo 3 phương tiện: Đi bộ, Xe máy, Ô tô.

---

### Bước 3: Không Gian 3D Digital Twin & Mặt Bằng 2D CAD
- **Truy cập**: Chọn **"Không gian 3D"** (hoặc `/twin`).
- **Chuyển đổi Chế độ Xem (View Modes)**:
  - **Nội thất 3D (Dollhouse)**: Khảo sát không gian 3D bóc tách tầng.
  - **Mặt bằng 2D**: Chuyển sang bản vẽ kỹ thuật CAD trực quan, hiển thị tường bao, vách kính, cửa mở và kích thước từng phòng.
  - **Chia đôi (Split View)**: Xem song song 3D và 2D cùng lúc trên một màn hình.
- **Thanh Chọn Tầng (Floor Dock)**:
  - Nằm ở cạnh dưới màn hình: Lựa chọn `Toàn bộ toà nhà`, `Tầng 1`, `Tầng 2`, `Tầng 3`.
  - Khi xem 2D CAD, hệ thống tự động tối ưu hiển thị tầng được chọn và ẩn các tùy chọn không tương thích.
- **Tính năng Bật/Tắt Chữ (Clean Architecture Mode)**:
  - Bấm nút **"Tắt chữ / Nhãn chữ"** trên thanh công cụ hoặc nhấn phím tắt **`L`** trên bàn phím.
  - Giúp loại bỏ các nhãn tên phòng khi bạn muốn chiêm ngưỡng toàn cảnh không gian thoáng đãng mà không bị rối mắt.
- **Các góc quay Camera 3D**:
  - `Orbit`: Xoay tự do góc nhìn.
  - `Dollhouse`: Phối cảnh mô hình kiến trúc.
  - `Top-down`: Chiếu thẳng đứng từ trên xuống.
  - `Reset`: Đặt lại góc camera ban đầu.

---

### Bước 4: Mô Phỏng Môi Trường & Ánh Sáng (Environment Sim)
- **Truy cập**: Chọn **"Ánh sáng"** (hoặc `/environment`).
- **Thanh trượt Thời gian 24 Giờ**:
  - Kéo thanh trượt từ `00:00` đến `24:00` để quan sát hướng đổ bóng và ánh nắng chiếu vào từng ô cửa sổ theo thời gian thực.
  - Bấm nút **Play / Pause** để tự động chạy chuyển động ngày/đêm.
- **Ngày trong Năm (1 - 365 ngày)**:
  - Khảo sát sự khác biệt giữa mặt trời mùa hè (nắng cao, góc gắt) và mùa đông (nắng xiên, góc thấp) theo toạ độ khí hậu thực tế của Hà Nội.
- **Mô phỏng Thời tiết**:
  - Chuyển đổi giữa 3 trạng thái: **Trời nắng (Sunny)**, **Nhiều mây (Cloudy)**, và **Trời mưa (Rainy)**.
- **Bảng Thống kê Năng lượng & Chiếu sáng**:
  - Mặc định được thu gọn ở góc phải để ưu tiên không gian thị giác.
  - Bấm nút góc phải trên để mở bảng phân tích: Giờ đón nắng trực tiếp, Chỉ số UV, Cường độ Lux, và Khuyến nghị công suất điều hòa nhiệt độ.

---

### Bước 5: Setup Kinh Doanh & Dự Toán Chi Phí (Business Setup Studio)
- **Truy cập**: Chọn **"Thiết kế"** (hoặc `/studio`).
- **Lựa chọn Mô hình Kinh doanh**:
  - Hỗ trợ 8 ngành nghề: Quán café/Trà sữa, Nhà hàng/Ẩm thực, Spa/Làm đẹp, Thời trang/Bán lẻ, Cửa hàng tiện lợi, Văn phòng hiện đại, Showroom trưng bày, Không gian Coworking.
- **Phong cách Thiết kế Nội thất**:
  - 6 phong cách kiến trúc thịnh hành: Minimalist (Tối giản), Scandinavian (Bắc Âu), Japanese (Nhật Bản Wabi-Sabi), Industrial (Công nghiệp hiện đại), Luxury (Sang trọng), Modern (Đương đại).
- **Trải nghiệm Progressive Disclosure**:
  - Toàn bộ các danh sách lựa chọn dài (phương án, danh mục nội thất, ngân sách, an toàn) mặc định được xếp gọn gàng.
  - Bấm vào từng mục để xem chi tiết:
    - *Bố trí layout 3D thời gian thực.*
    - *Dự toán chi phí đầu tư CapEx (6 nhóm chi phí rõ ràng).*
    - *Báo cáo kiểm tra quy chuẩn an toàn PCCC & hành lang lối thoát.*

---

### Bước 6: So Sánh Đa Mặt Bằng & Xuất Báo Cáo (Comparison)
- **Truy cập**: Chọn **"So sánh"** (hoặc `/comparison`).
- **Ghim Mặt Bằng Cần So Sánh**:
  - Ở bất kỳ trang nào, bấm nút **"+ Ghim so sánh"** tại thanh điều hướng chân trang (Hỗ trợ ghim song song tối đa 3 mặt bằng).
- **Quy tắc 3 Giây Đầu**:
  - Bảng so sánh thẻ bài (Showdown Cards) làm nổi bật tức thì 4 con số quyết định: **Giá thuê**, **Diện tích**, **Mặt tiền**, và **Điểm AI Match**.
  - AI tự động đánh giá và gắn huy hiệu **Quán quân AI** cho mặt bằng vượt trội về bài toán kinh doanh.
- **Chi Tiết Đối Chiếu Chuyên Sâu**:
  - Mở 3 khối Accordion để đối chiếu: *Thông số Kỹ thuật & Hiện trạng*, *Ước tính Doanh thu & Chi phí Vận hành*, *Phân tích Rủi ro & Khuyến nghị Pháp lý*.
- **Xuất Báo Cáo**:
  - Nhấn nút **"Xuất Báo Cáo PDF"** để in hoặc tải file báo cáo thẩm định chuẩn cho ban giám đốc và đối tác đầu tư.

---

## 3. Bảng Phím Tắt Tiện Dụng (Keyboard Shortcuts)

| Phím tắt | Chức năng | Áp dụng tại màn hình |
| :--- | :--- | :--- |
| **`L`** | Bật / Tắt nhãn tên phòng (Clean Architecture Mode) | Không gian 3D, Setup Studio |
| **`1` - `6`** | Chuyển nhanh giữa các bước khảo sát (1=Tìm kiếm, 2=Bản đồ, 3=3D...) | Toàn hệ thống |
| **`Chuột trái + Kéo`** | Xoay góc nhìn 3D (Orbit Rotation) | Không gian 3D, Setup Studio |
| **`Chuột phải + Kéo`** | Di chuyển camera (Pan) / Xoay nghiêng bản đồ (Pitch) | 3D Digital Twin, Bản đồ 3D |
| **`Cuộn chuột (Scroll)`**| Phóng to / Thu nhỏ camera (Zoom In / Out) | 3D Digital Twin, 2D CAD, Bản đồ |

---

## 4. Hướng Dẫn Kích Hoạt Tour Trải Nghiệm (Spotlight Tour)

Hệ thống được tích hợp sẵn Spotlight Tour tương tác từng bước cho từng trang:
1. Tại góc trên bên phải hoặc chân trang, bấm nút **"Hướng dẫn"** (hoặc *"Hướng dẫn trang này"*).
2. Hệ thống sẽ làm nổi bật (spotlight) từng nút bấm và hiển thị thẻ hướng dẫn ngữ cảnh.
3. Dùng nút **"Tiếp tục"** hoặc phím `Mũi tên phải` để đi qua các bước hướng dẫn.
