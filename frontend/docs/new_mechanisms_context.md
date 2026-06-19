# Bối cảnh & Các điểm cần chỉnh sửa (Cập nhật theo yêu cầu)

Tài liệu này trình bày lại chi tiết thiết kế cho 2 cơ chế: (1) Đưa Linh kiện vào DB và (2) Xử lý logic Đơn vị tính & Hao phí khi thay đổi vật tư.

---

## Cơ chế 1: Quản lý Linh kiện (Component Templates) trong Database

**Trả lời câu hỏi của bạn:** *"Thay đổi thì toàn bộ luồng code hiện tại đang lưu trữ linh kiện sản phẩm cũng phải đổi theo đúng không?"*

**Không nhất thiết phải đập bỏ toàn bộ luồng cũ.** Hệ thống hiện tại đang lưu `components` của mỗi Sản phẩm (`products`) dưới dạng một mảng JSON. Cấu trúc JSON này rất linh hoạt và phù hợp vì mỗi sản phẩm có kích thước, số lượng linh kiện khác nhau. 

**Điểm thay đổi cốt lõi chỉ là "Nguồn gốc" của dữ liệu mẫu:**
Thay vì lấy danh sách linh kiện từ file cứng `CATEGORY_BLUEPRINTS` ở Frontend, chúng ta lấy nó từ Database. Mảng JSON `components` trong bảng `products` hay `quotation_specs` vẫn giữ nguyên dạng JSON, chỉ là dữ liệu nạp vào nó sẽ phong phú và chuẩn xác hơn.

### Các thay đổi cụ thể:
1. **Schema Database (`schema.prisma`):** Thêm bảng `component_templates` (Linh kiện mẫu) và bảng `component_allowed_materials` (Các vật tư được phép dùng cho linh kiện đó).
2. **Backend API:** Thêm các API CRUD (`GET`, `POST`, `PUT`, `DELETE`) cho Linh kiện mẫu.
3. **Frontend (Trang Admin quản lý linh kiện):** Tạo giao diện để thêm mới linh kiện (ví dụ: Tên "Khung sườn", gắn với danh mục "Hàng rào", chọn các vật tư phù hợp như Sắt hộp, Inox...).
4. **Frontend (Trang cấu hình sản phẩm `ProductComponentsEditor.jsx`):** Gọi API để load danh sách linh kiện mẫu làm lựa chọn dropdown. Khi Admin chọn 1 linh kiện, hệ thống tự động đổ mảng `allowed_materials` để Admin biết linh kiện này được phép dùng những vật tư nào.

---

## Cơ chế 2: Quản lý Đơn vị tính và Hao phí theo cấu hình Sản phẩm

**Ý tưởng gốc của bạn rất hay:** Đơn vị tính là thuộc tính cố định của Vật tư (tấm, miếng, cây, kg), nhưng độ hao phí là thuộc tính của Sản phẩm (một cái cửa nhôm thì hao phí nhôm khác với cái tủ nhôm). Đặc biệt, **khi chuyển qua vật tư khác trong cùng một linh kiện, mức hao phí cũng phải thay đổi theo cấu hình vật tư đó.**

### Thiết kế cấu trúc lưu trữ mới cho JSON `components` của Sản phẩm:

Hiện tại, JSON của 1 linh kiện trong Sản phẩm đang lưu:
```json
{
  "name": "Khung bao cửa",
  "default_material": "SH_4080",
  "waste_rate": 1,
  "waste_unit": "cây"
}
```

**Sẽ được nâng cấp thành:**
```json
{
  "name": "Khung bao cửa",
  "default_material": "SH_4080",
  "waste_configs": {
    "SH_4080": { "rate": 1, "unit": "cây" },
    "INOX_304": { "rate": 0.5, "unit": "tấm" },
    "THEP_I_200": { "rate": 2, "unit": "kg" }
  }
}
```

### Cách thức hoạt động & Điểm cần sửa:

1. **Ở Trang cấu hình Sản phẩm (`ProductComponentsEditor.jsx`):**
   - Thay vì chỉ cho Admin nhập 1 ô "Hao phí" duy nhất, ta sẽ hiển thị ra một danh sách các "Vật tư phù hợp" (dựa theo cấu hình ở Cơ chế 1).
   - Với **mỗi loại vật tư**, Admin sẽ nhập được 1 mức `waste_rate` riêng biệt.
   - **Đơn vị tính (`unit`)** sẽ tự động được hệ thống khóa cứng (Read-only) bằng cách dò trong DB `materials -> material_units`, đảm bảo tuyệt đối không bị sai lệch đơn vị.

2. **Ở Trang tạo Báo giá (`CustomQuoteForm.jsx` / `QuotationDetail.jsx`):**
   - Khi Khách hàng hoặc Admin **thay đổi loại vật tư** cho một linh kiện (Ví dụ: Từ Sắt Hộp `SH_4080` sang Inox `INOX_304`).
   - Frontend sẽ tự động tra cứu vào mảng `waste_configs["INOX_304"]` của Sản phẩm đó để lấy ra **Đơn vị hao phí (tấm)** và **Tỉ lệ hao phí (0.5)** tương ứng.
   - Nếu vật tư đó chưa được cấu hình hao phí, có thể áp dụng mức mặc định là `0` hoặc cảnh báo Admin.
   - Nhờ vậy, khi xuất kho hoặc tính tiền dựa trên hao phí, số liệu sẽ tự động thích ứng với vật tư được chọn mà không cần can thiệp thủ công.
