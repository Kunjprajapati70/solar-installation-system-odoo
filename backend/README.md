# SunPower Solutions - Solar Installation Management System Backend

Enterprise-grade, secure, scalable, and modular backend architecture built with **Node.js, Express.js, MongoDB, Mongoose, JWT, Socket.IO, Multer, and QRCode**.

---

## 1. System Architecture Overview

The backend employs a **layered, decoupled enterprise architecture**:
- **Routes Layer (`src/routes/`)**: Declares REST endpoints and applies role-based authorization and upload middleware. Routes delegate directly to controllers.
- **Controllers Layer (`src/controllers/`)**: Handles HTTP request parsing, response formatting via `ApiResponse`, and delegates core business logic to services.
- **Services Layer (`src/services/`)**: Houses all domain business rules, BOM calculation algorithms, equipment movement machines, warranty lifecycle engines, payment reconciliation, and MongoDB aggregation pipelines.
- **Data Models Layer (`models/`)**: Mongoose schemas with indexed references, constraints, and timestamps.
- **Middleware Layer (`src/middleware/`)**: JWT verification (`auth.middleware.js`), role authorization (`role.middleware.js`), customer/technician data ownership verification (`ownership.middleware.js`), safe Multer file uploads (`upload.middleware.js`), and centralized error handling (`errorHandler.middleware.js`).
- **Real-Time Sockets (`src/sockets/`)**: Socket.IO room subscriptions (`user-:id`, `role-:role`, `customer-:id`) and instantaneous event broadcasting.
- **Utilities (`src/utils/`)**: Integer paise / INR rupee conversion (`currency.js`), standardized response envelope (`apiResponse.js`).

```
backend/
├── src/
│   ├── config/
│   │   ├── constants.js          # System roles, warranty durations, statuses
│   │   └── db.js                 # MongoDB connection & diagnostics
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── customer.controller.js
│   │   ├── customerPortal.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── enquiry.controller.js
│   │   ├── equipment.controller.js
│   │   ├── installation.controller.js
│   │   ├── inventory.controller.js
│   │   ├── notification.controller.js
│   │   ├── order.controller.js
│   │   ├── quotation.controller.js
│   │   ├── serviceTicket.controller.js
│   │   ├── setting.controller.js
│   │   ├── subsidy.controller.js
│   │   ├── survey.controller.js
│   │   ├── technician.controller.js
│   │   ├── transaction.controller.js
│   │   └── user.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── errorHandler.middleware.js
│   │   ├── ownership.middleware.js
│   │   ├── role.middleware.js
│   │   └── upload.middleware.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── customer.routes.js
│   │   ├── customerPortal.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── enquiry.routes.js
│   │   ├── equipment.routes.js
│   │   ├── expense.routes.js
│   │   ├── finance.routes.js
│   │   ├── installation.routes.js
│   │   ├── inventory.routes.js
│   │   ├── notification.routes.js
│   │   ├── order.routes.js
│   │   ├── quotation.routes.js
│   │   ├── report.routes.js
│   │   ├── serviceTicket.routes.js
│   │   ├── setting.routes.js
│   │   ├── subsidy.routes.js
│   │   ├── survey.routes.js
│   │   ├── technicianPortal.routes.js
│   │   ├── transaction.routes.js
│   │   ├── user.routes.js
│   │   └── warranty.routes.js
│   ├── services/
│   │   ├── analytics.service.js
│   │   ├── bom.service.js
│   │   ├── equipment.service.js
│   │   ├── installation.service.js
│   │   ├── notification.service.js
│   │   ├── payment.service.js
│   │   ├── qr.service.js
│   │   ├── serviceTicket.service.js
│   │   └── warranty.service.js
│   ├── sockets/
│   │   └── socketHandler.js
│   ├── utils/
│   │   ├── apiResponse.js
│   │   └── currency.js
│   ├── validators/
│   │   └── input.validator.js
│   ├── app.js
│   └── server.js
├── models/
├── uploads/
├── .env.example
├── package.json
├── postman_collection.json
├── testEndpoints.js
└── README.md
```

---

## 2. Core Business Rules Enforced

1. **Survey Approval Gate**:
   A quotation **cannot** be created unless its associated site survey has status `approved`. Attempting to generate a quotation on an unapproved survey throws a `400 Bad Request` with a business rule violation message.
