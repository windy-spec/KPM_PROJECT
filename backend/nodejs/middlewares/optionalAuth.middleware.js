const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    req.user = null; // Khách vãng lai
    return next();
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      req.user = null; // Token lỗi hoặc hết hạn thì coi như khách
    } else {
      req.user = decoded; // User đã đăng nhập
    }
    next();
  });
};
