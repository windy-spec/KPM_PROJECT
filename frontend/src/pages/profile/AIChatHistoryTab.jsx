import React, { useState, useEffect } from 'react';
import { MessageSquareCode, Clock, ArrowRight, Bot, PenTool, X } from 'lucide-react';
import aiService from '../../services/ai.service';
import Portal from '../../components/common/Portal';

const formatDate = (dateString) => {
  if (!dateString) return "---";
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
};

const formatSpec = (val) => {
  if (!val) return "___";
  let cleaned = String(val).replace(/^[:\s-]+/, "").trim();
  if (!cleaned || cleaned.toLowerCase().includes("not") || cleaned.toLowerCase() === "null" || cleaned.toLowerCase() === "n/a") {
    return "___";
  }
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

const AIChatHistoryTab = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDetails, setSessionDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const res = await aiService.getSessions();
      setSessions(res.data || []);
    } catch (error) {
      console.error("Lỗi tải lịch sử:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = async (sessionId) => {
    try {
      setSelectedSession(sessionId);
      setLoadingDetails(true);
      const res = await aiService.getSessionDetails(sessionId);
      setSessionDetails(res.data);
    } catch (error) {
      console.error("Lỗi tải chi tiết session:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse text-primary font-bold">Đang tải dữ liệu trò chuyện AI...</div>;

  return (
    <div className="mt-6 space-y-4">
      {sessions.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-outline-variant flex flex-col items-center shadow-sm">
          <Bot className="w-16 h-16 text-outline-variant mb-4" />
          <h3 className="text-lg font-bold text-on-surface">Chưa có lịch sử tư vấn nào</h3>
          <p className="text-sm text-on-surface-variant">Bạn có thể trò chuyện với trợ lý AI KPM để được tư vấn kỹ thuật và bản vẽ.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map(session => (
            <div key={session.id} onClick={() => handleOpenDetails(session.id)} className="bg-white rounded-2xl p-5 border border-outline-variant hover:border-primary/50 hover:shadow-md transition-all group cursor-pointer flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-primary/70">SES-{session.id.substring(0, 6)}</span>
                  </div>
                </div>
                <h3 className="text-base font-bold text-on-surface mb-2 group-hover:text-primary transition-colors">{session.session_title}</h3>

                <div className="flex items-center gap-4 text-xs font-medium text-on-surface-variant">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatDate(session.started_at)}</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-outline-variant/30 flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">Đã lưu trữ</span>
                <button className="flex items-center gap-1 text-xs font-black text-primary hover:text-primary-container transition-colors">
                  Xem lại chi tiết <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal / Overlay Chi Tiết */}
      {selectedSession && (
        <Portal>
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-surface w-full max-w-3xl h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
              <div className="bg-primary text-white p-4 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-lg flex items-center gap-2"><MessageSquareCode /> Chi tiết Phiên Chat</h3>
                <button onClick={() => setSelectedSession(null)} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-background">
                {loadingDetails ? (
                  <div className="text-center py-10 animate-pulse text-secondary font-bold">Đang tải lịch sử...</div>
                ) : sessionDetails?.messages?.length > 0 ? (
                  sessionDetails.messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${msg.sender_type === 'user' ? 'bg-primary text-white rounded-tr-sm' : 'bg-white text-on-surface border border-outline-variant/50 rounded-tl-sm'}`}>
                        <div className="text-sm whitespace-pre-wrap">{msg.message_text}</div>

                        {/* Hiển thị bản vẽ nếu có */}
                        {msg.ai_drawing_analyses && msg.ai_drawing_analyses.length > 0 && (
                          <div className="mt-3 space-y-3">
                            {msg.ai_drawing_analyses.map(draw => (
                              <div key={draw.id} className="bg-surface rounded-xl p-3 border border-outline-variant/60 shadow-inner">
                                <h4 className="font-bold text-primary mb-2 text-center text-sm border-b border-outline-variant/50 pb-2">📋 Bản vẽ: <span className="text-secondary">{draw.drawing_name}</span></h4>
                                {draw.image_url && <img src={draw.image_url} alt="Bản vẽ" className="w-full max-h-40 object-contain rounded-lg mb-2" />}
                                <div className="text-xs space-y-1.5 mt-2 bg-white p-2 rounded border border-outline-variant/50">
                                  <div className="flex justify-between"><b>Chiều dài:</b> <span>{formatSpec(draw.specifications?.length)}</span></div>
                                  <div className="flex justify-between"><b>Chiều rộng:</b> <span>{formatSpec(draw.specifications?.width)}</span></div>
                                  <div className="flex justify-between"><b>Chiều cao:</b> <span>{formatSpec(draw.specifications?.height)}</span></div>
                                  <div className="flex justify-between"><b>Tỉ lệ:</b> <span className="text-primary font-bold">{draw.scale_ratio || 'N/A'}</span></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-outline">Không có tin nhắn nào.</div>
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};

export default AIChatHistoryTab;
