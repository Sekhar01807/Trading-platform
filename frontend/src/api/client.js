import axios from "axios";
import { API_URL } from "../config";

const apiClient = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json"
    }
});

export const authApi = {
    signup: (data) => apiClient.post("/api/v1/auth/signup", data),
    login: (data) => apiClient.post("/api/v1/auth/login", data),
    logout: () => apiClient.post("/api/v1/auth/logout"),
    verifySession: () => apiClient.post("/api/v1/auth/")
};

export const systemApi = {
    getHealth: () => apiClient.get("/api/v1/health")
};

export default apiClient;
