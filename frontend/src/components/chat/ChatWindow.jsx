import React, { useRef, useEffect, useState } from "react";
import { useAIChat } from "../../context/AIChatContext";
import {
  Send,
  Paperclip,
  X,
  Image as ImageIcon,
  Cpu,
  Loader2,
  Link as LinkIcon,
  History,
  MessageSquareCode,
  FileText,
  Ruler,
  Edit3,
  CheckCircle2,
} from "lucide-react";

const ChatWindow = () => {
  const {
    messages,
    isChatOpen,
    isTyping,
    toggleChat,
    sendMessage,
    uploadAndAnalyzeDrawing,
    analyzeOnlineDrawing,
    sessions,
    isHistoryOpen,
    toggleHistory,
    startNewChat,
    loadSession,
  } = useAIChat();

  const [text, setText] = useState("");
  const [mode, setMode] = useState("auto");
  const fileInputRef = useRef(null);
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  if (!isChatOpen) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (text.trim()) {
      sendMessage(text, mode);
      setText("");
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
    const url = window.prompt(
      "Nhập đường link hình ảnh bản vẽ từ Internet (VD: https://domain.com/image.jpg):",
    );
    if (url && url.trim()) {
      analyzeOnlineDrawing(url.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const formatSpec = (val) => {
    if (!val) return "___";
    let cleaned = String(val)
      .replace(/^[:\s-]+/, "")
      .trim();
    if (
      !cleaned ||
      cleaned.toLowerCase().includes("not") ||
      cleaned.toLowerCase() === "null" ||
      cleaned.toLowerCase() === "n/a"
    ) {
      return "___";
    }

    // Tự động định dạng đơn vị m hoặc mm
    const numMatch = cleaned.match(/^[\d.,]+$/);
    if (numMatch) {
      const num = parseFloat(cleaned.replace(/,/g, ''));
      if (!isNaN(num)) {
        if (num >= 1000) {
          return `${(num / 1000).toLocaleString("vi-VN")} m`;
        } else {
          return `${num.toLocaleString("vi-VN")} mm`;
        }
      }
    }

    return cleaned;
  };

  const renderFormattedText = (textStr) => {
    if (!textStr) return null;
    const parts = textStr.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="fixed bottom-24 right-6 w-[400px] h-[650px] max-h-[85vh] bg-surface rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden z-[999] border border-outline-variant/50 flex-shrink-0 animate-in slide-in-from-bottom-8 zoom-in-95 duration-300 ease-out">
      {/* Slide-over History Panel */}
      <div
        className={`absolute inset-0 bg-surface z-20 flex flex-col transition-transform duration-300 ease-in-out ${isHistoryOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="bg-primary text-white px-5 py-4 flex justify-between items-center shadow-md shrink-0">
          <h3 className="font-bold text-base flex items-center gap-2">
            <History size={18} /> Lịch sử tư vấn
          </h3>
          <button
            onClick={toggleHistory}
            className="p-1 hover:bg-white/20 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
          <button
            onClick={startNewChat}
            className="w-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 p-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <MessageSquareCode size={18} /> Bắt đầu trò chuyện mới
          </button>

          <div className="mt-4">
            <h4 className="text-xs font-bold text-outline uppercase tracking-wider mb-3 px-1">
              Các phiên gần đây
            </h4>

            {/* THÊM LOGIC 3 NHÁNH Ở ĐÂY */}
            {!localStorage.getItem("accessToken") ? (
              // Nhánh 1: Khách vãng lai (Chưa đăng nhập)
              <div className="text-center bg-surface-variant/50 p-5 rounded-2xl border border-outline-variant/50 mt-6 shadow-inner">
                <div className="text-3xl mb-3 animate-bounce">🔒</div>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Anh/chị vui lòng{" "}
                  <a
                    href="/login"
                    className="text-primary font-bold hover:underline"
                  >
                    Đăng nhập
                  </a>{" "}
                  để lưu và xem lại các phiên báo giá nhé!
                </p>
              </div>
            ) : sessions.length === 0 ? (
              // Nhánh 2: User đã đăng nhập nhưng chưa chat lần nào
              <div className="text-center text-outline text-sm mt-10 font-medium">
                Chưa có lịch sử nào.
              </div>
            ) : (
              // Nhánh 3: User đã đăng nhập và có lịch sử (Giữ nguyên code map của bro)
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => loadSession(session.id)}
                    className="bg-white border border-outline-variant hover:border-primary/50 hover:shadow-md p-3.5 rounded-xl cursor-pointer transition-all text-left group"
                  >
                    <div className="font-bold text-sm text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                      {session.session_title}
                    </div>
                    <div className="text-[11px] text-outline mt-1.5 font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                      {new Date(session.started_at).toLocaleDateString("vi-VN")}{" "}
                      {new Date(session.started_at).toLocaleTimeString(
                        "vi-VN",
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-primary text-white px-5 py-4 flex justify-between items-center shadow-md z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shadow-inner backdrop-blur-sm border border-white/30">
            <Cpu size={22} className="text-on-primary-container" />
          </div>
          <div>
            <h3 className="font-bold text-base tracking-tight">
              KPM AI Assistant
            </h3>
            <p className="text-[11px] text-white/90 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
              Đang trực tuyến
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleHistory}
            title="Xem lịch sử trò chuyện"
            className="p-2 hover:bg-white/20 rounded-full transition-all active:scale-90"
          >
            <History size={20} />
          </button>
          <button
            onClick={toggleChat}
            className="p-2 hover:bg-white/20 rounded-full transition-all active:scale-90"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-background scroll-smooth">
        {messages.map((msg, index) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={index}
              className={`flex ${isUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                  isUser
                    ? "bg-primary text-white rounded-tr-sm shadow-primary/20"
                    : msg.isError
                      ? "bg-error/10 text-error rounded-tl-sm border border-error/20"
                      : "bg-white text-on-surface border border-outline-variant/60 rounded-tl-sm"
                }`}
              >
                {msg.type === "text" && (
                  <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
                    {renderFormattedText(msg.content)}
                  </div>
                )}

                {msg.type === "image_uploading" && (
                  <div className="space-y-3">
                    <div className="text-[15px] font-medium flex items-center gap-2">
                      <Loader2 className="animate-spin w-4 h-4" />
                      {msg.content}
                    </div>
                    <div className="relative w-full h-36 bg-black/5 rounded-xl overflow-hidden flex items-center justify-center border border-outline-variant/50">
                      {msg.previewUrl ? (
                        <img
                          src={msg.previewUrl}
                          alt="preview"
                          className="w-full h-full object-cover opacity-40 blur-sm scale-105"
                        />
                      ) : (
                        <ImageIcon
                          className="animate-pulse text-outline"
                          size={32}
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2
                          className="animate-spin text-primary drop-shadow-lg"
                          size={36}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {msg.type === "image" && (
                  <div className="space-y-2">
                    <div className="text-[15px]">{msg.content}</div>
                    <img
                      src={msg.imageUrl}
                      alt="Uploaded drawing"
                      className="rounded-xl max-h-52 object-contain border border-outline-variant/50 shadow-sm bg-white"
                    />
                  </div>
                )}

                {msg.type === "drawing_form" && (
                  <div className="space-y-3 w-full">
                    <div className="text-[14px] leading-relaxed whitespace-pre-wrap text-on-surface-variant mb-2">
                      {msg.content}
                    </div>

                    {/* Giao diện Bảng Thông Số Mới (Dạng Ticket) */}
                    <div className="bg-white rounded-2xl p-1 shadow-sm border border-outline-variant/60 overflow-hidden group">
                      {/* Header của Ticket */}
                      <div className="bg-primary/5 px-4 py-3 border-b border-outline-variant/50 flex items-start gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg text-primary mt-0.5">
                          <FileText size={20} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-primary text-[14px] leading-tight line-clamp-2">
                            {msg.drawingName || "Bản vẽ chưa xác định"}
                          </h4>
                          <p className="text-[11px] text-outline font-medium uppercase tracking-wider mt-1">
                            Tỉ lệ: {msg.scaleRatio || "N/A"}
                          </p>
                        </div>
                      </div>

                      {/* Mô tả (nếu có) */}
                      {msg.description && (
                        <div className="px-4 pt-3 text-[12px] text-on-surface-variant italic leading-relaxed border-b border-dashed border-outline-variant/50 pb-3">
                          <span className="font-semibold text-secondary not-italic mr-1">
                            Ghi chú:
                          </span>
                          {msg.description}
                        </div>
                      )}

                      {/* Khu vực thông số kỹ thuật (Giả lập Input) */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-outline uppercase tracking-wider mb-1">
                          <Ruler size={14} /> Trích xuất kích thước
                        </div>

                        <div className="grid grid-cols-1 gap-2.5">
                          {/* Row Dài */}
                          <div className="flex justify-between items-center bg-surface-variant/30 px-3 py-2.5 rounded-xl border border-transparent hover:border-primary/30 transition-colors cursor-text">
                            <span className="text-[13px] font-semibold text-secondary">
                              Dài (L)
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[14px] text-primary font-bold">
                                {formatSpec(msg.specs?.length)}
                              </span>
                              <Edit3
                                size={12}
                                className="text-outline opacity-50"
                              />
                            </div>
                          </div>

                          {/* Row Rộng */}
                          <div className="flex justify-between items-center bg-surface-variant/30 px-3 py-2.5 rounded-xl border border-transparent hover:border-primary/30 transition-colors cursor-text">
                            <span className="text-[13px] font-semibold text-secondary">
                              Rộng (W)
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[14px] text-primary font-bold">
                                {formatSpec(msg.specs?.width)}
                              </span>
                              <Edit3
                                size={12}
                                className="text-outline opacity-50"
                              />
                            </div>
                          </div>

                          {/* Row Cao */}
                          <div className="flex justify-between items-center bg-surface-variant/30 px-3 py-2.5 rounded-xl border border-transparent hover:border-primary/30 transition-colors cursor-text">
                            <span className="text-[13px] font-semibold text-secondary">
                              Cao (H)
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[14px] text-primary font-bold">
                                {formatSpec(msg.specs?.height)}
                              </span>
                              <Edit3
                                size={12}
                                className="text-outline opacity-50"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer Action */}
                      <div className="p-3 pt-0">
                        <button className="w-full bg-primary/10 text-primary py-2.5 rounded-xl text-[13px] font-bold hover:bg-primary hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2 group-hover:shadow-md">
                          <CheckCircle2 size={16} /> Xác nhận & Chuyển sang Báo
                          giá
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
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-white border border-outline-variant/60 text-on-surface rounded-2xl rounded-tl-sm px-5 py-3 shadow-sm flex items-center gap-3">
              <span className="text-[13px] font-medium text-secondary/80 italic">
                {isTyping === 'image' ? 'AI đang phân tích bản vẽ...' : 'AI đang suy nghĩ...'}
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 bg-secondary/60 rounded-full animate-bounce"></span>
                <span
                  className="w-1.5 h-1.5 bg-secondary/60 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></span>
                <span
                  className="w-1.5 h-1.5 bg-secondary/60 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></span>
              </div>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} className="h-1" />
      </div>

      {/* Mode Selector */}
      <div className="bg-surface px-3 py-2 flex justify-center gap-4 border-t border-outline-variant/40 text-[11px] font-medium z-0 shadow-[0_-2px_10px_rgba(0,0,0,0.02)] shrink-0">
        <label className="flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors">
          <input
            type="radio"
            name="aiMode"
            value="auto"
            checked={mode === "auto"}
            onChange={() => setMode("auto")}
            className="accent-primary w-3 h-3"
          />
          <span>Tự động</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors">
          <input
            type="radio"
            name="aiMode"
            value="fast"
            checked={mode === "fast"}
            onChange={() => setMode("fast")}
            className="accent-primary w-3 h-3"
          />
          <span>Nhanh (8B)</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors">
          <input
            type="radio"
            name="aiMode"
            value="slow"
            checked={mode === "slow"}
            onChange={() => setMode("slow")}
            className="accent-primary w-3 h-3"
          />
          <span>Chuyên sâu (70B)</span>
        </label>
      </div>

      {/* Input Form */}
      <div className="p-3.5 bg-white border-t border-outline-variant/50 shadow-[0_-4px_15px_rgba(0,0,0,0.03)] z-10 shrink-0">
        <form onSubmit={handleSend} className="flex items-end gap-2.5">
          <button
            type="button"
            onClick={handleLinkClick}
            className="p-2.5 text-secondary hover:text-primary hover:bg-secondary-container rounded-full transition-all active:scale-90 flex-shrink-0 bg-surface-variant hover:shadow-sm"
            title="Đính kèm link bản vẽ trên mạng"
          >
            <LinkIcon size={18} />
          </button>

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
            className="p-2.5 text-secondary hover:text-primary hover:bg-secondary-container rounded-full transition-all active:scale-90 flex-shrink-0 bg-surface-variant hover:shadow-sm"
            title="Tải ảnh bản vẽ lên"
          >
            <Paperclip size={18} />
          </button>

          <div className="flex-1 relative bg-surface-variant/80 rounded-2xl border border-transparent overflow-hidden flex items-center focus-within:border-primary/50 focus-within:bg-white focus-within:shadow-[0_0_0_2px_rgba(0,101,101,0.1)] transition-all">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn..."
              className="w-full max-h-32 min-h-[44px] py-3 px-4 resize-none bg-transparent outline-none text-[15px] text-on-surface"
              rows={1}
            />
          </div>

          <button
            type="submit"
            disabled={!text.trim() && !isTyping}
            className={`p-3 rounded-full flex-shrink-0 transition-all ${
              text.trim() && !isTyping
                ? "bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary-container active:scale-90 hover:-translate-y-0.5"
                : "bg-surface-variant text-outline-variant cursor-not-allowed"
            }`}
          >
            <Send size={18} className={text.trim() ? "translate-x-0.5" : ""} />
          </button>
        </form>
        <div className="text-center mt-2.5 text-[11px] text-outline/80 font-medium tracking-wide">
          AI có thể mắc sai sót. Vui lòng kiểm tra lại kích thước trước khi báo
          giá.
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
