# BẢN KẾ HOẠCH TỐI ƯU HỆ THỐNG AI CHATBOT
*(Giao thoa giữa Tư duy Hệ thống Toàn diện & Kỹ thuật Thực chiến Thực dụng)*

## 1. Đánh giá sự giao thoa (Điểm hay giữa 2 góc nhìn)
Sự kết hợp giữa **"Tầm nhìn đa kịch bản"** và **"Phòng thủ rủi ro kỹ thuật"** tạo ra một bản kế hoạch hoàn hảo. 
- **Điểm sáng 1:** Vẫn giữ được sự "Wow" của hệ thống (Hiển thị UI Rich Component, Multi-intent) nhưng không bắt con AI phải gánh vác việc xử lý logic JSON. AI chỉ tập trung làm việc nó giỏi nhất: Giao tiếp ngôn ngữ tự nhiên.
- **Điểm sáng 2:** Phân bổ nguồn lực thông minh. Thay vì dàn trải 10 kịch bản làm bề nổi, ta tập trung khoan sâu vào 2 kịch bản "sát thủ" để đảm bảo trải nghiệm Demo mượt mà không tì vết. Hệ thống sẽ có chiều sâu thực sự.

Dưới đây là Bảng Kế Hoạch Tối Ưu đã được đúc kết lại để bắt tay vào code ngay.

---

## 2. GIAI ĐOẠN 1: PHẠM VI MVP (CHỌN "TRÁI CÂY HÁI THẤP")
*Tập trung 100% hỏa lực vào 2 tính năng ấn tượng nhất để lấy điểm tuyệt đối. Các kịch bản khác đưa vào Lộ trình mở rộng.*

### 🎯 Kịch bản 1: Phân tích Bản vẽ/Hình ảnh (Vision AI)
- **Luồng:** Khách upload ảnh phác thảo/bản vẽ -> AI (mô hình Vision) nhận diện kích thước, loại cửa -> Bóc tách thông số kỹ thuật.
- **Kết quả:** AI trả về câu chữ phân tích chuyên sâu + Form Báo giá tạm tính. Gây ấn tượng mạnh về khả năng "đọc hiểu" bản vẽ kỹ thuật ngành cơ khí.

### 🎯 Kịch bản 2: Tìm kiếm và Bán chéo (Multi-intent Product Search)
- **Luồng:** Khách hỏi mẫu sản phẩm + Nêu vấn đề (VD: "Tìm lan can LC-05 cho ban công nhỏ").
- **Kết quả:** AI gọi Tool Backend. Backend trả về thông tin LC-05 + Gợi ý thêm LC-08 (phù hợp ban công hẹp).
- **Hiển thị:** Khung chat render ra 2 thẻ Product Card cực đẹp (UI Component) kèm lời dẫn dắt chốt sale mượt mà của AI.

---

## 3. GIAI ĐOẠN 2: KIẾN TRÚC KỸ THUẬT PHÒNG THỦ (DEFENSIVE ARCHITECTURE)
*Đây là chốt chặn sinh tử để dự án không bao giờ "crash" lúc demo.*

### 🛡️ Tầng 1: Backend "Làm thay" AI (Chống Prompt Bloat)
- **Vấn đề cũ:** Ép AI sinh ra cấu trúc JSON `[PRODUCT_WIDGET: [{"id":...}]]` dễ dẫn đến sai cú pháp khi dùng mô hình nhỏ (8B).
- **Giải pháp tối ưu:** 
  1. AI nhận diện ý định và gọi Tool tìm kiếm.
  2. **Backend (Node.js)** truy vấn Database (Prisma), lấy ra danh sách sản phẩm.
  3. **Chính Backend sẽ tự động build chuỗi string JSON chuẩn xác 100%**: `[PRODUCT_WIDGET: [{"id": "LC-05", "name": "Lan can kính", "image": "..."}]]`.
  4. Backend trả chuỗi này ngược lại cho AI như một phần của "Observation" (Kết quả Tool).
  5. Prompt của AI chỉ cần ghi: *"Hãy tư vấn dựa trên thông tin tao cung cấp. BẮT BUỘC chép nguyên si chuỗi [PRODUCT_WIDGET: ...] tao đưa xuống cuối câu trả lời của mày, không được sửa đổi một dấu phẩy nào."*

### 🛡️ Tầng 2: Frontend Bọc Thép (Chống Crash)
- **Cơ chế hoạt động:** React Component sẽ dùng Regex cắt phần `[PRODUCT_WIDGET: ...]` ra khỏi câu text cuối cùng của AI.
- **Phòng thủ Try-Catch:**
  ```javascript
  let widgetData = null;
  try {
      const match = text.match(/\[PRODUCT_WIDGET:\s*(.*?)\]/);
      if (match) {
          widgetData = JSON.parse(match[1]); // Parse chuỗi do Backend sinh ra (tỷ lệ lỗi ~0%)
      }
  } catch (error) {
      console.warn("Lỗi parse AI Widget, bỏ qua render Card:", error);
      widgetData = null; // Fallback: Bỏ qua widget
  }
  
  return (
      <div>
          <Markdown>{cleanedText}</Markdown>
          {/* Nếu parse thành công mới vẽ Card, lỗi thì thôi vẫn hiện Text bình thường */}
          {widgetData && <ProductCarousel data={widgetData} />}
      </div>
  )
  ```

---

## 4. GIAI ĐOẠN 3: LỘ TRÌNH MỞ RỘNG (FUTURE SCOPE)
*Dành cho báo cáo đồ án, khẳng định tư duy Hệ thống (System Architecture).*

- **Kịch bản Hậu mãi (CSKH):** Tích hợp Tool `trackOrder` để AI báo cáo tiến độ gia công sản phẩm (Đang sơn tĩnh điện, Đang lắp ráp).
- **Kịch bản Hỗ trợ Kỹ thuật:** Kết hợp RAG (Retrieval-Augmented Generation) để AI đọc cẩm nang bảo hành, hướng dẫn khách tự khắc phục cửa kêu, bản lề xệ.
- **Kịch bản Đặt hàng lại (Re-order):** Phân tích phong cách nội thất từ đơn hàng cũ của khách để gợi ý sản phẩm đồng bộ cho lần mua sau.

---
**=> KẾT LUẬN:** 
Với bản kế hoạch này, chúng ta vừa đảm bảo được "tính biểu diễn" xuất sắc (UI đẹp, AI thông minh tư vấn bán chéo, đọc hiểu bản vẽ), vừa đảm bảo được "sự an toàn tuyệt đối" về mặt kỹ thuật (Backend gánh logic JSON, Frontend bao bọc Try-catch). Không còn rủi ro sập app, không còn cảnh AI bị "ngáo". Sẵn sàng triển khai thực chiến!
