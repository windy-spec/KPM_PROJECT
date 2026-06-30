# Hướng Dẫn Code Chi Tiết Cho 4 Task Còn Lại

Dưới đây là đoạn code mẫu và vị trí file để bạn có thể tự sửa trực tiếp vào source code của mình.

---

## 1. Ràng buộc giá mặc cả (Tối đa giảm 10%)

### 👉 Ở Frontend (Chặn ngay từ lúc người dùng gõ phím)
**File:** `frontend/src/pages/profile/QuotationsTab.jsx` (Hoặc component Dialog mà bạn cho phép user nhập giá mặc cả)
**Cách làm:**
Tìm đến hàm xử lý khi user ấn nút "Gửi yêu cầu mặc cả" (ví dụ hàm `handleBargainSubmit`). Bổ sung đoạn check này ngay đầu hàm:
```javascript
const originalPrice = parseFloat(quotationData.total_quoted_price);
const minAllowedPrice = originalPrice * 0.9; // Giảm tối đa 10% (tức là giá phải >= 90%)

if (parseFloat(customPrice) < minAllowedPrice) {
    alert(`Bạn không được mặc cả thấp hơn 10% (Tối thiểu phải là ${formatVND(minAllowedPrice)})`);
    // Hoặc dùng toast.error() nếu có cài thư viện react-toastify
    return; // Dừng lại không gọi API
}
```

### 👉 Ở Backend (Chặn ở server để đảm bảo an toàn tuyệt đối)
**File:** `backend/nodejs/services/quotation.service.js`
**Cách làm:**
Tìm đến hàm xử lý cập nhật báo giá của người dùng (ví dụ hàm `updateUserProposal` hoặc chỗ nào update `user_proposed_price`).
```javascript
// Trích xuất giá gốc từ database trước khi update
const currentQuote = await prisma.quotations.findUnique({ where: { id: quotationId } });

const originalPrice = currentQuote.total_quoted_price;
const minAllowedPrice = originalPrice * 0.9;

if (user_proposed_price < minAllowedPrice) {
    throw new Error("Dữ liệu không hợp lệ: Giá mặc cả không được thấp hơn 10% so với giá hệ thống.");
}

// Nếu qua được đoạn if trên thì tiếp tục update database bình thường
```

---

## 2. Quản lý CRUD Chi tiết linh kiện (`component_templates`)

**Cách làm:**
- **Về Backend:** Bạn đang có sẵn hàm trong file `backend/nodejs/services/component_template.service.js`. Bạn hãy mở file này ra, trong các hàm `getAll` hoặc `getById`, hãy thêm cấu hình `include` để API trả về luôn các vật liệu cho phép:
  ```javascript
  return await prisma.component_templates.findMany({
      include: {
          allowed_materials: {
              include: { materials: true } // Kéo theo cả tên vật liệu từ bảng materials
          }
      }
  });
  ```
- **Về Frontend:** 
  1. Tạo 1 file mới: `frontend/src/pages/admin/ComponentTemplates.jsx`.
  2. Dùng Table (như Ant Design, MUI, hoặc table HTML thuần) gọi API `GET /api/component-templates` để đổ dữ liệu ra bảng.
  3. Làm 1 cái Modal (Form) để khi nhấn "Thêm mới" hoặc "Sửa", bạn cho phép Admin nhập: `component_name`, `default_length`, `default_width`, `default_height` và gọi API `POST / PUT` tương ứng.

---

## 3. Thêm `description` cho bảng `roles`

Trường `description` đã có sẵn trong database (`schema.prisma`). Việc của bạn chỉ là cập nhật data cho nó.
**File:** `backend/nodejs/scripts/seed_blueprints.js` (Hoặc file script tạo data seed ban đầu của bạn)
**Cách làm:**
Tìm đoạn code gọi `prisma.roles.create` hoặc `prisma.roles.upsert` và nhét thêm `description` vào cục data:
```javascript
await prisma.roles.upsert({
    where: { role_name: 'admin' },
    update: { description: 'Quản trị viên toàn quyền hệ thống' },
    create: { 
        role_name: 'admin', 
        description: 'Quản trị viên toàn quyền hệ thống' 
    }
});

// Làm tương tự cho 'user' và 'admin_kho'
```
*Lưu ý: Nếu không muốn chạy lại file seed, bạn có thể mở DBeaver/PgAdmin/TablePlus và sửa thẳng chữ trong database cũng được, không ảnh hưởng gì đến luồng code.*

---

## 4. Sửa template Email báo giá & Hóa đơn (Ẩn giá chi tiết)

**File:** `backend/nodejs/utils/mailer.utils.js`
**Cách làm:**
Trong file này đang chứa các chuỗi HTML để vẽ email (như hàm `sendQuotationEmail` ở dòng ~189 và `sendOrderConfirmationEmail` ở dòng ~318).
1. **Tìm thẻ `<th>`:** Xóa thẻ `<th>Đơn giá</th>` và `<th>Thành tiền</th>` trên thanh tiêu đề bảng.
2. **Tìm thẻ `<td>` vòng lặp:** Trong vòng lặp sinh ra danh sách món hàng (`orderItems.map...`), xóa các thẻ `<td>${item.price}</td>`.
3. **Hiển thị linh kiện/vật tư:** Ở trong cái `<td class="product-name">`, bạn có thể map thêm chi tiết linh kiện vào bên dưới tên sản phẩm.
   ```javascript
   // Ví dụ đoạn map HTML
   const itemsHtml = quotationSpecs.map(spec => `
     <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">
           <strong>${spec.component_name}</strong><br/>
           <small>Vật tư: ${spec.materials?.material_name || 'Không có'}</small><br/>
           <small>Kích thước: ${JSON.stringify(spec.dimensions)}</small>
        </td>
        <td style="padding: 10px; border: 1px solid #ddd;">${spec.quantity || 1}</td>
        <!-- BỎ HẾT CỘT GIÁ Ở ĐÂY -->
     </tr>
   `).join('');
   ```
4. **Giữ lại Tổng Tiền:** Ở cuối bảng, hãy chắc chắn dòng Tổng tiền vẫn dùng biến tổng: `Tổng tiền: ${formatVND(total_amount)}`.
