const express = require("express");
const cors = require("cors");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");

// Khởi chạy các tác vụ chạy ngầm (Cron Jobs)
require("./cron/importCleanup.cron");
const app = express();

const server = http.createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
  } 
});

// Quản lý Socket
io.on("connection", (socket) => {
  console.log("Client connected to Socket:", socket.id);

  socket.on("join", (data) => {
    if (data?.role === "admin" || data?.role === "superadmin") {
      socket.join("room_admin");
      console.log(`Socket ${socket.id} joined room_admin`);
    }
    if (data?.user_id) {
      socket.join(`room_user_${data.user_id}`);
      console.log(`Socket ${socket.id} joined room_user_${data.user_id}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Gắn io vào biến toàn cục để truy cập từ các Service
global.io = io;

// CREATE PORT OR GATES HERE (Thêm fallback 5000 nếu env chưa kịp nhận)
const Port = process.env.PORT || 5000;

// Place to import ROUTES
const materialRoutes = require("./routes/material.routes.js");
const authRoutes = require("./routes/auth.routes.js");
const productRoutes = require("./routes/product.routes.js");
const categoryRoutes = require("./routes/category.routes.js");
const importRoutes = require("./routes/import.routes.js");
const quotationRoutes = require("./routes/quotation.routes.js");
const materialTypeRoutes = require("./routes/material_type.routes.js");
const materialUnitRoutes = require("./routes/material_unit.routes.js");
const materialThicknessRoutes = require("./routes/material_thickness.routes.js");
const paint_typeRoutes = require("./routes/paint_type.routes.js");
const laborRoutes = require("./routes/labor.routes.js");
const cartRoutes = require("./routes/cart.routes.js");
const paymentRoutes = require("./routes/payment.routes.js");
const invoiceRoutes = require("./routes/invoice.routes.js");
const orderRoutes = require("./routes/order.routes.js");
const adminRoutes = require("./routes/admin.routes.js");
const userRoutes = require("./routes/user.routes.js");
app.use(cors());
app.use(express.json());

// Place to use ROUTES
app.use("/api/materials", materialRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/imports", importRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/material-types", materialTypeRoutes);
app.use("/api/material-units", materialUnitRoutes);
app.use("/api/material-thickness", materialThicknessRoutes);
app.use("/api/paint-types", paint_typeRoutes);
app.use("/api/labor", laborRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
// Route mặc định kiểm tra trạng thái server
app.get("/", (req, res) => {
  res.send(" KPM BACKEND IS RUNNING ");
});

server.listen(Port, () => {
  console.log(` Server is running on port ${Port}`);
});
