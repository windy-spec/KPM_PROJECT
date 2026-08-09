# HƯỚNG DẪN CÀI ĐẶT VÀ KHỞI CHẠY DỰ ÁN KPM

Kính gửi Thầy/Cô, dưới đây là hướng dẫn chi tiết để khởi chạy dự án KPM trên máy cá nhân.
Dự án sử dụng kiến trúc phân tán với Backend (Node.js/Express) và Frontend (React/Vite).

## 1. Yêu cầu hệ thống
- Máy tính cần cài đặt sẵn **Node.js** (Khuyến nghị phiên bản 18.x trở lên).
- Link tải Node.js (nếu chưa có): https://nodejs.org/

> **Lưu ý quan trọng về Database:** Toàn bộ Cơ sở dữ liệu (PostgreSQL) đã được nhóm host online trên **Supabase**. Thầy/Cô **KHÔNG CẦN** phải cài đặt PostgreSQL hay import file SQL thủ công ở dưới local. Các cấu hình API Key (Momo, VNPay, AI Groq, Cloudinary) cũng đã được setup sẵn.

---

## 2. Các bước khởi chạy dự án

Sau khi giải nén file `.rar`, Thầy/Cô vui lòng mở thư mục gốc của dự án `KPM` và thực hiện theo 2 bước sau:

### BƯỚC 1: Khởi chạy Backend (Server)
1. Mở Terminal (Command Prompt hoặc PowerShell) tại thư mục giải nén.
2. Di chuyển vào thư mục `backend`:
   ```bash
   cd backend
   ```
3. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```
4. Khởi chạy Server Backend:
   ```bash
   npm run dev
   ```
   *Thành công: Terminal sẽ báo `Server running on port 5000`.*

### BƯỚC 2: Khởi chạy Frontend (Giao diện người dùng)
1. Mở **THÊM MỘT** cửa sổ Terminal mới (giữ nguyên cửa sổ Terminal của Backend đang chạy).
2. Di chuyển vào thư mục `frontend`:
   ```bash
   cd frontend
   ```
3. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```
4. Khởi chạy giao diện Frontend:
   ```bash
   npm run dev
   ```
   *Thành công: Terminal sẽ hiển thị đường link local (thường là `http://localhost:5173`).*

---

## 3. Truy cập Hệ thống
- Sau khi cả 2 Terminal đều đang chạy, Thầy/Cô mở trình duyệt (Chrome/Edge/Safari) và truy cập vào đường link Frontend:
  👉 **http://localhost:5173**

---

## 4. Tài khoản truy cập tham khảo
*(Sinh viên tự điền thêm tài khoản Admin/Khách hàng vào đây để Giáo viên dễ test)*
- **Tài khoản Admin:**
  - Username: 
  - Password: 

- **Tài khoản Khách hàng (User):**
  - Username: 
  - Password: 

***

*Nếu gặp vấn đề trong quá trình `npm install`, Thầy/Cô vui lòng kiểm tra lại kết nối mạng hoặc thử chạy lại câu lệnh.* Chúc Thầy/Cô trải nghiệm hệ thống mượt mà!
