import React, { useRef, useEffect, useState } from 'react';
import { useAIChat } from '../../context/AIChatContext';
import { Send, Paperclip, X, Image as ImageIcon, Cpu, Loader2, Link as LinkIcon } from 'lucide-react';

const ChatWindow = () => {
  const { messages, isChatOpen, toggleChat, sendMessage, uploadAndAnalyzeDrawing, analyzeOnlineDrawing, isTyping } = useAIChat();
  const [text, setText] = useState('');
  const [mode, setMode] = useState('auto');
  const fileInputRef = useRef(null);
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isChatOpen) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (text.trim()) {
      sendMessage(text, mode);
      setText('');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAndAnalyzeDrawing(file);
    }
    e.target.value = null;
  };

  const handleLinkClick = () => {
    const url = window.prompt("Nhập đường link hình ảnh bản vẽ từ Internet (VD: https://domain.com/image.jpg):");
    if (url && url.trim()) {
      analyzeOnlineDrawing(url.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const formatSpec = (val) => {
    if (!val) return '___';
    let cleaned = String(val).replace(/^[:\s-]+/, '').trim();
    if (!cleaned || cleaned.toLowerCase().includes('not') || cleaned.toLowerCase() === 'null' || cleaned.toLowerCase() === 'n/a') {
      return '___';
    }
    return cleaned;
  };

  const renderFormattedText = (textStr) => {
    if (!textStr) return null;
    const parts = textStr.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="fixed bottom-24 right-6 w-[380px] h-[600px] max-h-[80vh] bg-surface rounded-2xl shadow-2xl flex flex-col overflow-hidden z-[999] border border-outline-variant flex-shrink-0 animate-in slide-in-from-bottom-5 fade-in duration-300">
      {/* Header */}
      <div className="bg-primary text-white px-4 py-3 flex justify-between items-center shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shadow-inner">
            <Cpu size={20} className="text-on-primary-container" />
          </div>
          <div>
            <h3 className="font-bold text-sm">KPM AI Assistant</h3>
            <p className="text-[10px] text-white/80 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
              Đang trực tuyến
            </p>
          </div>
        </div>
        <button onClick={toggleChat} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Mode Selector */}
      <div className="bg-surface-variant px-3 py-2 flex justify-center gap-3 border-b border-outline-variant text-xs shadow-sm z-0">
        <label className="flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors">
          <input type="radio" name="aiMode" value="auto" checked={mode === 'auto'} onChange={() => setMode('auto')} className="accent-primary" />
          <span className="font-medium">Tự động</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors">
          <input type="radio" name="aiMode" value="fast" checked={mode === 'fast'} onChange={() => setMode('fast')} className="accent-primary" />
          <span className="font-medium">Nhanh (8B)</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors">
          <input type="radio" name="aiMode" value="slow" checked={mode === 'slow'} onChange={() => setMode('slow')} className="accent-primary" />
          <span className="font-medium">Chuyên sâu (70B)</span>
        </label>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-background scroll-smooth">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm ${
                isUser 
                  ? 'bg-primary text-white rounded-tr-sm' 
                  : msg.isError 
                    ? 'bg-error/10 text-error rounded-tl-sm border border-error/20'
                    : 'bg-white text-on-surface border border-outline-variant rounded-tl-sm'
              }`}>
                {msg.type === 'text' && (
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {renderFormattedText(msg.content)}
                  </div>
                )}

                {msg.type === 'image_uploading' && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">{msg.content}</div>
                    <div className="relative w-full h-32 bg-black/10 rounded-lg overflow-hidden flex items-center justify-center border border-white/20">
                        {msg.previewUrl ? (
                            <img src={msg.previewUrl} alt="preview" className="w-full h-full object-cover opacity-50 blur-[2px]" />
                        ) : (
                            <ImageIcon className="animate-pulse text-white/50" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="animate-spin text-white drop-shadow-md" size={32} />
                        </div>
                    </div>
                  </div>
                )}

                {msg.type === 'image' && (
                  <div className="space-y-2">
                    <div className="text-sm">{msg.content}</div>
                    <img src={msg.imageUrl} alt="Uploaded drawing" className="rounded-lg max-h-48 object-contain border border-white/20 shadow-sm bg-white" />
                  </div>
                )}

                {msg.type === 'drawing_form' && (
                  <div className="space-y-3">
                    <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                    <div className="bg-surface rounded-xl p-3 shadow-inner border border-outline-variant text-on-surface">
                      <h4 className="font-bold text-primary mb-2 text-center text-sm border-b border-outline-variant pb-2">
                        📋 Bản vẽ: <span className="text-secondary">{msg.drawingName || 'Chưa xác định'}</span>
                      </h4>
                      <p className="text-center text-xs text-outline mb-3">Tỉ lệ: {msg.scaleRatio || 'N/A'}</p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center bg-white p-2 rounded border border-outline-variant">
                          <span className="font-semibold text-secondary">Chiều dài (L):</span>
                          <span className="font-mono bg-surface px-2 py-0.5 rounded text-primary">{formatSpec(msg.specs?.length)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-white p-2 rounded border border-outline-variant">
                          <span className="font-semibold text-secondary">Chiều rộng (W):</span>
                          <span className="font-mono bg-surface px-2 py-0.5 rounded text-primary">{formatSpec(msg.specs?.width)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-white p-2 rounded border border-outline-variant">
                          <span className="font-semibold text-secondary">Chiều cao (H):</span>
                          <span className="font-mono bg-surface px-2 py-0.5 rounded text-primary">{formatSpec(msg.specs?.height)}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex gap-2">
                         <button className="flex-1 bg-primary text-white py-2 rounded-lg text-xs font-bold hover:bg-primary-container transition-colors shadow-sm flex items-center justify-center gap-1">
                            <span>Lưu & Báo Giá</span>
                         </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-outline-variant text-on-surface rounded-2xl rounded-tl-sm px-4 py-3.5 shadow-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 bg-white border-t border-outline-variant shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <form onSubmit={handleSend} className="flex items-end gap-2">
          {/* Nút Đính Kèm Link (Mới) */}
          <button 
            type="button" 
            onClick={handleLinkClick}
            className="p-2.5 text-secondary hover:text-primary hover:bg-secondary-container rounded-full transition-colors flex-shrink-0 bg-surface-variant"
            title="Đính kèm link bản vẽ trên mạng"
          >
            <LinkIcon size={18} />
          </button>

          {/* Nút Đính Kèm File */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-secondary hover:text-primary hover:bg-secondary-container rounded-full transition-colors flex-shrink-0 bg-surface-variant"
            title="Tải ảnh bản vẽ lên"
          >
            <Paperclip size={18} />
          </button>
          
          <div className="flex-1 relative bg-surface-variant rounded-2xl border border-transparent overflow-hidden flex items-center focus-within:border-primary focus-within:bg-white transition-all">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn..."
              className="w-full max-h-32 min-h-[40px] py-2.5 px-3 resize-none bg-transparent outline-none text-sm text-on-surface"
              rows={1}
            />
          </div>

          <button 
            type="submit" 
            disabled={!text.trim() && !isTyping}
            className={`p-2.5 rounded-full flex-shrink-0 transition-all ${
              text.trim() && !isTyping 
                ? 'bg-primary text-white shadow-md hover:bg-primary-container active:scale-95' 
                : 'bg-surface-variant text-outline-variant cursor-not-allowed'
            }`}
          >
            <Send size={18} className={text.trim() ? 'translate-x-0.5' : ''} />
          </button>
        </form>
        <div className="text-center mt-2 text-[10px] text-outline">
          AI có thể mắc sai sót. Vui lòng kiểm tra lại kích thước trước khi báo giá.
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
