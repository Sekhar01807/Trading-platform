// Centralized API & Service Configuration
const isProduction = typeof window !== "undefined" && 
    window.location.hostname !== "localhost" && 
    window.location.hostname !== "127.0.0.1";

export const API_URL = import.meta.env.VITE_API_URL || (isProduction ? "https://pulsetrade-zygv.onrender.com" : "http://localhost:3000");
export const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || (isProduction ? "https://dashboard-lilac-nu-83.vercel.app" : "http://localhost:5173");
