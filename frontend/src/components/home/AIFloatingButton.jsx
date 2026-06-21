import React from 'react';
import { Bot, Sparkles, X } from 'lucide-react';
import Portal from '../common/Portal';
import { useAIChat } from '../../context/AIChatContext';

const AIFloatingButton = () => {
  const { isChatOpen, toggleChat } = useAIChat();

  return (
    <Portal>
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4 pointer-events-none">
        {/* Tin nhắn chào mời từ AI (Tooltip) */}
        {!isChatOpen && (
          <div className="bg-white border border-primary/20 shadow-2xl p-4 rounded-2xl max-w-[240px] relative animate-bounce flex flex-col gap-2">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase">
            <Sparkles className="w-3 h-3" />
            <span>KPM AI Assistant</span>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Chào bạn! Tôi có thể giúp bạn <b>tính giá nhanh</b> hoặc <b>tư vấn vật liệu</b> phù hợp.
          </p>
            {/* Mũi tên của tooltip */}
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-r border-b border-primary/20 rotate-45"></div>
          </div>
        )}

        {/* Nút bấm chính */}
        <button 
          onClick={toggleChat}
          className="w-16 h-16 bg-primary rounded-full shadow-[0_0_20px_rgba(0,101,101,0.4)] flex items-center justify-center group hover:scale-110 transition-all active:scale-95 border-4 border-white pointer-events-auto"
        >
          {isChatOpen ? (
             <X className="w-8 h-8 text-on-primary transition-transform" />
          ) : (
             <Bot className="w-8 h-8 text-on-primary group-hover:rotate-12 transition-transform" />
          )}
        </button>
      </div>
    </Portal>
  );
};

export default AIFloatingButton;