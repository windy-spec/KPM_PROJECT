# HƯỚNG DẪN CODE TỪ A-Z: XÂY DỰNG HỆ THỐNG AI CHO KPM
Tài liệu này là "Kim chỉ nam" chi tiết từng bước (Step-by-step) để bạn có thể **tự mình code và làm chủ** toàn bộ hệ thống AI.

Kiến trúc tập trung (Monolith):
- Toàn bộ code AI và Web API sẽ được đặt gọn gàng trong thư mục **`backend/nodejs`**.
- Scripts nạp dữ liệu và công cụ AI riêng lẻ sẽ được đặt trong **`backend/nodejs/scripts`** hoặc **`backend/nodejs/utils`**.

---

## GIAI ĐOẠN 1: CÀI ĐẶT MÔI TRƯỜNG & THƯ VIỆN
**Bước 1: Lấy API Key**
- Truy cập `console.groq.com`, tạo API Key.
- Mở file `backend/nodejs/.env`, thêm dòng: `GROQ_API_KEY=gsk_xxxxxxxxxxxxxx`

**Bước 2: Cài thư viện vào Server chính**
- Mở Terminal, di chuyển vào `backend/nodejs`.
- Chạy lệnh cài đặt:
```bash
npm install groq-sdk @xenova/transformers
```

---

## GIAI ĐOẠN 2: CẤU HÌNH DATABASE VECTOR (SUPABASE)
**Bước 1: Bật Extension trên Supabase**
- Đăng nhập vào trang quản trị Supabase của bạn.
- Mở menu **SQL Editor**, chạy câu lệnh này để bật tính năng Vector:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

**Bước 2: Sửa file `schema.prisma`**
- Mở file `backend/nodejs/prisma/schema.prisma`.
- Thêm `extensions = [vector]` vào block `datasource`:
```prisma
datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  directUrl  = env("DIRECT_URL")
  extensions = [vector]
}
```
- Sửa kiểu dữ liệu trong bảng `ai_knowledge_base`:
```prisma
model ai_knowledge_base {
  id                    String                 @id @default(uuid()) @db.Uuid
  rule_title            String                 @db.VarChar(255)
  rule_content          String
  embedding_vector      Unsupported("vector(384)")?  // ĐỔI DÒNG NÀY
  // ... các trường khác giữ nguyên
}
```

**Bước 3: Cập nhật DB**
- Chạy lệnh: `npx prisma db push` để đẩy cấu trúc mới lên Supabase.

---

## GIAI ĐOẠN 3: XÂY DỰNG DATA PIPELINE TẠI THƯ MỤC `backend/nodejs/scripts`
Thay vì nhét code sinh Vector bừa bãi vào Server chính, bạn sẽ viết các Tool chạy tay tại folder scripts để nạp dữ liệu.

**Bước 1: Viết hàm nhúng Vector (Embedder)**
- Tạo file `backend/nodejs/utils/embedder.js`.
- Ý nghĩa: Hàm này dùng `@xenova/transformers` tải model `all-MiniLM-L6-v2` về RAM và biến Text thành mảng 384 số.
```javascript
import { pipeline } from '@xenova/transformers';

let extractor;
export async function getVector(text) {
  if (!extractor) {
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data); // Trả về mảng 384 số thập phân
}
```

**Bước 2: Viết Script Nạp dữ liệu (Seeder)**
- Tạo file `backend/nodejs/scripts/seed_knowledge.js`.
- Bạn có thể viết 1 script đọc file JSON chứa đáp án các câu hỏi phỏng vấn. Nó sẽ gọi hàm `getVector` ở file utils, sau đó gọi Prisma Insert thẳng vào bảng `ai_knowledge_base`. Script này bạn chỉ cần chạy tay 1 lần (kiểu lệnh `node scripts/seed_knowledge.js`).

---

## GIAI ĐOẠN 4: VIẾT API TẠI `backend/nodejs`
Đây là phần cốt lõi để kết nối với Frontend.

**Bước 1: Viết AI Service**
- Tạo file `backend/nodejs/services/ai.service.js`. Tại đây chứa 3 hàm chính:
  1. `analyzeDrawing(imageUrl)`: Gọi API Groq (dùng model `llama-3.2-90b-vision-preview`), truyền URL ảnh vào, yêu cầu Groq trả về JSON 4 thông số.
  2. `searchKnowledge(userMessage)`: Gọi `getVector(userMessage)` để biến câu hỏi của khách thành mảng số. Sau đó dùng lệnh RAW SQL của Prisma để tìm kiến thức giống nhất trong Supabase: 
     *Lệnh SQL mẫu: `SELECT rule_content FROM ai_knowledge_base ORDER BY embedding_vector <=> $1 LIMIT 3;`*
  3. `chatWithAI(sessionId, userMessage)`: Luồng RAG hoàn chỉnh.
     - Đầu tiên: Gọi hàm `searchKnowledge(userMessage)` để lấy 3 luật liên quan nhất.
     - Sau đó: Nối 3 luật này vào cái System Prompt (Ví dụ: "Mày là tư vấn viên. Dưới đây là luật của xưởng: [Luật 1], [Luật 2]. Hãy trả lời câu hỏi của khách: [userMessage]").
     - Cuối cùng: Gửi nguyên cục Prompt đó lên Groq API (`llama-3.1-70b-versatile`) và trả response về cho Frontend.

**Bước 2: Mở Router & Controller**
- Tạo `controllers/ai.controller.js` gọi hàm từ Service.
- Thêm Route vào `routes/ai.routes.js` (Ví dụ: `POST /api/ai/chat`).

---

## GIAI ĐOẠN 5: GẮN VÀO FRONTEND (REACT)
**Bước 1: Form upload ảnh**
- Cập nhật `CustomQuoteForm.jsx`. Khi khách chọn ảnh, đẩy ảnh lên Backend. Backend gọi `analyzeDrawing` trả về JSON `{"length": 200, "width": 100}`.
- Dùng `setState` gán thẳng vào các input để tạo hiệu ứng Auto-fill.

**Bước 2: Giao diện Chat**
- Tạo `FloatingChat.jsx` (Dùng màu Xanh Blue chủ đạo).
- Gọi API `POST /api/ai/chat`. Lưu mảng tin nhắn vào State để hiển thị dạng hội thoại.

---
**TỔNG KẾT:** Bạn cứ code theo trình tự 5 GIAI ĐOẠN này là không bao giờ bị rối. Giai đoạn 1 & 2 làm nền móng -> Giai đoạn 3 là bơm máu (Kiến thức) cho AI -> Giai đoạn 4 là tạo não bộ xử lý -> Giai đoạn 5 là khoác áo giao diện.
