# 🤖 Bản Đặc Tả & Kế Hoạch Triển Khai AI (Groq API)

File này chứa chi tiết kiến trúc, luồng đi và các bước code cụ thể để tích hợp AI vào dự án KPM sử dụng **Groq API** (miễn phí, tốc độ cao) kết hợp với tất cả các bảng liên quan đến AI trong Database.

---

## 1. Phân Tích Database & Mục Đích Sử Dụng
Chúng ta có tổng cộng 6 bảng liên quan đến AI. Dưới đây là cách chúng sẽ hoạt động cùng nhau (không bỏ sót bảng nào):

### Nhóm 1: Cơ Sở Tri Thức (Knowledge Base)
- **`ai_knowledge_patterns`**: Lưu trữ các mẫu/kịch bản hội thoại. 
  - *Cách dùng:* Khi AI nhận được câu hỏi từ user, code sẽ quét `trigger_keywords`. Nếu khớp, AI sẽ bị ép trả lời theo định dạng của `response_structure`.
- **`ai_knowledge_base`**: Lưu trữ các quy định, thông số vật tư, báo giá chuẩn.
  - *Cách dùng:* Nếu cần, tạo `embedding_vector` để search (RAG) hoặc search text đơn giản, sau đó nhét nội dung `rule_content` vào Prompt của AI (System Message) để AI tư vấn không bịa thông tin.

### Nhóm 2: Quản Lý Hội Thoại (Chat)
- **`ai_chat_sessions`**: Lưu trữ phiên chat của User. Mỗi user có thể có nhiều session (ví dụ: Tư vấn tủ bếp, Tư vấn giường ngủ).
- **`ai_chat_messages`**: Lưu trữ lịch sử chat.
  - *Cột quan trọng:* `sender_type` (user/ai), `message_text`, `extracted_specs` (nếu trong lúc chat user đề cập đến kích thước, lưu chuỗi JSON bóc tách được vào đây).

### Nhóm 3: Tối Ưu Context & Token (Memory)
- **`ai_memory_contexts`**: Dùng để "nhớ" ngữ cảnh.
  - *Cách dùng:* Do các API LLM có giới hạn token (Context Window), khi số lượng messages trong `ai_chat_messages` của một session quá dài, ta sẽ gọi Groq API tạo ra một bản tóm tắt (summary) và lưu vào bảng này. Những lần chat sau, thay vì nạp toàn bộ lịch sử, ta chỉ nạp `summary_text` và vài tin nhắn gần nhất.

### Nhóm 4: Xử Lý Hình Ảnh Bản Vẽ (Vision)
- **`ai_drawing_analyses`**: Bảng dành riêng cho tính năng đọc bản vẽ thiết kế.
  - *Cách dùng:* Gắn với một `message_id`. Khi user gửi ảnh, lưu `image_url`, sau đó truyền cho Groq Vision (ví dụ: Llama-3.2-11B-Vision).
  - *Đầu ra lưu vào:* 
    - `drawing_name`: Tên sản phẩm dự đoán.
    - `scale_ratio`: Tỷ lệ bản vẽ (vd 1:100).
    - `specifications`: JSON chi tiết dài/rộng/cao và các linh kiện cấu thành (vd: `{"components": ["nóc", "hông", "cánh"], "dimensions": {"length": 1200, "width": 600, "height": 2000}}`).

---

## 2. Cấu Trúc Thư Mục Mới (Folder `ai`)
Mọi file liên quan đến AI sẽ được gom gọn vào các folder chuyên biệt để dễ quản lý:

```text
backend/nodejs/
├── controllers/
│   └── ai/
│       ├── chat.controller.js      (Xử lý API nhận tin nhắn chat)
│       ├── vision.controller.js    (Xử lý API upload ảnh & phân tích)
│       └── knowledge.controller.js (CRUD cho admin quản lý knowledge base)
├── services/
│   └── ai/
│       ├── groq.service.js         (Core: Giao tiếp trực tiếp với SDK của Groq)
│       ├── chat.service.js         (Xử lý logic lưu session, messages, gọi memory)
│       ├── memory.service.js       (Logic tóm tắt lịch sử chat lưu vào ai_memory_contexts)
│       └── vision.service.js       (Logic xử lý URL ảnh, prompt trích xuất JSON bản vẽ)
└── routes/
    └── ai.routes.js                (Định tuyến các API: /api/ai/chat, /api/ai/vision...)
```

---

## 3. Luồng Hoạt Động Cụ Thể (Flows)

### Flow 1: Chatbot Tư Vấn
1. **User** gửi tin nhắn text lên `/api/ai/chat`.
2. **Controller** gọi `chat.service.js`.
3. Lưu tin nhắn của User vào `ai_chat_messages`.
4. Tìm kiếm kiến thức trong `ai_knowledge_base` hoặc `patterns` tương ứng.
5. Kiểm tra lịch sử chat, nếu quá dài thì gọi `memory.service.js` lấy `summary_text`.
6. Ghép toàn bộ (System Prompt + Knowledge + Summary + Lịch sử gần nhất) gửi qua **Groq API (Llama-3)**.
7. Lấy câu trả lời, lưu vào `ai_chat_messages` với `sender_type = ai`.
8. Trả kết quả về cho frontend.

### Flow 2: Phân Tích Bản Vẽ (Vision)
1. **User** upload ảnh bản vẽ (qua multer lên server/S3/Cloudinary), nhận lại URL.
2. Gửi URL lên API `/api/ai/vision`.
3. **Controller** gọi `vision.service.js`.
4. Build Prompt yêu cầu bắt buộc trả về định dạng JSON cấu trúc chặt chẽ (Tên, D/R/C, Tỷ lệ, Chi tiết linh kiện).
5. Gửi lên **Groq API (Model Vision)**.
6. Nhận kết quả text (dạng JSON string), parse sang Object.
7. Lưu record vào `ai_drawing_analyses` (map với `message_id` nếu nằm trong luồng chat).
8. Trả cục JSON về Frontend để user confirm/preview.

---

## 4. Lộ Trình Code Chi Tiết (Roadmap)
- **Bước 1:** Đăng ký lấy API Key tại [Groq Console](https://console.groq.com/). Cài đặt SDK: `npm install groq-sdk`.
- **Bước 2:** Setup base `groq.service.js` để làm hàm tiện ích (gọi completion text và completion vision).
- **Bước 3:** Code luồng `vision.service.js` trước vì luồng này độc lập và dễ test nhất. Định nghĩa rõ System Prompt để ép AI trả về chuẩn JSON.
- **Bước 4:** Code `chat.service.js` (Lưu session, lưu message). Chưa cần RAG hay Memory vội, cứ chat được cơ bản đã.
- **Bước 5:** Tích hợp `ai_knowledge_base` (RAG) vào luồng chat. Dùng regex hoặc vector (như pgvector nếu có) để móc data.
- **Bước 6:** Code cronjob hoặc trigger cho `ai_memory_contexts` khi session_id vượt quá ví dụ 20 tin nhắn.
