import React, { useState, useEffect } from 'react';
import { MessageSquareCode, Clock, ArrowRight, Bot, PenTool } from 'lucide-react';

const AIChatHistoryTab = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock dữ liệu AI Sessions vì chưa có API cho chức năng này
    setTimeout(() => {
      setSessions([
        {
          id: 'SS-001',
          title: 'Tư vấn Bản vẽ Cổng Sắt Nghệ Thuật',
          date: 'Hôm qua, 14:20 PM',
          messages_count: 12,
          has_drawing: true,
          status: 'completed',
        },
        {
          id: 'SS-002',
          title: 'Hỏi đáp kỹ thuật hàn TIG / MIG',
          date: '3 ngày trước',
          messages_count: 5,
          has_drawing: false,
          status: 'completed',
        },
        {
          id: 'SS-003',
          title: 'Bóc tách vật tư Lan Can Kính',
          date: 'Tuần trước',
          messages_count: 24,
          has_drawing: true,
          status: 'completed',
        }
      ]);
      setLoading(false);
    }, 600);
  }, []);

  if (loading) return <div className="p-8 text-center animate-pulse">Đang tải dữ liệu trò chuyện AI...</div>;

  return (
    <div className="mt-6 space-y-4">
      {sessions.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-outline-variant flex flex-col items-center">
          <Bot className="w-16 h-16 text-outline-variant mb-4" />
          <h3 className="text-lg font-bold text-on-surface">Chưa có lịch sử tư vấn nào</h3>
          <p className="text-sm text-on-surface-variant">Bạn có thể trò chuyện với trợ lý AI KPM để được tư vấn kỹ thuật và bản vẽ.</p>
          <button className="mt-4 px-6 py-2 bg-primary text-white font-bold rounded-xl text-sm">Trò chuyện ngay</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map(session => (
            <div key={session.id} className="bg-white rounded-2xl p-5 border border-outline-variant hover:border-primary/50 hover:shadow-md transition-all group cursor-pointer flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-primary/70">{session.id}</span>
                  </div>
                  {session.has_drawing && (
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-1 rounded-full border border-amber-200">
                      <PenTool className="w-3 h-3" /> Có bản vẽ
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-on-surface mb-2 group-hover:text-primary transition-colors">{session.title}</h3>
                
                <div className="flex items-center gap-4 text-xs font-medium text-on-surface-variant">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {session.date}</span>
                  <span className="flex items-center gap-1"><MessageSquareCode className="w-3.5 h-3.5" /> {session.messages_count} tin nhắn</span>
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
    </div>
  );
};

export default AIChatHistoryTab;
