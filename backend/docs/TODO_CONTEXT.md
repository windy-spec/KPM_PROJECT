# Danh sách các công việc cần xử lý

Dưới đây là file context tổng hợp các task bạn cần làm dựa trên yêu cầu mới nhất của dự án. 

## 1. Ràng buộc giá mặc cả (Tối đa giảm 10%)
**Mô tả:** Người dùng khi mặc cả chỉ được phép nhập giá thấp hơn tối đa 10% so với giá gốc.
**Vị trí cần xử lý:**
- **Frontend:** Thêm validation ở form mặc cả báo giá. Chặn submit nếu `giá đề xuất < (Giá_Gốc * 0.9)`.
- **Backend (`quotation.service.js`):** Thêm logic kiểm tra an toàn. Trả về lỗi 400 nếu user truyền lên giá nhỏ hơn 90% giá ban đầu.

## 2. Quản lý CRUD cho Chi tiết linh kiện (Dùng lại `component_templates`)
**Trả lời câu hỏi của bạn:** Bảng `component_templates` hoàn toàn CÓ THỂ sử dụng lại được. Thực chất, bảng này đóng vai trò là "Khuôn mẫu linh kiện" (ví dụ: Nóc tủ, hông tủ, cánh cửa) quy định kích thước mặc định và được phép làm từ những loại vật liệu nào (`component_allowed_materials`).
**Công việc cần làm:**
- **Backend:** Các file như `component_template.service.js` và `component_template.controller.js` đã có sẵn. Bạn chỉ cần bổ sung/chỉnh sửa API nếu thiếu các logic liên quan đến thêm/sửa/xoá các vật liệu đi kèm (bảng `component_allowed_materials`).
- **Frontend:** Xây dựng giao diện Admin (bảng lưới, form thêm/sửa) gọi các API của `component_templates` để thêm, sửa tên linh kiện, kích thước mặc định và gán vật liệu cho linh kiện.

## 3. Tạo tài khoản cho Admin Kho (`admin_kho`)
**Mô tả:** Cấp một tài khoản chuyên biệt cho vai trò thủ kho.
**Vị trí cần xử lý:**
- Kiểm tra lại logic ở `auth.controller.js` hoặc gọi thẳng API tạo user, truyền `role_id` của `admin_kho` vào để cấp quyền.

## 4. Thêm `description` cho bảng `roles`
**Mô tả:** Bổ sung thêm trường mô tả (description) để giải thích rõ ràng ý nghĩa của từng role.
**Vị trí cần xử lý:**
- Bảng `roles` trong CSDL hiện đã có cột `description`. Bạn chỉ cần cập nhật script tạo dữ liệu ban đầu (seed) hoặc viết API CRUD Role để thêm/sửa trực tiếp mô tả này (admin, user, admin_kho...).

## 6. Sửa template Email báo giá & Hóa đơn
**Mô tả:** Email gửi đi cần hiển thị đầy đủ chi tiết sản phẩm, nhưng **ẨN** giá chi tiết.
**Chi tiết hiển thị:**
- Tên sản phẩm.
- Chi tiết các linh kiện của sản phẩm.
- Các loại vật tư được sử dụng.
- **KHÔNG** hiển thị giá của từng sản phẩm, linh kiện hay vật tư.
- **CHỈ** hiển thị duy nhất **Tổng tiền** cuối cùng.
**Vị trí cần xử lý:**
- **Backend:** `quotation.service.js` và `invoice.service.js` (chỉnh lại cục data truyền vào template mailer).
- **Template Email:** Tìm các file giao diện thư (HTML template). Xoá các cột hiển thị đơn giá/thành tiền của từng dòng chi tiết, chỉ giữ lại cột tên và số lượng, sau đó in đậm dòng Tổng tiền ở cuối.

## 7. Test các luồng và note lại lỗi
**Mô tả:** Khảo sát lại luồng hoàn chỉnh từ Khách hàng -> Đặt hàng -> Báo giá -> Hoá đơn.
- Ghi chú các lỗi phát sinh (bugs, validation hổng, crash) vào 1 file log để có kế hoạch fix tiếp theo.
