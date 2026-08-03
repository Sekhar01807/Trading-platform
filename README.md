# 📈 Zerodha Full-Stack Trading Platform

A production-ready full-stack stock trading and portfolio management application built with **Node.js, Express, React 19, WebSockets (Socket.io), MongoDB, and Docker**.

![License](https://img.shields.io/badge/License-ISC-blue.svg)
![React](https://img.shields.io/badge/Frontend-React_19-blue)
![Node.js](https://img.shields.io/badge/Backend-Node.js_Express-green)
![Database](https://img.shields.io/badge/Database-MongoDB_Atlas-brightgreen)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-orange)
![Docker](https://img.shields.io/badge/DevOps-Docker_Compose-blue)

---

## 🚀 Key Features

- 💹 **Real-Time Stock Market Data**: Streaming live market price updates from Yahoo Finance API via WebSockets (`socket.io`).
- 💼 **Portfolio & Position Management**: Dynamic BUY/SELL order execution automatically updates stock holdings and average cost basis.
- 🔒 **User Authentication & Session Security**: Secure JWT authentication with HTTP-only cookies and user data isolation.
- 📊 **Interactive Data Visualization**: Integrated Chart.js stock analytics, portfolio distribution charts, and market depth views.
- 🐳 **Dockerized Full-Stack Architecture**: Single-command container deployment via `docker compose up`.
- 🧪 **Automated Testing & CI/CD**: Unit & integration test coverage with Jest + Supertest, automatically verified on GitHub Actions.

---

## 🛠️ Tech Stack

### Frontend & Dashboard
- **React 19** + **Vite**
- **React Router 7**
- **Material UI (@mui/material)** + Custom CSS
- **Chart.js** & **react-chartjs-2**
- **Socket.io Client**
- **Axios** + **React Toastify**

### Backend API
- **Node.js** & **Express**
- **MongoDB Atlas** with **Mongoose ODM**
- **Socket.io** Server
- **Yahoo Finance API (`yahoo-finance2`)**
- **JSONWebTokens (`jsonwebtoken`)** & **bcryptjs**

### DevOps & Infrastructure
- **Docker** & **Docker Compose**
- **GitHub Actions** (CI Pipeline)
- **Jest** & **Supertest**

---

## 📁 Repository Structure

```text
Zerodha/
├── Backend/              # Express REST API & WebSocket Server
│   ├── Controllers/     # Route logic handlers
│   ├── Middlewares/     # Authentication & request validation
│   ├── model/           # Mongoose schemas & data models
│   ├── tests/           # Jest & Supertest test suites
│   ├── index.js         # API entry point & WebSocket setup
│   └── Dockerfile       # Backend container definition
├── dashboard/            # React Dashboard SPA (Portfolio & Orders)
│   ├── src/components/  # Stock chart, holdings, & buy/sell action windows
│   └── Dockerfile       # Dashboard container definition
├── frontend/             # React Marketing & Auth Portal SPA
│   ├── src/landing_page/# Hero, About, Products, Pricing & Auth pages
│   └── Dockerfile       # Frontend container definition
├── docker-compose.yml    # Full-stack Docker orchestration
└── README.md
```

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

### 2. Start Services

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

Run the backend test suite:
```bash
cd Backend
npm test
```

---

## 📡 Key API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/signup` | User account registration | ❌ |
| `POST` | `/login` | User login & JWT issuance | ❌ |
| `GET` | `/allHoldings` | Retrieve user stock holdings | 🔑 |
| `GET` | `/allPositions` | Retrieve user active positions | 🔑 |
| `GET` | `/allOrders` | Retrieve user order history | 🔑 |
| `POST` | `/newOrders` | Submit BUY / SELL stock order | 🔑 |
