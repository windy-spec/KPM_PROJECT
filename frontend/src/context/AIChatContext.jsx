import React, { createContext, useState, useContext, useEffect } from 'react';
import aiService from '../services/ai.service';

const AIChatContext = createContext();

export const AIChatProvider = ({ children }) => {
  const defaultMessages = [
    {
      role: 'assistant',
      content: 'Dạ em chào anh/chị ạ! Em là AI trợ lý của Xưởng Cơ Khí KPM. Anh/chị cần tư vấn báo giá hay bóc tách bản vẽ thì cứ gửi em nhé!',
      type: 'text'
    }
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
      res.data?.messages?.forEach(msg => {
        loadedMessages.push({
          role: msg.sender_type === 'user' ? 'user' : 'assistant',
          content: msg.message_text,
          type: 'text'
        });

        // Load drawing analyses nếu có
        if (msg.ai_drawing_analyses && msg.ai_drawing_analyses.length > 0) {
          msg.ai_drawing_analyses.forEach(draw => {
            loadedMessages.push({
              role: 'assistant',
              content: 'Thông số bản vẽ đã phân tích:',
              type: 'drawing_form',
              specs: draw.specifications,
              drawingName: draw.drawing_name,
              scaleRatio: draw.scale_ratio,
              analysisId: draw.id
            });
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

  const sendMessage = async (text, mode = 'auto') => {
    if (!text.trim()) return;

    const userMessage = { role: 'user', content: text, type: 'text' };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const res = await aiService.chat(text, sessionId, mode);
      const apiData = res.data;

      if (apiData?.sessionId && !sessionId) {
        setSessionId(apiData.sessionId);
      }
      
      const aiMessage = { role: 'assistant', content: apiData?.reply || 'Dạ em nghe ạ.', type: 'text' };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Lỗi chat AI:', error);
      setMessages((prev) => [...prev, { 
        role: 'assistant', 
        content: 'Dạ hệ thống AI đang bận hoặc bảo trì, anh/chị vui lòng thử lại sau giây lát nhé ạ.', 
        type: 'text',
        isError: true 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const uploadAndAnalyzeDrawing = async (file) => {
    const previewUrl = URL.createObjectURL(file);
    const uploadingMsgId = Date.now();
    
    setMessages((prev) => [...prev, { 
        id: uploadingMsgId, role: 'user', content: 'Đang gửi bản vẽ...', 
        type: 'image_uploading', previewUrl: previewUrl
    }]);
    setIsTyping(true);

    try {
      const uploadRes = await aiService.uploadDrawing(file);
      const imageUrl = uploadRes.data?.imageUrl;

      setMessages((prev) => prev.map(msg => 
        msg.id === uploadingMsgId 
          ? { role: 'user', content: 'Nhờ AI phân tích bản vẽ này giúp.', type: 'image', imageUrl: imageUrl }
          : msg
      ));

      // BẮT BUỘC TRUYỀN sessionId để BE gắn vào
      const analyzeRes = await aiService.analyzeDrawing(imageUrl, sessionId);
      const analysisData = analyzeRes.data;

      // Cập nhật sessionId nếu đây là tin nhắn đầu tiên
      if (analysisData?.sessionId && !sessionId) {
        setSessionId(analysisData.sessionId);
      }

      setMessages((prev) => [...prev, {
          role: 'assistant',
          content: 'Dạ em đã đọc xong bản vẽ! Dưới đây là các thông số em trích xuất được. Anh/chị xem và điền thêm số lượng để em báo giá nhé:',
          type: 'drawing_form',
          specs: analysisData?.dimensions,
          drawingName: analysisData?.drawingName,
          scaleRatio: analysisData?.scaleRatio,
          analysisId: analysisData?.id
      }]);

    } catch (error) {
        console.error('Lỗi khi bóc tách bản vẽ:', error);
        setMessages((prev) => prev.filter(msg => msg.id !== uploadingMsgId));
        setMessages((prev) => [...prev, {
            role: 'assistant', content: 'Dạ hệ thống AI Vision đang gặp sự cố khi đọc ảnh, anh/chị thử lại file rõ nét hơn nhé ạ!', type: 'text', isError: true
        }]);
    } finally {
        setIsTyping(false);
        URL.revokeObjectURL(previewUrl);
    }
  };

  const analyzeOnlineDrawing = async (imageUrl) => {
    if (!imageUrl) return;
    
    const uploadingMsgId = Date.now();
    setMessages((prev) => [...prev, { 
        id: uploadingMsgId, role: 'user', content: 'Đang tải bản vẽ từ link mạng...', 
        type: 'image_uploading', previewUrl: imageUrl
    }]);
    setIsTyping(true);

    try {
      setMessages((prev) => prev.map(msg => 
        msg.id === uploadingMsgId 
          ? { role: 'user', content: 'Nhờ AI phân tích bản vẽ từ link này.', type: 'image', imageUrl: imageUrl }
          : msg
      ));

      // Truyền sessionId
      const analyzeRes = await aiService.analyzeDrawing(imageUrl, sessionId);
      const analysisData = analyzeRes.data;

      if (analysisData?.sessionId && !sessionId) {
        setSessionId(analysisData.sessionId);
      }

      setMessages((prev) => [...prev, {
          role: 'assistant',
          content: 'Dạ em đã đọc xong bản vẽ từ link! Dưới đây là các thông số em trích xuất được:',
          type: 'drawing_form',
          specs: analysisData?.dimensions,
          drawingName: analysisData?.drawingName,
          scaleRatio: analysisData?.scaleRatio,
          analysisId: analysisData?.id
      }]);

    } catch (error) {
        console.error('Lỗi khi bóc tách bản vẽ online:', error);
        setMessages((prev) => prev.filter(msg => msg.id !== uploadingMsgId));
        setMessages((prev) => [...prev, {
            role: 'assistant', content: 'Dạ link ảnh không đọc được hoặc lỗi hệ thống, anh/chị kiểm tra lại link nhé!', type: 'text', isError: true
        }]);
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
        uploadAndAnalyzeDrawing,
        analyzeOnlineDrawing,
      }}
    >
      {children}
    </AIChatContext.Provider>
  );
};

export const useAIChat = () => {
  return useContext(AIChatContext);
};
