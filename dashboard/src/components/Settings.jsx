import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { LANDING_URL, API_URL } from "../config";

// Material UI Icons
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import SecurityIcon from "@mui/icons-material/Security";
import TuneIcon from "@mui/icons-material/Tune";
import PaletteIcon from "@mui/icons-material/Palette";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import LockResetIcon from "@mui/icons-material/LockReset";
import DevicesIcon from "@mui/icons-material/Devices";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";

const Settings = ({ user }) => {
    const navigate = useNavigate();

    // Password form state
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Trading Preferences state (Loaded from localStorage or defaults)
    const [tradingPrefs, setTradingPrefs] = useState({
        defaultOrderType: localStorage.getItem("pulsetrade_orderType") || "MARKET",
        defaultProductType: localStorage.getItem("pulsetrade_productType") || "CNC",
        orderConfirmation: localStorage.getItem("pulsetrade_orderConfirmation") === "true",
        defaultQuantity: Number(localStorage.getItem("pulsetrade_defaultQty")) || 1
    });

    // Appearance Preferences state
    const [appearancePrefs, setAppearancePrefs] = useState({
        theme: localStorage.getItem("pulsetrade_theme") || "light",
        density: localStorage.getItem("pulsetrade_density") || "comfortable",
        notifications: localStorage.getItem("pulsetrade_notifications") !== "false"
    });

    // Danger Zone state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);

    // Password change handler
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (!passwordData.currentPassword) {
            toast.error("Please enter your current password");
            return;
        }
        if (!passwordData.newPassword || passwordData.newPassword.length < 8) {
            toast.error("New password must be at least 8 characters long");
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }

        setIsChangingPassword(true);
        try {
            const { data } = await axios.post(
                `${API_URL}/change-password`,
                {
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                },
                { withCredentials: true }
            );

            if (data.success) {
                toast.success("Password updated successfully!");
                setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                toast.error(data.message || "Failed to change password");
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Failed to change password. Please check your credentials.";
            toast.error(errorMsg);
        } finally {
            setIsChangingPassword(false);
        }
    };

    // Trading preferences save
    const handleTradingPrefChange = (key, value) => {
        const updated = { ...tradingPrefs, [key]: value };
        setTradingPrefs(updated);
        localStorage.setItem(
            key === "defaultOrderType" ? "pulsetrade_orderType" :
            key === "defaultProductType" ? "pulsetrade_productType" :
            key === "orderConfirmation" ? "pulsetrade_orderConfirmation" : "pulsetrade_defaultQty",
            value
        );
        toast.info("Trading preferences saved!");
    };

    // Appearance preferences save
    const handleAppearanceChange = (key, value) => {
        const updated = { ...appearancePrefs, [key]: value };
        setAppearancePrefs(updated);
        localStorage.setItem(
            key === "theme" ? "pulsetrade_theme" :
            key === "density" ? "pulsetrade_density" : "pulsetrade_notifications",
            value
        );
        toast.info("Appearance preferences saved!");
    };

    // Single session logout
    const handleLogout = async () => {
        try {
            await axios.post(`${API_URL}/logout`, {}, { withCredentials: true });
        } catch (e) {}
        window.location.href = LANDING_URL;
    };

    // Sign out from all devices
    const handleLogoutAll = async () => {
        if (window.confirm("Are you sure you want to sign out of all active sessions and devices?")) {
            try {
                await axios.post(`${API_URL}/logout-all`, {}, { withCredentials: true });
                toast.success("Signed out from all devices successfully!");
            } catch (e) {}
            window.location.href = LANDING_URL;
        }
    };

    // Delete account permanently
    const handleDeleteAccount = async (e) => {
        e.preventDefault();
        if (!deletePassword) {
            toast.error("Please enter your password to confirm deletion");
            return;
        }

        setIsDeletingAccount(true);
        try {
            const { data } = await axios.post(
                `${API_URL}/delete-account`,
                { password: deletePassword },
                { withCredentials: true }
            );

            if (data.success) {
                toast.success("Your account has been deleted.");
                setTimeout(() => {
                    window.location.href = LANDING_URL;
                }, 1000);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Failed to delete account. Incorrect password.";
            toast.error(errorMsg);
            setIsDeletingAccount(false);
        }
    };

    const traderCode = `PT-${(user?.id || "9842").toString().substring(0, 6).toUpperCase()}`;

    return (
        <div style={{ padding: "30px 20px", maxWidth: "980px", margin: "0 auto", color: "#0F172A", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
            
            {/* Header */}
            <div style={{ marginBottom: "28px" }}>
                <h2 style={{ margin: "0 0 6px 0", fontWeight: "800", fontSize: "1.8rem", color: "#0F172A", letterSpacing: "-0.5px" }}>
                    Settings & Preferences
                </h2>
                <p style={{ margin: 0, color: "#64748B", fontSize: "0.95rem" }}>
                    Manage your account details, security credentials, order placement defaults, and UI preferences.
                </p>
            </div>

            {/* 1. Account Section */}
            <div style={{ background: "#FFFFFF", borderRadius: "20px", border: "1px solid #E2E8F0", padding: "28px", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)", marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h3 style={{ margin: 0, fontWeight: "700", color: "#0F172A", fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "10px" }}>
                        <PersonOutlineIcon style={{ color: "#2563EB", fontSize: "1.4rem" }} /> Account Information
                    </h3>
                    <Link to="/profile" style={{ textDecoration: "none" }}>
                        <button
                            style={{
                                background: "#EFF6FF",
                                color: "#2563EB",
                                border: "1px solid #BFDBFE",
                                padding: "8px 16px",
                                borderRadius: "10px",
                                fontWeight: "700",
                                fontSize: "0.85rem",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px"
                            }}
                        >
                            <EditIcon style={{ fontSize: "0.95rem" }} /> Edit Profile Details
                        </button>
                    </Link>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                    <div style={{ background: "#F8FAFC", padding: "16px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                        <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: "700", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Full Name</span>
                        <strong style={{ fontSize: "1rem", color: "#0F172A" }}>{user?.username || "Trader"}</strong>
                    </div>

                    <div style={{ background: "#F8FAFC", padding: "16px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                        <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: "700", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Email Address</span>
                        <strong style={{ fontSize: "1rem", color: "#0F172A" }}>{user?.email || "N/A"}</strong>
                    </div>

                    <div style={{ background: "#F8FAFC", padding: "16px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                        <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: "700", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Client Trader Code</span>
                        <strong style={{ fontSize: "1rem", color: "#2563EB" }}>{traderCode}</strong>
                    </div>
                </div>
            </div>

            {/* 2. Security Section */}
            <div style={{ background: "#FFFFFF", borderRadius: "20px", border: "1px solid #E2E8F0", padding: "28px", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)", marginBottom: "24px" }}>
                <h3 style={{ margin: "0 0 20px 0", fontWeight: "700", color: "#0F172A", fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "10px" }}>
                    <SecurityIcon style={{ color: "#10B981", fontSize: "1.4rem" }} /> Security & Credentials
                </h3>

                {/* Password Change Form */}
                <div style={{ background: "#F8FAFC", borderRadius: "14px", border: "1px solid #E2E8F0", padding: "20px", marginBottom: "24px" }}>
                    <h4 style={{ margin: "0 0 14px 0", fontWeight: "700", color: "#0F172A", fontSize: "1rem", display: "flex", alignItems: "center", gap: "6px" }}>
                        <LockResetIcon style={{ color: "#2563EB", fontSize: "1.2rem" }} /> Change Password
                    </h4>

                    <form onSubmit={handlePasswordChange} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", alignItems: "flex-end" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
                                Current Password
                            </label>
                            <input
                                type="password"
                                placeholder="Enter current password..."
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "0.9rem", outline: "none", background: "#FFFFFF" }}
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
                                New Password (min 8 chars)
                            </label>
                            <input
                                type="password"
                                placeholder="Enter new password..."
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "0.9rem", outline: "none", background: "#FFFFFF" }}
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                placeholder="Confirm new password..."
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "0.9rem", outline: "none", background: "#FFFFFF" }}
                            />
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isChangingPassword}
                                style={{
                                    width: "100%",
                                    background: "#2563EB",
                                    color: "#FFFFFF",
                                    border: "none",
                                    padding: "11px 20px",
                                    borderRadius: "8px",
                                    fontWeight: "700",
                                    fontSize: "0.9rem",
                                    cursor: isChangingPassword ? "not-allowed" : "pointer",
                                    opacity: isChangingPassword ? 0.7 : 1,
                                    transition: "all 0.2s"
                                }}
                            >
                                {isChangingPassword ? "Updating..." : "Update Password"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Active Sessions & Sign Out Controls */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                    <div style={{ background: "#F8FAFC", padding: "18px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <ShieldOutlinedIcon style={{ color: "#10B981", fontSize: "1.2rem" }} />
                            <strong style={{ fontSize: "0.95rem", color: "#0F172A" }}>Authentication Security</strong>
                        </div>
                        <p style={{ margin: "0 0 12px 0", color: "#64748B", fontSize: "0.85rem" }}>
                            JWT HttpOnly cookie authentication active. Protected against CSRF and XSS injection.
                        </p>
                        <span style={{ fontSize: "0.75rem", background: "#DCFCE7", color: "#15803D", padding: "4px 8px", borderRadius: "6px", fontWeight: "700" }}>
                            Status: Secure & Authenticated
                        </span>
                    </div>

                    <div style={{ background: "#F8FAFC", padding: "18px", borderRadius: "12px", border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                                <DevicesIcon style={{ color: "#2563EB", fontSize: "1.2rem" }} />
                                <strong style={{ fontSize: "0.95rem", color: "#0F172A" }}>Session Revocation</strong>
                            </div>
                            <p style={{ margin: "0 0 12px 0", color: "#64748B", fontSize: "0.85rem" }}>
                                Invalidate all active login sessions across all your browsers and devices.
                            </p>
                        </div>
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                            <button
                                onClick={handleLogout}
                                style={{
                                    background: "#F1F5F9",
                                    color: "#475569",
                                    border: "1px solid #CBD5E1",
                                    padding: "8px 14px",
                                    borderRadius: "8px",
                                    fontWeight: "600",
                                    fontSize: "0.8rem",
                                    cursor: "pointer"
                                }}
                            >
                                Sign Out Current
                            </button>
                            <button
                                onClick={handleLogoutAll}
                                style={{
                                    background: "#FEF2F2",
                                    color: "#EF4444",
                                    border: "1px solid #FCA5A5",
                                    padding: "8px 14px",
                                    borderRadius: "8px",
                                    fontWeight: "700",
                                    fontSize: "0.8rem",
                                    cursor: "pointer"
                                }}
                            >
                                Sign Out All Devices
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Trading Preferences Section */}
            <div style={{ background: "#FFFFFF", borderRadius: "20px", border: "1px solid #E2E8F0", padding: "28px", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)", marginBottom: "24px" }}>
                <h3 style={{ margin: "0 0 20px 0", fontWeight: "700", color: "#0F172A", fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "10px" }}>
                    <TuneIcon style={{ color: "#F59E0B", fontSize: "1.4rem" }} /> Trading Preferences
                </h3>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
                    
                    {/* Default Order Type */}
                    <div style={{ background: "#F8FAFC", padding: "18px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "#0F172A", marginBottom: "4px" }}>
                            Default Order Type
                        </label>
                        <span style={{ display: "block", fontSize: "0.75rem", color: "#64748B", marginBottom: "12px" }}>
                            Auto-selected when placing new orders
                        </span>
                        <div style={{ display: "flex", gap: "8px" }}>
                            {["MARKET", "LIMIT"].map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => handleTradingPrefChange("defaultOrderType", type)}
                                    style={{
                                        flex: 1,
                                        padding: "8px",
                                        borderRadius: "8px",
                                        fontWeight: "700",
                                        fontSize: "0.85rem",
                                        cursor: "pointer",
                                        border: tradingPrefs.defaultOrderType === type ? "2px solid #2563EB" : "1px solid #CBD5E1",
                                        background: tradingPrefs.defaultOrderType === type ? "#EFF6FF" : "#FFFFFF",
                                        color: tradingPrefs.defaultOrderType === type ? "#2563EB" : "#475569"
                                    }}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Default Order Mode */}
                    <div style={{ background: "#F8FAFC", padding: "18px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "#0F172A", marginBottom: "4px" }}>
                            Default Order Mode
                        </label>
                        <span style={{ display: "block", fontSize: "0.75rem", color: "#64748B", marginBottom: "12px" }}>
                            Equity Delivery Trading Mode
                        </span>
                        <div style={{
                            padding: "8px 12px",
                            borderRadius: "8px",
                            background: "#EFF6FF",
                            border: "1px solid #BFDBFE",
                            color: "#2563EB",
                            fontWeight: "700",
                            fontSize: "0.85rem",
                            textAlign: "center"
                        }}>
                            CNC (Cash & Carry)
                        </div>
                    </div>

                    {/* Confirmation Modal Toggle */}
                    <div style={{ background: "#F8FAFC", padding: "18px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "#0F172A", marginBottom: "4px" }}>
                            Order Confirmation
                        </label>
                        <span style={{ display: "block", fontSize: "0.75rem", color: "#64748B", marginBottom: "12px" }}>
                            Prompt for confirmation before placing
                        </span>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <button
                                type="button"
                                onClick={() => handleTradingPrefChange("orderConfirmation", true)}
                                style={{
                                    flex: 1,
                                    padding: "8px",
                                    borderRadius: "8px",
                                    fontWeight: "700",
                                    fontSize: "0.85rem",
                                    cursor: "pointer",
                                    border: tradingPrefs.orderConfirmation ? "2px solid #10B981" : "1px solid #CBD5E1",
                                    background: tradingPrefs.orderConfirmation ? "#ECFDF5" : "#FFFFFF",
                                    color: tradingPrefs.orderConfirmation ? "#059669" : "#475569"
                                }}
                            >
                                ON
                            </button>
                            <button
                                type="button"
                                onClick={() => handleTradingPrefChange("orderConfirmation", false)}
                                style={{
                                    flex: 1,
                                    padding: "8px",
                                    borderRadius: "8px",
                                    fontWeight: "700",
                                    fontSize: "0.85rem",
                                    cursor: "pointer",
                                    border: !tradingPrefs.orderConfirmation ? "2px solid #64748B" : "1px solid #CBD5E1",
                                    background: !tradingPrefs.orderConfirmation ? "#F1F5F9" : "#FFFFFF",
                                    color: !tradingPrefs.orderConfirmation ? "#0F172A" : "#475569"
                                }}
                            >
                                OFF
                            </button>
                        </div>
                    </div>

                    {/* Default Quantity */}
                    <div style={{ background: "#F8FAFC", padding: "18px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "#0F172A", marginBottom: "4px" }}>
                            Default Quantity
                        </label>
                        <span style={{ display: "block", fontSize: "0.75rem", color: "#64748B", marginBottom: "12px" }}>
                            Default shares pre-filled in window
                        </span>
                        <input
                            type="number"
                            min="1"
                            max="10000"
                            value={tradingPrefs.defaultQuantity}
                            onChange={(e) => handleTradingPrefChange("defaultQuantity", Math.max(1, Number(e.target.value)))}
                            style={{
                                width: "100%",
                                padding: "8px 12px",
                                borderRadius: "8px",
                                border: "1px solid #CBD5E1",
                                fontSize: "0.9rem",
                                fontWeight: "700",
                                background: "#FFFFFF",
                                color: "#0F172A",
                                outline: "none"
                            }}
                        />
                    </div>

                </div>
            </div>

            {/* 4. Appearance & Preferences Section */}
            <div style={{ background: "#FFFFFF", borderRadius: "20px", border: "1px solid #E2E8F0", padding: "28px", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)", marginBottom: "24px" }}>
                <h3 style={{ margin: "0 0 20px 0", fontWeight: "700", color: "#0F172A", fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "10px" }}>
                    <PaletteIcon style={{ color: "#6366F1", fontSize: "1.4rem" }} /> Appearance & Preferences
                </h3>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
                    
                    {/* Theme */}
                    <div style={{ background: "#F8FAFC", padding: "18px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "#0F172A", marginBottom: "4px" }}>
                            Theme
                        </label>
                        <span style={{ display: "block", fontSize: "0.75rem", color: "#64748B", marginBottom: "12px" }}>
                            Default Light Theme for clarity
                        </span>
                        <div style={{ display: "flex", gap: "6px" }}>
                            {["light", "dark", "system"].map((th) => (
                                <button
                                    key={th}
                                    type="button"
                                    onClick={() => handleAppearanceChange("theme", th)}
                                    style={{
                                        flex: 1,
                                        padding: "8px 4px",
                                        borderRadius: "8px",
                                        fontWeight: "700",
                                        fontSize: "0.75rem",
                                        textTransform: "capitalize",
                                        cursor: "pointer",
                                        border: appearancePrefs.theme === th ? "2px solid #2563EB" : "1px solid #CBD5E1",
                                        background: appearancePrefs.theme === th ? "#EFF6FF" : "#FFFFFF",
                                        color: appearancePrefs.theme === th ? "#2563EB" : "#475569"
                                    }}
                                >
                                    {th}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dashboard Density */}
                    <div style={{ background: "#F8FAFC", padding: "18px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "#0F172A", marginBottom: "4px" }}>
                            Dashboard Density
                        </label>
                        <span style={{ display: "block", fontSize: "0.75rem", color: "#64748B", marginBottom: "12px" }}>
                            Layout and row spacing
                        </span>
                        <div style={{ display: "flex", gap: "8px" }}>
                            {["comfortable", "compact"].map((dens) => (
                                <button
                                    key={dens}
                                    type="button"
                                    onClick={() => handleAppearanceChange("density", dens)}
                                    style={{
                                        flex: 1,
                                        padding: "8px",
                                        borderRadius: "8px",
                                        fontWeight: "700",
                                        fontSize: "0.8rem",
                                        textTransform: "capitalize",
                                        cursor: "pointer",
                                        border: appearancePrefs.density === dens ? "2px solid #2563EB" : "1px solid #CBD5E1",
                                        background: appearancePrefs.density === dens ? "#EFF6FF" : "#FFFFFF",
                                        color: appearancePrefs.density === dens ? "#2563EB" : "#475569"
                                    }}
                                >
                                    {dens}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notifications */}
                    <div style={{ background: "#F8FAFC", padding: "18px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "#0F172A", marginBottom: "4px" }}>
                            Toast Notifications
                        </label>
                        <span style={{ display: "block", fontSize: "0.75rem", color: "#64748B", marginBottom: "12px" }}>
                            Real-time order fill alerts
                        </span>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <button
                                type="button"
                                onClick={() => handleAppearanceChange("notifications", true)}
                                style={{
                                    flex: 1,
                                    padding: "8px",
                                    borderRadius: "8px",
                                    fontWeight: "700",
                                    fontSize: "0.85rem",
                                    cursor: "pointer",
                                    border: appearancePrefs.notifications ? "2px solid #10B981" : "1px solid #CBD5E1",
                                    background: appearancePrefs.notifications ? "#ECFDF5" : "#FFFFFF",
                                    color: appearancePrefs.notifications ? "#059669" : "#475569"
                                }}
                            >
                                ON
                            </button>
                            <button
                                type="button"
                                onClick={() => handleAppearanceChange("notifications", false)}
                                style={{
                                    flex: 1,
                                    padding: "8px",
                                    borderRadius: "8px",
                                    fontWeight: "700",
                                    fontSize: "0.85rem",
                                    cursor: "pointer",
                                    border: !appearancePrefs.notifications ? "2px solid #64748B" : "1px solid #CBD5E1",
                                    background: !appearancePrefs.notifications ? "#F1F5F9" : "#FFFFFF",
                                    color: !appearancePrefs.notifications ? "#0F172A" : "#475569"
                                }}
                            >
                                OFF
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* 5. 🔐 Danger Zone Section */}
            <div style={{
                background: "#FFF5F5",
                borderRadius: "20px",
                border: "2px solid #FED7D7",
                padding: "28px",
                boxShadow: "0 4px 16px rgba(239, 68, 68, 0.05)",
                marginBottom: "24px"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                    <WarningAmberIcon style={{ color: "#E53E3E", fontSize: "1.6rem" }} />
                    <h3 style={{ margin: 0, fontWeight: "800", color: "#9B2C2C", fontSize: "1.2rem" }}>
                        Danger Zone
                    </h3>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", background: "#FFFFFF", padding: "20px", borderRadius: "14px", border: "1px solid #FEB2B2" }}>
                    <div>
                        <strong style={{ fontSize: "1rem", color: "#9B2C2C", display: "block", marginBottom: "4px" }}>
                            Delete Account
                        </strong>
                        <p style={{ margin: 0, color: "#742A2A", fontSize: "0.85rem", maxWidth: "580px" }}>
                            Permanently delete your account and associated trading data. This action cannot be undone. All orders, holdings, and portfolio balances will be wiped out immediately.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        style={{
                            background: "#E53E3E",
                            color: "#FFFFFF",
                            border: "none",
                            padding: "10px 20px",
                            borderRadius: "10px",
                            fontWeight: "700",
                            fontSize: "0.9rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            boxShadow: "0 4px 12px rgba(229, 62, 62, 0.3)",
                            transition: "all 0.2s"
                        }}
                    >
                        <DeleteForeverIcon style={{ fontSize: "1.1rem" }} /> Delete Account
                    </button>
                </div>
            </div>

            {/* Confirmation Modal for Account Deletion */}
            {isDeleteModalOpen && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: "rgba(15, 23, 42, 0.6)",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9999,
                    padding: "20px"
                }}>
                    <div style={{
                        background: "#FFFFFF",
                        borderRadius: "20px",
                        padding: "28px",
                        maxWidth: "460px",
                        width: "100%",
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
                        border: "1px solid #FED7D7"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#E53E3E" }}>
                                <WarningAmberIcon style={{ fontSize: "1.6rem" }} />
                                <h3 style={{ margin: 0, fontWeight: "800", fontSize: "1.25rem", color: "#9B2C2C" }}>
                                    Confirm Account Deletion
                                </h3>
                            </div>
                            <button
                                onClick={() => { setIsDeleteModalOpen(false); setDeletePassword(""); }}
                                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748B" }}
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        <p style={{ color: "#475569", fontSize: "0.9rem", lineHeight: "1.5", margin: "0 0 16px 0" }}>
                            Are you absolutely sure? This will <strong>permanently wipe</strong> all your stocks, executed orders, funds balance, and account history from PulseTrade.
                        </p>

                        <form onSubmit={handleDeleteAccount}>
                            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "#0F172A", marginBottom: "6px" }}>
                                Enter your account password to confirm:
                            </label>
                            <input
                                type="password"
                                placeholder="Account password..."
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "10px 14px",
                                    borderRadius: "8px",
                                    border: "1px solid #CBD5E1",
                                    fontSize: "0.9rem",
                                    marginBottom: "20px",
                                    outline: "none"
                                }}
                            />

                            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                                <button
                                    type="button"
                                    onClick={() => { setIsDeleteModalOpen(false); setDeletePassword(""); }}
                                    style={{
                                        background: "#F1F5F9",
                                        color: "#475569",
                                        border: "1px solid #CBD5E1",
                                        padding: "10px 18px",
                                        borderRadius: "10px",
                                        fontWeight: "600",
                                        fontSize: "0.9rem",
                                        cursor: "pointer"
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isDeletingAccount}
                                    style={{
                                        background: "#E53E3E",
                                        color: "#FFFFFF",
                                        border: "none",
                                        padding: "10px 20px",
                                        borderRadius: "10px",
                                        fontWeight: "700",
                                        fontSize: "0.9rem",
                                        cursor: isDeletingAccount ? "not-allowed" : "pointer",
                                        opacity: isDeletingAccount ? 0.7 : 1
                                    }}
                                >
                                    {isDeletingAccount ? "Deleting..." : "Permanently Delete"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Settings;
