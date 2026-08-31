// Centralized API & Service Configuration
const isLocalhost = typeof window !== "undefined" && (
    window.location.hostname === "localhost" || 
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "0.0.0.0" ||
    window.location.hostname === "::1" ||
    window.location.hostname.startsWith("192.168.") ||
    window.location.hostname.startsWith("10.") ||
    window.location.hostname.startsWith("172.")
);

const getLocalDashboardUrl = () => {
    if (typeof window !== "undefined") {
        return `${window.location.protocol}//${window.location.hostname}:5173`;
    }
    return "http://localhost:5173";
};

const getLocalApiUrl = () => {
    if (typeof window !== "undefined") {
        return `${window.location.protocol}//${window.location.hostname}:3000`;
    }
    return "http://localhost:3000";
};

export const API_URL = isLocalhost
    ? (import.meta.env.VITE_API_URL && (import.meta.env.VITE_API_URL.includes("localhost") || import.meta.env.VITE_API_URL.includes("127.0.0.1")) ? import.meta.env.VITE_API_URL : getLocalApiUrl())
    : (import.meta.env.VITE_API_URL || "https://pulsetrade-zygv.onrender.com");

export const DASHBOARD_URL = isLocalhost
    ? (import.meta.env.VITE_DASHBOARD_URL && (import.meta.env.VITE_DASHBOARD_URL.includes("localhost") || import.meta.env.VITE_DASHBOARD_URL.includes("127.0.0.1")) ? import.meta.env.VITE_DASHBOARD_URL : getLocalDashboardUrl())
    : (import.meta.env.VITE_DASHBOARD_URL || "https://dashboard-lilac-nu-83.vercel.app");

