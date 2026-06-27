# Phân tích luồng Báo giá & Thanh toán (Payment Flow Context)

## 1. Vấn đề hiện tại (Bug "Tiếp tục thanh toán" không hoạt động)
**Mô tả lỗi:** Sau khi admin xác nhận báo giá, đơn hàng chuyển sang trạng thái `pending_payment` (Chờ thanh toán). Tuy nhiên, khi người dùng bấm nút "Tiếp tục thanh toán" ở màn hình Đơn hàng (`OrdersTab`), hệ thống điều hướng sang trang Checkout nhưng ngay lập tức bị đẩy ngược về trang `/cart` (Giỏ hàng).

**Nguyên nhân gốc rễ (Root Cause):**
- Khi Admin xác nhận báo giá (`QuotationService.updateStatus` -> `admin_confirmed`), hệ thống tạo ra một `Order` mới nhưng **không tạo `order_items`** (vì đây là đơn hàng từ báo giá tùy chỉnh, dữ liệu chi tiết nằm ở bảng `quotation_specs`).
- Khi user bấm "Tiếp tục thanh toán" ở `OrdersTab.jsx`, code hiện tại đang cố map danh sách sản phẩm từ `order.raw_items` (chính là `order_items`). Vì mảng này rỗng `[]`, biến `checkoutItems` được truyền sang trang `Checkout.jsx` sẽ rỗng.
- Trang `Checkout.jsx` có một hook `useEffect` kiểm tra: nếu `cartItems.length === 0`, tự động đá user về `/cart`. Do đó user không thể thanh toán được.

## 2. Phân tích Luồng Thanh Toán Mới (Theo yêu cầu)
Luồng yêu cầu: *User yêu cầu báo giá -> admin nhập báo giá ->*
* **Dưới 20 triệu:** Thanh toán COD hoặc Ngân hàng.
* **Trên 20 triệu:** Ngân hàng chuyển khoản full, COD phải cọc 10% và trừ lại lúc nhận hàng.
* **Chưa chọn PTTT:** Trạng thái là `pending_payment`.

**Kiểm tra tính khả thi trên hệ thống hiện tại:**
1. **Trạng thái `pending_payment` mặc định:** Đã hoạt động đúng. Khi Admin xác nhận, `QuotationService` tạo Order với trạng thái `production_status: "pending_payment"`. Đơn hàng sẽ kẹt ở trạng thái này cho đến khi user chọn PTTT ở trang Checkout.
2. **Logic Cọc 10% (COD >= 20 triệu):** Hệ thống backend (`payment.service.js` -> `createCashPayment`) đã có sẵn logic kiểm tra:
   ```javascript
   const isDepositRequired = amount >= 20000000;
   // ... cập nhật order thành "pending_deposit" và tính deposit_amount = amount * 0.1
   ```
   Trang `Checkout.jsx` cũng đã có UI cảnh báo cho đơn trên 20 triệu khi chọn COD.
3. **Logic Trừ tiền cọc:** Hệ thống đã hỗ trợ trừ tiền cọc ở `OrdersTab.jsx` (cột hiển thị giá trị đơn hàng, đã có code tính `total_amount - deposit_amount` để báo còn nợ COD).

## 3. Các bước cần thực hiện để sửa lỗi và hoàn thiện luồng

**Bước 1: Sửa Backend trả về `quotation_specs` cho OrdersTab**
- File: `backend/nodejs/services/order.service.js` (Hàm `getMyOrders`)
- Thêm `quotation_specs` vào query để có thông tin chi tiết các linh kiện của báo giá:
  ```javascript
  quotations: {
    include: { quotation_specs: true }
  }
  ```

**Bước 2: Sửa logic truyền data ở `OrdersTab.jsx`**
- File: `frontend/src/pages/profile/OrdersTab.jsx`
- Trong hàm onClick của nút "Tiếp tục thanh toán", phải check:
  - Nếu là đơn đặt trực tiếp: Lấy `order.raw_items`
  - Nếu là đơn từ báo giá (`order.quotations` tồn tại): Lấy từ `order.quotations.quotation_specs` và format lại thành mảng `checkoutItems` tương thích (tạo mock `product_name`, `price`, `image` từ `quotation_specs`).

**Bước 3: Đảm bảo Checkout.jsx không bị crash**
- Trang Checkout hiện tại cần đọc `product_name`, `price`, `quantity`, `image` của mảng `checkoutItems`. Dữ liệu map từ `quotation_specs` phải fake các trường này để Checkout hiển thị đúng giỏ hàng tạm.

**Tổng kết:** Luồng logic bạn yêu cầu hệ thống đã có thiết kế sẵn (cọc 10%, trạng thái chờ), chỉ bị vướng ở khâu truyền dữ liệu từ Order sang Checkout đối với Đơn hàng sinh ra từ Báo giá. Chỉ cần sửa Bước 1 và 2 là toàn bộ luồng sẽ mượt mà.
