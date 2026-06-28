import React, { useRef, useEffect, useState } from "react";
import { useAIChat } from "../../context/AIChatContext";
import {
  Send,
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
  ChevronRight,
  Zap,
  Package,
  ClipboardList,
  Wrench,
  ScanLine,
} from "lucide-react";
import ProductWidget from "./ProductWidget";

const ChatWindow = () => {
  const {
    messages,
    isChatOpen,
    isTyping,
    sessionId,
    toggleChat,
    sendMessage,
    sessions,
    isHistoryOpen,
    toggleHistory,
    startNewChat,
    loadSession,
  } = useAIChat();

  const [text, setText] = useState("");
  const [mode, setMode] = useState("auto");
  const [attachedImage, setAttachedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const fileInputRef = useRef(null);
  const genericFileInputRef = useRef(null);
  const endOfMessagesRef = useRef(null);

  // State cục bộ để lưu trữ các thông số bản vẽ đang được chỉnh sửa
  const [editableSpecs, setEditableSpecs] = useState({});

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  if (!isChatOpen) return null;

  const handleSend = (e) => {
    e?.preventDefault();
    if (text.trim() || attachedImage) {
      if (attachedImage) {
        sendMessage(text, mode, attachedImage);
        setAttachedImage(null);
        setPreviewUrl(null);
      } else {
        sendMessage(text, mode);
      }
      setText("");
    }
  };

  const handleGenericFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
    e.target.value = null;
  };

  const handleLinkClick = () => {
    const url = window.prompt(
      "Nhập đường link hình ảnh (VD: https://domain.com/image.jpg):",
    );
    if (url && url.trim()) {
      setAttachedImage(url.trim());
      setPreviewUrl(url.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatSpec = (val) => {
    if (!val) return "";
    let cleaned = String(val)
      .replace(/^[:\s-]+/, "")
      .trim();
    if (
      !cleaned ||
      cleaned.toLowerCase().includes("not") ||
      cleaned.toLowerCase() === "null" ||
      cleaned.toLowerCase() === "n/a"
    )
      return "";
    return cleaned;
  };

  // NÂNG CẤP: Hàm render Text hỗ trợ Markdown cơ bản (In đậm + List gạch đầu dòng + Xuống dòng)
  const renderFormattedText = (textStr) => {
    if (!textStr) return null;

    // Tách theo dòng trước
    const lines = textStr.split("\n");
    return lines.map((line, lineIndex) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return <div key={lineIndex} className="h-1.5" />; // Giữ khoảng cách cho dòng rỗng

      // Hỗ trợ cả dấu '-' và '*' cho danh sách
      const isListItem =
        trimmedLine.startsWith("-") || trimmedLine.startsWith("*");
      let content = isListItem ? trimmedLine.substring(1).trim() : line;

      // Dọn rác: Nếu bullet không có nội dung (do tag đã bị bóc đi), bỏ qua không render
      if (isListItem && !content) return null;

      // Xử lý in đậm **text**
      const parts = content.split(/(\*\*.*?\*\*)/g);
      const formattedContent = parts.map((part, idx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={idx} className="text-on-surface font-bold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={idx}>{part}</span>;
      });

      if (isListItem) {
        return (
          <div key={lineIndex} className="flex items-start gap-2 mt-1.5">
            <span className="text-primary mt-1 shrink-0">
              <ChevronRight size={14} />
            </span>
            <span>{formattedContent}</span>
          </div>
        );
      }

      return (
        <div key={lineIndex} className="min-h-[1.2rem]">
          {formattedContent}
        </div>
      );
    });
  };

  // NÂNG CẤP: Quick Prompts cho người dùng mới
  const QUICK_PROMPTS = [
    "Bên em có làm Cửa cổng sắt không?",
    "Em ơi, Inox 304 có bị rỉ sét không?",
    "Đơn hàng của tôi xong chưa?",
    "Làm theo kích thước bản vẽ này thì giá bao nhiêu?",
  ];

  return (
    <div className="fixed bottom-24 right-6 w-[400px] h-[700px] max-h-[85vh] bg-surface rounded-3xl shadow-[0_15px_50px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden z-[999] border border-outline-variant/50 flex-shrink-0 animate-in slide-in-from-bottom-8 zoom-in-95 duration-300 ease-out">
      {/* ... (Giữ nguyên phần History Sidebar của ông) ... */}
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
            className="w-full bg-primary text-white hover:bg-primary-container active:scale-95 p-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <MessageSquareCode size={18} /> Chat mới ngay
          </button>
          
          {sessions && sessions.length > 0 ? (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => loadSession(session.id)}
                className={`w-full text-left p-3 rounded-xl transition-all border ${
                  sessionId === session.id
                    ? "bg-primary/10 border-primary shadow-sm"
                    : "bg-surface hover:bg-surface-variant border-outline-variant/50"
                }`}
              >
                <div className="font-bold text-[13px] text-on-surface truncate">
                  {session.session_title || "Phiên tư vấn mới"}
                </div>
                <div className="text-[11px] text-outline mt-1">
                  {new Date(session.started_at).toLocaleString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </div>
              </button>
            ))
          ) : (
            <div className="text-center text-outline text-xs mt-4">
              Chưa có lịch sử chat nào
            </div>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="bg-primary text-white px-5 py-4 flex justify-between items-center shadow-md z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shadow-inner backdrop-blur-sm border border-white/30 relative">
            <Cpu size={22} className="text-on-primary-container" />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-400 border-2 border-primary rounded-full"></span>
          </div>
          <div>
            <h3 className="font-bold text-base tracking-tight leading-tight">
              KPM Trợ lý ảo
            </h3>
            <p className="text-[11px] text-white/80 font-medium">
              Sẵn sàng tư vấn báo giá
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleHistory}
            className="p-2 hover:bg-white/20 rounded-full transition-all"
          >
            <History size={20} />
          </button>
          <button
            onClick={toggleChat}
            className="p-2 hover:bg-white/20 rounded-full transition-all"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-background scroll-smooth custom-scrollbar">
        {messages.length === 1 && (
          <div className="mb-4">
            <p className="text-xs text-outline text-center mb-3">Chọn luồng tư vấn bên dưới để bắt đầu</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => sendMessage("Tôi muốn tư vấn và xem các mẫu sản phẩm cổng, cửa, lan can của xưởng", "slow")}
                className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-outline-variant/40 hover:border-primary hover:bg-primary/5 rounded-2xl transition-all group hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                  <Package size={20} className="text-primary" />
                </div>
                <span className="text-[12px] font-bold text-on-surface text-center leading-tight">Tư vấn sản phẩm</span>
              </button>

              <button
                onClick={() => sendMessage("Đơn hàng của tôi đang ở đâu rồi?", "fast")}
                className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-outline-variant/40 hover:border-secondary hover:bg-secondary/5 rounded-2xl transition-all group hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-secondary/10 group-hover:bg-secondary/20 flex items-center justify-center transition-colors">
                  <ClipboardList size={20} className="text-secondary" />
                </div>
                <span className="text-[12px] font-bold text-on-surface text-center leading-tight">Tra cứu đơn hàng</span>
              </button>

              <button
                onClick={() => {
                  genericFileInputRef.current?.click();
                }}
                className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-outline-variant/40 hover:border-tertiary hover:bg-tertiary/5 rounded-2xl transition-all group hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-tertiary/10 group-hover:bg-tertiary/20 flex items-center justify-center transition-colors">
                  <ScanLine size={20} className="text-tertiary" />
                </div>
                <span className="text-[12px] font-bold text-on-surface text-center leading-tight">Gửi bản vẽ</span>
              </button>

              <button
                onClick={() => sendMessage("Cho tôi hỏi về vật liệu cơ khí và quy trình gia công của xưởng", "slow")}
                className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-outline-variant/40 hover:border-error hover:bg-error/5 rounded-2xl transition-all group hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-error/10 group-hover:bg-error/20 flex items-center justify-center transition-colors">
                  <Wrench size={20} className="text-error" />
                </div>
                <span className="text-[12px] font-bold text-on-surface text-center leading-tight">Hỏi kỹ thuật</span>
              </button>
            </div>
          </div>
        )}

        {messages.map((msg, index) => {
          const isUser = msg.role === "user";
          let rawContent = msg.content || "";
          let widgetData = null,
            optionsData = null,
            drawingData = null;

          // Fix 3: chỉ parse DRAWING_SPECS nếu tin nhắn trước đó của user có kèm ảnh
          const prevMsg = messages[index - 1];
          const prevUserHadImage = !isUser && prevMsg?.role === "user" && !!prevMsg?.imageUrl;

          if (!isUser && msg.type === "text") {
            const extractTag = (tagName) => {
              // Regex bắt được mọi dạng: [...], {...}, hoặc rỗng
              const regex = new RegExp(
                `\\[${tagName}:\\s*([\\[{][\\s\\S]*?[\\]}])?\\s*\\]`,
                "i"
              );
              const match = rawContent.match(regex);
              if (match) {
                rawContent = rawContent.replace(regex, "");
                rawContent = rawContent.replace(/^[\*\-]\s*$/gm, "").trim();
                rawContent = rawContent.replace(/\n{3,}/g, "\n\n").trim();

                if (!match[1]) return null; // Tag rỗng
                try {
                  const parsed = JSON.parse(match[1]);
                  // Nếu AI trả về Object thay vì Array -> bỏ qua, không render widget
                  if (!Array.isArray(parsed)) return null;
                  return parsed;
                } catch (e) {
                  return null;
                }
              }
              return null;
            };
            widgetData = extractTag("PRODUCT_WIDGET");
            optionsData = extractTag("OPTIONS");
            drawingData = (() => {
              // DRAWING_SPECS chỉ parse nếu user trước đó có gửi ảnh
              if (!prevUserHadImage) {
                // Vẫn phải xóa tag nếu có để tránh lộ ra màn hình
                rawContent = rawContent.replace(/\[DRAWING_SPECS:[^\]]*\]/gi, "").trim();
                return null;
              }
              const regex = /\[DRAWING_SPECS:\s*(\{[\s\S]*?\})?\s*\]/i;
              const match = rawContent.match(regex);
              if (match) {
                rawContent = rawContent.replace(regex, "").trim();
                if (!match[1]) return null;
                try { return JSON.parse(match[1]); } catch { return null; }
              }
              return null;
            })();

            // Dọn sạch mọi tag thừa còn sót lại
            rawContent = rawContent.replace(/\[(PRODUCT_WIDGET|OPTIONS|DRAWING_SPECS)[^\]]*\]/gi, "").trim();
          }

          return (
            <div
              key={index}
              className={`flex ${isUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm ${
                  isUser
                    ? "bg-primary text-white rounded-tr-sm shadow-primary/20"
                    : msg.isError
                      ? "bg-error/10 text-error rounded-tl-sm border border-error/20"
                      : "bg-white text-on-surface border border-outline-variant/60 rounded-tl-sm"
                }`}
              >
                {msg.imageUrl && isUser && (
                  <img
                    src={msg.imageUrl}
                    alt="Attached"
                    className="max-w-[200px] max-h-[200px] rounded-lg object-cover border border-white/20 shadow-sm mb-2"
                  />
                )}

                {msg.type === "text" && (
                  <div className="flex flex-col gap-2 w-full">
                    <div className="text-[14px] leading-relaxed text-on-surface-variant">
                      {renderFormattedText(rawContent)}
                    </div>

                    {/* NÂNG CẤP: COMBOBOX THÔNG MINH CHO TÙY CHỌN */}
                    {optionsData && optionsData.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-outline-variant/30">
                        {optionsData.length <= 3 ? (
                          <div className="flex flex-wrap gap-2">
                            {optionsData.map((opt, idx) => (
                              <button
                                key={idx}
                                onClick={() => sendMessage(opt, mode)}
                                className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-full text-[13px] font-bold transition-all border border-primary/20"
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                sendMessage(e.target.value, mode);
                                e.target.value = ""; // Reset
                              }
                            }}
                            className="w-full bg-surface border border-outline-variant text-on-surface text-sm rounded-xl px-3 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all cursor-pointer"
                          >
                            <option value="">
                              -- Vui lòng chọn một tùy chọn --
                            </option>
                            {optionsData.map((opt, idx) => (
                              <option key={idx} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}

                    {/* NÂNG CẤP: BẢNG THÔNG SỐ CÓ THỂ CHỈNH SỬA (EDITABLE FORM) */}
                    {drawingData && (
                      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant/60 overflow-hidden mt-2">
                        <div className="bg-primary/10 px-4 py-3 flex items-center gap-3">
                          <FileText size={20} className="text-primary" />
                          <div>
                            <h4 className="font-bold text-primary text-[14px] leading-tight">
                              {drawingData.name || "Bản vẽ phân tích"}
                            </h4>
                            <p className="text-[11px] text-outline font-medium">
                              Tỉ lệ: {drawingData.scale || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="p-4 space-y-3 bg-white">
                          <div className="flex items-center justify-between text-xs font-bold text-outline uppercase tracking-wider mb-2">
                            <span className="flex items-center gap-1">
                              <Ruler size={14} /> Kích thước (mm)
                            </span>
                            <span className="text-[10px] text-primary lowercase italic">
                              Có thể sửa
                            </span>
                          </div>

                          {["length", "width", "height"].map((dim) => (
                            <div
                              key={dim}
                              className="flex justify-between items-center bg-surface-variant/30 px-3 py-2 rounded-xl border border-outline-variant/30 focus-within:border-primary/50 transition-colors"
                            >
                              <span className="text-[13px] font-semibold text-secondary w-20">
                                {dim === "length"
                                  ? "Dài (L)"
                                  : dim === "width"
                                    ? "Rộng (W)"
                                    : "Cao (H)"}
                              </span>
                              <input
                                type="number"
                                defaultValue={formatSpec(drawingData[dim])}
                                placeholder="___"
                                className="bg-transparent text-right font-mono text-[14px] text-primary font-bold outline-none w-24"
                                onChange={(e) =>
                                  setEditableSpecs({
                                    ...editableSpecs,
                                    [dim]: e.target.value,
                                  })
                                }
                              />
                            </div>
                          ))}
                        </div>

                        <div className="p-3 bg-white border-t border-outline-variant/30">
                          <button
                            onClick={() => {
                              // Action: Đẩy dữ liệu sang form báo giá
                              console.log("Dữ liệu chốt:", {
                                ...drawingData,
                                ...editableSpecs,
                              });
                              alert(
                                "Đã gom dữ liệu, chuẩn bị chuyển sang màn hình Báo Giá!",
                              );
                            }}
                            className="w-full bg-primary text-white py-2.5 rounded-xl text-[13px] font-bold hover:bg-primary-container active:scale-95 flex items-center justify-center gap-2 shadow-md shadow-primary/20 transition-all"
                          >
                            <CheckCircle2 size={16} /> Chốt thông số & Báo giá
                          </button>
                        </div>
                      </div>
                    )}

                    {widgetData && <ProductWidget items={widgetData} />}
                  </div>
                )}
                {/* ... Các phần khác (loading, image_uploading) giữ nguyên ... */}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-outline-variant/60 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-primary" />
              <span className="text-[13px] text-secondary font-medium">
                Đang suy nghĩ...
              </span>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} className="h-1" />
      </div>

      {/* Input Form */}
      <div className="p-3 bg-white border-t border-outline-variant/50 shadow-[0_-4px_15px_rgba(0,0,0,0.03)] z-10 shrink-0">
        {previewUrl && (
          <div className="mb-2 relative inline-block p-1 bg-surface-variant rounded-xl border border-outline-variant">
            <img
              src={previewUrl}
              alt="Preview"
              className="h-16 w-16 object-cover rounded-lg"
            />
            <button
              onClick={() => {
                setAttachedImage(null);
                setPreviewUrl(null);
              }}
              className="absolute -top-2 -right-2 bg-error text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"
            >
              <X size={12} />
            </button>
          </div>
        )}
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <input
            type="file"
            ref={genericFileInputRef}
            onChange={handleGenericFileChange}
            accept="image/*"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => genericFileInputRef.current?.click()}
            className="p-2.5 text-secondary bg-surface-variant hover:text-primary hover:bg-primary/10 rounded-full transition-all"
          >
            <ImageIcon size={18} />
          </button>

          <button
            type="button"
            onClick={handleLinkClick}
            className="p-2.5 text-secondary bg-surface-variant hover:text-primary hover:bg-primary/10 rounded-full transition-all"
          >
            <LinkIcon size={18} />
          </button>

          <div className="flex-1 bg-surface-variant/50 rounded-2xl border border-outline-variant focus-within:border-primary focus-within:bg-white flex items-center transition-all px-1">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập yêu cầu tư vấn..."
              className="w-full max-h-32 min-h-[44px] py-3 px-3 resize-none bg-transparent outline-none text-[14px]"
              rows={1}
            />
          </div>

          <button
            type="submit"
            disabled={(!text.trim() && !attachedImage) || isTyping}
            className={`p-3 rounded-full flex-shrink-0 transition-all ${(text.trim() || attachedImage) && !isTyping ? "bg-primary text-white shadow-md hover:bg-primary-container" : "bg-surface-variant text-outline-variant"}`}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
