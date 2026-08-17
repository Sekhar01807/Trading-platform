import axios from "axios";
import { API_URL } from "../config";

// Centralized Axios HTTP Client
const apiClient = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json"
    }
});

// Request Interceptor
apiClient.interceptors.request.use(
    (config) => {
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        const status = error.response ? error.response.status : null;

        if (status === 401) {
            // Avoid looping if already on login/auth page
            if (typeof window !== "undefined" && !window.location.pathname.includes("/login") && !window.location.pathname.includes("/signup")) {
                // Session expired or unauthenticated
                window.dispatchEvent(new CustomEvent("unauthorizedSession"));
            }
        }

        return Promise.reject(error);
    }
);

// -------------------------------------------------------------
// Domain Specific API Services
// -------------------------------------------------------------

export const authApi = {
    signup: (data) => apiClient.post("/api/v1/auth/signup", data),
    login: (data) => apiClient.post("/api/v1/auth/login", data),
    logout: () => apiClient.post("/api/v1/auth/logout"),
    verifySession: () => apiClient.post("/api/v1/auth/"),
    updateProfile: (data) => apiClient.post("/api/v1/auth/updateProfile", data)
};

export const ordersApi = {
    getAllOrders: (params = {}) => apiClient.get("/api/v1/orders/allOrders", { params }),
    placeOrder: (orderData) => apiClient.post("/api/v1/orders/newOrders", orderData)
};

export const holdingsApi = {
    getAllHoldings: () => apiClient.get("/api/v1/holdings/allHoldings"),
    getAllPositions: () => apiClient.get("/api/v1/holdings/allPositions"),
    seedDemoData: () => apiClient.post("/api/v1/holdings/seedDemoData"),
    resetPortfolio: () => apiClient.delete("/api/v1/holdings/resetPortfolio")
};

export const walletApi = {
    getFunds: () => apiClient.get("/api/v1/wallet/user/funds"),
    updateFunds: (data) => apiClient.post("/api/v1/wallet/user/funds", data),
    createRazorpayOrder: (data) => apiClient.post("/api/v1/wallet/create-razorpay-order", data),
    verifyRazorpayPayment: (data) => apiClient.post("/api/v1/wallet/verify-razorpay-payment", data),
    getTransactions: () => apiClient.get("/api/v1/wallet/user/transactions")
};

export const systemApi = {
    getHealth: () => apiClient.get("/api/v1/health")
};

export default apiClient;
