# Đặc Tả Kiến Trúc & Phát Triển Trợ Lý AI KPM

Tài liệu này đặc tả chi tiết 2 nhánh phát triển AI cốt lõi cho hệ thống KPM (Trợ lý ảo bán hàng và Phân tích bản vẽ kỹ thuật), dựa trên cấu trúc CSDL hiện tại.

---

## NHÁNH 1: TRỢ LÝ ẢO TƯ VẤN BÁN HÀNG & BÁO GIÁ (AI SALES ASSISTANT)

### 1. Mục đích & Vai trò
- Đóng vai trò là một nhân viên Sale/Tư vấn am hiểu hệ thống vật tư của xưởng.
- Lắng nghe yêu cầu của khách hàng, giải đáp thắc mắc và **tự động tính toán báo giá** dựa trên dữ liệu thật từ Database (Vật liệu, Độ dày, Loại sơn, Nhân công).
- Trích xuất tự động các thông số khách hàng yêu cầu để chuyển thành bảng báo giá (`quotations`).

### 2. Giao diện hiển thị (Phía User)
- Cửa sổ Chat tương tác (tương tự Messenger/ChatGPT) tích hợp trong giao diện Khách hàng.
- Lịch sử chat được lưu trữ và có thể xem lại trong **Profile** của người dùng.
- Hiển thị các block dữ liệu thông minh trong khung chat (Ví dụ: AI gửi lại một Card Báo Giá để khách hàng click xác nhận).

### 3. Cấu trúc Database sử dụng
- **Lưu trữ Chat:** `ai_chat_sessions` (Phiên chat), `ai_chat_messages` (Nội dung chat & thông số kỹ thuật `extracted_specs` được AI bóc tách).
- **Bộ nhớ ngữ cảnh:** `ai_memory_contexts` (Tóm tắt lại các đoạn chat để tiết kiệm token và duy trì trí nhớ của AI).
- **Cấu hình AI (Luật & Kiến thức):** `ai_knowledge_base` (Chứa các rule của xưởng như cách tính giá, chính sách), `ai_knowledge_patterns` (Cấu hình format câu trả lời ép AI phải theo form định sẵn).
- **Dữ liệu tham chiếu (Báo giá):** `materials`, `material_thickness`, `paint_types`, `labor_rates`, `quotations`.

### 4. Hướng đi & Cách thực hiện (Implementation)
- **Công nghệ lõi:** Sử dụng API của **Groq** (hoàn toàn miễn phí, tốc độ phản hồi cực nhanh - cực kỳ phù hợp cho đồ án sinh viên). Sử dụng các model mã nguồn mở mạnh mẽ như `llama-3.1-70b-versatile` hoặc `llama-3.1-8b-instant` có hỗ trợ tốt Function Calling.
- **Luồng xử lý (Workflow):**
  1. **Khởi tạo:** Khi User mở chat, hệ thống tạo `ai_chat_sessions`. Kéo các luật lệ kích hoạt từ `ai_knowledge_patterns` nhét vào System Prompt.
  2. **Truy xuất thông tin (RAG / Function Calling):** Khi khách hỏi "Giá gỗ sồi 18mm bao nhiêu?", AI sử dụng Function Calling để gọi một API nội bộ, query bảng `materials` & `material_thickness` để lấy giá chính xác trả lời khách.
  3. **Bóc tách dữ liệu:** Khi khách chốt yêu cầu, AI lưu lại một object JSON vào cột `extracted_specs` của `ai_chat_messages` (vd: `{ material_id: "...", length: 2000, width: 800 }`).
  4. **Lưu ngữ cảnh:** Cứ sau mỗi 10 tin nhắn, chạy một background job tóm tắt lại hội thoại lưu vào `ai_memory_contexts`.

---

## NHÁNH 2: AI PHÂN TÍCH BẢN VẼ KỸ THUẬT (DRAWING ANALYSIS)

### 1. Mục đích & Vai trò
- Giúp khách hàng (hoặc nhân viên kinh doanh) không rành đọc bản vẽ vẫn có thể số hóa được thông tin bản vẽ một cách nhanh chóng.
- Tiết kiệm thời gian bóc tách khối lượng từ ảnh chụp phác thảo hoặc bản vẽ CAD.

