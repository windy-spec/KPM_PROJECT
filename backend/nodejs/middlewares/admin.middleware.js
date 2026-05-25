module.exports = (req, res, next) => {
  // Biến req.user đã được giải mã từ auth.middleware.js trước đó
  if (req.user && req.user.role === "ADMIN") {
    next(); // Đúng là Admin, cho phép qua cửa vào Controller
  } else {
    return res.status(403).json({
      success: false,
      message:
        "Truy cập bị từ chối. Chỉ tài khoản Admin mới được thực hiện thao tác này!",
    });
  }
};
