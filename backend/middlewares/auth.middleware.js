const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // Lấy token từ Header

  if (!token)
    return res
      .status(403)
      .json({ message: "Không có thẻ thông hành (Token)!" });

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err)
      return res
        .status(401)
        .json({ message: "Thẻ hết hạn hoặc không hợp lệ!" });
    req.user = decoded;
    next(); // Thẻ đúng, cho đi tiếp vào Controller
  });
};
  