# Cập nhật Luồng Thanh toán Đặt Cọc & Hoá Đơn (Giai đoạn 2)

## 1. Cơ chế mới về Đặt Cọc (Cập nhật Backend)
- **Mốc kích hoạt**: Nếu tổng giá trị tiền **vật tư** (không bao gồm vận chuyển và lắp đặt) lớn hơn hoặc bằng **10,000,000 VNĐ**, đơn hàng sẽ yêu cầu thanh toán cọc 10%.
- **Cách tính cọc**: Số tiền cọc = Tổng giá vật tư x 10%. Các loại phí vận chuyển và lắp đặt sẽ được gộp vào đợt thanh toán thứ 2 (Phase 2) khi đơn hàng đã gia công xong.
- **Service `order.service.js`**: Cập nhật hàm `updateCheckoutInfo` để tính toán tự động `deposit_amount` và `is_deposit_required`.
- **Payment Webhook**: Cập nhật logic trong Webhook của MoMo và VNPay. Khi thanh toán thành công:
  - Nếu `is_deposit` là `true`: Tạo hoá đơn loại `DEPOSIT`, đổi status thành `pending` (để bắt đầu gia công), và cập nhật `is_deposit_paid = true`.
  - Nếu `is_phase_2` là `true`: Tạo hoá đơn loại `PHASE_2`, đồng thời tự động tạo thêm một hoá đơn tổng `TOTAL` gộp lại và gửi email cho người dùng.

## 2. Quản lý Hoá Đơn Phân Cấp (Database & Services)
- **Bảng `invoices` (Prisma)**:
  - Đã loại bỏ ràng buộc `@unique` trên trường `order_id` để cho phép 1 Đơn hàng (Order) có thể có nhiều Hoá đơn (1-N).
  - Bổ sung `invoice_type` (`DEPOSIT`, `PHASE_2`, `TOTAL`, `STANDARD`).
  - Bổ sung `parent_invoice_id` để tạo quan hệ tự tham chiếu (Self-relation) cho hoá đơn Tổng tham chiếu đến hoá đơn 1 và 2.
- **Service `invoice.service.js`**:
  - Chuyển `prisma.invoices.findUnique` thành `findFirst` khi truy vấn theo `order_id` để tương thích với quan hệ 1-N.
  - Sửa `createInvoice` để nhận thêm tham số `invoiceType`.
  - Viết mới hàm `createTotalInvoice(orderId, session)` để tìm hoá đơn Đợt 1 và Đợt 2, nhúng lại thành hoá đơn Tổng và gửi cho khách.
- **Email (`mailer.utils.js`)**: Cập nhật hàm `sendVerifyEmail` nhận thêm tham số `type` để điều chỉnh tiêu đề và nội dung email thông báo phù hợp với từng đợt thanh toán (DEPOSIT_INVOICE, PHASE2_INVOICE, TOTAL_INVOICE).

## 3. Frontend - Trải nghiệm Người Dùng (FE)
- **Cải thiện Giao diện Thanh toán `Checkout.jsx`**:
  - Thêm 2 tùy chọn thanh toán rõ ràng nếu đơn trên 10 triệu: "Thanh toán toàn bộ" và "Thanh toán cọc 10%".
  - **Kiểm soát Địa lý & COD**: Chặn phương thức COD (Thanh toán khi nhận hàng) nếu người dùng chọn Thanh toán cọc, HOẶC địa chỉ giao hàng chứa các chuỗi: `Bình Dương`, `Cần Giờ`, `Vũng Tàu` hoặc không chứa `Hồ Chí Minh`.
- **Thanh toán Đợt 2 & Nhận Hàng**:
  - Tại bảng điều khiển User (`OrdersTab.jsx`), khi đơn hàng đang ở trạng thái `delivering` và đã đóng cọc, nút "Đã nhận hàng" chuyển thành "Thanh toán Đợt 2".
  - Xây dựng Component mới `Phase2Checkout.jsx` cho luồng thu 90% còn lại cộng với chi phí phụ trợ (Ship + Lắp đặt).
- **Trải nghiệm nhập liệu UI UX nâng cao**:
  - Mọi trường nhập giá tiền (như lúc mặc cả của User ở `QuotationsTab.jsx` hay lúc Admin duyệt giá ở `AdminQuoteReviewModal.jsx`, `QuotationDetail.jsx`) đều được định dạng dấu chấm ngăn cách hàng nghìn (VD: 1.000.000) trực tiếp theo thời gian thực (Real-time formatting) giúp tránh nhầm lẫn số không.

## 4. Bảng điều khiển Admin (ManageOrders)
- Hiển thị danh sách Hoá đơn Phân cấp: Khi Admin xem chi tiết đơn hàng tại `ManageOrders.jsx`, một bảng "Danh sách Hóa Đơn" sẽ hiển thị liệt kê toàn bộ các đợt hoá đơn kèm trạng thái và số tiền, giúp đối soát trực tiếp mà không cần vào DB.
