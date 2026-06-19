# Bối cảnh & Các điểm cần chỉnh sửa (Cập nhật theo yêu cầu mới nhất)

Tài liệu này trình bày lại chi tiết thiết kế cho 3 cơ chế cốt lõi sẽ vận hành trong hệ thống: (1) Đưa Linh kiện vào Database và Dọn dẹp dữ liệu cũ, (2) Quản lý Định mức Tiêu hao (Số lượng tuyệt đối), và (3) Luồng giao tiếp giữa Admin và Role Kho khi duyệt đơn hàng.

---

## Cơ chế 1: Quản lý Linh kiện trong Database & Dọn dẹp

**Giải pháp:** 
- Tạo bảng `component_templates` và `component_allowed_materials` trong Database.
- Khi Admin tạo Sản phẩm, hệ thống gọi API tải linh kiện từ DB xuống.
- Khởi tạo tài khoản mang role `admin_kho`. Role này chỉ thao tác trên Backend (API) và bạn của bạn sẽ viết Frontend riêng cho nó.
- **Dọn dẹp:** Sau khi viết Script đẩy dữ liệu từ `CATEGORY_BLUEPRINTS` vào DB thành công, ta sẽ xóa bỏ hoàn toàn file `frontend/src/config/categoryBlueprints.js` và thư mục liên quan để loại bỏ nợ kỹ thuật (technical debt).

---

## Cơ chế 2: Quản lý Định mức Tiêu hao (Thay thế % hao phí) & Cỗ Máy Tính Giá

**Ghi nhận:** Định mức tiêu hao KHÔNG PHẢI LÀ %, mà là **Số lượng vật tư hao tổn cụ thể (Số tuyệt đối)**.
Ví dụ: Làm chân ghế tiêu hao hết đúng 2 cây sắt.

### Tích hợp vào Cỗ Máy Tính Giá (Pricing Engine - `quotation.service.js`)
Lỗi ở code cũ là Pricing Engine tính phí vật tư dựa theo công thức: `Diện tích * 1.05 (Hao phí 5%)`.
Giờ đây ta phải bỏ ngay dòng `const wasted = 1.05` đi.
Thay vào đó, Pricing Engine sẽ lấy trực tiếp `waste_rate` (tức là mức tiêu hao tuyệt đối do Admin cấu hình) nhân thẳng với Đơn giá vật tư. Nếu làm cái bàn cần 2 tấm gỗ, thì Tiền vật tư = `Giá 1 tấm * 2`. Bỏ qua hoàn toàn việc tính hao hụt theo diện tích. Điều này giúp tính giá chính xác 100% theo vật tư vật lý.

---

## Cơ chế 3: Luồng Quản lý Kho (Inventory) & Phê duyệt Đơn hàng

> 🚨 **CẬP NHẬT QUAN TRỌNG:** Ngăn chặn lỗi Double Calculation (Tính toán 2 lần). Hệ thống áp dụng cơ chế **Snapshot (Chụp ảnh dữ liệu)** để đảm bảo số lượng xuất kho luôn khớp tuyệt đối với lúc Admin duyệt đơn, bất chấp việc ai đó sửa định mức linh kiện trong lúc chờ Kho xác nhận.

**Bước 1: Admin Duyệt Đơn (Phát lệnh yêu cầu xuống Kho)**
Khi Admin nhấn "Duyệt đơn":
- Hệ thống tính toán một lần duy nhất: Nhân **Định mức tiêu hao** với **Số lượng sản phẩm** để sinh ra một **"Bảng Yêu Cầu Vật Tư"**.
- Bảng này lập tức được **lưu chết (Snapshot)** vào cột `material_requirements` (kiểu JSON) trong bảng `orders`.
- Đơn hàng đổi trạng thái sang `Chờ Kho Xác Nhận`. Không có trừ kho lúc này.

**Bước 2: Role Kho kiểm tra và Xuất kho**
Bạn của bạn sẽ làm giao diện Frontend cho Role `admin_kho`. Giao diện này sẽ gọi vào API Xác nhận xuất kho của Backend do bạn viết. Khi gọi API:

* **Backend lấy Snapshot:** Hệ thống KHÔNG tính toán lại, mà mở cột `material_requirements` của Đơn hàng ra để đọc chính xác số lượng Admin đã yêu cầu.
* **Backend kiểm tra kho ĐỦ hàng:** 
  - API thực thi trừ số lượng (`decrement`) vào bảng `inventory` và lưu lịch sử `inventory_logs`.
  - Thông báo tự động gửi về Admin báo "Vật tư đã chuẩn bị xong".
  - Đơn hàng chuyển sang trạng thái: `Đang Sản Xuất`.
  - API trả về Success cho Frontend của Kho.

* **Backend kiểm tra kho THIẾU hàng:**
  - API trả về mã lỗi 400 kèm **Danh sách Vật tư thiếu** (Tên vật tư, Số lượng cần, Số lượng đang có, **Số lượng cần mua thêm**).
  - Frontend của Role Kho hứng mảng này, vẽ thành một cái bảng báo cáo và bấm gửi lại cho Admin để Admin tiến hành quy trình **Mua hàng (Purchase Order)**.

---
*Tài liệu này đóng vai trò là "Kim chỉ nam" cho mọi dòng code ở Frontend và Backend nhằm đảm bảo tính toàn vẹn của dữ liệu và quy trình nghiệp vụ đúng như bạn thiết kế.*
