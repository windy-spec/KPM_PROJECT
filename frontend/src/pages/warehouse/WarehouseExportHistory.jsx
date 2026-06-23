import React, { useState, useEffect } from "react";
import { Loader2, ArrowUpRight, Calendar, Search, History } from "lucide-react";
import Pagination from "../../components/common/Pagination";
import warehouseService from "../../services/warehouse.service";

const WarehouseExportHistory = () => {
    const [historyLogs, setHistoryLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const [page, setPage] = useState(1);
    const pageSize = 15;

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await warehouseService.getExportHistory();
            if (res.data?.success) {
                setHistoryLogs(res.data.data);
            }
        } catch (err) {
            console.error(err);
            setError("Không thể tải danh sách lịch sử phiếu xuất.");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "---";
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const filteredLogs = historyLogs.filter(log => {
        const matName = (log.materials?.material_name || "").toLowerCase();
        const matCode = (log.materials?.material_code || "").toLowerCase();
        const refCode = (log.reference_code || "").toLowerCase();
        const q = searchQuery.toLowerCase();
        return matName.includes(q) || matCode.includes(q) || refCode.includes(q);
    });

    const totalPages = Math.ceil(filteredLogs.length / pageSize);
    const currentTableData = filteredLogs.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div className="w-full bg-white border border-outline-variant/70 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/60 pb-4">
                <div>
                    <h3 className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <History className="w-5 h-5 text-teal-600" /> Lịch sử phiếu xuất kho
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                        Danh sách toàn bộ các mã vật tư đã được xuất khỏi hệ thống để phục vụ sản xuất.
                    </p>
                </div>

                <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Tìm mã đơn, mã vật tư..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                        className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold w-64 focus:outline-teal-600"
                    />
                </div>
            </div>

            {error && (
                <div className="p-4 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-100">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="py-12 flex justify-center items-center gap-2 text-slate-500 text-sm font-semibold">
                    <Loader2 className="w-6 h-6 animate-spin text-teal-600" /> Đang tải dữ liệu...
                </div>
            ) : (
                <div className="border border-outline-variant/50 rounded-xl bg-slate-50/50 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-100 text-slate-600 uppercase tracking-wider font-black border-b border-outline-variant/60 text-[10px]">
                                    <th className="p-3 pl-5">Thời gian xuất</th>
                                    <th className="p-3">Mã vật tư</th>
                                    <th className="p-3">Tên vật tư</th>
                                    <th className="p-3 text-center">Số lượng</th>
                                    <th className="p-3">Đơn hàng tham chiếu</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/40 font-medium">
                                {currentTableData.length > 0 ? (
                                    currentTableData.map((log) => (
                                        <tr key={log.id} className="hover:bg-white transition-colors">
                                            <td className="p-3 pl-5 text-slate-500 flex items-center gap-1.5 font-semibold">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {formatDate(log.created_at)}
                                            </td>
                                            <td className="p-3 font-bold text-slate-700">
                                                {log.materials?.material_code || "N/A"}
                                            </td>
                                            <td className="p-3 font-semibold text-slate-800">
                                                {log.materials?.material_name || "N/A"}
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-black border border-rose-100 uppercase text-[10px]">
                                                    <ArrowUpRight className="w-3 h-3" />
                                                    {Math.abs(log.quantity_change)} {log.materials?.material_units?.unit_name || "Cái"}
                                                </span>
                                            </td>
                                            <td className="p-3 font-mono text-[11px] font-black text-teal-700">
                                                {log.reference_code || "Hệ thống"}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-slate-400 italic font-semibold text-xs">
                                            Không tìm thấy dữ liệu phiếu xuất kho nào khớp với tìm kiếm.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <div className="p-3 border-t border-outline-variant/50 flex justify-end bg-white">
                            <Pagination
                                currentPage={page}
                                totalPages={totalPages}
                                onPageChange={(p) => setPage(p)}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default WarehouseExportHistory;
