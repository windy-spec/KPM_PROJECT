# Tài liệu Hướng dẫn: Luồng Hiển thị Vật tư Mặc định & Cơ chế Báo giá

Tài liệu này giải thích các thay đổi mới nhất về cách Frontend xử lý logic hiển thị sản phẩm và báo giá.

## 1. Cơ sở dữ liệu (Database & Backend)
- Toàn bộ các sản phẩm đã được chạy script để khởi tạo các trường ID vật tư chuẩn. 
- Tại trường `components` (kiểu JSON) của mỗi sản phẩm, các linh kiện giờ đây đã có sẵn:
  - `material_id`: ID của vật tư tiêu chuẩn.
  - `thickness_id`: ID độ dày tiêu chuẩn tương ứng.
  - `paint_id`: ID loại sơn tiêu chuẩn (nếu có).
- Nhờ việc này, Admin có thể thay đổi linh kiện tiêu chuẩn ở trang Dashboard mà không cần can thiệp vào code Frontend. Frontend chỉ việc đọc ra và hiển thị.

## 2. Trang Danh sách Sản phẩm (`ProductList` / `ProductCard`)
- Thay vì luôn hiển thị chữ "Tùy chỉnh linh kiện", hệ thống hiện tại sẽ hiển thị **Giá bán tiêu chuẩn (`base_price`)** của sản phẩm. 
- Điều này giúp khách hàng có cái nhìn tổng quan về mức giá cơ bản trước khi bấm vào cấu hình.

## 3. Trang Chi tiết Sản phẩm (`ProductDetail.jsx`)

### 3.1. Khởi tạo dữ liệu
- Khi fetch dữ liệu sản phẩm, `ProductDetail` sẽ tự động thiết lập các `select box` (vật tư, độ dày, sơn) theo các ID mặc định đã lưu trong `product.components`.
- Một biến `initialConfig` sẽ lưu trữ chuỗi JSON của cấu hình ban đầu này.

### 3.2. Checkbox "Tôi đã kiểm tra..." (Luồng Đồng ý)
- Đã thêm một biến state `isAgreed`.
- Dưới phần cấu hình sẽ xuất hiện checkbox bắt buộc: "Tôi đã kiểm tra đủ các thông số và đồng ý với các chi tiết linh kiện". Chữ đồng ý được gắn link tới quy định của công ty (`/legal/warranty`).
- Nếu khách chưa tick vào ô này, **MỌI NÚT (Mua ngay, Giỏ hàng, Yêu cầu Báo giá)** đều sẽ bị disable (mờ đi).

### 3.3. Cơ chế Báo giá (Tạm tính)
- Biến `isModified` đóng vai trò kiểm tra xem khách hàng có thay đổi thông số nào khác so với `initialConfig` hay không.
- **Nếu `isModified = false` (Khách giữ nguyên thông số chuẩn)**:
  - Giá hiển thị trên màn hình sẽ là **Giá bán tiêu chuẩn (`base_price`)**.
  - Không gọi API `calculateRealtime` (giảm tải hệ thống và không hiện loading).
  - Nút chính sẽ là **"Mua ngay"** và **"Giỏ hàng"**.
- **Nếu `isModified = true` (Khách thay đổi một tùy chọn vật tư/độ dày/sơn)**:
  - API tính giá thời gian thực (`calculateRealtime`) sẽ được gọi để tính lại giá cấu thành dựa trên vật liệu mới.
  - Hiển thị bảng giá Breakdown Costs.
  - Nút Mua ngay / Giỏ hàng sẽ bị khóa lại.
  - Nút chính đổi thành **"Yêu cầu Báo giá"** (Gửi yêu cầu về cho Admin xử lý).

## 4. Trang Quản trị Admin (`ProductComponentsEditor`)
- Khi Admin sửa "Vật tư mặc định" cho một linh kiện, editor cũng tự động ánh xạ lại `material_id` phù hợp để lưu về Database.
- Việc này giúp đồng bộ dữ liệu chặt chẽ từ Admin panel cho đến Frontend hiển thị cho khách hàng.

---
**Tóm tắt lưu ý cho FE Team**: Không thay đổi logic của `isModified` hay `isAgreed` trừ khi có luồng nghiệp vụ mới. Khi thêm các tuỳ chọn mới (như phụ kiện, tuỳ chỉnh kính), cần phải nhớ cập nhật vào `initialConfig` để việc so sánh trạng thái "Mặc định" không bị sai lệch.
