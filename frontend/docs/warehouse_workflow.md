# KPM Frontend - Warehouse Workflow (Quy trình nghiệp vụ Kho)

Tài liệu này mô tả kiến trúc component, state quản lý và cách hoạt động của giao diện phân hệ Thủ Kho.

## 1. Cấu Trúc File (File Structure)

- `WarehouseDashboard.jsx`: Là Component Container gốc chứa toàn bộ các view của Kho. Quản lý trạng thái chung (`activePanel`) và hiển thị các Alert thông báo kết quả thao tác (Thành công, Lỗi, Bảng báo đỏ thiếu vật tư).
- `WarehouseSidebar.jsx`: Thanh Menu điều hướng bên trái. Sử dụng Query Params (`?panel=...`) để chuyển trang mà không bị reload.
- `ExportRequestsPanel.jsx`: Bảng điều khiển "Yêu Cầu Xuất Vật Tư" (Luồng chính xử lý đơn hàng).
- `WarehouseExportHistory.jsx`: Trang "Lịch Sử Phiếu Xuất" hiển thị theo từng hóa đơn xuất kho, gom nhóm theo `reference_code` và cho phép bung/thu chi tiết bằng accordion để xem danh sách vật tư trong mỗi hóa đơn.
- `WarehouseInventory.jsx`: Trang Quản lý tồn kho thực tế, nơi chứa Thẻ Kho chi tiết. Ngăn chặn nhập số lẻ khi chỉnh sửa lượng tồn kho (chỉ nhập số nguyên `step="1"`).
- `WarehouseRequest.jsx`: Form lập phiếu đề xuất xin Admin cấp thêm vật tư.
- `ManageMaterialRequests.jsx`: Dùng chung với Admin để theo dõi trạng thái các phiếu xin nhập hàng.

## 2. Quản Lý State (State Management) ở Dashboard

`WarehouseDashboard` đóng vai trò Controller trung tâm. Mọi hàm xử lý API (như `handleReceiveOrder`, `handleConfirmSufficientStock`, `handleReportOutOfStock`,...) đều được khai báo tại Dashboard và truyền xuống dưới (Props drilling) vào `ExportRequestsPanel`.

**Lợi ích của mô hình này:**
- Các Alert thông báo (`warehouseSuccess`, `warehouseError`, `missingMaterials`) sẽ được hiển thị cố định ở vùng màn hình chính của Dashboard, không bị mất hoặc che khuất bởi giao diện con.
- Có biến `warehouseLoading` làm cờ khoá (disabled) các nút bấm ở UI con, tránh việc người dùng nhấp đúp (double click) gửi trùng request.

## 3. Cơ Chế Xử Lý Lỗi Thiếu Vật Tư
Khi Warehouse click "Đủ hàng - Đưa vào sản xuất" tại `ExportRequestsPanel`:
1. Hàm `handleConfirmSufficientStock` sẽ gọi xuống API của backend.
2. Backend kiểm tra chéo lại với CSDL. Nếu thực sự có thiếu hụt (có thể do có user khác vừa xuất đi), Backend trả về mã lỗi `400` kèm theo một mảng `missing_list`.
3. Frontend (Catch Error block tại Dashboard) sẽ bắt được mảng này, set vào state `missingMaterials`.
4. Giao diện Dashboard tự động bung ra một bảng đỏ (Red Alert Table) liệt kê chính xác mã vật tư nào thiếu, yêu cầu bao nhiêu, hiện có bao nhiêu, và chênh lệch âm bao nhiêu để thủ kho nắm rõ.

## 4. Cơ Chế Bắt Đầu Sản Xuất
- Từ UI "Yêu cầu Xuất vật tư", khi đơn hàng đạt trạng thái `production_ready` (đã xuất kho hoặc đã nhập bù thành công), thủ kho có nút **[Bắt đầu sản xuất]**. Nút này chuyển đơn thành `producing`.
- Trạng thái `producing` được hiển thị đồng bộ lên Admin với nhãn "Đang sản xuất" (màu Teal, hiệu ứng animate-pulse).
- Tương tự, UI khách hàng (`OrdersTab.jsx`) cũng theo dõi qua biến Socket và tự động nhảy Stepper tiến độ sang bước 2. Thẻ Tracking Modal cập nhật nhật ký thời gian thực.

## 5. Quy Chuẩn Nhập Liệu Tồn Kho
Trang `WarehouseInventory.jsx` (Quản lý tồn kho thực) đã được thiết lập nghiêm ngặt:
- Trọng lượng, quy cách có thể là số thực nhưng **số lượng (Quantity)** vật tư chỉ chấp nhận số nguyên (Integer). 
- Các thẻ input số lượng đều có thuộc tính `step="1"`, cơ chế `onBlur` tự động ép kiểu bằng `parseInt()` để chống các thao tác copy/paste chuỗi hoặc số thập phân sai lệch.
