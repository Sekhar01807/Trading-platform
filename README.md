# 📈 PulseTrade — Full-Stack Stock Trading Platform

A production-grade stock trading and portfolio management application built with **Node.js, Express, React 19, WebSockets (Socket.io), MongoDB Atlas, Razorpay Sandbox, and Docker**.

![License](https://img.shields.io/badge/License-ISC-blue.svg)
![React](https://img.shields.io/badge/Frontend-React_19-blue)
![Node.js](https://img.shields.io/badge/Backend-Node.js_Express-green)
![Database](https://img.shields.io/badge/Database-MongoDB_Atlas-brightgreen)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-orange)
![Docker](https://img.shields.io/badge/DevOps-Docker_Compose-blue)

---

## 🏛️ System Architecture

```mermaid
flowchart TB
    subgraph ClientLayer [Client Presentation Layer]
        FE[React 19 Marketing Portal\n:5174]
        DASH[React 19 Trading Terminal\n:5173]
    end

    subgraph GatewayLayer [API Gateway & Middleware Layer]
        CORS[Strict CORS Allowlist]
        SEC[Security Headers nosniff/DENY/HSTS]
        RL[Layered Sliding-Window Rate Limiters]
        AUTH[JWT HttpOnly Cookie Auth]
        VAL[Declarative Request Validator]
        LOG[Structured JSON Logger & X-Request-Id]
    end

    subgraph ServiceLayer [Business Services & API Controllers]
        API_V1["API Version 1 Router (/api/v1)"]
        SWAGGER["OpenAPI 3.0 Swagger UI (/api-docs)"]
        HEALTH["Diagnostics Endpoint (/health)"]
        ORDER_SVC[OrderService: Concurrency Safe BUY/SELL]
        WALLET_SVC[WalletService: Idempotent Ledger]
        TICKER_SVC[MarketTickerService: Live Yahoo Finance]
    end

    subgraph DataLayer [Storage & Real-Time Engine]
        MONGO[(MongoDB Atlas Database)]
        SOCKET[[Socket.IO Authenticated Server]]
        YAHOO[Yahoo Finance NSE Quotes API]
        RZP[Razorpay Sandbox Gateway]
    end

    FE -->|HTTP / REST| CORS
    DASH -->|HTTP / REST & Axios Interceptors| CORS
    DASH <-->|Authenticated WebSocket| SOCKET

    CORS --> SEC --> RL --> LOG --> VAL --> AUTH --> API_V1
    API_V1 --> ORDER_SVC
    API_V1 --> WALLET_SVC
    API_V1 --> HEALTH
    API_V1 --> SWAGGER

    ORDER_SVC -->|Atomic Operations & Indexes| MONGO
    WALLET_SVC -->|Financial Audit Ledger| MONGO
    WALLET_SVC -->|HMAC-SHA256 Verification| RZP
    TICKER_SVC -->|Live Quote Polling| YAHOO
    TICKER_SVC -->|Broadcast Price Ticks| SOCKET
    TICKER_SVC -->|Sync Live LTP| MONGO
```

---

## 🗄️ Database Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USER ||--o{ HOLDING : owns
    USER ||--o{ POSITION : maintains
    USER ||--o{ ORDER : executes
    USER ||--o{ TRANSACTION : records
    USER ||--o{ PAYMENT_RECORD : verifies

    USER {
        ObjectId _id PK
        string email UK "Unique, Indexed"
        string username
        string password "Bcrypt Hashed"
        number funds "Trading Wallet Cash Balance"
        string phone
        string bio
        date createdAt
    }

    HOLDING {
        ObjectId _id PK
        ObjectId userId FK "Indexed, Compound UK (userId + name)"
        string name "Stock Symbol (e.g. INFY)"
        number qty "Quantity of Shares"
        number avg "Weighted Average Purchase Cost Basis"
        number price "Live Market Price (LTP)"
        string net "Net % Change"
        string day "Day % Change"
        boolean isLoss
        date updatedAt
    }

    POSITION {
        ObjectId _id PK
        ObjectId userId FK "Indexed"
        string product "CNC or MIS"
        string name "Stock Symbol"
        number qty "Position Quantity"
        number avg "Cost Basis"
        number price "Live Market Price"
        string net
        string day
        boolean isLoss
    }

    ORDER {
        ObjectId _id PK
        ObjectId userId FK "Indexed (userId + createdAt, userId + status)"
        string name "Stock Symbol"
        number qty "Quantity"
        number price "Execution Price"
        number marketPrice "Market Quote LTP"
        string mode "BUY or SELL"
        string productType "CNC or MIS"
        string orderType "MARKET or LIMIT"
        string status "EXECUTED, REJECTED, PENDING, CANCELLED"
        string failureReason "Detailed Error Cause if Rejected"
        number totalCost "Total Value in INR"
        date createdAt "Indexed"
    }

    TRANSACTION {
        ObjectId _id PK
        ObjectId userId FK "Indexed (userId + createdAt)"
        string type "DEPOSIT, WITHDRAWAL, ORDER_BUY, ORDER_SELL"
        number amount "INR Amount"
        number balanceBefore "Wallet Cash Before"
        number balanceAfter "Wallet Cash After"
        string status "SUCCESS, FAILED, PENDING"
        string referenceId "Order ID / Razorpay Payment ID"
        string description "Audit Log Note"
        date createdAt "Indexed"
    }

    PAYMENT_RECORD {
        ObjectId _id PK
        ObjectId userId FK "Indexed"
        string razorpay_payment_id UK "Unique Payment ID (Idempotency Key)"
        string razorpay_order_id "Razorpay Order ID"
        string razorpay_signature "HMAC-SHA256 Signature"
        number amount "Deposit Amount"
        string status "SUCCESS"
        date createdAt
    }
```

---

## 🚀 Key Features

- 💹 **Real-Time Stock Market Data**: Streaming live market price updates from Yahoo Finance API via WebSockets (`socket.io`) with JWT handshake authentication.
- 💼 **Transaction-Safe Order Execution**:
  - Atomic BUY order balance deductions (`{ funds: { $gte: totalCost } }`) eliminating double-spending race conditions.
  - Atomic SELL deductions (`{ qty: { $gte: qty } }`) eliminating overselling.
  - Automatic weighted average cost basis calculations (`avgCostBasis` vs `marketPrice` vs `executionPrice`).
  - Order state machine (`PENDING`, `EXECUTED`, `REJECTED`, `CANCELLED`).
- 📑 **Orders Pagination, Filtering & Search**:
  - Filter by `status` (EXECUTED / REJECTED), `mode` (BUY / SELL), and stock `symbol`.
  - Sort by date, price, quantity, or total cost (`asc` / `desc`).
  - Structured pagination metadata (`totalOrders`, `totalPages`, `hasNextPage`, `hasPrevPage`).
- 🔒 **Hardened Authentication & Session Security**:
  - Secure JWT session tokens stored exclusively in **`HttpOnly` cookies** with **zero JWT token exposure in JSON responses**.
  - Strict **CORS allowlist enforcement** on REST APIs and Socket.IO connections.
  - Layered sliding-window rate limiters (Global, Auth, Trading Orders, Wallet actions).
  - Production security headers (`nosniff`, `DENY`, `X-XSS-Protection`, `HSTS`).
- 💳 **Razorpay Sandbox Integration with Idempotency**:
  - Cryptographic server-side **HMAC-SHA256 signature verification**.
  - Unique payment ID tracking preventing duplicate crediting from replayed callbacks.
  - Immutable wallet transaction ledger (`TransactionModel`) recording before/after balances.
- 🩺 **System Diagnostics & Observability**:
  - JSON structured logging with correlation `X-Request-Id` and response latency tracking.
  - Rich health check endpoint (`/health` and `/api/v1/health`) reporting DB latency, memory, uptime, and active socket connections.
  - Interactive **OpenAPI 3.0 Swagger UI** documentation at `/api-docs`.
- 🎨 **Responsive Frontend & Modern State UX**:
  - Centralized Axios API client with interceptors and domain services.
  - Polished loading skeleton rows, actionable empty states with CTAs, and error retry banners.
  - Mobile-first responsive layouts with touch-friendly action windows and table scrolling.

---

## 🛠️ Tech Stack

### Frontend & Dashboard
- **React 19** + **Vite**
- **React Router 7**
- **Material UI (@mui/material)** + Custom Design System
- **Chart.js** & **react-chartjs-2**
- **Socket.io Client**
- **Axios Client Interceptors** + **React Toastify**

### Backend API
- **Node.js** & **Express**
- **MongoDB Atlas** with **Mongoose ODM**
- **Socket.io** Authenticated Server
- **Yahoo Finance API (`yahoo-finance2`)**
- **JSONWebTokens (`jsonwebtoken`)** & **bcryptjs**
- **Razorpay SDK** (Cryptographic HMAC-SHA256 Auditing)
- **OpenAPI 3.0 & Swagger UI**

### DevOps & Infrastructure
- **Docker** & **Docker Compose**
- **GitHub Actions** (Full-Stack CI Pipeline)
- **Jest** & **Supertest** (Real MongoDB Integration Testing)

---

## 📡 API Endpoints (Version 1: `/api/v1`)

| Method | Primary Endpoint | Legacy Alias | Description | Auth Required | Rate Limited |
|---|---|---|---|:---:|:---:|
| `GET` | `/api/v1/health` | `/health` | System diagnostics & DB ping latency | ❌ | ❌ |
| `GET` | `/api-docs` | `/api-docs` | Interactive OpenAPI 3.0 Swagger UI | ❌ | ❌ |
| `POST` | `/api/v1/auth/signup` | `/signup` | User account registration (sets HttpOnly cookie) | ❌ | 🔒 (20 / 15m) |
| `POST` | `/api/v1/auth/login` | `/login` | User login & HttpOnly cookie issuance | ❌ | 🔒 (20 / 15m) |
| `POST` | `/api/v1/auth/logout` | `/logout` | User logout & cookie clearance | ❌ | ❌ |
| `POST` | `/api/v1/auth/` | `/` | User session verification | 🔑 | ❌ |
| `GET` | `/api/v1/orders/allOrders` | `/allOrders` | Fetch user orders (supports page, limit, status, mode, symbol, sort) | 🔑 | ❌ |
| `POST` | `/api/v1/orders/newOrders` | `/newOrders` | Submit transaction-safe BUY / SELL stock order | 🔑 | 🔒 (30 / 1m) |
| `GET` | `/api/v1/holdings/allHoldings` | `/allHoldings` | Retrieve user stock holdings | 🔑 | ❌ |
| `GET` | `/api/v1/holdings/allPositions` | `/allPositions` | Retrieve user active positions | 🔑 | ❌ |
| `POST` | `/api/v1/holdings/seedDemoData` | `/seedDemoData` | Seed ₹50,000 demo portfolio | 🔑 | ❌ |
| `DELETE` | `/api/v1/holdings/resetPortfolio` | `/resetPortfolio` | Reset portfolio and funds to clean state | 🔑 | ❌ |
| `GET` | `/api/v1/wallet/user/funds` | `/user/funds` | Fetch available cash margin & total funds | 🔑 | ❌ |
| `POST` | `/api/v1/wallet/user/funds` | `/user/funds` | Deposit or withdraw funds from wallet | 🔑 | 🔒 (15 / 1m) |
| `POST` | `/api/v1/wallet/create-razorpay-order` | `/create-razorpay-order` | Create Razorpay test order | 🔑 | 🔒 (15 / 1m) |
| `POST` | `/api/v1/wallet/verify-razorpay-payment` | `/verify-razorpay-payment` | Verify HMAC-SHA256 signature with idempotency | 🔑 | 🔒 (15 / 1m) |
| `GET` | `/api/v1/wallet/user/transactions` | `/user/transactions` | Retrieve wallet audit transaction ledger | 🔑 | ❌ |

---

## 💻 Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/Sekhar01807/Trading-platform.git
cd Trading-platform
```

### 2. Configure Environment Variables
Copy `.env.example` in `Backend/` to `.env`:
```bash
ATLASDB_URL=mongodb+srv://...
TOKEN_KEY=your_jwt_secret_key
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
FRONTEND_URL=http://localhost:5174
DASHBOARD_URL=http://localhost:5173
```

### 3. Start Services

#### Run Backend API:
```bash
cd Backend
npm install
npm run dev   # Development mode with nodemon
# or npm start for production mode (node index.js)
```
- **API Health**: `http://localhost:3000/health`
- **Swagger Docs**: `http://localhost:3000/api-docs`

#### Run Dashboard:
```bash
cd dashboard
npm install
npm run dev
```

#### Run Frontend Marketing Portal:
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Running Automated Tests

Run the real MongoDB integration test suite:
```bash
cd Backend
npm test
```
