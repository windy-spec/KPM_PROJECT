# HƯỚNG DẪN SỬA LỖI HỆ THỐNG KPM (USER & ADMIN)

Tài liệu này tổng hợp nguyên nhân và cách sửa đổi cho các lỗi bạn đã nêu.

---

## PHÍA USER

### ❌ Lỗi 1: Lỗi "navigate is not defined" khi cuộn trang
* **File bị lỗi:** [`NavigationMenu.jsx`](file:///c:/Users/TP/Desktop/KPM/frontend/src/components/layout/NavigationMenu.jsx#L2)
* **Nguyên nhân:** Dùng biến `navigate` và `location` tại dòng 30-38 nhưng chưa import và khởi tạo từ thư viện `react-router-dom`.
* **Cách sửa:**
  1. Thay thế dòng 2:
     ```javascript
     import { Link, useLocation, useNavigate } from 'react-router-dom';
     ```
  2. Tại dòng 6, khai báo `useNavigate` và `useLocation` bên trong Component:
     ```javascript
     const NavigationMenu = () => {
       const navigate = useNavigate();
       const location = useLocation();
       const [isScrolled, setIsScrolled] = useState(false);
       // ...
     ```

---

### ❌ Lỗi 2: Mua ngay chưa tạo được đơn hàng
* **File bị lỗi:** [`ProductDetail.jsx`](file:///c:/Users/TP/Desktop/KPM/frontend/src/pages/product/ProductDetail.jsx#L296)
* **Nguyên nhân:** Khi gọi `const submitRes = await cartService.submitCart();`, kết quả trả về có cấu trúc `{ success: true, data: { order_id: "..." } }`. Code hiện tại đang kiểm tra sai trường `submitRes.order_id` (bị `undefined`), nên luôn chạy vào nhánh báo lỗi.
* **Cách sửa:** Sửa dòng 296 từ:
  ```javascript
  if (submitRes.order_id) {
  ```
  thành:
  ```javascript
  if (submitRes.data?.order_id) {
  ```
  Và sửa tiếp dòng 301 để truyền đúng `order_id`:
  ```javascript
  order_id: submitRes.data.order_id,
  ```

---

### ❌ Lỗi 3: Giỏ hàng chưa lưu được & Lịch sử đơn hàng trống
* **File bị lỗi 1:** [`order.service.js` (Backend)](file:///c:/Users/TP/Desktop/KPM/backend/nodejs/services/order.service.js#L7)
* **Nguyên nhân 1:** Do database lỗi truy vấn Prisma. Trong Prisma Schema, model `users` không có trường `phone` (trường này nằm ở bảng `user_profiles`). Khi Prisma chạy câu lệnh:
  `users: { select: { id: true, username: true, email: true, phone: true } }`
  Nó sẽ crash toàn bộ API lấy thông tin đơn hàng vì `phone` không tồn tại.
* **Cách sửa:** Truy cập file [`order.service.js`](file:///c:/Users/TP/Desktop/KPM/backend/nodejs/services/order.service.js) và xóa bỏ trường `phone: true` ở các khối select của `users` (tại các dòng 7, 10, 31, 34, 60).
  * *Ví dụ:* Sửa thành:
    ```javascript
    users: { select: { id: true, username: true, email: true } }
    ```

* **File bị lỗi 2:** [`order.service.js` (Backend)](file:///c:/Users/TP/Desktop/KPM/backend/nodejs/services/order.service.js#L29)
* **Nguyên nhân 2:** Hàm `getOrderById` ép kiểu id đơn hàng về `parseInt(id)` nhưng ID đơn hàng trong DB là kiểu **UUID String**, dẫn đến việc ép kiểu trả về `NaN` và không tìm thấy đơn hàng.
* **Cách sửa:** Sửa dòng 29 từ:
  ```javascript
  where: { id: parseInt(id) },
  ```
  thành:
  ```javascript
  where: { id: id },
  ```

---

### ❌ Lỗi 4: Cấu hình yêu thích cần đặt được tên
* **File bị lỗi:** [`ProductDetail.jsx`](file:///c:/Users/TP/Desktop/KPM/frontend/src/pages/product/ProductDetail.jsx#L311)
* **Nguyên nhân:** Hàm `handleSaveFavorite` gửi cấu hình đi nhưng không truyền tham số `title`, nên backend luôn đặt mặc định là `"Cấu hình yêu thích chưa đặt tên"`.
* **Cách sửa:** Thêm hộp thoại hỏi tên trước khi lưu:
  ```javascript
  const handleSaveFavorite = async () => {
    if (!priceData) {
      toast.warning("Vui lòng cấu hình đầy đủ trước khi lưu!");
      return;
    }
    
    // Thêm prompt hỏi tên cấu hình
    const title = window.prompt("Nhập tên cho thiết kế yêu thích của bạn:", `Cấu hình ${product.product_name}`);
    if (title === null) return; // Nhấn Cancel
    if (!title.trim()) {
      toast.warning("Tên thiết kế không được để trống!");
      return;
    }

    try {
      await quotationService.saveFavorite({
        product_id: product.id,
        components: componentsConfig,
        note: note,
        title: title.trim(), // Truyền tên lên backend
      });
      toast.success("Đã lưu thiết kế vào mục yêu thích!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi lưu yêu thích");
    }
  };
  ```

---

### ❌ Lỗi 5: Thanh toán thành công nhưng chưa cập nhật đơn hàng thành công
* **Nguyên nhân:**
  * **Với VNPay:** Cần đăng ký URL IPN (Server-to-Server) trong trang Merchant Admin của VNPay Sandbox:
    1. Truy cập: [sandbox.vnpayment.vn/merchantv2](https://sandbox.vnpayment.vn/merchantv2/)
    2. Cấu hình IPN URL: `https://silver-icons-repair.loca.lt/api/payments/vnpay-ipn`
    *(Nếu không cấu hình, khi bạn thanh toán thành công VNPay không thể gọi về máy bạn để cập nhật status từ `pending` sang `success` được)*.

---

## PHÍA ADMIN

### ❌ Lỗi 6: Chưa có tổng quan doanh số trên Dashboard
* **Nguyên nhân:** Doanh thu trên Dashboard chỉ cộng dồn từ các giao dịch có trạng thái `status: "success"` (đã thanh toán thành công qua MoMo/VNPay). Các đơn hàng đặt bằng Tiền mặt (CASH) mặc định có trạng thái giao dịch là `pending` (chờ thu tiền).
* **Giải pháp:** Khi đơn hàng Tiền mặt được giao thành công hoặc khi Admin nhận được tiền mặt, Admin cần cập nhật trạng thái đơn hàng thành **DELIVERED / COMPLETED** để hệ thống tự động ghi nhận doanh thu, hoặc duyệt trạng thái giao dịch liên quan thành `success`.

---

### ❌ Lỗi 7: Chưa link được từ Dashboard vào quản lý đơn hàng
* **File bị lỗi:** [`Dashboard.jsx`](file:///c:/Users/TP/Desktop/KPM/frontend/src/pages/admin/Dashboard.jsx#L263)
* **Nguyên nhân:** Bảng "Đơn hàng mới cập nhật" hiển thị nút "Xem chi tiết" nhưng chưa được gắn sự kiện chuyển panel.
* **Cách sửa:** Tại các dòng 265 và 268 trong file `Dashboard.jsx`, bọc nút bấm bằng sự kiện đổi panel đơn hàng:
  ```javascript
  // Sửa nút xem chi tiết:
  <button 
    type="button" 
    onClick={() => navigate('/admin/dashboard?panel=orders')}
    className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-primary transition-colors" 
    title="Xem chi tiết"
  >
    <ChevronRight className="w-3.5 h-3.5" />
  </button>
  ```
