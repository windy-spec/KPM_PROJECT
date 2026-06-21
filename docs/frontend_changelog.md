# Frontend Changelog (AI Integration & Warehouse Enhancements)

## 1. AI Chat History
* **Profile Integration:**
  * Added `AIChatHistoryTab.jsx` to render the user's AI session history inside the Profile Dashboard.
  * Added a clickable Modal that fetches and displays the detailed message trace, including AI drawing analyses.
* **Services:**
  * Updated `ai.service.js` with `getSessions()` and `getSessionDetails(id)` to map to the new backend endpoints.

## 2. Low Stock Warning (Admin)**
* **Admin Topbar UI:**
  * Integrated a Notification Bell icon with a pulsing red badge in `AdminTopbar.jsx` when there are low-stock materials.
  * Implemented a dropdown list that displays which materials are below the threshold (< 20 quantity).
* **API Service:**
  * Added a call to `GET /api/warehouse/inventory/low-stock` within `AdminTopbar.jsx`.

## 3. Order Workflow State Machine Update
* **Admin Dashboard (`ManageOrders.jsx`):**
  * Updated badge rendering colors, icons, and labels for `WAITING_WAREHOUSE`, `EXPORTING_WAREHOUSE`, `MANUFACTURING`, `SHIPPING`, `COMPLETED`, and `CANCELLED`.
  * Added buttons to transition orders between these stages, handling logical routing for Admin users (e.g. `MANUFACTURING` -> `SHIPPING`).
* **Warehouse Dashboard (`WarehouseDashboard.jsx` & `ExportRequestsPanel.jsx`):**
  * Updated `ExportRequestsPanel.jsx` to have two distinct tabs/sections:
    1. **Chờ Kiểm & Xuất Kho:** Orders in `WAITING_WAREHOUSE` state.
    2. **Đang Kiểm & Xuất Kho:** Orders in `EXPORTING_WAREHOUSE` state.
  * Added the `completeOrderExport` API call via `WarehouseDashboard.jsx` when the "Hoàn thành xuất" button is clicked, moving the order to `MANUFACTURING`.
