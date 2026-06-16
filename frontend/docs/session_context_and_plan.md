# TỔNG HỢP CONTEXT & KẾ HOẠCH TRIỂN KHAI (DÀNH CHO BUỔI TỐI)

Tài liệu này tổng hợp lại toàn bộ những lỗi đã fix, những tính năng đã thêm trong phiên làm việc vừa qua, cùng với kế hoạch chi tiết cho các tính năng bạn dự định tự code (Quản lý Hóa đơn, Giỏ hàng, Xuất PDF).

---

## PHẦN 1: NHỮNG GÌ ĐÃ HOÀN THÀNH (FILE ĐÃ SỬA)

### 1. Fix lỗi Webhook MoMo và VNPay (Thanh toán xong nhưng không cập nhật trạng thái)
**Vấn đề:** 
- Đơn hàng sau khi thanh toán thành công bị kẹt ở trạng thái "Chờ thanh toán".
- VNPay báo lỗi sai Checksum (SecureHash).
- VNPay sập API báo lỗi `obj.hasOwnProperty is not a function`.

**Các file đã can thiệp & Cách giải quyết:**
1. **`frontend/src/pages/checkout/PaymentResult.jsx`**
   - *Cách fix:* Thay vì dùng `Object.fromEntries()` để truyền params qua Axios (làm thay đổi cách mã hóa khoảng trắng của VNPay), đã chuyển sang dùng `searchParams.toString()` để giữ nguyên 100% định dạng chữ ký (SecureHash) gốc từ VNPay. Đã gọi API về Backend để đồng bộ trạng thái ngay lập tức khi người dùng được chuyển hướng về frontend.
2. **`backend/nodejs/services/payment.service.js`**
   - *Cách fix (MoMo):* Thêm chặn xử lý đúp (`if (transaction.status !== "pending") return ...`) để tránh việc vừa nhận Webhook, vừa nhận request từ Frontend sinh ra 2 hóa đơn.
   - *Cách fix (VNPay):* 
     - Sửa lỗi sập hàm băm: Đổi `if (obj.hasOwnProperty(key))` thành `if (Object.prototype.hasOwnProperty.call(obj, key))` vì Express tạo `req.query` bằng `Object.create(null)` không có sẵn prototype.
     - Đã thêm rất nhiều dòng `console.log()` và `console.error()` trong hàm `handleVnpayIpn` để dễ dàng debug nếu chữ ký băm bị sai.

### 2. Fix lỗi Sai Lệch Số Tiền Khi "Tiếp tục thanh toán"
**Vấn đề:** Khi vào Lịch sử đơn hàng và nhấn "Tiếp tục thanh toán" cho một đơn chưa trả tiền, trang Checkout tự động tính lại phí ship và phí lắp ráp từ đầu, làm sai lệch so với tổng tiền đã lưu trong database.

**Các file đã can thiệp & Cách giải quyết:**
1. **`frontend/src/pages/profile/OrdersTab.jsx`**
   - *Cách fix:* Sửa lại hàm map data đơn hàng, bổ sung trích xuất `shipping_fee`, `installation_fee` và truyền toàn bộ dữ liệu này qua `navigate("/checkout", { state: { ... } })`.
2. **`frontend/src/pages/checkout/Checkout.jsx`**
   - *Cách fix:* Đã lập trình lại logic tính toán. Nếu phát hiện `location.state.from_order === true`, hệ thống sẽ ưu tiên lấy phí Ship và phí Lắp đặt cũ để hiển thị. Nút checkbox "Lắp đặt tại nhà" cũng tự động được tích sẵn nếu đơn cũ có phí lắp đặt. Nhờ đó, `finalTotal` gửi lên VNPay/MoMo khớp 100% với đơn hàng.

### 3. Cập nhật Giao diện (Navigation & FAQ)
1. **`frontend/src/components/layout/NavigationMenu.jsx`**
   - Đổi tên "Unknow" thành "Trung tâm trợ giúp".
   - Cấu trúc lại để hiển thị Dropdown gồm 3 trang: Điều khoản dịch vụ, Chính sách bảo mật, Các câu hỏi thường gặp.
2. **`frontend/src/pages/help/FAQ.jsx`** *(Tạo mới)*
   - Tạo mới giao diện cực đẹp chứa danh sách các câu hỏi thường gặp giả lập.

---

## PHẦN 2: KẾ HOẠCH BẠN TỰ LÀM TỐI NAY (HÓA ĐƠN & GIỎ HÀNG ADMIN)

