// Centralized API & Service Configuration
const isProduction = typeof window !== "undefined" && 
    window.location.hostname !== "localhost" && 
    window.location.hostname !== "127.0.0.1";

export const API_URL = import.meta.env.VITE_API_URL || (isProduction ? "https://pulsetrade-zygv.onrender.com" : "http://localhost:3000");
export const LANDING_URL = import.meta.env.VITE_LANDING_URL || (isProduction ? "https://frontend-seven-phi-94.vercel.app" : "http://localhost:5174");
