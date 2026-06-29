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

---

## 3. LUỒNG TRỢ LÝ AI (AI CHAT AGENT)

Hệ thống AI được thiết kế theo dạng **Agent kết hợp Tool Registry**. AI không trực tiếp thao tác (sửa/xóa) trên Database để tránh rủi ro, mà đóng vai trò như một nhân viên Sale/Tư vấn am hiểu kỹ thuật.

### Các "Công cụ" (Tools) AI đang có:
Khi khách hàng nhắn tin, Backend sẽ tự động phân tích ngữ cảnh và cấp cho AI các "quyền" (Tools) để gọi hàm lấy dữ liệu:
1. **`tra_cuu_san_pham_va_danh_muc` (searchProduct):** AI dùng để lấy các mẫu sản phẩm hiện có ở xưởng để tư vấn, báo giá sơ bộ.
2. **`tra_cuu_vat_tu` (searchMaterial):** Lấy giá vật tư (sắt, inox...) hoặc sơn.
3. **`tra_cuu_nhan_cong` (searchLabor):** Xem đơn giá nhân công hiện tại.
4. **Trích xuất bản vẽ (Vision AI):** Khách gửi ảnh, AI phân tích bóc tách các thông số Dài, Rộng, Cao.
5. **(Sắp tới) `checkOrderStatus`:** Kiểm tra trạng thái đơn hàng. 

### Định hướng hiển thị FE:
Để trải nghiệm chân thực nhất:
- **Tương tác thông minh:** Khi AI đang xử lý (nhất là lúc đọc bản vẽ tốn nhiều thời gian), FE hiển thị hiệu ứng Loading kiểu typing (như dấu `...` kèm text "AI đang suy nghĩ/phân tích...") để người dùng không tưởng hệ thống bị lag.
- **Xử lý số liệu linh hoạt:** Khi AI trả về thông số (ví dụ Dài 2000), FE sẽ tự động fomat số liệu thông minh. Ví dụ: Nếu số `> 1000`, FE tự chuyển về dạng mét (Ví dụ `2000` -> `2 m`). Nếu `<= 1000`, FE giữ nguyên đơn vị milimet (`500 mm`). Việc này giúp khách hàng dễ hình dung kích thước.
- **Cá nhân hóa (Context User):** AI được cấp quyền đọc `user_profile` của khách đang đăng nhập (thông qua token/session). Nhờ đó AI biết tên khách, số điện thoại để tự xưng hô thân mật hoặc tự động lấy đúng số điện thoại để gọi hàm tra cứu đơn hàng mà không cần bắt khách phải nhập thủ công mã số.

---

## 4. LUỒNG QUẢN LÝ YÊU CẦU NHẬP VẬT TƯ (MATERIAL IMPORT REQUEST FLOW)

Đây là luồng nghiệp vụ khi kho báo thiếu vật tư (Out of Stock) trong lúc chuẩn bị nguyên liệu cho đơn hàng, dẫn tới việc hệ thống sinh ra một **Yêu cầu nhập vật tư** gửi lên cho Admin.

**Bước 1: Thủ kho (Warehouse) báo thiếu hàng**
- Khi gọi API `/api/warehouse/orders/:orderId/out-of-stock`, backend tự động tính toán những vật tư bị thiếu và tạo các bản ghi vào bảng `material_import_requests` với trạng thái `PENDING`.
- Nếu Thủ kho muốn đề xuất thêm (bù hao), họ cũng có thể gọi API `POST /api/material-requests` (FE có thể gọi qua `materialRequestService.createRequest()`).

**Bước 2: Cả Kho và Admin theo dõi danh sách**
- **API:** `GET /api/material-requests`
- Trả về danh sách toàn bộ các yêu cầu nhập vật tư (bao gồm mã vật tư, tên vật tư, số lượng yêu cầu, ghi chú, mã đơn hàng).
- API này không giới hạn Admin, nên tài khoản Kho (hoặc role khác) cũng gọi được để xem tiến độ. FE (`ManageMaterialRequests.jsx`) phân quyền nút Duyệt chỉ hiện ra khi role = `ADMIN`.

**Bước 3: Admin duyệt Yêu cầu nhập vật tư**
- **API:** `PUT /api/material-requests/:id/approve`
- **Tác dụng:**
  - Chuyển trạng thái yêu cầu sang `APPROVED`.
  - Tự động cộng dồn số lượng được yêu cầu vào bảng tồn kho thực tế (`inventory`).
  - Ghi lịch sử nhập kho (`inventory_logs`) với action `IMPORT`.
- Việc này giúp tinh gọn thao tác cho Admin, không cần phải chạy ra ngoài tự chỉnh tồn kho bằng tay nữa.