2. **Server-Calculated Financials & BOM**:
   Frontend totals are never trusted. All Bill of Materials (BOM) equipment quantities, gross amounts, PM Surya Ghar central subsidies, net payable figures, and advance requirements are calculated deterministically on the server.
3. **Smart Equipment QR Lifecycle**:
   Every physical equipment unit has an immutable, unique uppercase serial number and generated QR code. Lifecycle states (`in_stock` $\rightarrow$ `reserved` $\rightarrow$ `dispatched` $\rightarrow$ `installed` $\rightarrow$ `under_service`) enforce inventory availability and record movement history trails.
4. **Delivery-Triggered Warranty Start**:
   Warranties **never** start at quotation, order creation, or warehouse dispatch. Warranty coverage activates strictly upon confirmed delivery (`deliveryConfirmedAt`), calculating expiry duration by equipment category (Solar Panels: 240 months, Inverters: 24 months, Batteries: 24 months, Structure: 60 months).
5. **Automated Service Ticket Warranty Billing**:
   Raising a service complaint performs a real-time serial lookup. If the equipment has an active warranty, `customerCharge` is automatically enforced at **₹0.00**. For out-of-warranty repairs, itemized parts and labour costs are computed.
6. **Technician Job Protection**:
   Technicians can only access installation jobs assigned to them. Server timestamps govern start times, quality testing ($V_{oc}, I_{sc}$, earthing $\Omega$), site photo uploads, and customer sign-off.
7. **Customer Portal Identity & Ownership**:
   All `/api/customer-portal/*` endpoints resolve customer identity strictly from the authenticated JWT token (`req.user._id`), never trusting IDs passed in request parameters.

---

## 3. Dedicated API Endpoints

### Customer Portal (`/api/customer-portal`)
- `GET /profile` — Retrieve authenticated customer profile.
- `GET /orders` — View customer's solar orders and installation stages.
- `GET /quotations` — View customer's approved and active quotations.
- `GET /payments` — View verified receipts and transactions.
- `GET /installations` — View progress and assigned technicians.
- `GET /equipment` — View serialized equipment and specs.
- `GET /warranties` — View active warranty certificates and expiry dates.
- `GET /service-tickets` — View service complaints and resolution history.
- `POST /service-tickets` — Raise a service complaint with automatic serial warranty lookup.
- `GET /notifications` — Customer notification stream.

### Technician Portal (`/api/technicians` & `/api/installations`)
- `GET /api/technicians/me/jobs` — Retrieve assigned installation jobs.
- `GET /api/technicians/me/jobs/:id` — View specific job details.
- `GET /api/technicians/me/hours` — Retrieve verified working hours calculated from server timestamps.
- `POST /api/installations/:id/start` — Start job timer on server.
- `PUT /api/installations/:id/progress` — Update milestone step check.
- `POST /api/installations/:id/photos` — Upload and attach site photos (Multer).
- `PUT /api/installations/:id/testing` — Record $V_{oc}, I_{sc}$, earthing resistance, and generation check.
- `POST /api/installations/:id/complete` — Submit customer acceptance signature and trigger delivery confirmation.

### Smart Equipment & QR Code (`/api/equipment`)
- `POST /api/equipment` — Register equipment with unique serial and generated QR code.
- `GET /api/equipment` — Paginated list with search and category filters.
- `GET /api/equipment/serial/:serialNumber` — Safe scanner lookup.
- `GET /api/equipment/:id/qr` — Get Base64 PNG and vector SVG QR data.
- `POST /api/equipment/:id/dispatch` — Validate warehouse stock and dispatch to site.
- `POST /api/equipment/:id/deliver` — Confirm on-site delivery.
- `POST /api/equipment/:id/install` — Mark equipment as commissioned.
- `GET /api/equipment/:id/history` — Audit trail of movements.

### Automatic Warranty Management (`/api/warranty`)
- `GET /api/warranty` — List all warranty certificates.
- `GET /api/warranty/serial/:serialNumber` — Lookup warranty by serial number.
- `GET /api/warranty/summary` — Active, Expired, and Upcoming counts.
- `POST /api/warranty/check-eligibility` — Diagnostic warranty claim verification.

