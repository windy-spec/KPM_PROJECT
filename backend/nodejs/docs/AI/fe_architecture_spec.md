# Đặc Tả Kiến Trúc Giao Diện (FE Architecture) Cho AI KPM

Tài liệu này đặc tả cách thức Frontend (React/Vite) của KPM sẽ tích hợp và giao tiếp với hệ thống AI (Groq API). Mục tiêu là mang lại trải nghiệm mượt mà, tiện lợi mà không làm xáo trộn cấu trúc code hiện hành.

---

## 1. NÚT CHAT TRỢ LÝ ẢO TOÀN CỤC (GLOBAL FLOATING WIDGET)
- **Vị trí tích hợp:** Gắn tại `MainLayout.jsx` để xuất hiện ở mọi trang (Home, Product, Cart, v.v.).
- **Giao diện (UI):** 
  - Trạng thái đóng: Một icon Robot AI/Chat bubble trôi nổi ở góc phải dưới màn hình.
  - Trạng thái mở: Trượt ra một Panel/Modal chat dọc theo mép phải màn hình (giống Intercom hoặc Zalo Chat).
- **Trải nghiệm người dùng (UX):**
  - **Nhắn tin thời gian thực:** Hỗ trợ Streaming text (chữ hiện ra từ từ) để khách không có cảm giác chờ đợi, vì Groq API phản hồi cực kỳ nhanh.
  - **Render Component Động:** Khi AI trả về một cục dữ liệu JSON dạng báo giá, Frontend không in ra text khô khan, mà sẽ *bắt* cục JSON đó và render thành một Component React thực thụ (Ví dụ: `<QuotationCard data={data} />`). Trên thẻ này có luôn nút bấm "Thêm vào giỏ hàng" hoặc "Mua ngay".

## 2. PHÂN TÍCH BẢN VẼ TRONG FORM YÊU CẦU BÁO GIÁ
- **Vị trí tích hợp:** Trang `CustomQuoteForm.jsx` (Route `/request-a-quote`).
- **Giao diện (UI):**
  - Bổ sung khu vực "Kéo thả bản vẽ/ảnh thiết kế" (Drag & Drop Zone).
  - Trạng thái Loading sinh động: Hiển thị các dải scan hiệu ứng chạy dọc bức ảnh kèm dòng chữ "AI đang bóc tách kích thước...".
- **Trải nghiệm người dùng (UX) - Auto-Fill:**
  - Khách hàng tải ảnh lên -> Frontend gọi API gửi ảnh cho Backend (Groq Llama 3.2 Vision) -> Backend trả về cục JSON 4 tham số.
  - Frontend dùng state để **tự động điền (Auto-fill)** vào các ô input: Tên sản phẩm, Chiều Dài, Chiều Rộng, Chiều Cao, và Ghi chú mô tả.
  - Khách hàng xem lại, nếu thấy AI đọc chưa đúng ý, họ hoàn toàn có thể click vào ô text để sửa lại trước khi bấm "Gửi Yêu cầu".

## 3. LƯU TRỮ LỊCH SỬ AI TRONG TRANG CÁ NHÂN
- **Vị trí tích hợp:** Component `Profile.jsx` (Route `/profile`).
- **Giao diện (UI):**
  - Thêm một Tab mới bên cạnh các tab hiện tại (như "Đơn hàng của tôi", "Thiết kế yêu thích"), đặt tên là **"Lịch sử Tư vấn AI"**.
  - Hiển thị danh sách các phiên chat (kèm ngày tháng và Tóm tắt phiên chat do bảng `ai_memory_contexts` cung cấp).
- **Trải nghiệm người dùng (UX):**
  - Nhấp vào một phiên chat cũ sẽ bung ra (popup) toàn bộ lịch sử trò chuyện.
  - Khách hàng có thể tìm lại chiếc cổng sắt từng nhờ AI tư vấn tháng trước và chốt đơn ngay lập tức mà không cần gõ lại yêu cầu.

---

## Sơ đồ luồng dữ liệu (Data Flow)
1. **Chat/Nhập liệu:** `FE (React)` --> *HTTP POST / Socket* --> `BE (NodeJS)`
2. **Xử lý LLM:** `BE (NodeJS)` --> *Groq API (Llama 3)* --> `BE (NodeJS)`
3. **Cập nhật CSDL:** `BE` bóc tách dữ liệu JSON, lưu vào `ai_chat_messages`, `ai_drawing_analyses` (nếu có ảnh).
4. **Phản hồi:** `BE` --> *Stream / JSON* --> `FE (React)`.
5. **Hiển thị:** `FE` nhận dữ liệu, cập nhật State, kích hoạt Auto-fill hoặc Render các thẻ thông tin đồ họa (Card).
