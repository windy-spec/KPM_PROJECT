import React, { useState, useEffect } from "react";
import {
    Loader2,
    ArrowUpRight,
    Calendar,
    Search,
    History,
    ChevronDown,
    ChevronUp,
    FileText,
    Package,
} from "lucide-react";
import Pagination from "../../components/common/Pagination";
import warehouseService from "../../services/warehouse.service";

const WarehouseExportHistory = () => {
    const [historyInvoices, setHistoryInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedRows, setExpandedRows] = useState([]);

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
                setHistoryInvoices(Array.isArray(res.data.data) ? res.data.data : []);
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

    const toggleRow = (groupKey) => {
        setExpandedRows((prev) =>
            prev.includes(groupKey)
                ? prev.filter((item) => item !== groupKey)
                : [...prev, groupKey],
        );
    };

    const filteredInvoices = historyInvoices.filter((invoice) => {
        const refCode = (invoice.reference_code || "").toLowerCase();
        const orderId = (invoice.order_id || "").toLowerCase();
        const q = searchQuery.toLowerCase();
        const itemMatches = (invoice.items || []).some((item) => {
            const matName = (item.material_name || "").toLowerCase();
            const matCode = (item.material_code || "").toLowerCase();
            const note = (item.note || "").toLowerCase();
            return matName.includes(q) || matCode.includes(q) || note.includes(q);
        });

        return refCode.includes(q) || orderId.includes(q) || itemMatches;
    });

    const totalPages = Math.ceil(filteredInvoices.length / pageSize);
    const currentTableData = filteredInvoices.slice((page - 1) * pageSize, page * pageSize);

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
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setPage(1);
                        }}
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
                                    <th className="p-3">Mã hóa đơn</th>
                                    <th className="p-3">Đơn hàng tham chiếu</th>
                                    <th className="p-3 text-center">Số dòng vật tư</th>
                                    <th className="p-3 text-center">Xem chi tiết</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/40 font-medium">
                                {currentTableData.length > 0 ? (
                                    currentTableData.map((invoice) => {
                                        const isExpanded = expandedRows.includes(invoice.group_key);

                                        return (
                                            <React.Fragment key={invoice.group_key}>
                                                <tr
                                                    className={`transition-colors cursor-pointer ${isExpanded ? "bg-white" : "hover:bg-white"}`}
                                                    onClick={() => toggleRow(invoice.group_key)}
                                                >
                                                    <td className="p-3 pl-5 text-slate-500 font-semibold align-top">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {formatDate(invoice.created_at)}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 font-bold text-slate-700 align-top">
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="w-3.5 h-3.5 text-teal-600" />
                                                            <span className="font-mono text-[11px] font-black text-teal-700">
                                                                {invoice.reference_code || "Hệ thống"}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 font-semibold text-slate-800 align-top">
                                                        {invoice.order_id ? `#${invoice.order_id}` : "---"}
                                                    </td>
                                                    <td className="p-3 text-center align-top">
                                                        <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-black border border-slate-200 uppercase text-[10px]">
                                                            <Package className="w-3 h-3" />
                                                            {invoice.total_items || (invoice.items || []).length} dòng
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-center align-top">
                                                        <span className="inline-flex items-center justify-center gap-1 text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-black border border-teal-100 uppercase text-[10px]">
                                                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                            {isExpanded ? "Đang mở" : "Xem"}
                                                        </span>
                                                    </td>
                                                </tr>

                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan="5" className="p-0 bg-slate-50">
                                                            <div className="border-t border-outline-variant/50 p-4">
                                                                <div className="mb-3 flex items-center justify-between gap-3">
                                                                    <div>
                                                                        <p className="text-xs font-black uppercase tracking-wider text-slate-600">
                                                                            Danh sách vật tư trong hóa đơn
                                                                        </p>
                                                                        <p className="text-[11px] text-slate-500 font-medium mt-1">
                                                                            {invoice.items?.length || 0} dòng vật tư đã được xuất.
                                                                        </p>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            toggleRow(invoice.group_key);
                                                                        }}
                                                                        className="text-[11px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-700"
                                                                    >
                                                                        Thu gọn
                                                                    </button>
                                                                </div>

                                                                <div className="overflow-x-auto rounded-xl border border-outline-variant/50 bg-white">
                                                                    <table className="w-full text-left text-[11px] border-collapse">
                                                                        <thead>
                                                                            <tr className="bg-slate-100 text-slate-600 uppercase tracking-wider font-black border-b border-outline-variant/60">
                                                                                <th className="p-3">Mã vật tư</th>
                                                                                <th className="p-3">Tên vật tư</th>
                                                                                <th className="p-3 text-center">Số lượng xuất</th>
                                                                                <th className="p-3">Đơn vị</th>
                                                                                <th className="p-3">Ghi chú</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-outline-variant/40 font-medium">
                                                                            {(invoice.items || []).map((item) => (
                                                                                <tr key={item.id} className="hover:bg-slate-50">
                                                                                    <td className="p-3 font-black text-teal-700">{item.material_code}</td>
                                                                                    <td className="p-3 font-semibold text-slate-800">{item.material_name}</td>
                                                                                    <td className="p-3 text-center">
                                                                                        <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-black border border-rose-100 uppercase">
                                                                                            <ArrowUpRight className="w-3 h-3" />
                                                                                            {Math.abs(Number(item.quantity_change) || 0)}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td className="p-3 font-semibold text-slate-600">{item.unit_name || "Cai"}</td>
                                                                                    <td className="p-3 text-slate-500">{item.note || "---"}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
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
