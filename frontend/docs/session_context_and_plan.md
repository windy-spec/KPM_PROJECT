# TỔNG HỢP CONTEXT & KẾ HOẠCH TRIỂN KHAI (CẬP NHẬT THEO FEEDBACK CỦA THẦY)

Tài liệu này tổng hợp lại toàn bộ yêu cầu mới từ giáo viên hướng dẫn, phân tích chi tiết những tính năng cần bổ sung, và cung cấp **hướng dẫn cách làm cụ thể (Implementation Guide)** để bạn có thể tự code và sửa lại dự án một cách hoàn chỉnh.

---

## PHẦN 1: DANH SÁCH TÍNH NĂNG CẦN BỔ SUNG (FEEDBACK MỚI NHẤT)

### 1. Luồng Thương lượng Báo Giá (Hai Chiều)
**Yêu cầu:** 
- User yêu cầu báo giá.
- Admin dùng tool tính giá tối thiểu, sau đó nhập/điều chỉnh giá và gửi cho User.
- User có 2 lựa chọn: (1) Chấp nhận giá Admin đưa, (2) Gửi lại mức giá User mong muốn thương lượng.
- Admin nhận mức giá User đề xuất và chỉ được quyền **Cập nhật trạng thái** cuối cùng (không được tự sửa giá lúc này nữa).
- 4 Trạng thái báo giá cuối: `Hủy`, `Đang xử lý`, `Xem xét`, `Đồng ý báo giá`.

### 2. Phân loại Mức Tiền Thanh Toán & Đặt Cọc
**Yêu cầu:** Áp dụng logic xử lý thanh toán/đặt cọc dựa trên tổng giá trị đơn hàng.
- **Dưới 20 triệu:** Thanh toán hoặc đặt cọc theo logic bình thường.
- **Từ 20 triệu đến 40 triệu:** Bắt buộc đặt cọc **10%** giá trị đơn hàng. Hệ thống tự động gửi Email xác nhận đặt cọc thành công.
- **Trên 40 triệu:** Cần có giao dịch lớn -> Hệ thống gửi Email hẹn gặp mặt trực tiếp để ký hợp đồng và trao đổi (không cho phép thanh toán online toàn bộ số tiền lớn như vậy rủi ro cao).

### 3. Role Quản Lý Kho & Thống kê Vật Tư
**Yêu cầu:**
- Bổ sung thêm 1 Role: **Nhân viên Kho (Warehouse)**.
- **Nhiệm vụ của Kho:** Quản lý các vật tư/sản phẩm đã nhập, quản lý vật tư **còn thừa** (để tái sử dụng cho các sản phẩm kế tiếp).
- **Thống kê (Dành cho Admin & Kho):** Báo cáo số tiền nhập/xuất, hóa đơn, danh sách vật tư đã nhập, danh sách vật tư còn sót/thừa ra có thể tận dụng.

### 4. Hóa Đơn Điện Tử (In ra Giấy)
**Yêu cầu:**
- Nghiên cứu cách lập hóa đơn điện tử (form hóa đơn chuẩn, có số hóa đơn, ngày giờ, thông tin khách, chi tiết vật tư, mã vạch/QR nếu có).
- Cho phép hệ thống điền dữ liệu (Data binding) vào form hóa đơn này.
- Có chức năng **In ra giấy (Xuất PDF)** để giao cho khách hàng hoặc lưu trữ.

### 5. Cải thiện Giao diện & Luồng Phụ
**Yêu cầu:**
- Hoàn thiện luồng thêm nhiều ảnh cho sản phẩm (sử dụng gallery ảnh).
- Thêm **Dropdown Menu User/Logo** cho Admin ở trên Topbar (để bấm vào Avatar hiện menu Đăng xuất, Đổi mật khẩu...).

---

## PHẦN 2: HƯỚNG DẪN CÁCH LÀM (IMPLEMENTATION GUIDE)

Phần này sẽ hướng dẫn bạn chi tiết cần sửa ở những file nào, bảng nào trong Database để đáp ứng các yêu cầu trên.

### HƯỚNG DẪN 1: LUỒNG THƯƠNG LƯỢNG BÁO GIÁ (QUOTATION)

**1. Sửa Database (Prisma Schema):**
- Trong model `quotations`, bạn cần thêm các trường:
  ```prisma
  admin_proposed_price  Decimal?  @db.Decimal(15, 2) // Giá Admin gửi User
  user_proposed_price   Decimal?  @db.Decimal(15, 2) // Giá User mặc cả lại
  ```