### 1. Quản lý Giỏ Hàng (View-Only)
**Mục đích:** Giúp Admin theo dõi người dùng đang bỏ gì vào giỏ hàng để bắt sóng xu hướng.
- **Backend cần làm:**
  - `cart.service.js`: Tạo hàm `getAllCarts()` join với bảng `users` và `cart_items` (join thêm `products` và `quotations`).
  - `cart.controller.js` & `cart.routes.js`: Expose API `GET /all` (Nhớ gắn middleware check Admin).
- **Frontend cần làm:**
  - `pages/admin/ManageCarts.jsx`: Giao diện bảng (Table) hiển thị danh sách người dùng và số lượng món hàng. Có nút "Xem chi tiết" mở Modal xem list linh kiện trong giỏ.
  - `components/admin/AdminSidebar.jsx` & `pages/admin/Dashboard.jsx`: Khai báo biến `panel=carts` để hiển thị.

### 2. Quản lý Hóa Đơn (Kèm tính năng Xuất PDF)
**Mục đích:** Xem danh sách hóa đơn toàn hệ thống và xuất PDF để gửi cho xưởng/khách hàng.
- **Backend cần làm:**
  - `invoice.service.js`: Tạo hàm `getAllInvoices()` join bảng `orders` và `users`.
  - `invoice.controller.js` & `invoice.routes.js`: Expose API `GET /all`.
- **Frontend cần làm:**
  - `pages/admin/ManageInvoices.jsx`: Giao diện hiển thị danh sách hóa đơn (Mã HĐ, Khách, Tổng tiền, Trạng thái Email, Ngày tạo).
  - Có một nút "Xuất PDF" (hoặc "In Hóa đơn") ở mỗi dòng.

---

## PHẦN 3: HƯỚNG DẪN NGHIÊN CỨU TÍNH NĂNG XUẤT PDF

Để tính năng xuất PDF hoạt động, bạn có 3 hướng tiếp cận tùy theo độ khó và thời gian:

### Hướng 1: Dùng `react-to-print` (DỄ NHẤT - KHUYÊN DÙNG)
- **Cài đặt:** `npm install react-to-print`
- **Cơ chế:** Thư viện này đơn giản chỉ là gọi chức năng "In" (Ctrl + P) của trình duyệt. Khách hàng sẽ thấy cửa sổ in và chọn "Save as PDF" (Lưu dưới dạng PDF).
- **Cách làm:** Bạn code một Component giao diện Hóa Đơn thật đẹp (có logo, bảng tính, chữ ký...). Component này bình thường bị ẩn đi (`display: none`). Khi bấm nút, `react-to-print` sẽ lấy nội dung HTML của nó để in. Giao diện thiết kế hoàn toàn bằng HTML/CSS/Tailwind nên cực kỳ dễ tinh chỉnh.

### Hướng 2: Dùng `jspdf` và `html2canvas` (MỨC TRUNG BÌNH)
- **Cài đặt:** `npm install jspdf html2canvas`
- **Cơ chế:** `html2canvas` sẽ chụp "màn hình" của cái thẻ `<div id="invoice">` thành một tấm ảnh (base64). Sau đó `jspdf` sẽ nhét tấm ảnh đó vào trang A4 của PDF và tự động tải file `hoadon.pdf` về máy.
- **Ưu điểm:** Khách bấm phát tải file luôn, không qua hộp thoại in.
- **Nhược điểm:** Text trong PDF bản chất là ảnh chụp, nên không thể bôi đen copy chữ được. Nếu Hóa đơn dài quá 1 trang A4 sẽ hơi khó cắt trang.

### Hướng 3: Dùng `puppeteer` tại Backend (KHÓ NHẤT - CHUYÊN NGHIỆP NHẤT)
- **Cài đặt (Backend):** `npm install puppeteer ejs`
- **Cơ chế:** 
  1. Frontend gọi API `/api/invoices/:id/pdf`
  2. NodeJS dùng EJS để render data hóa đơn thành chuỗi HTML chuẩn chỉnh.
  3. Puppeteer mở một trình duyệt Chromium ẩn ở Server, tải chuỗi HTML đó, rồi gọi hàm `page.pdf({ format: 'A4' })` để xuất trực tiếp ra buffer binary.
  4. Backend gửi file binary về lại Frontend để tải xuống.
- **Ưu điểm:** File PDF cực xịn, nhẹ, nét, bôi đen được chữ, tự cắt trang hoàn hảo.
- **Nhược điểm:** Phải cài Chromium trên server (nặng), tốn RAM server khi render.

> **Chúc bạn buổi tối vọc code hiệu quả! Tất cả nền tảng đã dọn sẵn sàng.**