### Real-Time Dashboard & Reports (`/api/dashboard` & `/api/reports`)
- `GET /api/dashboard/stats` — Revenue from confirmed payments, profit, installed kW, open tickets.
- `GET /api/dashboard/revenue-expenses` — 12-month area chart data for Recharts.
- `GET /api/dashboard/installations` — Installation pipeline distribution for Recharts.
- `GET /api/dashboard/capacity` — Capacity by system type (`on_grid`, `off_grid`, `hybrid`).
- `GET /api/dashboard/service-tickets` — Breakdown by category and status.
- `GET /api/dashboard/inventory` — Stock levels and reorder alerts.
- `GET /api/reports/summary` — High-level executive business summary.
- `GET /api/reports/profitability` — Reconciled profitability report.
- `GET /api/reports/technician-hours` — Technician hours and performance ratings.

---

## 4. Setup and Installation

### Prerequisites
- Node.js (v18+)
- MongoDB (Running on `localhost:27017` or remote MongoDB Atlas connection string)

### Environment Configuration
Create `.env` based on `.env.example`:
```bash
cp .env.example .env
```
Default configuration:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/solar_installation_db
JWT_SECRET=sunpower_enterprise_solar_secret_key_2026_jwt
JWT_EXPIRE=30d
NODE_ENV=development
```

### Installation
```bash
npm install
```

### Database Seeding
Populates realistic solar inventory, 15 technicians, customers, serial equipment with QR codes, orders, warranties, and financial transactions:
```bash
npm run seed
```

### Start Server
```bash
# Production mode
npm start

# Development mode with hot reload
npm run dev
```

---

## 5. Automated Verification & Testing

Run the automated integration test suite covering all 18 modules and business rule constraints:
```bash
node testEndpoints.js
```
Expected output:
```
🧪 ========================================================
🧪 STARTING SUNPOWER SOLUTIONS BACKEND INTEGRATION TEST SUITE
🧪 ========================================================

  ✅ PASS: Health Check
  ✅ PASS: Admin Authentication (JWT Login)
  ✅ PASS: Technician Authentication
  ✅ PASS: Customer Authentication
  ✅ PASS: Customer Portal: GET /profile
  ✅ PASS: Customer Portal: GET /orders
  ✅ PASS: Customer Portal: GET /warranties
  ✅ PASS: Technician Portal: GET /me/jobs
  ✅ PASS: Technician Portal: GET /me/hours
  ✅ PASS: Site Survey Creation (Scheduled status)
  ✅ PASS: Business Rule 1: Quotation blocked until Site Survey approval
  ✅ PASS: Survey Approval: PUT /surveys/:id/approve
  ✅ PASS: Server-side BOM & Pricing Calculation on Approved Survey
  ✅ PASS: Order Creation & Milestone Pipeline Initialization
  ✅ PASS: Equipment List: GET /equipment
  ✅ PASS: QR Code Serial Lookup: GET /equipment/serial/:serialNumber
  ✅ PASS: QR Code Image Generation: GET /equipment/:id/qr
  ✅ PASS: Warranty Summary: GET /warranty/summary
  ✅ PASS: Warranty Eligibility Check: POST /warranty/check-eligibility
  ✅ PASS: Service Ticket Creation with Automated Diagnosis
  ✅ PASS: Financial Transaction Logging & Order Balance Reconciliation
  ✅ PASS: Dashboard KPI Aggregation: GET /dashboard/stats
  ✅ PASS: Monthly Revenue vs Expenses Chart Data (12 Months): GET /dashboard/revenue-expenses
  ✅ PASS: Installation Pipeline Aggregation: GET /dashboard/installations
  ✅ PASS: Capacity by System Type: GET /dashboard/capacity
  ✅ PASS: Finance Overview: GET /finance/summary
  ✅ PASS: Technician Performance Report: GET /reports/technician-hours

========================================================
TEST SUMMARY: 27 PASSED, 0 FAILED
========================================================
🎉 ALL ENTERPRISE API SPECIFICATIONS VERIFIED SUCCESSFULLY!
```

---

## 6. Postman Collection
Import `postman_collection.json` directly into Postman. It includes pre-configured environment variables (`baseUrl`, `adminToken`, `techToken`, `custToken`) and organized request folders for every portal and feature.
