# Hướng Dẫn Tích Hợp Thanh Toán (Dành cho Frontend)

Tài liệu này tổng hợp lại những thay đổi mới nhất ở Backend liên quan đến luồng **Checkout Giỏ hàng** và **Thanh toán MoMo / Tiền mặt**. Luồng thanh toán hiện tại đã hỗ trợ tách biệt cho **Hàng Custom (Báo giá)** và **Hàng Thường (Mua đứt bán đoạn)**.

---

## 1. Luồng Submit Giỏ Hàng (`/api/cart/submit`)

Trước đây, khi submit giỏ hàng, hệ thống chỉ hỗ trợ chuyển các "Hàng Custom" thành báo giá (Quotation). Bây giờ, hệ thống đã hỗ trợ lên đơn trực tiếp cho các "Hàng Thường" (có sẵn trong giỏ).

**Thay đổi ở Response:**
Khi gọi API `POST /api/cart/submit`, Backend sẽ trả về cục JSON như sau:
```json
{
  "success": true,
  "message": "Lên đơn hàng thành công! Vui lòng tiến hành thanh toán.",
  "order_id": "8b3f2...-..." // (NEW) Backend sẽ trả về mã order_id nếu trong giỏ có hàng thường
}
```

**Nhiệm vụ của Frontend:**
1. Khi nhận được response thành công từ API Submit giỏ hàng, hãy kiểm tra xem có field `order_id` hay không.
2. Nếu **CÓ `order_id`**: Chuyển hướng người dùng thẳng sang trang Thanh Toán (hoặc hiện Modal thanh toán) và truyền mã `order_id` này vào API thanh toán.
3. Nếu **KHÔNG CÓ `order_id`** (nghĩa là giỏ hàng chỉ toàn hàng custom): Thông báo cho người dùng "Gửi yêu cầu báo giá thành công, vui lòng chờ Admin duyệt" và chuyển hướng về trang Danh sách báo giá.

---

## 2. Luồng Gọi API Thanh Toán

API thanh toán hiện tại đã được nâng cấp để hỗ trợ thanh toán thông qua 2 loại mã: `quotation_id` hoặc `order_id`.

**Các API Thanh Toán:**
- MoMo: `POST /api/payments/momo`
- Tiền mặt: `POST /api/payments/cash`

**Cách truyền Body Data:**
Trước đây, bạn truyền `{ "quotation_id": "..." }`.
Bây giờ, tuỳ thuộc vào loại đơn mà bạn truyền field tương ứng:

- **Dành cho Hàng Thường (vừa lấy được order_id từ lúc submit cart):**
  ```json
  {
    "order_id": "8b3f2..."
  }
  ```

- **Dành cho Hàng Custom (khi Admin đã duyệt báo giá và user vào bấm Thanh toán):**
  ```json
  {
    "quotation_id": "2c9a1..."
  }
  ```

**Lưu ý:**
- Khi thanh toán thành công qua MoMo (nhận được Webhook), Backend sẽ tự động sinh ra **Hóa Đơn (Invoice)**.
- Khi người dùng vào mục "Lịch sử hóa đơn", API `/api/invoices/my-invoices` cũng đã được Backend nâng cấp để tự động hiển thị đầy đủ hóa đơn của cả hàng thường và hàng custom mà không cần Frontend sửa logic gọi API.

---

## 3. Tóm Tắt Ghi Chú
- **Hàng Custom (đặt làm)**: Vẫn hoạt động theo luồng cũ -> User gửi request -> Chờ Admin duyệt -> User thanh toán bằng `quotation_id`.
- **Hàng Thường (có sẵn)**: User add vào giỏ -> Submit giỏ -> Nhận được `order_id` -> Thanh toán ngay lập tức bằng `order_id`.
- Backend đã tạo sẵn bảng `order_items` để lưu thông tin chi tiết các món hàng thường khi sinh đơn.
