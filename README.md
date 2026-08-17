# 📈 PulseTrade — Full-Stack Paper-Trading Platform

> **Full-stack paper-trading platform for simulated stock trading and portfolio management.**

---

### 🛡️ Tech Stack & Badges

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)](https://opensource.org/licenses/ISC)
[![React 19](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite_7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js_18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express 5](https://img.shields.io/badge/Express_5-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Socket.io](https://img.shields.io/badge/Socket.io_4-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![JWT HttpOnly](https://img.shields.io/badge/JWT_Auth-HttpOnly_Cookies-FF6C37?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Razorpay Sandbox](https://img.shields.io/badge/Razorpay-Sandbox_Gateway-0C2340?style=for-the-badge&logo=razorpay&logoColor=white)](https://razorpay.com/)
[![Docker Compose](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![GitHub Actions CI](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/features/actions)
[![Jest & Supertest](https://img.shields.io/badge/Tests-Jest_%26_Supertest-C21325?style=for-the-badge&logo=jest&logoColor=white)](https://jestjs.io/)
[![Swagger OpenAPI](https://img.shields.io/badge/OpenAPI_3.0-Swagger_UI-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](https://swagger.io/)

---

> [!NOTE]
> **Product Disclaimer & Scope**: **PulseTrade** is an educational paper-trading simulator and portfolio management application. It allows users to practice simulated stock trading and track virtual portfolios using market data feeds. It does **not** route live trades to real financial exchanges (such as NSE/BSE) and has no affiliation with Zerodha Broking Ltd. or any registered stock broker.

---

## 🏛️ System Architecture

PulseTrade is structured with a clean, decoupled layered backend architecture:

```
                      React
                        │
                        ▼
                Axios / Socket.IO
                        │
                        ▼
                Express API Server
                        │
            ┌───────────┴───────────┐
            │                       │
       Auth Middleware        Validation
            │                       │
            └───────────┬───────────┘
                        ▼
                   Controllers
                        │
                        ▼
                    Services
                        │
          ┌─────────────┼─────────────┐
          │             │             │
        Users         Orders       Portfolio
          │             │             │
          └─────────────┼─────────────┘
                        ▼
                    MongoDB
                        │
                        ▼
                Transaction Layer
```

```mermaid
flowchart TB
    subgraph ClientLayer [1. Client Presentation Layer]
        FE["React 19 Marketing & Landing Portal"]
        DASH["React 19 Trading Terminal"]
    end

    subgraph SecurityLayer [2. Security & Middleware Layer]
        SEC["Security Headers & CORS Allowlist"]
        RL["Rate Limiters (Auth, Orders, Wallet)"]
        LOG["Structured JSON Logger (X-Request-Id)"]
        VAL["Centralized Declarative Validator"]
        AUTH["JWT HttpOnly Cookie Auth Middleware"]
    end

    subgraph ServiceLayer [3. Business Services Layer]
        AUTH_SVC["AuthService: Hashing, Session Management"]
        ORDER_SVC["OrderService: Concurrency Safe BUY/SELL & Weighted Cost Basis"]
        HOLDING_SVC["HoldingService: Holdings, Positions & Demo Seeding"]
        WALLET_SVC["WalletService: Ledger Auditing & Razorpay Verification"]
        TICKER_SVC["MarketTickerService: Live Market Data Streaming"]
    end

    subgraph DataLayer [4. Storage & Persistence Layer]
        MONGO[("MongoDB Atlas")]
        SOCKET[["Socket.IO Engine"]]
        YAHOO["Yahoo Finance Market Data Feed"]
        RZP["Razorpay Sandbox Gateway"]
    end

    FE -->|REST API Calls| SEC
    DASH -->|Axios Client Interceptors| SEC
    DASH <-->|WebSocket Stream| SOCKET

    SEC --> RL --> LOG --> VAL --> AUTH
    AUTH --> AUTH_SVC
    AUTH --> ORDER_SVC
    AUTH --> HOLDING_SVC
    AUTH --> WALLET_SVC

    ORDER_SVC -->|Atomic Operations & Transactions| MONGO
    WALLET_SVC -->|Financial Audit Ledger| MONGO
    WALLET_SVC -->|HMAC-SHA256 Verification| RZP
    HOLDING_SVC -->|Holdings & Cost Basis| MONGO
    TICKER_SVC -->|Market Data Polling| YAHOO
    TICKER_SVC -->|Broadcast Price Ticks| SOCKET
```

---

## 📸 Product Walkthrough & Screenshots

| Trading Terminal & Holdings Analytics | Live Stock Watchlist & Market Depth |
|:---:|:---:|
| ![Trading Terminal Dashboard](/docs/screenshots/dashboard_holdings.png)<br><sub>*Dynamic portfolio valuation, weighted average cost basis, and P&L charts*</sub> | ![Live Watchlist](/docs/screenshots/watchlist_ticker.png)<br><sub>*Real-time NSE stock ticker via authenticated WebSockets*</sub> |

| Transaction-Safe Order Action Window | Wallet & Razorpay Sandbox Deposit Modal |
|:---:|:---:|
| ![Order Execution Modal](/docs/screenshots/order_execution.png)<br><sub>*Atomic BUY/SELL modal with balance validation*</sub> | ![Razorpay Deposit Modal](/docs/screenshots/wallet_funds.png)<br><sub>*Simulated UPI/Netbanking deposits with HMAC-SHA256 signature auditing*</sub> |

| OpenAPI 3.0 Interactive Swagger UI | System Diagnostics & Health Status |
|:---:|:---:|
| ![Swagger UI Docs](/docs/screenshots/swagger_docs.png)<br><sub>*Interactive API testing at `/api-docs`*</sub> | ![Health Endpoint](/docs/screenshots/health_diagnostics.png)<br><sub>*System uptime, database latency & memory stats at `/health`*</sub> |

---

## ⚡ Quick Demo & Test Credentials

Experience PulseTrade with pre-configured sandbox credentials or instant demo data seeding:

### Option A: One-Click Demo Seeding
1. Register or Log in to the [Trading Terminal](http://localhost:5173).
2. Navigate to **Holdings** and click **"Load Demo Portfolio"**.
3. Instantly loads a **₹50,000 simulated balance** and **12 active NSE equity holdings** with real-time price tickers.

### Option B: Test Credentials
| Role | Email | Password | Initial Balance |
|---|---|---|:---:|
| **Demo Trader** | `demo@pulsetrade.com` | `DemoTrader123!` | ₹50,000 (Simulated) |

### Option C: Simulated Razorpay Sandbox Deposit
1. Go to the **Funds** tab and click **"+ Add Funds"**.
2. Enter any amount (e.g. ₹10,000).
3. In the Razorpay Checkout popup, select **Netbanking (SBI / HDFC)** or **UPI** to simulate verified deposits without real money.

---

## 🔑 Core Engineering & Business Logic Gaps Addressed

### 1. Server-Enforced Order Validation (GAP 1)
- **BUY Validation**: The backend independently validates that `available balance >= (qty * price)`. If insufficient, the order is rejected with status `REJECTED`, logging a clear failure reason without touching funds or holdings.
- **SELL Validation**: The backend validates that `shares owned >= requested quantity`. If a user attempts to sell shares they do not own, or more shares than they have, the order is rejected immediately.
- Never trust frontend calculations for balances or quantities.

### 2. Race Conditions & Atomic Concurrency Safety (GAP 2)
- Prevents double-spending and overselling when concurrent requests arrive simultaneously (e.g. two simultaneous ₹800 BUY orders with only a ₹1,000 balance).
- Employs atomic conditional updates (`{ _id: userId, funds: { $gte: totalCost } }` and `{ userId, name, qty: { $gte: qty } }`) with automatic rollback compensation on failure.

### 3. Realistic Order Model & Pricing Separation (GAP 3 & 4)
- **Order Model**: Includes `orderId`, `userId`, `symbol` / `name`, `side` / `mode` (`BUY` / `SELL`), `quantity` / `qty`, `requestedPrice`, `executedPrice`, `marketPrice`, `status` (`PENDING`, `EXECUTED`, `FILLED`, `REJECTED`, `CANCELLED`), `failureReason`, `totalCost`, and timestamps.
- **Price Separation**: Distinguishes requested market price (`requestedPrice` / `marketPrice`) from actual simulated fill execution price (`executedPrice`).

### 4. Layered Security & Centralized Validation (GAP 5 & 6)
- **Zero-Token Exposure**: Strict `HttpOnly: true` cookies with zero JWT tokens exposed in JSON payloads.
- **Brute-Force Rate Limiting**: Dedicated auth rate limiter (10 attempts / 15 mins) plus global and trading rate limiters.
- **Centralized Validation Middleware**: Validates inputs (emails, password strength, positive integers for quantities, valid order modes) before reaching controllers.
- **Generic Auth Errors**: Both unknown users and bad passwords return `"Incorrect email address or password"` to prevent user enumeration.

### 5. Clean Architectural Separation (GAP 7)
- Strict separation of concerns across every domain:
  `Route -> Middleware -> Controller -> Service -> Model`
- Controllers handle HTTP transport, while `AuthService`, `OrderService`, `HoldingService`, and `WalletService` encapsulate business logic.

### 6. Strict User Isolation & Access Control (GAP 8 & 9)
- All authenticated endpoints (`/allOrders`, `/allHoldings`, `/allPositions`, `/user/funds`, `/user/transactions`) are strictly scoped to the authenticated `req.userId`.
- Rigorously verified through integration tests ensuring User A can never read or mutate User B's portfolio or order records.

### 7. Transparent Market Data Presentation (GAP 10)
- Accurately presented as a paper-trading platform that simulates trading using market data polled from Yahoo Finance, supplemented with synthetic micro-ticks outside market hours.

### 8. Standardized Error Handling & Observability (GAP 11 & 12)
- Structured error middleware mapping status codes (400, 401, 403, 404, 409, 429, 500) without exposing stack traces in production.
- Structured JSON logging with correlation IDs (`X-Request-Id`) and response latency metrics.

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
        string password "Bcrypt Hashed (Salt factor 12)"
        number funds "Trading Wallet Balance"
        string phone
        string bio
        date createdAt
    }

    HOLDING {
        ObjectId _id PK
        ObjectId userId FK "Compound Unique Index (userId + name)"
        string name "Stock Symbol"
        number qty "Quantity Owned"
        number avg "Weighted Average Purchase Cost Basis"
        number price "Live Market Price (LTP)"
        string net "Net Percentage Change"
        string day "Day Percentage Change"
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
        ObjectId userId FK "Compound Indexes (userId + createdAt, userId + status)"
        string name "Stock Symbol"
        string symbol "Symbol Alias"
        number qty "Order Quantity"
        number quantity "Quantity Alias"
        number price "Execution Fill Price"
        number requestedPrice "Requested / Limit Price"
        number executedPrice "Simulated Fill Price"
        number marketPrice "Market LTP"
        string mode "BUY or SELL"
        string side "BUY or SELL"
        string productType "CNC or MIS"
        string orderType "MARKET or LIMIT"
        string status "EXECUTED, FILLED, REJECTED, PENDING, CANCELLED"
        string failureReason "Error details if rejected"
        number totalCost "Total Cost Value"
        date createdAt "Indexed"
    }

    TRANSACTION {
        ObjectId _id PK
        ObjectId userId FK "Compound Index (userId + createdAt)"
        string type "DEPOSIT, WITHDRAWAL, ORDER_BUY, ORDER_SELL"
        number amount "Transaction INR Amount"
        number balanceBefore "Balance Prior to Transaction"
        number balanceAfter "Balance Post Transaction"
        string status "SUCCESS, FAILED, PENDING"
        string referenceId "Order ID / Razorpay Payment ID"
        string description "Audit Log Details"
        date createdAt "Indexed"
    }

    PAYMENT_RECORD {
        ObjectId _id PK
        ObjectId userId FK "Indexed"
        string razorpay_payment_id UK "Unique Idempotency Key"
        string razorpay_order_id "Razorpay Order ID"
        string razorpay_signature "HMAC-SHA256 Signature"
        number amount "Deposit Amount"
        string status "SUCCESS"
        date createdAt
    }
```

---

## 📡 API Reference (`/api/v1`)

Access the interactive **Swagger UI** documentation at **[`http://localhost:3000/api-docs`](http://localhost:3000/api-docs)**.

| HTTP Method | Version 1 Path | Legacy Alias | Description | Auth Required | Rate Limited |
|:---:|---|---|---|:---:|:---:|
| `GET` | `/api/v1/health` | `/health` | System diagnostics, uptime & DB ping latency | ❌ | ❌ |
| `GET` | `/api-docs` | `/api-docs` | Interactive OpenAPI 3.0 Swagger UI | ❌ | ❌ |
| `POST` | `/api/v1/auth/signup` | `/signup` | User account registration (sets HttpOnly cookie) | ❌ | 🔒 (10 / 15m) |
| `POST` | `/api/v1/auth/login` | `/login` | User login & HttpOnly session cookie issuance | ❌ | 🔒 (10 / 15m) |
| `POST` | `/api/v1/auth/logout` | `/logout` | User logout & cookie clearance | ❌ | ❌ |
| `POST` | `/api/v1/auth/` | `/` | User session verification | 🔑 | ❌ |
| `GET` | `/api/v1/orders/allOrders` | `/allOrders` | Retrieve user orders with pagination, filtering & sorting | 🔑 | ❌ |
| `POST` | `/api/v1/orders/newOrders` | `/newOrders` | Submit transaction-safe BUY / SELL stock order | 🔑 | 🔒 (30 / 1m) |
| `GET` | `/api/v1/holdings/allHoldings` | `/allHoldings` | Retrieve user stock holdings & cost basis | 🔑 | ❌ |
| `GET` | `/api/v1/holdings/allPositions` | `/allPositions` | Retrieve user active intraday positions | 🔑 | ❌ |
| `POST` | `/api/v1/holdings/seedDemoData` | `/seedDemoData` | Seed ₹50,000 demo portfolio with 12 stocks | 🔑 | ❌ |
| `DELETE` | `/api/v1/holdings/resetPortfolio` | `/resetPortfolio` | Reset portfolio, orders & wallet to clean state | 🔑 | ❌ |
| `GET` | `/api/v1/wallet/user/funds` | `/user/funds` | Fetch available cash margins & wallet balance | 🔑 | ❌ |
| `POST` | `/api/v1/wallet/user/funds` | `/user/funds` | Deposit or withdraw funds from wallet | 🔑 | 🔒 (15 / 1m) |
| `POST` | `/api/v1/wallet/create-razorpay-order` | `/create-razorpay-order` | Create Razorpay Sandbox test order | 🔑 | 🔒 (15 / 1m) |
| `POST` | `/api/v1/wallet/verify-razorpay-payment` | `/verify-razorpay-payment` | Verify HMAC-SHA256 signature with idempotency | 🔑 | 🔒 (15 / 1m) |
| `GET` | `/api/v1/wallet/user/transactions` | `/user/transactions` | Retrieve wallet audit transaction ledger | 🔑 | ❌ |

---

## 🧪 Test Coverage & Verification

PulseTrade features a real integration test suite with Jest and Supertest running against MongoDB:

```bash
cd Backend
npm test
```

### Integration Test Breakdown

| Test Category | Critical Business Logic Verified | Status |
|---|---|:---:|
| **Health & Observability** | Health endpoint (`/health`), OpenAPI JSON, Swagger UI, `X-Request-Id` correlation tracking | ✅ Passed |
| **Authentication & Security** | Signup validation, duplicate email rejection, HttpOnly cookies, zero-token JSON, generic login errors | ✅ Passed |
| **BUY Order Engine** | Atomic balance deduction, insufficient funds rejection (`status: REJECTED`), holding creation, weighted cost basis math | ✅ Passed |
| **SELL Order Engine** | Atomic holding deduction, overselling rejection, selling unowned stock rejection, proceeds crediting, holding removal upon 0 qty | ✅ Passed |
| **Portfolio Math** | Multi-purchase weighted average price (`(5*1000 + 5*1200)/10 = 1100 avg`), partial sell cost basis preservation | ✅ Passed |
| **User Isolation** | User A cannot see User B's orders, holdings, positions, funds, or wallet transactions | ✅ Passed |
| **Pagination & Filtering** | Pagination metadata (`page`, `limit`, `totalPages`), mode filter (`BUY`/`SELL`), symbol search, price/date sorting | ✅ Passed |
| **Wallet & Idempotency** | Atomic ADD/WITHDRAW, overdrawing prevention, HMAC-SHA256 verification, replay attack prevention | ✅ Passed |
| **Backward Compatibility** | Legacy root routes (`/allHoldings`, `/user/funds`, `/allOrders`, `/newOrders`) | ✅ Passed |

---

## 💻 Local Development Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Git](https://git-scm.com/)
- [MongoDB Atlas](https://www.mongodb.com/atlas) account (or local MongoDB)

### 2. Clone the Repository
```bash
git clone https://github.com/Sekhar01807/Trading-platform.git
cd Trading-platform
```

### 3. Configure Environment Variables
Copy `.env.example` in `Backend/` to `.env`:
```env
PORT=3000
NODE_ENV=development
ATLASDB_URL=mongodb+srv://<user>:<password>@cluster.mongodb.net/pulsetrade
TOKEN_KEY=your_secure_jwt_secret_key_here
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
FRONTEND_URL=http://localhost:5174
DASHBOARD_URL=http://localhost:5173
```

### 4. Run Services

#### Start Backend API & WebSocket Server:
```bash
cd Backend
npm install
npm run dev
```
- API Health Check: `http://localhost:3000/health`
- Interactive Swagger UI: `http://localhost:3000/api-docs`

#### Start Dashboard Trading Terminal:
```bash
cd dashboard
npm install
npm run dev
```
- Accessible at `http://localhost:5173`

#### Start Marketing Portal:
```bash
cd frontend
npm install
npm run dev
```
- Accessible at `http://localhost:5174`

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
