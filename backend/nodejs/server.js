const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// CREATE PORT OR GATES HERE (Thêm fallback 5000 nếu env chưa kịp nhận)
const Port = process.env.PORT || 5000;

// Place to import ROUTES
const materialRoutes = require("./routes/material.routes.js");
const authRoutes = require("./routes/auth.routes.js");
const productRoutes = require("./routes/product.routes.js");
const categoryRoutes = require("./routes/category.routes.js");
const importRoutes = require("./routes/import.routes.js");
app.use(cors());
app.use(express.json());

// Place to use ROUTES
app.use("/api/materials", materialRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/imports", importRoutes);
// Route mặc định kiểm tra trạng thái server
app.get("/", (req, res) => {
  res.send(" KPM BACKEND IS RUNNING ");
});

app.listen(Port, () => {
  console.log(` Server is running on port ${Port}`);
});
