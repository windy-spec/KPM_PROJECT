# Backend Changelog (AI Integration & Warehouse Enhancements)

## 1. AI Chat History
* **Endpoints Added:**
  * `GET /api/ai/sessions`: Fetches all AI chat sessions for the logged-in user.
  * `GET /api/ai/sessions/:id`: Fetches the detailed message history and drawing analyses for a specific session.
* **Controllers & Services:**
  * Added `getSessions` and `getSessionDetails` in `ai.controller.js` and `ai.service.js`.
  * Utilizes Prisma to query `ai_chat_sessions`, `ai_chat_messages`, and `ai_drawing_analyses`.

## 2. Warehouse & Inventory Enhancements
* **Seeding:**
  * Created `seed_inventory.js` to automatically generate `quantity` and `leftover_amount` for existing materials, recording them in `inventory_logs`.
* **Low Stock API:**
  * Added `GET /api/warehouse/inventory/low-stock` to fetch items with quantity < 20.
  * Added `getLowStock` method in `warehouse.controller.js` and `warehouse.service.js`.

## 3. Order Workflow State Machine
* **New Statuses:** 
  * Replaced/Added new constants for `production_status`: `WAITING_WAREHOUSE`, `EXPORTING_WAREHOUSE`, `MANUFACTURING`, `SHIPPING`, `COMPLETED`, `CANCELLED`.
* **Export Process Logic:**
  * `POST /api/warehouse/orders/:orderId/confirm-materials`: Verifies stock. If sufficient, transitions order to `EXPORTING_WAREHOUSE`.
  * `POST /api/warehouse/orders/:orderId/complete-export`: Completes the warehouse export process, transitioning order to `MANUFACTURING`.