### 2. Giao diện hiển thị (Phía User)
- Nút bấm/Khu vực kéo thả ảnh bản vẽ (Upload File) ở cửa sổ Chat hoặc trong form Yêu cầu Báo giá.
- Sau khi upload và phân tích, hệ thống hiển thị trả về một Form điền sẵn 4 trường dữ liệu trọng tâm: Tên bản vẽ, Kích thước tổng thể, Tỷ lệ, và Mô tả. Người dùng có thể sửa lại nếu AI đọc chưa chuẩn.

### 3. Thông số trọng tâm (Focus Parameters)
Hệ thống sẽ ép AI (Vision) chỉ tập trung trích xuất chính xác 4 tham số này để đưa vào JSON:
1. **Tên bản vẽ (Drawing Name):** Chủ thể của bản vẽ là gì (Ví dụ: "Tủ bếp chữ L", "Bàn làm việc nhân viên").
2. **Thông số kích thước (Dimensions):** Bóc tách chính xác Dài (Length) x Rộng (Width) x Cao (Height).
3. **Tỷ lệ bản vẽ (Scale Ratio):** Phân tích xem bản vẽ đang vẽ ở tỷ lệ nào (Ví dụ: 1:100, 1:50) dựa trên ghi chú trên ảnh.
4. **Mô tả/Chi tiết (Description/About):** Tóm tắt xem bản vẽ này yêu cầu gia công vật liệu gì, có ghi chú đục lỗ, vát cạnh hay yêu cầu đặc biệt nào không.

### 4. Cấu trúc Database sử dụng
- `ai_drawing_analyses`: Đây là bảng cốt lõi. Chứa `drawing_name`, `image_url`, `specifications` (Lưu cục JSON chứa Chiều dài, rộng, cao và mô tả), `scale_ratio`, và liên kết với bảng chat qua `message_id`.

### 5. Hướng đi & Cách thực hiện (Implementation)
- **Công nghệ lõi:** Tiếp tục tận dụng hệ sinh thái **Groq** bằng cách sử dụng các model Đa phương thức (Multimodal Vision) mới nhất của họ như `llama-3.2-90b-vision-preview` hoặc `llama-3.2-11b-vision-preview`. Các model này đọc ảnh rất tốt và quan trọng nhất là vẫn dùng chung API Key của Groq (miễn phí).
- **Luồng xử lý (Workflow):**
  1. Người dùng upload hình ảnh (PNG, JPG, PDF) vào khung chat. Ảnh được lưu lên Cloud (S3/Cloudinary) và tạo một record `ai_chat_messages`.
  2. Backend gửi URL ảnh cùng System Prompt ép kiểu dữ liệu trả về (JSON Schema) cho AI Vision.
     *System Prompt ví dụ: "Mày là kỹ sư bóc tách. Đọc bản vẽ trong ảnh và TRẢ VỀ DUY NHẤT một cục JSON có cấu trúc: { drawing_name: String, dimensions: { length: Number, width: Number, height: Number }, scale_ratio: String, description: String }".*
  3. Nhận kết quả JSON, parse và lưu vào bảng `ai_drawing_analyses`.
  4. Bắn dữ liệu (qua Socket/API) về Frontend để hiển thị cho người dùng confirm.

---

## 🛠 TÓM TẮT CÁC BƯỚC KHỞI CHẠY DỰ ÁN AI
1. **Thiết lập Engine API:** Cài đặt SDK (OpenAI/Gemini/Claude) trong Backend (hoặc tạo một Microservice bằng Python FastAPI nếu cần xử lý RAG nặng).
2. **Xây dựng Data Pipeline:** Viết API đồng bộ dữ liệu Bảng Giá / Vật Tư thành các cấu trúc JSON tĩnh hoặc Vector DB để mồi cho LLM.
3. **Phát triển luồng Chat:** Hoàn thiện UI khung Chat và API lưu trữ phiên chat vào `ai_chat_sessions`.
4. **Phát triển luồng Phân tích ảnh:** Viết API nhận ảnh, gọi LLM Vision, bóc tách JSON và lưu vào `ai_drawing_analyses`.