- Trạng thái (`status`) sẽ mở rộng thành: `draft` -> `admin_quoted` (Admin báo giá) -> `user_proposed` (User mặc cả) -> (Admin chốt:) `processing` (Đang xử lý) / `under_review` (Xem xét) / `agreed` (Đồng ý) / `canceled` (Hủy).

**2. Sửa Backend (`quotation.controller.js` & `service`):**
- Khi User submit giỏ hàng/báo giá -> status là `draft`.
- Admin API: Thêm hàm `adminQuote(quotationId, adminPrice)` -> chuyển status thành `admin_quoted` và update `admin_proposed_price`.
- User API: Thêm hàm `userNegotiate(quotationId, userPrice)` -> user nhập giá mặc cả, chuyển status thành `user_proposed` và update `user_proposed_price`. Hoặc user bấm "Đồng ý" thì gọi hàm `userAccept(quotationId)`.
- Admin API: Thêm hàm `adminFinalDecision(quotationId, finalStatus)`. Lưu ý backend phải check: Nếu gọi API này, CHỈ được đổi `status` thành 1 trong 4 trạng thái thầy yêu cầu (Đang xử lý, Xem xét, Đồng ý, Hủy), **tuyệt đối không** update bảng giá nữa.

**3. Sửa Frontend (`QuotationDetail.jsx`):**
- Dựa vào `status` mà hiển thị form tương ứng:
  - Nếu `status === 'admin_quoted'`, bên User hiển thị nút "Chấp nhận" hoặc Ô nhập giá để "Thương lượng lại".
  - Nếu `status === 'user_proposed'`, bên Admin hiển thị mức giá User muốn, KÈM THEO một Select/Dropdown chọn 4 trạng thái (Hủy, Đang xử lý, Xem xét, Đồng ý) -> Bấm Lưu cập nhật trạng thái. Không cho Admin nhập ô giá tiền nữa (`disabled`).

### HƯỚNG DẪN 2: LOGIC THANH TOÁN THEO NGƯỠNG TIỀN (>20tr, >40tr)

**1. Sửa Frontend (`Checkout.jsx`):**
- Khi tính toán `finalTotal` (Tổng tiền). Dùng câu lệnh `if/else`:
  - `if (finalTotal > 40000000)`: Ẩn cổng thanh toán MoMo/VNPay. Hiện dòng chữ: *"Đơn hàng giá trị lớn. Vui lòng đặt hàng, chúng tôi sẽ gửi Email hẹn lịch gặp mặt trực tiếp để ký hợp đồng"*. Nút "Thanh toán" đổi thành "Gửi yêu cầu gặp mặt".
  - `else if (finalTotal >= 20000000)`: Hiển thị dòng chữ *"Đơn hàng trên 20 triệu yêu cầu đặt cọc 10%"*. Tính ra biến `depositAmount = finalTotal * 0.1`. Nút thanh toán truyền đúng cục tiền `depositAmount` này cho VNPay/MoMo.
  - `else`: Thanh toán bình thường 100% hoặc ship COD.

**2. Sửa Backend (`payment.service.js` & `mailer.utils.js`):**
- Tại luồng xử lý Webhook trả về thành công:
  - Check xem tiền khách trả là bao nhiêu. Cập nhật `production_status` thành `deposit_paid` (đã cọc).
  - Viết 1 template Email: *"Xác nhận đã nhận cọc số tiền... cho đơn hàng... "* -> Dùng `sendVerifyEmail` gửi đi.
- Tại luồng Submit Đơn hàng (khi > 40tr):
  - Khi lưu đơn hàng, gọi ngay `sendVerifyEmail(user.email, orderData, "MEETUP_APPOINTMENT")` với nội dung hẹn gặp trực tiếp.

### HƯỚNG DẪN 3: ROLE KHO & QUẢN LÝ VẬT TƯ THỪA

**1. Sửa Database (Prisma Schema):**
- Thêm model quản lý Tồn kho & Vật tư thừa (Inventory):
  ```prisma
  model inventory {
    id              String    @id @default(uuid()) @db.Uuid
    material_id     String    @db.Uuid
    quantity        Decimal   @default(0) @db.Decimal(12, 2)
    leftover_amount Decimal   @default(0) @db.Decimal(12, 2) // Số lượng vật tư thừa (vụn sắt, sơn dư...)
    updated_at      DateTime? @default(now())
    materials       materials @relation(fields: [material_id], references: [id])
  }
  ```
- Trong model `roles`, đảm bảo đã INSERT một role tên là `Warehouse` (hoặc `Kho`).

