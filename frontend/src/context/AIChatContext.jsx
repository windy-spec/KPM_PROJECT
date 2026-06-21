import React, { createContext, useState, useContext } from 'react';
import aiService from '../services/ai.service';

const AIChatContext = createContext();

export const AIChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Dạ em chào anh/chị ạ! Em là AI trợ lý của Xưởng Cơ Khí KPM. Anh/chị cần tư vấn báo giá hay bóc tách bản vẽ thì cứ gửi em nhé!',
      type: 'text'
    }
  ]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const toggleChat = () => setIsChatOpen(!isChatOpen);

  const sendMessage = async (text, mode = 'auto') => {
    if (!text.trim()) return;

    const userMessage = { role: 'user', content: text, type: 'text' };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const res = await aiService.chat(text, sessionId, mode);
      
      // Axios trả về res là body của server: { success: true, data: { sessionId, reply } }
      const apiData = res.data;

      if (apiData?.sessionId && !sessionId) {
        setSessionId(apiData.sessionId);
      }
      
      const aiMessage = { role: 'assistant', content: apiData?.reply || 'Dạ em nghe ạ.', type: 'text' };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Lỗi chat AI:', error);
      const errorMessage = { 
        role: 'assistant', 
        content: 'Dạ hệ thống AI đang bận hoặc bảo trì, anh/chị vui lòng thử lại sau giây lát nhé ạ.', 
        type: 'text',
        isError: true 
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const uploadAndAnalyzeDrawing = async (file) => {
    const previewUrl = URL.createObjectURL(file);
    const uploadingMsgId = Date.now();
    
    const userFileMsg = { 
        id: uploadingMsgId,
        role: 'user', 
        content: 'Đang gửi bản vẽ...', 
        type: 'image_uploading',
        previewUrl: previewUrl
    };
    setMessages((prev) => [...prev, userFileMsg]);
    setIsTyping(true);

    try {
      const uploadRes = await aiService.uploadDrawing(file);
      // Backend format: { success, data: { imageUrl, messageId } }
      const imageUrl = uploadRes.data?.imageUrl;

      setMessages((prev) => prev.map(msg => 
        msg.id === uploadingMsgId 
          ? { role: 'user', content: 'Nhờ AI phân tích bản vẽ này giúp.', type: 'image', imageUrl: imageUrl }
          : msg
      ));

      const analyzeRes = await aiService.analyzeDrawing(imageUrl, uploadRes.data?.messageId || null);
      // Backend format: { success, data: { id, drawingName, scaleRatio, dimensions } }
      const analysisData = analyzeRes.data;

      const aiFormMsg = {
          role: 'assistant',
          content: 'Dạ em đã đọc xong bản vẽ! Dưới đây là các thông số em trích xuất được. Anh/chị xem và điền thêm số lượng để em báo giá nhé:',
          type: 'drawing_form',
          specs: analysisData?.dimensions,
          drawingName: analysisData?.drawingName,
          scaleRatio: analysisData?.scaleRatio,
          analysisId: analysisData?.id
      };
      
      setMessages((prev) => [...prev, aiFormMsg]);

    } catch (error) {
        console.error('Lỗi khi bóc tách bản vẽ:', error);
        setMessages((prev) => prev.filter(msg => msg.id !== uploadingMsgId));
        setMessages((prev) => [...prev, {
            role: 'assistant',
            content: 'Dạ hệ thống AI Vision đang gặp sự cố khi đọc ảnh, anh/chị thử lại file rõ nét hơn nhé ạ!',
            type: 'text',
            isError: true
        }]);
    } finally {
        setIsTyping(false);
        URL.revokeObjectURL(previewUrl);
    }
  };

  const analyzeOnlineDrawing = async (imageUrl) => {
    if (!imageUrl) return;
    
    const uploadingMsgId = Date.now();
    const userFileMsg = { 
        id: uploadingMsgId,
        role: 'user', 
        content: 'Đang tải bản vẽ từ link mạng...', 
        type: 'image_uploading',
        previewUrl: imageUrl
    };
    setMessages((prev) => [...prev, userFileMsg]);
    setIsTyping(true);

    try {
      setMessages((prev) => prev.map(msg => 
        msg.id === uploadingMsgId 
          ? { role: 'user', content: 'Nhờ AI phân tích bản vẽ từ link này.', type: 'image', imageUrl: imageUrl }
          : msg
      ));

      const analyzeRes = await aiService.analyzeDrawing(imageUrl, null);
      const analysisData = analyzeRes.data;

      const aiFormMsg = {
          role: 'assistant',
          content: 'Dạ em đã đọc xong bản vẽ từ link! Dưới đây là các thông số em trích xuất được:',
          type: 'drawing_form',
          specs: analysisData?.dimensions,
          drawingName: analysisData?.drawingName,
          scaleRatio: analysisData?.scaleRatio,
          analysisId: analysisData?.id
      };
      
      setMessages((prev) => [...prev, aiFormMsg]);

    } catch (error) {
        console.error('Lỗi khi bóc tách bản vẽ online:', error);
        setMessages((prev) => prev.filter(msg => msg.id !== uploadingMsgId));
        setMessages((prev) => [...prev, {
            role: 'assistant',
            content: 'Dạ link ảnh không đọc được hoặc lỗi hệ thống, anh/chị kiểm tra lại link nhé!',
            type: 'text',
            isError: true
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
        toggleChat,
        sendMessage,
        uploadAndAnalyzeDrawing,
        analyzeOnlineDrawing, // Hàm mới
      }}
    >
      {children}
    </AIChatContext.Provider>
  );
};

export const useAIChat = () => {
  return useContext(AIChatContext);
};
