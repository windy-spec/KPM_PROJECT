import React, { useRef, useEffect, useState } from "react";
import ReactMarkdown from 'react-markdown';
import { useAIChat } from "../../context/AIChatContext";
import { toast } from "react-toastify";
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
  CheckCircle2,
  ChevronRight,
  Package,
  ClipboardList,
  Wrench,
  ScanLine,
} from "lucide-react";
import ProductWidget from "./ProductWidget";

const MarkdownComponents = {
  img: ({ node, ...props }) => (
    <div className="overflow-hidden rounded-3xl mt-3 mb-2 group shadow-sm border border-outline-variant/30">
      <img {...props} className="w-full object-cover rounded-3xl group-hover:scale-105 transition-transform duration-700" alt={props.alt || ''} />
    </div>
  ),
  p: ({ node, children, ...props }) => {
    const childArray = React.Children.toArray(children);
    if (childArray.length > 0 && typeof childArray[0] === 'string' && childArray[0].startsWith('DESC:')) {
      const newFirstChild = childArray[0].replace('DESC:', '').trim();
      return (
        <blockquote className="border-l-4 border-primary bg-primary/5 p-3 rounded-r-xl italic text-on-surface-variant my-2 text-[13px] shadow-sm">
          {newFirstChild} {childArray.slice(1)}
        </blockquote>
      );
    }
    return <p className="mb-2 leading-relaxed" {...props}>{children}</p>;
  },
  li: ({ node, children, ...props }) => (
    <li className="flex items-start gap-2 mt-1.5" {...props}>
      <span className="text-primary mt-[5px] shrink-0"><ChevronRight size={14} /></span>
      <span>{children}</span>
    </li>
  ),
  ul: ({ node, children, ...props }) => (
    <ul className="mb-2" {...props}>{children}</ul>
  ),
  strong: ({ node, children, ...props }) => (
    <strong className="text-current font-black" {...props}>{children}</strong>
  )
};

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
  const [mode, setMode] = useState(""); // Default rỗng, ép chọn mode
  const [attachedImage, setAttachedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const fileInputRef = useRef(null);
  const genericFileInputRef = useRef(null);
  const endOfMessagesRef = useRef(null);

  const [editableSpecs, setEditableSpecs] = useState({});
  const [selectedOptions, setSelectedOptions] = useState({});

  // Kiểm tra đăng nhập bằng token local storage
  const isLoggedIn = !!localStorage.getItem("accessToken");

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, mode]);

  if (!isChatOpen) return null;

  const handleSend = (e) => {
    e?.preventDefault();
    if (!mode) {
      toast.warning("Vui lòng chọn 1 chủ đề trước khi chat!");
      return;
    }
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
      // Tự động set mode vision nếu khách upload ảnh mà chưa có mode
      if (!mode) setMode("vision_analysis");
    }
    e.target.value = null;
  };

  const handleLinkClick = () => {
    const url = window.prompt("Nhập đường link hình ảnh (VD: https://domain.com/image.jpg):");
    if (url && url.trim()) {
      setAttachedImage(url.trim());
      setPreviewUrl(url.trim());
      if (!mode) setMode("vision_analysis");
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
    let cleaned = String(val).replace(/^[:\s-]+/, "").trim();
    if (!cleaned || cleaned.toLowerCase().includes("not") || cleaned.toLowerCase() === "null" || cleaned.toLowerCase() === "n/a")
      return "";
    return cleaned;
  };



  const getPlaceholderText = () => {
    if (!mode) return "Vui lòng chọn 1 chủ đề phía trên để bắt đầu...";
    switch (mode) {
      case "product_search": return "Nhập tên sản phẩm, ví dụ: Cửa cổng dưới 2 triệu...";
      case "order_tracking": return "Nhập mã đơn hàng (vd: ORD-123) hoặc bỏ trống gửi luôn...";
      case "knowledge_support": return "Nhập câu hỏi về kỹ thuật, vật liệu, chính sách...";
      case "vision_analysis": return "Đính kèm ảnh bản vẽ kỹ thuật...";
      default: return "Nhập tin nhắn...";
    }
  };

  return (
    <div className="fixed bottom-24 right-6 w-[400px] h-[700px] max-h-[85vh] bg-surface rounded-3xl shadow-[0_15px_50px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden z-[999] border border-outline-variant/50 flex-shrink-0 animate-in slide-in-from-bottom-8 zoom-in-95 duration-300 ease-out">
      
      {/* History Sidebar */}
      <div className={`absolute inset-0 bg-surface z-20 flex flex-col transition-transform duration-300 ease-in-out ${isHistoryOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="bg-primary text-white px-5 py-4 flex justify-between items-center shadow-md shrink-0">
          <h3 className="font-bold text-base flex items-center gap-2">
            <History size={18} /> Lịch sử tư vấn
          </h3>
          <button onClick={toggleHistory} className="p-1 hover:bg-white/20 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
          <button
            onClick={() => {
              startNewChat();
              setMode(""); // Reset mode khi tạo chat mới
            }}
            className="w-full bg-primary text-white hover:bg-primary-container p-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <MessageSquareCode size={18} /> Chat mới ngay
          </button>

          {sessions && sessions.length > 0 ? (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => {
                  loadSession(session.id);
                  setMode("knowledge_support"); // Hoặc mặc định 1 mode khi load lịch sử
                }}
                className={`w-full text-left p-3 rounded-xl transition-all border ${sessionId === session.id ? "bg-primary/10 border-primary shadow-sm" : "bg-surface hover:bg-surface-variant border-outline-variant/50"}`}
              >
                <div className="font-bold text-[13px] text-on-surface truncate">
                  {session.session_title || "Phiên tư vấn mới"}
                </div>
                <div className="text-[11px] text-outline mt-1">
                  {new Date(session.started_at).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                </div>
              </button>
            ))
          ) : (
            <div className="text-center text-outline text-xs mt-4">Chưa có lịch sử chat nào</div>
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
              Guided AI Assistant
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {mode && (
            <button
              onClick={() => setMode("")}
              className="mr-1 px-3 py-1.5 text-[11px] font-bold bg-white/10 hover:bg-white/20 rounded-lg transition-all"
            >
              Đổi chủ đề
            </button>
          )}
          <button onClick={toggleHistory} className="p-2 hover:bg-white/20 rounded-full transition-all">
            <History size={20} />
          </button>
          <button onClick={toggleChat} className="p-2 hover:bg-white/20 rounded-full transition-all">
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-background scroll-smooth custom-scrollbar relative">
        
        {/* Welcome Screen / Mode Selection */}
        {!mode ? (
          <div className="flex flex-col items-center justify-center p-2 min-h-full animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
               <Cpu size={32} />
            </div>
            <h3 className="text-[15px] font-bold text-on-surface text-center mb-2">Chào mừng bạn đến với KPM</h3>
            <p className="text-[13px] text-secondary text-center mb-6">Bạn cần em hỗ trợ vấn đề gì ạ? Vui lòng chọn 1 chủ đề bên dưới:</p>
            
            <div className="grid grid-cols-2 gap-3 w-full">
              <button onClick={() => { setMode("product_search"); sendMessage("Danh mục sản phẩm", "product_search"); }} className="flex flex-col items-center gap-2 p-4 bg-white border border-outline-variant/60 hover:border-primary hover:bg-primary/5 rounded-2xl transition-all group shadow-sm hover:shadow-md">
                <Package size={24} className="text-primary" />
                <span className="text-[12px] font-bold text-on-surface text-center">Hỏi sản phẩm</span>
              </button>

              {isLoggedIn ? (
                <button onClick={() => { setMode("order_tracking"); sendMessage("Đơn hàng của tôi đang ở đâu rồi?", "order_tracking"); }} className="flex flex-col items-center gap-2 p-4 bg-white border border-outline-variant/60 hover:border-secondary hover:bg-secondary/5 rounded-2xl transition-all group shadow-sm hover:shadow-md">
                  <ClipboardList size={24} className="text-secondary" />
                  <span className="text-[12px] font-bold text-on-surface text-center">Tra cứu đơn hàng</span>
                </button>
              ) : (
                <div className="flex flex-col items-center justify-center p-4 bg-surface-variant/30 border border-outline-variant/30 rounded-2xl opacity-60 relative group cursor-not-allowed">
                  <ClipboardList size={24} className="text-outline" />
                  <span className="text-[12px] font-bold text-outline text-center mt-2">Tra cứu đơn hàng</span>
                  <div className="absolute hidden group-hover:block bg-on-surface text-white text-[10px] py-1 px-2 rounded -top-8 w-max">
                    Cần đăng nhập
                  </div>
                </div>
              )}

              <button onClick={() => { setMode("knowledge_support"); sendMessage("Tư vấn kỹ thuật", "knowledge_support"); }} className="flex flex-col items-center gap-2 p-4 bg-white border border-outline-variant/60 hover:border-error hover:bg-error/5 rounded-2xl transition-all group shadow-sm hover:shadow-md">
                <Wrench size={24} className="text-error" />
                <span className="text-[12px] font-bold text-on-surface text-center">Tư vấn kỹ thuật</span>
              </button>

              <button onClick={() => { setMode("vision_analysis"); genericFileInputRef.current?.click(); }} className="flex flex-col items-center gap-2 p-4 bg-white border border-outline-variant/60 hover:border-tertiary hover:bg-tertiary/5 rounded-2xl transition-all group shadow-sm hover:shadow-md">
                <ScanLine size={24} className="text-tertiary" />
                <span className="text-[12px] font-bold text-on-surface text-center">Phân tích bản vẽ</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
          const isUser = msg.role === "user";
          let rawContent = msg.content || "";
          let widgetData = null, optionsData = null, drawingData = null;

          const prevMsg = messages[index - 1];
          const prevUserHadImage = !isUser && prevMsg?.role === "user" && !!prevMsg?.imageUrl;

          if (!isUser && msg.type === "text") {
            const extractTag = (tagName) => {
              const regex = new RegExp(`\\[${tagName}:\\s*(\\[[\\s\\S]*?\\]|\\{[\\s\\S]*?\\})\\s*\\]`, "i");
              const match = rawContent.match(regex);
              if (match) {
                rawContent = rawContent.replace(match[0], "").replace(/^[\*\-]\s*$/gm, "").replace(/\n{3,}/g, "\n\n").trim();
                if (!match[1]) return null;
                try {
                  const parsed = JSON.parse(match[1]);
                  return parsed;
                } catch (e) { 
                  console.error("Lỗi parse JSON tag:", tagName, e);
                  return null; 
                }
              }
              return null;
            };
            widgetData = extractTag("PRODUCT_WIDGET");
            optionsData = extractTag("OPTIONS");
            drawingData = (() => {
              if (!prevUserHadImage) {
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
            rawContent = rawContent.replace(/\[(PRODUCT_WIDGET|OPTIONS|DRAWING_SPECS)[^\]]*\]/gi, "").trim();
          }

          // Cải tiến ẩn message đầu tiên (lời chào cũ) nếu đang ở màn chọn Mode
          if (!mode && index === 0) return null;

          return (
            <div key={index} className={`flex ${isUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300 relative z-0`}>
              <div className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm ${isUser ? "bg-primary text-white rounded-tr-sm shadow-primary/20" : msg.isError ? "bg-error/10 text-error rounded-tl-sm border border-error/20" : "bg-white text-on-surface border border-outline-variant/60 rounded-tl-sm"}`}>
                {msg.imageUrl && isUser && (
                  <img src={msg.imageUrl} alt="Attached" className="max-w-[200px] max-h-[200px] rounded-lg object-cover border border-white/20 shadow-sm mb-2" />
                )}

                {msg.type === "text" && (
                  <div className="flex flex-col gap-2 w-full">
                    <div className={`text-[14px] leading-relaxed ${isUser ? "text-white" : "text-on-surface-variant"}`}>
                      <ReactMarkdown components={MarkdownComponents}>
                        {rawContent}
                      </ReactMarkdown>
                    </div>

                    {optionsData && optionsData.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-outline-variant/30">
                        {optionsData.length <= 3 ? (
                          <div className="flex flex-wrap gap-2">
                            {optionsData.map((opt, idx) => (
                              <button key={idx} onClick={() => sendMessage(opt, mode)} className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-full text-[13px] font-bold transition-all border border-primary/20">{opt}</button>
                            ))}
                          </div>
                        ) : (
                          <select 
                            value={selectedOptions[index] || ""}
                            onChange={(e) => { 
                              if (e.target.value) { 
                                setSelectedOptions(prev => ({...prev, [index]: e.target.value}));
                                sendMessage(e.target.value, mode); 
                              } 
                            }} 
                            className="w-full bg-surface border border-outline-variant text-on-surface text-sm rounded-xl px-3 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all cursor-pointer"
                          >
                            <option value="">-- Vui lòng chọn một tùy chọn --</option>
                            {optionsData.map((opt, idx) => <option key={idx} value={opt}>{opt}</option>)}
                          </select>
                        )}
                      </div>
                    )}

                    {drawingData && (
                      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant/60 overflow-hidden mt-2">
                        {/* ... Giữ nguyên form bản vẽ ... */}
                         <div className="bg-primary/10 px-4 py-3 flex items-center gap-3">
                          <FileText size={20} className="text-primary" />
                          <div>
                            <h4 className="font-bold text-primary text-[14px] leading-tight">{drawingData.name || "Bản vẽ phân tích"}</h4>
                            <p className="text-[11px] text-outline font-medium">Tỉ lệ: {drawingData.scale || "N/A"}</p>
                          </div>
                        </div>

                        <div className="p-4 space-y-3 bg-white">
                          {["length", "width", "height"].map((dim) => (
                            <div key={dim} className="flex justify-between items-center bg-surface-variant/30 px-3 py-2 rounded-xl border border-outline-variant/30 focus-within:border-primary/50 transition-colors">
                              <span className="text-[13px] font-semibold text-secondary w-20">
                                {dim === "length" ? "Dài (L)" : dim === "width" ? "Rộng (W)" : "Cao (H)"}
                              </span>
                              <input
                                type="number"
                                defaultValue={formatSpec(drawingData[dim])}
                                placeholder="___"
                                className="bg-transparent text-right font-mono text-[14px] text-primary font-bold outline-none w-24"
                                onChange={(e) => setEditableSpecs({ ...editableSpecs, [dim]: e.target.value })}
                              />
                            </div>
                          ))}
                        </div>
                        
                      </div>
                    )}

                    {widgetData && <ProductWidget items={widgetData} />}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-outline-variant/60 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-primary" />
              <span className="text-[13px] text-secondary font-medium">Đang suy nghĩ...</span>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} className="h-1" />
        </>
        )}
      </div>

      {/* Input Form */}
      <div className="p-3 bg-white border-t border-outline-variant/50 shadow-[0_-4px_15px_rgba(0,0,0,0.03)] z-10 shrink-0 relative">
        {!mode && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-20 flex items-center justify-center">
             <span className="text-xs font-bold text-outline">Vui lòng chọn chủ đề để bắt đầu chat</span>
          </div>
        )}
        
        {previewUrl && (
          <div className="mb-2 relative inline-block p-1 bg-surface-variant rounded-xl border border-outline-variant">
            <img src={previewUrl} alt="Preview" className="h-16 w-16 object-cover rounded-lg" />
            <button onClick={() => { setAttachedImage(null); setPreviewUrl(null); }} className="absolute -top-2 -right-2 bg-error text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"><X size={12} /></button>
          </div>
        )}
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <input type="file" ref={genericFileInputRef} onChange={handleGenericFileChange} accept="image/*" className="hidden" />
          
          {mode === "vision_analysis" && (
            <>
              <button type="button" onClick={() => genericFileInputRef.current?.click()} className="p-2.5 text-secondary bg-surface-variant hover:text-primary hover:bg-primary/10 rounded-full transition-all" title="Tải ảnh lên">
                <ImageIcon size={18} />
              </button>
              <button type="button" onClick={handleLinkClick} className="p-2.5 text-secondary bg-surface-variant hover:text-primary hover:bg-primary/10 rounded-full transition-all" title="Dán link ảnh">
                <LinkIcon size={18} />
              </button>
            </>
          )}

          <div className="flex-1 bg-surface-variant/30 rounded-2xl border border-outline-variant/50 focus-within:border-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/10 flex items-center transition-all px-2 shadow-inner">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={getPlaceholderText()}
              disabled={!mode}
              className="w-full max-h-32 min-h-[44px] py-3 px-2 resize-none bg-transparent outline-none text-[14px] text-on-surface disabled:opacity-50 placeholder-outline"
              rows={1}
            />
          </div>

          <button
            type="submit"
            disabled={(!text.trim() && !attachedImage) || isTyping || !mode}
            className={`p-3 rounded-full flex-shrink-0 transition-all ${((text.trim() || attachedImage) && !isTyping && mode) ? "bg-primary text-white shadow-md hover:bg-primary-container" : "bg-surface-variant text-outline-variant"}`}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
