import React from 'react';
import { ShieldCheck, Cpu, Clock, Layers } from 'lucide-react';

const HeroStats = () => {
    const stats = [
        {
            icon: Cpu,
            value: "3 Giây",
            label: "Bóc tách bằng AI",
            color: "text-primary bg-primary/5",
        },
        {
            icon: ShieldCheck,
            value: "100%",
            label: "Chính xác kỹ thuật",
            color: "text-emerald-600 bg-emerald-50",
        },
        {
            icon: Clock,
            value: "24/7",
            label: "Báo giá tự động",
            color: "text-amber-600 bg-amber-50",
        },
        {
            icon: Layers,
            value: "50+",
            label: "Cấu kiện mẫu mã",
            color: "text-blue-600 bg-blue-50",
        },
    ];

    return (
        <div className="w-full bg-white border-b border-outline-variant/50 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="max-w-[1140px] mx-auto px-6 md:px-12 py-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-outline-variant/40">
                    {stats.map((item, index) => (
                        <div
                            key={index}
                            className={`flex items-center gap-4 justify-start md:justify-center ${index > 0 ? 'pt-4 md:pt-0 md:pl-4' : ''
                                }`}
                        >
                            {/* Icon hình tròn nhỏ gọn */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                                <item.icon className="w-5 h-5" />
                            </div>

                            {/* Chữ thông tin */}
                            <div className="flex flex-col">
                                <span className="text-base md:text-lg font-black text-on-surface tracking-tight leading-tight">
                                    {item.value}
                                </span>
                                <span className="text-[11px] font-bold text-on-surface-variant/80 uppercase tracking-wider mt-0.5">
                                    {item.label}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HeroStats;