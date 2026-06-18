# Tài Liệu: Luồng Quản Lý & Theo Dõi Trạng Thái Đơn Hàng (Order Flow)

Tài liệu này giải thích cách hoạt động của hệ thống cập nhật và theo dõi trạng thái đơn hàng giữa Frontend và Backend. Các dev đọc kỹ để nắm rõ chuẩn trạng thái (status keys) đang được sử dụng nhé.

---

## 1. Chuẩn Hóa Bộ Trạng Thái Đơn Hàng (Status Dictionary)
Trong database bảng `orders`, trường `production_status` quy định vòng đời của một đơn hàng. Bộ từ khóa chuẩn bao gồm:

- `pending_payment`: **Chờ thanh toán**. Đơn hàng vừa được tạo (từ Checkout), khách chưa hoàn tất thanh toán.
- `pending`: **Chờ xử lý / Đã thanh toán**. Đơn hàng đã có tiền, chờ Admin kiểm tra để duyệt.
- `production`: **Đang sản xuất**. Xưởng đang thi công, cắt gọt vật tư theo yêu cầu.
- `delivering`: **Đang giao hàng**. Đơn hàng đã xuất xưởng và giao cho đối tác vận chuyển.
- `completed`: **Đã hoàn thành**. Khách đã nhận hàng thành công.
- `cancelled`: **Đã hủy**. Đơn hàng bị hủy (do khách không thanh toán hoặc Admin từ chối).

> **Lưu ý quan trọng**: Tuyệt đối không dùng các status chế ngoài lề (như PENDING, CONFIRMED, DELIVERED viết hoa hay `in_progress`) vì nó sẽ gãy logic render ở Frontend.

---

## 2. Admin Cập Nhật Trạng Thái (`ManageOrders.jsx`)
Khi Admin thao tác duyệt đơn, hệ thống sẽ gọi API thông qua service:
```javascript
orderService.updateOrderStatus(orderId, {
  status: 'production',
  stage_name: 'Đang sản xuất',
  stage_description: 'Đơn hàng đã được chuyển xuống xưởng sản xuất'
});
```

**Hoạt động ở Backend (`PUT /orders/:id/status`)**:
1. Cập nhật thẳng trường `production_status` của đơn hàng trong bảng `orders`.
2. Tạo thêm một record mới trong bảng `order_tracking` (Lưu lại lịch sử với `stage_name`, `stage_description` và thời gian thực hiện). Việc này được bao bọc trong một Database Transaction, nếu lỗi sẽ rollback toàn bộ.

---

## 3. Khách Hàng Theo Dõi Tiến Độ (`OrdersTab.jsx`)
Bên phía User, thẻ `OrdersTab` hiển thị danh sách đơn hàng. Khi khách bấm nút **"Theo dõi đơn hàng"**, một Modal sẽ hiện lên.

**Quy trình gọi dữ liệu**:
1. Giao diện mở Modal lên trước ở trạng thái loading.
2. Gọi API `orderService.getOrderTracking(orderId)` (tương ứng với endpoint `GET /orders/:id/tracking`).
3. Backend sẽ query bảng `order_tracking`, trả về mảng danh sách lịch sử sắp xếp từ mới nhất đến cũ nhất.
4. UI sẽ map mảng này ra thành dạng **Timeline** cực kỳ đẹp mắt, khớp với CSS Design System chung của toàn dự án.

---

## 4. Danh Sách API Liên Quan
Các hàm này đã được định nghĩa tại `frontend/src/services/order.service.js`:
- `getMyOrders()`: Lấy danh sách đơn hàng của tôi.
- `updateOrderStatus(id, data)`: Đổi trạng thái và ghi log tracking.
- `getOrderTracking(id)`: Lấy ra mảng timeline log trạng thái của đơn hàng ID đó.

> Mọi thắc mắc về luồng này, xin hãy đối chiếu logic tại `backend/nodejs/services/order.service.js` (Class `OrderService`).
