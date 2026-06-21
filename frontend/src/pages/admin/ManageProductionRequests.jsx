import React, { useState, useEffect } from "react";
import orderService from "../../services/order.service";
import {
    CheckCircle,
    Loader2,
    AlertCircle,
    Cpu,
    Layers,
    ShoppingBag,
    Eye,
    ListFilter
} from "lucide-react";

const ManageProductionRequests = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submittingId, setSubmittingId] = useState(null);
    const [alert, setAlert] = useState({ type: "", msg: "" });

    // Tab hiện tại: "PENDING" (Chờ bóc tách định mức) hoặc "ALL" (Tất cả yêu cầu/đơn hàng)
    const [activeTab, setActiveTab] = useState("PENDING");

    // Hàm fetch dữ liệu tập trung từ API Orders
    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await orderService.getAllOrders();
            setOrders(res?.data || res || []);
        } catch (err) {
            console.error("Lỗi tải danh sách lệnh sản xuất:", err);
            setAlert({ type: "error", msg: "Không thể tải danh sách lệnh yêu cầu sản xuất từ hệ thống." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Xử lý phê duyệt lệnh và bóc tách định mức kỹ thuật chuyển giao sang kho
    const handleApproveAndProcessSnapshot = async (orderId) => {
        if (!window.confirm(`Xác nhận phê duyệt yêu cầu #${orderId}? Hệ thống sẽ bóc tách cấu trúc thành phần (components) thành mật độ vật tư kỹ thuật và chuyển giao trạng thái sang bộ phận Kho.`)) {
            return;
        }

        setSubmittingId(orderId);
        setAlert({ type: "", msg: "" });

        try {
            // Gọi API approveOrderAndRequestMaterials đã được thiết lập ở Backend
            await orderService.approveOrderAndRequestMaterials(orderId);

            setAlert({
                type: "success",
                msg: `Phê duyệt thành công yêu cầu #${orderId}! Định mức kỹ thuật đã bóc tách snapshot và chuyển tiếp sang lệnh chờ xuất kho.`
            });

            // Reload dữ liệu để cập nhật trạng thái mới nhất
            await fetchOrders();
        } catch (err) {
            console.error(err);
            setAlert({
                type: "error",
                msg: err.response?.data?.message || "Lỗi trong quá trình xử lý bóc tách định mức kỹ thuật sản xuất!"
            });
        } finally {
            setSubmittingId(null);
        }
    };

    // Logic lọc dữ liệu phía client dựa trên Tab đang active
    const filteredOrders = orders.filter((order) => {
        if (activeTab === "PENDING") {
            return order.production_status?.toUpperCase() === "PENDING";
        }
        return true; // Tab "ALL": hiển thị toàn bộ trạng thái lệnh
    });

    // Đếm số lượng lệnh đang xếp hàng chờ duyệt bóc tách để hiển thị badge nhấp nháy
    const pendingCount = orders.filter(o => o.production_status?.toUpperCase() === "PENDING").length;

    return (
        <div className="bg-white p-6 rounded-2xl border border-outline-variant/70 shadow-sm">

            {/* Khối Header điều khiển và các Tab chuyển đổi */}
            <div className="mb-6 border-b border-slate-100 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                        {activeTab === "PENDING" ? (
                            <>
                                <Cpu className="w-5 h-5 text-teal-600 animate-pulse" /> Điều Phối & Phê Duyệt Sản Xuất
                            </>
                        ) : (
                            <>
                                <ShoppingBag className="w-5 h-5 text-primary" /> Quản Lý Yêu Cầu Sản Xuất Tổng Hợp
                            </>
                        )}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        {activeTab === "PENDING"
                            ? "Xử lý bóc tách dữ liệu cấu trúc kỹ thuật sản phẩm nhân tỉ lệ hao hụt thành thông số vật tư chính xác để chuyển giao bộ phận Kho."
                            : "Theo dõi trạng thái, luồng đi và tiến độ của tất cả các lệnh sản xuất trong hệ thống."}
                    </p>
                </div>

                {/* Bộ điều hướng Tab Filter */}
                <div className="flex bg-slate-100 p-1 rounded-xl items-center self-start md:self-auto text-xs font-bold">
                    <button
                        onClick={() => setActiveTab("PENDING")}
                        className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${activeTab === "PENDING"
                            ? "bg-white text-teal-700 shadow-sm"
                            : "text-slate-500 hover:text-slate-800"
                            }`}
                    >
                        <span>Chờ Tính Định Mức</span>
                        {pendingCount > 0 && (
                            <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black animate-bounce">
                                {pendingCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("ALL")}
                        className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${activeTab === "ALL"
                            ? "bg-white text-primary shadow-sm"
                            : "text-slate-500 hover:text-slate-800"
                            }`}
                    >
                        <ListFilter className="w-3.5 h-3.5" />
                        <span>Tất Cả Yêu Cầu ({orders.length})</span>
                    </button>
                </div>
            </div>

            {/* Hiển thị Banner Alert thông báo trạng thái */}
            {alert.msg && (
                <div className={`mb-5 p-4 rounded-xl flex items-start gap-3 border text-sm font-semibold ${alert.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                    }`}>
                    {alert.type === "success" ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                    <span>{alert.msg}</span>
                </div>
            )}

            {/* Danh sách dữ liệu dạng Bảng */}
            {loading ? (
                <div className="flex flex-col items-center justify-center p-12 text-slate-400 text-xs font-bold gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-teal-600" /> Đang đồng bộ danh sách yêu cầu sản xuất từ máy chủ...
                </div>
            ) : (
                <div className="overflow-x-auto border border-outline-variant/60 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-700 uppercase font-black border-b border-outline-variant tracking-wider text-[11px]">
                                <th className="p-4">Mã lệnh sản xuất</th>
                                <th className="p-4">Thông tin khách hàng</th>
                                <th className="p-4">Sản phẩm kỹ thuật</th>
                                <th className="p-4 text-center">Trạng thái sản xuất</th>
                                <th className="p-4 text-right">Thao tác xử lý</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/40 font-semibold text-slate-600">
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">

                                    {/* Mã Lệnh */}
                                    <td className="p-4 font-bold text-slate-900">#SX_{order.id}</td>

                                    {/* Khách hàng */}
                                    <td className="p-4">
                                        <p className="font-bold text-slate-800">{order.users?.username || "Khách vãng lai"}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">{order.users?.email}</p>
                                    </td>

                                    {/* Thành phần cấu tạo của sản phẩm */}
                                    <td className="p-4 max-w-xs">
                                        <div className="space-y-1">
                                            {order.order_items?.map((item, idx) => (
                                                <div key={idx} className="bg-slate-100 px-2 py-1 rounded text-[11px] text-slate-700 truncate">
                                                    {item.products?.product_name || "Sản phẩm kỹ thuật"} (x{item.quantity})
                                                </div>
                                            ))}
                                        </div>
                                    </td>

                                    {/* Trạng thái Production Status */}
                                    <td className="p-4 text-center">
                                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-full border ${order.production_status?.toUpperCase() === "PENDING"
                                            ? "bg-amber-50 border-amber-200 text-amber-700 animate-pulse"
                                            : "bg-blue-50 border-blue-200 text-blue-700"
                                            }`}>
                                            {order.production_status?.toUpperCase() === "PENDING" ? "Chờ Tính Định Mức" : order.production_status}
                                        </span>
                                    </td>

                                    {/* Actions */}
                                    <td className="p-4 text-right flex items-center justify-end gap-2 h-full py-6">
                                        {order.production_status?.toUpperCase() === "PENDING" && (
                                            <button
                                                onClick={() => handleApproveAndProcessSnapshot(order.id)}
                                                disabled={submittingId === order.id}
                                                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold rounded-lg transition-all flex items-center gap-1.5 ml-auto cursor-pointer text-[10px] uppercase tracking-wider shadow-sm"
                                            >
                                                {submittingId === order.id ? (
                                                    <>
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                        Đang bóc tách...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Layers className="w-3 h-3" />
                                                        Duyệt & Bóc Tách
                                                    </>
                                                )}
                                            </button>
                                        )}
                                        <button className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 cursor-pointer">
                                            <Eye className="w-3.5 h-3.5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {/* No Data */}
                            {filteredOrders.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="text-center p-10 text-slate-400 font-medium italic">
                                        Hiện tại danh mục này không có yêu cầu sản xuất nào.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ManageProductionRequests;