**2. Backend:**
- Tạo `inventory.controller.js` & `inventory.service.js`.
- API cho Kho:
  - `GET /inventory/all`: Xem danh sách tất cả vật tư và số lượng còn trong kho (bao gồm `leftover_amount`).
  - `POST /inventory/import`: Nhập kho (cộng thêm `quantity`).
  - `POST /inventory/leftover`: Báo cáo vật tư thừa sau 1 mẻ thi công (cộng thêm `leftover_amount`).

**3. Frontend (`ManageInventory.jsx`):**
- Tạo trang `ManageInventory.jsx` (chỉ hiển thị khi Role là Admin hoặc Kho).
- Trang này có 2 tab:
  - Tab 1: Quản lý Nhập Xuất (Vật tư mới).
  - Tab 2: Danh sách Vật Tư Thừa (Để tái sử dụng). Có nút xuất Excel danh sách này.

### HƯỚNG DẪN 4: HÓA ĐƠN ĐIỆN TỬ VÀ IN PDF

**1. Cách tiếp cận dễ và đẹp nhất (Frontend-side):**
- Sử dụng thư viện `react-to-print`. Cài đặt bằng lệnh: `npm install react-to-print`.
- Tạo một Component mới tên là `InvoiceTemplate.jsx`. 
- Component này bạn sẽ code bằng TailwindCSS, thiết kế giống hệt một tờ hóa đơn điện tử thực tế:
  - Header: Logo Công ty, Chữ HÓA ĐƠN ĐIỆN TỬ, Mã số thuế.
  - Body: Bảng thông tin khách hàng, số HĐ, Ngày lập.
  - Table: Danh sách sản phẩm, số lượng, đơn giá, thành tiền, thuế VAT.
  - Footer: Chữ ký số (nếu có), mã QR (dùng thư viện `qrcode.react`).
- Mặc định Component này sẽ bị ẩn (`hidden` hoặc đưa ra ngoài màn hình). 
- Trang `ManageInvoices.jsx` sẽ truyền Data (props) vào `InvoiceTemplate`. Khi Admin bấm nút "In hóa đơn", `react-to-print` sẽ lấy cái Template đó ra và bật hộp thoại In của trình duyệt -> Admin chọn "Save as PDF".

### HƯỚNG DẪN 5: GIAO DIỆN PHỤ (ẢNH & TOPBAR)

**1. Upload nhiều ảnh sản phẩm:**
- Model `product_images` đã có sẵn trong DB.
- Sửa trang `ManageProducts.jsx` (hoặc modal thêm SP):
  - Dùng thẻ `<input type="file" multiple />` để cho phép chọn nhiều ảnh.
  - Khi submit, Backend dùng `multer` xử lý mảng file (`req.files`) -> Upload lên Cloudinary bằng `Promise.all` -> Lấy danh sách URL về `insertMany` vào bảng `product_images`.

**2. Dropdown User Logo cho Admin:**
- Sửa file `AdminTopbar.jsx` (nằm trong `frontend/src/components/admin/AdminTopbar.jsx`).
- Bọc cái Avatar hiện tại bằng thẻ `div relative`. Dùng biến state `[isOpen, setIsOpen]` để toggle tắt bật một cái thẻ `div absolute` chứa danh sách chức năng (Hồ sơ, Đăng xuất).

---

## PHẦN 3: TỔNG KẾT NHỮNG GÌ ĐÃ FIX TRƯỚC ĐÓ

*(Phần này giữ lại để bạn nắm tiến trình của dự án)*
- **Thanh toán:** Đã fix lỗi lệch chữ ký VNPay (SecureHash) và sập server khi nhận Webhook. Đã xử lý đúp bill MoMo.
- **Logic Tính tiền:** Đã fix lỗi load lại giỏ hàng làm mất phí ship/phí lắp đặt khi nhấn "Tiếp tục thanh toán" từ đơn hàng cũ.
- **UI Menu:** Cập nhật lại thanh điều hướng (Navigation), thêm trang Trung tâm trợ giúp (FAQ).

> **Lời khuyên:** Khối lượng công việc thầy giao khá nhiều luồng nghiệp vụ. Bạn nên bắt tay vào làm từ cái **Giao diện (Dropdown Admin, In Hóa Đơn PDF bằng react-to-print)** trước cho dễ thở, sau đó làm logic **Ngưỡng tiền (Thanh toán 10% / Hẹn gặp)**, rồi cuối cùng mới đụng vào DB để sửa luồng **Thương lượng giá** và **Quản lý Kho**. Chúc bạn code thành công!
