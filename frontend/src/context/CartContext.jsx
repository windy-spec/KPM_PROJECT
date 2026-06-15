import React, { createContext, useState, useEffect, useContext } from "react";
import cartService from "../services/cart.service";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState([]); // THÊM STATE LƯU ITEMS

  const fetchCartCount = async () => {
    try {
      const res = await cartService.getCart();
      const items = res.data?.cart_items || [];

      // Tính số lượng
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(totalQuantity);

      // LƯU CẢ DANH SÁCH ITEMS ĐỂ NAVBAR DÙNG
      setCartItems(items);
    } catch (error) {
      console.log("Chưa đăng nhập hoặc lỗi lấy giỏ hàng");
    }
  };

  useEffect(() => {
    fetchCartCount();
  }, []);

  return (
    // XUẤT THÊM cartItems RA NGOÀI
    <CartContext.Provider value={{ cartCount, cartItems, fetchCartCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
