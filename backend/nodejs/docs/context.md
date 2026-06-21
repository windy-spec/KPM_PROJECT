# KPM Project Context & Status

## 1. Tổng quan hệ thống (System Overview)
Dự án KPM là một nền tảng thương mại điện tử kết hợp báo giá tùy chỉnh (Custom Quotation) và quản lý kho/xưởng sản xuất.
Hệ thống được chia thành 2 phần chính:
- **Frontend (Khách hàng & Admin/Kho):** Xây dựng bằng React, Vite, Tailwind CSS. Sử dụng `react-router-dom` để điều hướng, `react-toastify` để thông báo, và tích hợp đăng nhập Google (`@react-oauth/google`).
- **Backend (API & Xử lý nghiệp vụ):** Xây dựng bằng Node.js, Express, và sử dụng Prisma ORM để giao tiếp với cơ sở dữ liệu PostgreSQL.

## 2. Các luồng chức năng hiện tại đã hoàn thiện (Current Flows)
Dựa trên cấu trúc thư mục, router và schema, hệ thống đã phát triển các luồng sau:

### Phía Người dùng (Client/User Flow)
- **Xác thực (Auth):** Đăng nhập, Đăng ký, Quên mật khẩu, Đăng nhập qua Google (OAuth).
- **Hồ sơ cá nhân:** Quản lý thông tin user (Profile), lịch sử đơn hàng, thiết kế yêu thích.
- **Sản phẩm (Products):** Xem danh sách sản phẩm, Xem chi tiết sản phẩm. Có khả năng tự cấu hình kích thước/vật liệu (Quotation Specs) ngay trên trang chi tiết sản phẩm.
- **Báo giá tùy chỉnh (Custom Quotation):** Gửi yêu cầu báo giá theo bản vẽ hoặc yêu cầu đặc biệt. Có tích hợp AI để phân tích bản vẽ (AI Drawing Analysis).
- **Giỏ hàng & Thanh toán (Cart & Checkout):** 
  - Thêm sản phẩm hoặc cấu hình báo giá vào giỏ hàng.
  - Thanh toán qua VNPAY hoặc MoMo, hoặc thanh toán tiền mặt (Cash).
- **Trang thông tin:** FAQ, Giới thiệu (About), Chính sách bảo hành, Điều khoản sử dụng, Thuật ngữ kỹ thuật.

### Phía Quản trị & Vận hành (Admin & Warehouse Flow)
- **Admin Dashboard:** Thống kê doanh thu, số lượng đơn hàng, người dùng. Quản lý danh mục, sản phẩm.
- **Quản lý Đơn hàng (Orders & Invoices):** Theo dõi trạng thái sản xuất, cập nhật tiến độ (Order Tracking), xuất hóa đơn (Invoice).
- **Quản lý Báo giá (Quotations):** Phê duyệt, điều chỉnh giá đề xuất cho khách hàng.
- **Quản lý Vật tư & Cấu hình giá (Materials & Pricing):**
  - Quản lý danh mục vật tư, độ dày, loại sơn, và đơn giá.
  - Quản lý định mức nhân công (Labor Categories & Rates).
  - Quản lý Template thành phần sản phẩm (Component Templates & Allowed Materials).
- **Quản lý Kho (Warehouse):** Giao diện riêng cho `ADMIN_KHO` để quản lý tồn kho (Inventory) và nhật ký xuất/nhập/hao phí (Inventory Logs). Tải lên file lô hàng nhập.

## 3. Danh sách các lỗi hiện tại cần fix dần (Pending Issues / Bugs)

Dưới đây là danh sách các lỗi đang tồn đọng cần được xử lý dần theo từng bước (đã được note từ quá trình test trước đó):

### Phía User (Khách hàng)
1. **Lỗi "navigate is not defined" khi cuộn trang:**
   - **Vị trí:** `NavigationMenu.jsx`.
   - **Mô tả:** Sử dụng `navigate` và `location` nhưng chưa import và gọi hook `useNavigate`, `useLocation`.
2. **Lỗi Mua ngay chưa tạo được đơn hàng:**
   - **Vị trí:** `ProductDetail.jsx`.
   - **Mô tả:** Đọc sai cấu trúc response từ API khi thêm vào giỏ. Chờ lấy `submitRes.data?.order_id` thay vì `submitRes.order_id`.
3. **Lỗi Giỏ hàng chưa lưu được & Lịch sử đơn hàng trống:**
   - **Vị trí:** `order.service.js`.
   - **Mô tả:** Lỗi Prisma query gọi trường `phone` trong bảng `users` (trường này nằm ở `user_profiles`), và lỗi `parseInt(id)` thay vì giữ nguyên UUID cho id đơn hàng.
4. **Lỗi Cấu hình yêu thích chưa đặt được tên:**
   - **Vị trí:** `ProductDetail.jsx`.
   - **Mô tả:** Cần hiển thị hộp thoại prompt cho phép người dùng đặt tên thiết kế khi lưu yêu thích để phân biệt.
5. **Lỗi Thanh toán thành công nhưng chưa cập nhật đơn hàng:**
   - **Mô tả:** Phía VNPay Sandbox chưa gọi được Webhook (IPN URL) về server để cập nhật trạng thái đơn hàng. Cần cấu hình đúng IPN trong merchant portal của VNPAY.

### Phía Admin (Quản trị)
6. **Lỗi Chưa có tổng quan doanh số trên Dashboard:**
   - **Mô tả:** Doanh thu hiện chỉ cộng dồn từ các đơn hàng trả qua VNPAY/MoMo (`status: "success"`). Các đơn hàng Tiền mặt (Cash) vẫn ở trạng thái `pending` nên không được tính vào tổng. Cần logic cập nhật khi đơn Cash hoàn thành.
7. **Lỗi Chưa link được từ Dashboard vào quản lý đơn hàng:**
   - **Vị trí:** `Dashboard.jsx`.
   - **Mô tả:** Nút "Xem chi tiết" ở bảng Đơn hàng mới cập nhật chưa gắn sự kiện chuyển sang panel `orders`.

---
*Tài liệu này dùng để làm base context cho quá trình sửa lỗi và phát triển tiếp theo.*
