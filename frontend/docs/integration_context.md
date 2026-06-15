# Tài liệu Context Tích hợp API Dữ liệu Thật (Frontend)

Tài liệu này tổng hợp lại các thay đổi đã thực hiện ở phía Frontend để thay thế dữ liệu gán cứng (mock data) bằng dữ liệu thật gọi từ Backend API, giúp đội ngũ Frontend (FE) dễ dàng nắm bắt ngữ cảnh.

## 1. Các Services (API Client) đã được bổ sung
Chúng tôi đã tạo thêm các tệp service trong thư mục `src/services/` để gọi API Backend:
- `cart.service.js`: Các hàm gọi API giỏ hàng (`getCart`, `addToCart`, `updateQuantity`, `removeItem`, `submitCart`).
- `order.service.js`: Lấy thông tin đơn hàng (`getAllOrders`, `getOrderById`, `getMyOrders`).
- `user.service.js`: Lấy thống kê hồ sơ cá nhân (`getProfileStats`).
- `admin.service.js`: Bổ sung thêm API lấy thống kê tổng quan (`getDashboardStats`).

## 2. Các trang (Pages) đã được tích hợp dữ liệu thật

### 2.1. Giỏ hàng & Thanh toán (Cart & Checkout)
- **`Cart.jsx`**: Dùng `cartService.getCart()` để lấy giỏ hàng. Gọi `cartService.submitCart()` để chốt giỏ thành đơn hàng tạm và lấy `order_id` truyền sang `Checkout` qua `location.state`.
- **`Checkout.jsx`**: Cung cấp 4 phương thức thanh toán cho khách hàng:
  1. **Ví điện tử MoMo**: Gọi API `/payments/momo`, server trả về `payUrl`, FE sẽ dùng `window.location.href` để điều hướng user sang MoMo.
  2. **VNPay**: Gọi API `/payments/vnpay`, server trả về `payUrl` của VNPay (đã được tạo checksum HMAC SHA512), FE điều hướng user sang cổng VNPay.
  3. **Chuyển khoản Ngân hàng (VietQR)**: Gọi API `/payments/vietqr`, server trả về thông tin tạo QR (số tài khoản, ngân hàng, nội dung chuyển khoản tự động). (FE có thể hiển thị mã QR hoặc chuyển hướng).
  4. **Thanh toán Tiền mặt (COD)**: Gọi API `/payments/cash`, xác nhận đơn hàng thành công ngay lập tức.

### 2.2. Bảng điều khiển Admin (Dashboard)
- **`Dashboard.jsx` (Overview)**: Thay vì mảng `stats`, `weeklyRevenue`, `orders` ảo, hệ thống dùng `adminService.getDashboardStats()` trả về tổng doanh thu, biểu đồ doanh thu theo tháng, và danh sách đơn hàng/báo giá gần nhất.

### 2.3. Quản lý Đơn hàng (ManageOrders)
- **`ManageOrders.jsx`**: Xóa `MOCK_ORDERS`. Dùng `orderService.getAllOrders()` để lấy toàn bộ đơn hàng trong hệ thống (bao gồm cả đơn trực tiếp và đơn từ báo giá). Dữ liệu được map lại (format) để hiển thị đồng nhất trên bảng.

### 2.4. Hồ sơ Cá nhân (User Profile)
- **`OverviewTab.jsx`**: Gọi `userService.getProfileStats()` để lấy số lượng đơn hàng, số báo giá đang chờ duyệt, và tổng tiền đã chi tiêu của user.
- **`OrdersTab.jsx`**: Gọi `orderService.getMyOrders()` để hiển thị các đơn hàng thuộc về user đang đăng nhập.

## 3. Cổng thanh toán (Payment Gateways) tại Backend
- Đã cài đặt `qs`, `moment`, `crypto` để hỗ trợ tích hợp cổng VNPay.
- Các route `POST /payments/vnpay` và `GET /payments/vnpay-ipn` đã được thêm vào hệ thống để tiếp nhận và cập nhật trạng thái đơn hàng (IPN webhook) hoàn toàn tự động.
- Cấu trúc thanh toán linh hoạt, nhận cả `order_id` hoặc `quotation_id`, hỗ trợ hóa đơn tự động bằng Webhook của MoMo và VNPay.

## 4. Chức năng AI (Tạm ẩn)
- Theo yêu cầu hiện tại, các chức năng liên quan đến AI (như `AIChatHistoryTab.jsx`) tạm thời được vô hiệu hóa dữ liệu mẫu (chỉ hiển thị trống) để không gây nhầm lẫn. Việc tích hợp AI sẽ được tiến hành ở giai đoạn sau.

## Tóm lược dành cho FE
Toàn bộ luồng dữ liệu FE từ quản lý Giỏ Hàng -> Thanh Toán -> Chọn Cổng Thanh Toán (MoMo, VNPay, VietQR, COD) -> Dashboard Admin -> Quản lý Đơn hàng -> Hồ sơ khách hàng đều đã được thiết lập với hệ thống API thật. Các file component chính đã được refactor để đảm bảo trải nghiệm mua sắm và thanh toán mượt mà. Đội FE có thể tiếp tục phát triển giao diện hiển thị QR cho VietQR dựa trên dữ liệu Backend trả về.
