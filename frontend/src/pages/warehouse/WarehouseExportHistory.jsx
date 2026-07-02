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
    Boxes,
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
        <div className="bg-white rounded-2xl border border-outline-variant/70 shadow-sm flex flex-col h-full min-h-[500px] relative">
            <div className="p-5 border-b border-outline-variant/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-container/20">
                <div>
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-on-surface flex items-center gap-2">
                        <History className="w-5 h-5 text-primary" /> Lịch sử phiếu xuất kho
                    </h2>
                    <p className="text-xs text-on-surface-variant font-medium mt-1">
                        Theo dõi toàn bộ các phiếu xuất kho đã được xử lý cho sản xuất
                    </p>
                </div>

                <div className="relative w-full lg:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Tìm mã đơn, mã vật tư..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setPage(1);
                        }}
                        className="w-full pl-9 pr-4 py-2.5 bg-surface-container/50 border border-outline-variant/60 rounded-xl text-xs font-semibold text-on-surface outline-none focus:border-primary"
                    />
                </div>
            </div>

            <div className="p-5 flex-1 overflow-auto">

            {error && (
                <div className="mb-4 flex items-center gap-2 text-error bg-error/10 p-3 rounded-lg text-sm font-semibold">
                    <AlertCircle className="w-5 h-5" /> {error}
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3 text-on-surface-variant">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-sm font-bold uppercase tracking-wider">Đang tải dữ liệu...</span>
                </div>
            ) : (
                <div className="border border-outline-variant/50 rounded-xl bg-surface-container/30 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-surface-container/40 border-b border-outline-variant/40 text-[10px] font-black uppercase tracking-[0.15em] text-on-surface-variant/80">
                                    <th className="p-4 rounded-tl-xl">Thời gian xuất</th>
                                    <th className="p-4">Mã hóa đơn</th>
                                    <th className="p-4">Đơn hàng tham chiếu</th>
                                    <th className="p-4 text-center">Số dòng vật tư</th>
                                    <th className="p-4 text-center rounded-tr-xl">Xem chi tiết</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/30 text-xs font-semibold text-on-surface-variant">
                                {currentTableData.length > 0 ? (
                                    currentTableData.map((invoice) => {
                                        const isExpanded = expandedRows.includes(invoice.group_key);

                                        return (
                                            <React.Fragment key={invoice.group_key}>
                                                <tr
                                                    className={`transition-colors cursor-pointer ${isExpanded ? "bg-surface-container/40" : "hover:bg-surface-container/20"}`}
                                                    onClick={() => toggleRow(invoice.group_key)}
                                                >
                                                    <td className="p-4 text-slate-600 font-semibold align-top">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="w-3.5 h-3.5 text-primary" />
                                                            {formatDate(invoice.created_at)}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 font-bold text-on-surface align-top">
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="w-3.5 h-3.5 text-primary" />
                                                            <span className="font-mono text-[11px] font-black text-primary">
                                                                {invoice.reference_code || "Hệ thống"}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 font-semibold text-on-surface-variant align-top">
                                                        {invoice.order_id ? `#${invoice.order_id}` : "---"}
                                                    </td>
                                                    <td className="p-4 text-center align-top">
                                                        <span className="inline-flex items-center gap-1 text-primary bg-primary/10 px-2.5 py-1 rounded-full font-black border border-primary/20 uppercase text-[10px]">
                                                            <Package className="w-3 h-3" />
                                                            {invoice.total_items || (invoice.items || []).length} dòng
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center align-top">
                                                        <span className="inline-flex items-center justify-center gap-1 text-primary bg-surface-container px-2.5 py-1 rounded-full font-black border border-outline-variant/60 uppercase text-[10px]">
                                                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                            {isExpanded ? "Đang mở" : "Xem"}
                                                        </span>
                                                    </td>
                                                </tr>

                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan="5" className="p-0 bg-surface-container/20">
                                                            <div className="border-t border-outline-variant/50 p-4">
                                                                <div className="mb-3 flex items-center justify-between gap-3">
                                                                    <div>
                                                                        <p className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant">
                                                                            Danh sách vật tư trong hóa đơn
                                                                        </p>
                                                                        <p className="text-[11px] text-on-surface-variant/70 font-medium mt-1">
                                                                            {invoice.items?.length || 0} dòng vật tư đã được xuất.
                                                                        </p>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            toggleRow(invoice.group_key);
                                                                        }}
                                                                        className="text-[11px] font-black uppercase tracking-[0.2em] text-on-surface-variant hover:text-primary"
                                                                    >
                                                                        Thu gọn
                                                                    </button>
                                                                </div>

                                                                <div className="overflow-x-auto rounded-xl border border-outline-variant/50 bg-white">
                                                                    <table className="w-full text-left text-[11px] border-collapse">
                                                                        <thead>
                                                                            <tr className="bg-surface-container/40 text-on-surface-variant uppercase tracking-[0.15em] font-black border-b border-outline-variant/50">
                                                                                <th className="p-3">Mã vật tư</th>
                                                                                <th className="p-3">Tên vật tư</th>
                                                                                <th className="p-3 text-center">Số lượng xuất</th>
                                                                                <th className="p-3">Đơn vị</th>
                                                                                <th className="p-3">Ghi chú</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-outline-variant/30 font-medium">
                                                                            {(invoice.items || []).map((item) => (
                                                                                <tr key={item.id} className="hover:bg-surface-container/20">
                                                                                    <td className="p-3 font-black text-primary">{item.material_code}</td>
                                                                                    <td className="p-3 font-semibold text-on-surface">{item.material_name}</td>
                                                                                    <td className="p-3 text-center">
                                                                                        <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full font-black border border-rose-100 uppercase">
                                                                                            <ArrowUpRight className="w-3 h-3" />
                                                                                            {Math.abs(Number(item.quantity_change) || 0)}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td className="p-3 font-semibold text-on-surface-variant">{item.unit_name || "Cai"}</td>
                                                                                    <td className="p-3 text-on-surface-variant/80">{item.note || "---"}</td>
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
                                        <td colSpan="5" className="p-8 text-center text-on-surface-variant/70 font-semibold text-xs">
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
        </div>
    );
};

export default WarehouseExportHistory;
