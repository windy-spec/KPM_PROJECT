import React, { createContext, useState, useContext, useEffect } from "react";
import aiService from "../services/ai.service";

const AIChatContext = createContext();

export const AIChatProvider = ({ children }) => {
  const defaultMessages = [
    {
      role: "assistant",
      content:
        "Dạ em chào anh/chị ạ! Em là AI trợ lý của Xưởng Cơ Khí KPM. Anh/chị cần tư vấn báo giá hay bóc tách bản vẽ thì cứ gửi em nhé!",
      type: "text",
    },
  ];

  const [messages, setMessages] = useState(defaultMessages);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  // States cho History Slide-over
  const [sessions, setSessions] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const toggleChat = () => setIsChatOpen(!isChatOpen);
  const toggleHistory = () => {
    setIsHistoryOpen(!isHistoryOpen);
    if (!isHistoryOpen) {
      fetchSessions();
    }
  };

  const startNewChat = () => {
    setSessionId(null);
    setMessages(defaultMessages);
    setIsHistoryOpen(false);
  };

  const fetchSessions = async () => {
    // 1. Chặn ngay từ cửa nếu là khách vãng lai (không có token)
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setSessions([]); // Reset mảng lịch sử về rỗng
      return; // Dừng hàm, không gọi API để tránh lỗi 401 đỏ console
    }

    // 2. Nếu có token (đã đăng nhập) thì mới gọi API
    try {
      const res = await aiService.getSessions();
      console.log("Fetch Sessions API Response:", res);
      setSessions(res.data || []);
    } catch (error) {
      console.error("Lỗi lấy lịch sử AI:", error);
    }
  };

  const loadSession = async (id) => {
    try {
      setIsTyping(true);
      const res = await aiService.getSessionDetails(id);

      const loadedMessages = [];
      res.data?.messages?.forEach((msg) => {
        loadedMessages.push({
          role: msg.sender_type === "user" ? "user" : "assistant",
          content: msg.message_text,
          type: "text",
        });

        //
        if (msg.ai_drawing_analyses) {
          const draw = msg.ai_drawing_analyses;

          // 1. CHÈN THÊM ẢNH GỐC VÀO TRƯỚC FORM BẢN VẼ
          loadedMessages.push({
            role: "user",
            content: "Nhờ AI phân tích bản vẽ này giúp.",
            type: "image",
            imageUrl: draw.image_url, // Link ảnh lấy từ DB
          });

          // 2. Chèn form thông số (Code cũ của bro)
          loadedMessages.push({
            role: "assistant",
            content: "Thông số bản vẽ đã phân tích:",
            type: "drawing_form",
            specs: draw.specifications,
            drawingName: draw.drawing_name,
            scaleRatio: draw.scale_ratio,
            analysisId: draw.id,
          });
        }
      });

      setMessages(loadedMessages.length > 0 ? loadedMessages : defaultMessages);
      setSessionId(id);
      setIsHistoryOpen(false); // Đóng slide-over
    } catch (error) {
      console.error("Lỗi load phiên chat:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const sendMessage = async (text, mode = "auto", file = null) => {
    if (!text.trim() && !file) return;

    let displayImageUrl = null;
    let backendImageUrl = null;

    if (file) {
      if (typeof file === "string") {
        displayImageUrl = file;
        backendImageUrl = file;
      } else {
        displayImageUrl = URL.createObjectURL(file);
      }
    }

    const userMessage = {
      role: "user",
      content: text,
      type: "text",
      imageUrl: displayImageUrl,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(file ? "image" : "text");

    try {
      if (file && typeof file !== "string") {
        const uploadRes = await aiService.uploadDrawing(file);
        backendImageUrl = uploadRes.data?.imageUrl;
      }

      const res = await aiService.chat(text, sessionId, mode, backendImageUrl);
      const apiData = res.data;

      if (apiData?.sessionId && !sessionId) {
        setSessionId(apiData.sessionId);
      }

      const aiMessage = {
        role: "assistant",
        content: apiData?.reply || "Dạ em nghe ạ.",
        type: "text",
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Lỗi chat AI:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Dạ hệ thống AI đang bận hoặc bảo trì, anh/chị vui lòng thử lại sau giây lát nhé ạ.",
          type: "text",
          isError: true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <AIChatContext.Provider
      value={{
        messages,
        isChatOpen,
        isTyping,
        sessionId,
        sessions,
        isHistoryOpen,
        toggleChat,
        toggleHistory,
        startNewChat,
        loadSession,
        sendMessage,
      }}
    >
      {children}
    </AIChatContext.Provider>
  );
};

export const useAIChat = () => {
  return useContext(AIChatContext);
};
