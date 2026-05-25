const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Cấu hình kết nối Cloudinary bằng biến môi trường
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Setup kho chứa của Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "KPM_Products", // Tên thư mục nó sẽ tự tạo trên Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "webp"], // Chặn người dùng up file tào lao
    transformation: [{ width: 1000, crop: "limit" }], // Tự động nén nếu ảnh quá to (tối ưu load web)
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
