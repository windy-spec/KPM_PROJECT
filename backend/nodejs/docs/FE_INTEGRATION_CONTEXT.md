# TÀI LIỆU TÍCH HỢP CHO FRONTEND (FE)

Tài liệu này giải thích các luồng xử lý Backend đã có sẵn để team FE gọi API và tích hợp giao diện, không cần viết thêm API mới ở BE.

## 1. THÊM NHIỀU SẢN PHẨM CÙNG LÚC (BATCH IMPORT)
Thay vì dùng API tạo từng sản phẩm (CRUD bình thường), hệ thống đã có sẵn luồng **Nhập nhiều sản phẩm bằng file Excel**. FE chỉ cần gọi các API sau theo đúng thứ tự:

**Bước 1: Tải file mẫu Excel (Template)**
- **API:** `GET /api/imports/template`
- **Tác dụng:** Trả về file Excel mẫu có chứa sẵn dropdown mã danh mục để Admin điền nhiều sản phẩm vào.

**Bước 2: Upload file Excel để hệ thống đọc (Draft)**
- **API:** `POST /api/imports/upload` (Form-Data, field `file`)
- **Tác dụng:** Hệ thống đọc file Excel, validate dữ liệu (kiểm tra thiếu trường, trùng lặp) và lưu nháp vào bảng `product_imports_tmp`.
- **Trả về:** `batch_id` (Mã lô nhập) để dùng cho các bước tiếp theo.

**Bước 3: Xem lại dữ liệu đã upload (Review)**
- **API:** `GET /api/imports/batch/:batchId`
- **Tác dụng:** Trả ra danh sách tất cả các sản phẩm đã tải lên. FE dùng dữ liệu này hiển thị ra bảng để Admin review xem có dòng nào báo trạng thái `INVALID` (Lỗi) không.

**Bước 4: Chốt duyệt (Lưu chính thức vào Database)**
- **API:** `POST /api/imports/batch/:batchId/approve`
- **Tác dụng:** Nếu Admin đồng ý với lô hàng, gọi API này. Hệ thống sẽ tự động chuyển đổi toàn bộ dữ liệu hợp lệ (`VALID`) thành các Sản phẩm (Products) chính thức và tự sinh luôn cả Danh mục con nếu chưa có.

*(Lưu ý: Nếu file có lỗi quá nhiều, FE có thể gọi API `GET /api/imports/batch/:batchId/export-errors` để tải file Excel báo lỗi chi tiết, hoặc gọi `POST /api/imports/batch/:batchId/reject` để hủy bỏ lô nhập).*

---

## 2. LUỒNG KHO VÀ ĐƠN HÀNG (WAREHOUSE FLOW)
Bạn không cần làm luồng Kho tự đi "Nhập sản phẩm", mà Kho chỉ có nhiệm vụ duyệt trừ tồn kho (Vật tư) khi có đơn đặt hàng từ khách.

**Bước 1: Admin Kinh Doanh duyệt đơn hàng**
- Gọi API duyệt đơn (nằm trong Order Flow).
- Khi đơn hàng được xác nhận sản xuất, BE tự động tính toán tổng số **Vật tư cần dùng** dựa vào hệ số `waste_rate` của từng linh kiện tạo nên sản phẩm đó.
- Danh sách vật tư cần dùng được lưu cứng vào đơn hàng. Trạng thái đơn đổi thành `WAITING_WAREHOUSE`.

**Bước 2: Admin Kho kiểm tra và Xuất kho**
- **API:** `POST /api/warehouse/confirm-order/:orderId`
- **Tác dụng:**
  - Nếu kho **Không Đủ Vật Tư**: Trả về lỗi 400 kèm theo mảng danh sách chính xác các vật tư đang thiếu và số lượng thiếu để FE hiển thị (Ví dụ: "Thiếu 10m Thép Hộp, 5m Inox").
  - Nếu kho **Đủ Vật Tư**: Tự động mở Transaction trừ đi tồn kho của các vật tư tương ứng, ghi log vào bảng `inventory_logs` (Hành động `EXPORT`), và đổi trạng thái đơn hàng sang `MANUFACTURING` (Đang sản xuất).

=> **Giao diện FE cần làm cho Kho:** Chỉ cần một danh sách các đơn hàng có trạng thái `WAITING_WAREHOUSE`, bấm vào xem chi tiết đơn sẽ thấy nút **"Xác nhận xuất kho"** (Gọi API bước 2).
