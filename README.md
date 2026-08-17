# 📈 PulseTrade — Full-Stack Stock Trading Platform

A modern full-stack stock trading and portfolio management application built with **Node.js, Express, React 19, WebSockets (Socket.io), MongoDB Atlas, Razorpay Sandbox, and Docker**.

![License](https://img.shields.io/badge/License-ISC-blue.svg)
![React](https://img.shields.io/badge/Frontend-React_19-blue)
![Node.js](https://img.shields.io/badge/Backend-Node.js_Express-green)
![Database](https://img.shields.io/badge/Database-MongoDB_Atlas-brightgreen)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-orange)
![Docker](https://img.shields.io/badge/DevOps-Docker_Compose-blue)

---

## 🚀 Key Features

- 💹 **Real-Time Stock Market Data**: Streaming live market price updates from Yahoo Finance API via WebSockets (`socket.io`).
- 💼 **Portfolio & Position Management**: Dynamic BUY/SELL order execution automatically updating holdings, average price basis, and available margins.
- 🔒 **Hardened Authentication & Session Security**:
  - Secure JWT session tokens stored exclusively in **`HttpOnly` cookies** (mitigating XSS / JavaScript token theft).
  - Strict **CORS allowlist enforcement** on both REST APIs and Socket.IO connections.
  - Brute-force rate limiting on authentication routes (`/login`, `/signup`).
  - Production security headers (`nosniff`, `DENY`, `X-XSS-Protection`, `HSTS`).
- 💳 **Razorpay Payment Gateway (Test Mode / Paper Trading)**:
  - Integrated Razorpay Checkout modal for simulated wallet deposits.
  - Server-side cryptographic **HMAC-SHA256 signature verification** before crediting funds.
  - Clearly operated in **Test / Sandbox Mode** for portfolio simulations (supports Netbanking and UPI test flows).
- 📊 **Interactive Data Visualization**: Integrated Chart.js stock analytics, portfolio distribution charts, and market depth order books.
- 🐳 **Dockerized Full-Stack Architecture**: Single-command container deployment via `docker compose up`.
- 🧪 **Automated Integration Testing**: Real backend integration test suite with Jest + Supertest verifying routes, authentication, order validation, and signature verification.

---

## 🛠️ Tech Stack

### Frontend & Dashboard
- **React 19** + **Vite**
- **React Router 7**
- **Material UI (@mui/material)** + Custom CSS Design System
- **Chart.js** & **react-chartjs-2**
- **Socket.io Client**
- **Axios** + **React Toastify**

### Backend API
- **Node.js** & **Express**
- **MongoDB Atlas** with **Mongoose ODM**
- **Socket.io** Server
- **Yahoo Finance API (`yahoo-finance2`)**
- **JSONWebTokens (`jsonwebtoken`)** & **bcryptjs**
- **Razorpay SDK** (HMAC-SHA256 Signature Verification)

### DevOps & Infrastructure
- **Docker** & **Docker Compose**
- **GitHub Actions** (CI Pipeline)
- **Jest** & **Supertest**

---

## 📁 Repository Structure

```text
PulseTrade/
├── Backend/              # Express REST API & WebSocket Server
│   ├── Controllers/     # Route logic handlers (Auth, Profile)
│   ├── Middlewares/     # Authentication & request validation
│   ├── model/           # Mongoose schemas & data models (User, Holding, Order, Position)
│   ├── tests/           # Real integration test suites (Supertest + Jest)
│   ├── index.js         # API entry point, CORS configuration & WebSocket engine
│   └── Dockerfile       # Backend container definition
├── dashboard/            # React Trading Terminal (Portfolio, Watchlist, Orders & Funds)
│   ├── src/components/  # Market charts, holdings, buy/sell action windows, funds modal
│   └── Dockerfile       # Dashboard container definition
├── frontend/             # React Marketing & Landing Portal SPA
│   ├── src/landing_page/# Hero, About, Products, Pricing & Auth pages
│   └── Dockerfile       # Frontend container definition
├── docker-compose.yml    # Full-stack Docker orchestration
└── README.md
```

---

## 💳 Payment Gateway (Razorpay Sandbox)

PulseTrade uses Razorpay's Standard Checkout in **Test Mode** to simulate real-world wallet deposits for paper trading.

### How it works:
1. **Order Creation**: Client calls `POST /create-razorpay-order` to generate a Razorpay order ID.
2. **Checkout Modal**: Client launches Razorpay's Standard Checkout SDK (`checkout.js`).
3. **Server-Side Verification**: Once paid, client submits `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature` to `POST /verify-razorpay-payment`.
4. **HMAC-SHA256 Audit**: The backend independently computes `HMAC-SHA256(order_id + "|" + payment_id, secret)` and compares it against the signature. Only cryptographically verified payments credit the user's trading wallet.

> 💡 **Demo Tip**: In the Razorpay popup, select **Netbanking (SBI/HDFC)** or **UPI** to instantly simulate test deposits without real money.

---

## 💻 Local Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Git](https://git-scm.com/)
- [Docker Desktop](https://www.docker.com/) *(optional for container run)*

### 1. Clone the repository
```bash
git clone https://github.com/Sekhar01807/Trading-platform.git
cd Trading-platform
```

### 2. Configure Environment Variables
Copy `.env.example` in `Backend/` to `.env` and fill in your keys:
```bash
ATLASDB_URL=mongodb+srv://...
TOKEN_KEY=your_jwt_secret_key
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
FRONTEND_URL=http://localhost:5174
DASHBOARD_URL=http://localhost:5173
```

### 3. Start Services

#### Option A: Running with Docker Compose (Recommended)
```bash
docker compose up --build
```
- **Backend API**: `http://localhost:3000`
- **Dashboard**: `http://localhost:5173`
- **Frontend**: `http://localhost:5174`

#### Option B: Running Services Manually

##### Backend:
```bash
cd Backend
npm install
npm start
```

##### Dashboard:
```bash
cd dashboard
npm install
npm run dev
```

##### Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Running Automated Tests

Run the real backend integration test suite:
```bash
cd Backend
npm test
```

---

## 📡 Key API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/` | API health check & service status | ❌ |
| `POST` | `/signup` | User account registration | ❌ |
| `POST` | `/login` | User login & `HttpOnly` JWT issuance | ❌ |
| `POST` | `/logout` | User logout & cookie clearance | ❌ |
| `POST` | `/` | User session verification | 🔑 |
| `GET` | `/user/funds` | Fetch wallet cash, spent margins & balance | 🔑 |
| `POST` | `/user/funds` | Add / withdraw wallet funds | 🔑 |
| `POST` | `/create-razorpay-order` | Create Razorpay test order | 🔑 |
| `POST` | `/verify-razorpay-payment` | Verify HMAC-SHA256 signature & credit funds | 🔑 |
| `GET` | `/allHoldings` | Retrieve user stock holdings | 🔑 |
| `GET` | `/allPositions` | Retrieve user active positions | 🔑 |
| `GET` | `/allOrders` | Retrieve user order history | 🔑 |
| `POST` | `/newOrders` | Submit BUY / SELL stock order | 🔑 |
| `POST` | `/seedDemoData` | Load initial ₹50,000 test portfolio | 🔑 |
| `DELETE` | `/resetPortfolio` | Reset portfolio to ₹0.00 clean state | 🔑 |
