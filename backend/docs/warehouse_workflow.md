# KPM Backend - Warehouse Workflow (Quy trình nghiệp vụ Kho)

Tài liệu này mô tả chi tiết luồng xử lý đơn hàng và nghiệp vụ quản lý vật tư tại Backend của dự án KPM.

## 1. Cơ Sở Dữ Liệu (Database Schema)
Các bảng chính liên quan đến nghiệp vụ Kho:
- `inventory`: Lưu trữ tồn kho khả dụng hiện tại của từng mã vật tư.
- `inventory_logs`: Lưu vết (logs) toàn bộ lịch sử xuất/nhập, thay đổi, điều chỉnh kho. Chứa các `action_type` như `IMPORT`, `EXPORT`, `MANUAL_ADJUST`, `DELETE`.
- `material_import_requests`: Chứa thông tin các phiếu yêu cầu nhập vật tư từ Kho chuyển lên cho Admin phê duyệt.
- `orders`: Có trường `production_status` dùng để điều hướng luồng đơn hàng.
- `order_tracking`: Lưu vết các bước tiến độ của đơn hàng để khách hàng có thể theo dõi.

## 2. Luồng Trạng Thái Đơn Hàng (Production Status Flow)

Quy trình xử lý đơn hàng ở Kho chạy theo tuyến tính các trạng thái (`production_status`):
1. **`pending_payment` / `pending`**: Chờ khách hàng thanh toán và Admin duyệt.
2. **`admin_approved`**: Admin duyệt xong, đơn hàng đổ về Kho chờ tiếp nhận.
3. **`warehouse_received`**: Kho nhấn **Tiếp nhận đơn**. Ở bước này, kho sẽ kiểm tra các vật tư yêu cầu của đơn hàng so với `inventory`.
4. **Phân nhánh kiểm kho**:
   - Nếu đủ vật tư: Kho bấm **Đủ hàng - Đưa vào sản xuất** -> Hệ thống trừ `inventory`, ghi `inventory_logs` (EXPORT), chuyển trạng thái sang **`production_ready`**.
   - Nếu thiếu vật tư: Kho bấm **Thiếu hàng - Yêu cầu nhập** -> Hệ thống chuyển trạng thái sang **`out_of_stock`**. Thủ kho vào mục lập phiếu đề xuất nhập kho để trình Admin duyệt mua thêm.
5. **`import_approved`**: Admin đã mua hàng và duyệt nhập bù. Kho sẽ bấm xác nhận đã nhập bù -> Hệ thống tự động xuất kho lượng vật tư tương ứng và chuyển trạng thái đơn hàng sang **`production_ready`**.
6. **`producing`**: Chuyển từ `production_ready` sang `producing` khi bắt đầu đưa vào máy móc gia công sản xuất.
7. **`production_completed`**: Xưởng gia công hoàn tất, đóng gói sản phẩm và báo cáo lại Admin.

## 3. Các API Quan Trọng

### 3.1. API Trạng thái Đơn hàng (Warehouse Controller)
- `POST /api/warehouse/orders/:orderId/receive`: Tiếp nhận đơn.
- `POST /api/warehouse/orders/:orderId/confirm-stock`: Xác nhận đủ hàng & Trừ tồn kho tự động.
- `POST /api/warehouse/orders/:orderId/out-of-stock`: Báo thiếu hàng.
- `POST /api/warehouse/orders/:orderId/import-ready`: Xác nhận nhập bù & chuyển sản xuất.
- `POST /api/warehouse/orders/:orderId/start-production`: Bắt đầu gia công.
- `POST /api/warehouse/orders/:orderId/complete-production`: Gia công xong.

### 3.2. API Tồn Kho (Inventory)
- `GET /api/warehouse/inventory`: Lấy danh sách tồn kho thực.
- `GET /api/warehouse/inventory/export-history`: Trích xuất lịch sử xuất kho (lọc từ `inventory_logs` với `action_type = "EXPORT"`).
- `POST /api/warehouse/request-import`: Tạo phiếu đề xuất nhập hàng mới.

## 4. Socket.io & Giữ kết nối (Keep-Alive)
- **Tự động thức giấc (Wake DB)**: Do DB có thể rơi vào chế độ ngủ (sleep) nếu không hoạt động, hệ thống Socket đã được thiết lập một cơ chế "Keep Alive".
- Trong file `server.js`:
  - Mỗi khi có client truy cập vào hệ thống, một query `SELECT 1` nhỏ sẽ được gửi để đánh thức database.
  - Được kết hợp với cơ chế Throttle (Debounce) giới hạn gọi 1 lần / phút để tránh quá tải Connection Pool của Prisma.
  - Có một `setInterval` chạy ngầm mỗi 10 phút để đảm bảo DB luôn "nóng".
- **Real-time Tracker**: Khi Warehouse bấm cập nhật trạng thái đơn hàng (Tiếp nhận, Xuất kho, Báo thiếu...), Backend sẽ dùng `global.io` để emit tín hiệu `orderStatusUpdated` ngược lên Frontend. Điều này giúp khách hàng (user room) và Admin (admin room) thấy tiến độ đơn hàng nhảy thời gian thực mà không cần tải lại trang.
