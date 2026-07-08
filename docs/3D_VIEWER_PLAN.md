# TÀI LIỆU HỆ THỐNG: QUOTATION & 3D VIEWER

## 1. NHỮNG TÍNH NĂNG ĐÃ HOÀN THÀNH TỚI THỜI ĐIỂM HIỆN TẠI

### 1.1. Sửa lỗi tính toán cấu hình Báo giá (Diện tích / Thể tích)
- **Vấn đề trước đây:** Khi tính hệ số vật tư, hệ thống chỉ lấy `(Dài x Rộng)`, nếu có truyền `Chiều Cao` thì bị bỏ qua hoàn toàn.
- **Giải pháp đã triển khai:** Cập nhật lại logic trong `quotation.service.js` (`createQuotation` và `calculateRealtime`). 
- **Công thức mới:** 
  - Hệ thống kiểm tra linh kiện có bao nhiêu kích thước cấu hình (Dài, Rộng, Cao) lớn hơn 0.
  - Tự động nhân tất cả các kích thước hợp lệ lại với nhau để tạo thành "Hệ số diện tích / Thể tích chuẩn". 
  - => Giải quyết triệt để vấn đề "thiếu chiều cao" khi nhân hệ số tiêu hao vật liệu cho các sản phẩm 3D.

### 1.2. Khôi phục và tái cấu trúc hệ thống Đính kèm Bản vẽ 2D
- **Sửa lỗi CSS khi đóng gói ảnh 2D:** Việc đưa file HTML 2D vào `iframe` làm mất kết nối với thư viện `TailwindCSS`, khiến chữ và lưới (grid) bị phóng to, vỡ nát. 
  - => Đã fix bằng cách chuyển về thẻ `div` tàng hình, lấy được toàn bộ CSS của ứng dụng.
- **Tự động khôi phục dữ liệu:** Khi bản vẽ linh kiện thiếu "Ảnh nét đứt", hệ thống tự động tìm và khôi phục từ `Mẫu Linh Kiện` nguyên gốc. Đã chạy script xử lý sạch sẽ các bản ghi cũ trong DB.

### 1.3. Nâng cấp trải nghiệm Bản vẽ 3D Tổng thể (Từ Ảnh tĩnh -> Link Tương tác)
- **Vấn đề trước đây:** Dùng `html2canvas` để chụp ảnh tự động cho các file mô hình 3D sinh ra rất nhiều lỗi (màn hình trắng bốc, sai tỉ lệ, treo máy, sinh ra ảnh hỏng) vì HTML 3D thường chứa các file nội tuyến phức tạp.
- **Giải pháp đột phá (Chuyển sang Hyperlink):** 
  - Gỡ bỏ hoàn toàn tiến trình chụp ảnh `html2canvas` tĩnh cho Mô hình tổng thể.
  - Tự động tạo và đính kèm **Đường Link Tương tác 3D** (Hyperlink) vào hồ sơ báo giá (VD: `/viewer/3d/:drawing_id`).
  - Xử lý triệt để lỗi "undefined" ID và bảo vệ Backend khỏi lỗi văng Prisma khi nhận sai UUID.

---

## 2. KẾ HOẠCH PHÁT TRIỂN TRANG SHARED "VIEWER 3D" (TƯƠNG LAI)

Trang `Viewer3D.jsx` hiện tại đang ở mức cơ bản (hiển thị iframe full màn hình). Dưới đây là kế hoạch kiến trúc để biến nó thành một công cụ xịn sò cho khách hàng (End-user):

### Giai đoạn 1: Tối ưu UI/UX cho màn hình Viewer
- **Thêm Control Panel (Bảng điều khiển):** Thay vì chỉ có mỗi mô hình 3D, hãy thêm một thanh menu nhỏ ở góc màn hình gồm các nút:
  - Nút **"Phóng to toàn màn hình"** (Fullscreen API).
  - Nút **"Bật/Tắt xoay tự động"** (Nếu mã HTML 3D có hỗ trợ thuộc tính xoay).
  - Nút **"Tải ảnh mô hình về máy"** (Cho phép khách hàng tự chọn góc nhìn đẹp và bấm tải thay vì hệ thống tự chụp bị lỗi).
- **Thêm Brand nhận diện:** Chèn Logo KPM ở góc trên cùng bên trái. Gắn link để khách bấm vào Logo là quay về trang chủ (nhằm giữ chân khách hàng).

### Giai đoạn 2: Tương tác trực tiếp & Đa nền tảng
- **Reponsive cho Mobile:** Đảm bảo khi khách hàng mở link bằng điện thoại, mô hình 3D phải fit vừa vặn khung hình và hỗ trợ vuốt/zoom bằng 2 ngón tay mượt mà.
- **Bảo mật và Phân quyền link (Tùy chọn):** Nếu có một số bản vẽ thuộc diện bảo mật cao, hệ thống có thể yêu cầu khách nhập mã truy cập (Access Code) để xem bản vẽ thay vì link public.

### Giai đoạn 3: Thông tin đính kèm
- Xung quanh màn hình Viewer, hiển thị thêm một thanh thông tin gập mở gọn gàng, chứa thông số: `Tên sản phẩm`, `Chủ đầu tư/Khách hàng`, và `Người thực hiện (KPM)`. Điều này giúp bản vẽ mang tính cá nhân hóa cao, làm khách hàng tin tưởng hơn.

---

## 3. TÌNH TRẠNG CODE

Toàn bộ các file:
- `backend/services/drawing.service.js` (Bảo vệ API khỏi lỗi P2023)
- `backend/services/quotation.service.js` (Tính năng diện tích chuẩn)
- `frontend/src/pages/quotations/QuotationDetail.jsx` (Giao diện đóng gói siêu tốc, gắn Link Viewer)
- `frontend/src/pages/shared/Viewer3D.jsx` (Trang xem 3D hoàn toàn mới)
- `frontend/src/App.jsx` (Khai báo route mới)

Tất cả đã hoạt động trơn tru, không còn lỗi syntax (Parse Error) hay lỗi runtime. 
