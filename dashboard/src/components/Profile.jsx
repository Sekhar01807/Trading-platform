import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { LANDING_URL, API_URL } from "../config";

// Material UI Icons
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import InfoIcon from "@mui/icons-material/Info";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SecurityIcon from "@mui/icons-material/Security";
import SettingsIcon from "@mui/icons-material/Settings";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import HistoryIcon from "@mui/icons-material/History";
import AccountTreeIcon from "@mui/icons-material/AccountTree";

const Profile = ({ user, onProfileUpdate, onUsernameUpdate }) => {
    const [profilePic, setProfilePic] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Edit form state fields initialized from user object
    const [formData, setFormData] = useState({
        username: user?.username || "",
        email: user?.email || "",
        phone: user?.phone || "",
        bio: user?.bio || ""
    });

    const [holdings, setHoldings] = useState([]);
    const [orders, setOrders] = useState([]);
    const [transactions, setTransactions] = useState([]);

    // Wallet Funds
    const [totalAddedFunds, setTotalAddedFunds] = useState(0);

    useEffect(() => {
        axios.get(`${API_URL}/user/funds`, { withCredentials: true })
            .then(res => {
                if (res.data && res.data.totalAddedFunds !== undefined) {
                    setTotalAddedFunds(res.data.totalAddedFunds);
                }
            })
            .catch(() => {});

        axios.get(`${API_URL}/user/transactions`, { withCredentials: true })
            .then(res => {
                if (res.data && res.data.transactions) {
                    setTransactions(res.data.transactions);
                }
            })
            .catch(() => {});
    }, []);

    // Keep form data synchronized when user object updates
    useEffect(() => {
        setFormData({
            username: user?.username || "",
            email: user?.email || "",
            phone: user?.phone || "",
            bio: user?.bio || ""
        });
    }, [user]);

    // Load custom profile photo avatar per user ID
    useEffect(() => {
        if (user?.id) {
            const savedPic = localStorage.getItem(`profilePic_${user.id}`);
            if (savedPic) {
                setProfilePic(savedPic);
            }
        }
    }, [user?.id]);

    // Fetch user's real holdings and orders from backend
    useEffect(() => {
        axios.get(`${API_URL}/allHoldings`, { withCredentials: true })
            .then(res => setHoldings(res.data || []))
            .catch(() => {});

        axios.get(`${API_URL}/allOrders`, { withCredentials: true })
            .then(res => setOrders(res.data || []))
            .catch(() => {});
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result;
                setProfilePic(base64String);
                if (user?.id) {
                    localStorage.setItem(`profilePic_${user.id}`, base64String);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveEntireProfile = () => {
        if (onProfileUpdate) {
            onProfileUpdate(formData);
        } else if (onUsernameUpdate && formData.username) {
            onUsernameUpdate(formData.username);
        }
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setFormData({
            username: user?.username || "",
            email: user?.email || "",
            phone: user?.phone || "",
            bio: user?.bio || ""
        });
        setIsEditing(false);
    };

    const handleLogout = async () => {
        try {
            await axios.post(`${API_URL}/logout`, {}, { withCredentials: true });
        } catch (e) {
            // Ignore error on logout
        }
        window.location.href = LANDING_URL;
    };

    const initials = user?.username
        ? user.username.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)
        : "PT";

    const traderCode = `PT-${(user?.id || "9842").toString().substring(0, 6).toUpperCase()}`;
    const memberSinceDate = user?.createdAt 
        ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "Recently";

    // User's Real Portfolio calculations
    const totalSpentOnStocks = holdings.reduce((sum, h) => sum + ((h.qty || 0) * (h.avg || 0)), 0);
    const currentPortfolioValue = holdings.reduce((sum, h) => sum + ((h.qty || 0) * (h.price || h.avg || 0)), 0);
    const totalPnl = currentPortfolioValue - totalSpentOnStocks;
    const isProfit = totalPnl >= 0;
    const pnlPercent = totalSpentOnStocks > 0 ? ((totalPnl / totalSpentOnStocks) * 100).toFixed(2) : "0.00";
    const availableMargin = Math.max(0, totalAddedFunds - totalSpentOnStocks);
    const totalNetWorth = availableMargin + currentPortfolioValue;

    // Recent orders sorted descending
    const recentOrders = [...orders]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 4);

    return (
        <div style={{ padding: "30px 20px", maxWidth: "980px", margin: "0 auto", color: "#0F172A", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
            
            {/* Header & Main Control Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                    <h2 style={{ margin: "0 0 4px 0", fontWeight: "800", fontSize: "1.75rem", color: "#0F172A", letterSpacing: "-0.5px" }}>
                        My Profile
                    </h2>
                    <span style={{ color: "#64748B", fontSize: "0.9rem" }}>
                        Manage your account credentials, view portfolio net worth, and monitor trading activity.
                    </span>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                    <Link to="/settings" style={{ textDecoration: "none" }}>
                        <button
                            style={{
                                background: "#FFFFFF",
                                color: "#0F172A",
                                border: "1px solid #CBD5E1",
                                padding: "10px 18px",
                                borderRadius: "10px",
                                fontWeight: "600",
                                fontSize: "0.9rem",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                transition: "all 0.2s"
                            }}
                        >
                            <SettingsIcon style={{ fontSize: "1.05rem", color: "#64748B" }} /> Settings
                        </button>
                    </Link>

                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            style={{
                                background: "#2563EB",
                                color: "#FFFFFF",
                                border: "none",
                                padding: "10px 20px",
                                borderRadius: "10px",
                                fontWeight: "700",
                                fontSize: "0.9rem",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
                                transition: "all 0.2s"
                            }}
                        >
                            <EditIcon style={{ fontSize: "1rem" }} /> Edit Profile
                        </button>
                    ) : (
                        <div style={{ display: "flex", gap: "10px" }}>
                            <button
                                onClick={handleSaveEntireProfile}
                                style={{
                                    background: "#10B981",
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
                                    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)"
                                }}
                            >
                                <SaveIcon style={{ fontSize: "1rem" }} /> Save Changes
                            </button>
                            <button
                                onClick={handleCancelEdit}
                                style={{
                                    background: "#F1F5F9",
                                    color: "#64748B",
                                    border: "1px solid #CBD5E1",
                                    padding: "10px 16px",
                                    borderRadius: "10px",
                                    fontWeight: "600",
                                    fontSize: "0.9rem",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px"
                                }}
                            >
                                <CloseIcon style={{ fontSize: "1rem" }} /> Cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 1. Profile Header Card */}
            <div style={{
                background: "#FFFFFF",
                borderRadius: "20px",
                border: "1px solid #E2E8F0",
                padding: "30px",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)",
                marginBottom: "24px"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
                    
                    {/* User Avatar with Photo Upload */}
                    <div style={{ position: "relative" }}>
                        <div style={{
                            width: "100px",
                            height: "100px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "2.2rem",
                            fontWeight: "800",
                            color: "#2563EB",
                            overflow: "hidden",
                            border: "3px solid #BFDBFE",
                            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.15)"
                        }}>
                            {profilePic ? (
                                <img src={profilePic} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                                initials
                            )}
                        </div>

                        {/* Image upload button */}
                        <input
                            type="file"
                            id="profile-avatar-file-input"
                            hidden
                            accept="image/*,.jpeg,.jpg,.png"
                            onChange={handleImageUpload}
                        />
                        <label
                            htmlFor="profile-avatar-file-input"
                            style={{
                                position: "absolute",
                                bottom: "0",
                                right: "0",
                                background: "#2563EB",
                                color: "#FFFFFF",
                                borderRadius: "50%",
                                width: "32px",
                                height: "32px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                border: "2px solid #FFFFFF",
                                boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
                            }}
                            title="Change photo avatar"
                        >
                            <PhotoCameraIcon style={{ fontSize: "1rem" }} />
                        </label>
                    </div>

                    {/* Basic Info Overview */}
                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "6px" }}>
                            <h3 style={{ margin: 0, fontWeight: "800", fontSize: "1.6rem", color: "#0F172A" }}>
                                {user?.username || "Trader"}
                            </h3>
                            <span style={{
                                color: "#64748B",
                                fontSize: "0.95rem",
                                background: "#F1F5F9",
                                padding: "4px 10px",
                                borderRadius: "8px",
                                fontWeight: "500",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px"
                            }}>
                                <EmailIcon style={{ fontSize: "0.95rem", color: "#64748B" }} /> {user?.email || "No email"}
                            </span>
                        </div>

                        <div style={{ color: "#64748B", fontSize: "0.9rem", marginBottom: "10px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                            <span>Client Code: <strong style={{ color: "#2563EB" }}>{traderCode}</strong></span>
                            <span>&bull;</span>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                <CalendarTodayIcon style={{ fontSize: "0.85rem", color: "#64748B" }} /> Member since <strong>{memberSinceDate}</strong>
                            </span>
                        </div>

                        <p style={{ margin: 0, color: "#475569", fontSize: "0.95rem", fontStyle: user?.bio ? "normal" : "italic" }}>
                            {user?.bio || "No trading bio added yet."}
                        </p>
                    </div>

                </div>
            </div>

            {/* 2. Personal Information (Editable) */}
            <div style={{ background: "#FFFFFF", borderRadius: "20px", border: "1px solid #E2E8F0", padding: "28px", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)", marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h4 style={{ margin: 0, fontWeight: "700", color: "#0F172A", fontSize: "1.15rem", display: "flex", alignItems: "center", gap: "8px" }}>
                        <PersonIcon style={{ color: "#2563EB", fontSize: "1.2rem" }} /> Personal Information
                    </h4>
                    {isEditing && (
                        <span style={{ fontSize: "0.8rem", color: "#2563EB", fontWeight: "600", background: "#EFF6FF", padding: "4px 10px", borderRadius: "6px" }}>
                            Editing Mode Active
                        </span>
                    )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                    
                    {/* Username */}
                    <div style={{ background: "#F8FAFC", padding: "16px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748B", fontSize: "0.8rem", fontWeight: "700", textTransform: "uppercase", marginBottom: "6px" }}>
                            <PersonIcon style={{ fontSize: "1rem", color: "#3B82F6" }} /> Full Name / Username
                        </div>
                        {!isEditing ? (
                            <strong style={{ fontSize: "1.05rem", color: "#0F172A" }}>{user?.username || "N/A"}</strong>
                        ) : (
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Enter full name or username..."
                                style={{
                                    width: "100%",
                                    padding: "8px 12px",
                                    borderRadius: "8px",
                                    border: "1px solid #3B82F6",
                                    fontSize: "0.95rem",
                                    background: "#FFFFFF",
                                    color: "#0F172A",
                                    outline: "none"
                                }}
                            />
                        )}
                    </div>

                    {/* Email */}
                    <div style={{ background: "#F8FAFC", padding: "16px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748B", fontSize: "0.8rem", fontWeight: "700", textTransform: "uppercase" }}>
                                <EmailIcon style={{ fontSize: "1rem", color: "#3B82F6" }} /> Registered Email Address
                            </div>
                            <span style={{ fontSize: "0.75rem", color: "#10B981", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                <VerifiedUserIcon style={{ fontSize: "0.9rem" }} /> Verified
                            </span>
                        </div>
                        {!isEditing ? (
                            <strong style={{ fontSize: "1.05rem", color: "#0F172A" }}>{user?.email || "N/A"}</strong>
                        ) : (
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter email address..."
                                style={{
                                    width: "100%",
                                    padding: "8px 12px",
                                    borderRadius: "8px",
                                    border: "1px solid #3B82F6",
                                    fontSize: "0.95rem",
                                    background: "#FFFFFF",
                                    color: "#0F172A",
                                    outline: "none"
                                }}
                            />
                        )}
                    </div>

                    {/* Phone */}
                    <div style={{ background: "#F8FAFC", padding: "16px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748B", fontSize: "0.8rem", fontWeight: "700", textTransform: "uppercase", marginBottom: "6px" }}>
                            <PhoneIcon style={{ fontSize: "1rem", color: "#10B981" }} /> Mobile Phone Number
                        </div>
                        {!isEditing ? (
                            <strong style={{ fontSize: "1.05rem", color: user?.phone ? "#0F172A" : "#94A3B8" }}>
                                {user?.phone || "Not set (Click edit to add)"}
                            </strong>
                        ) : (
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="e.g. +91 9876543210"
                                style={{
                                    width: "100%",
                                    padding: "8px 12px",
                                    borderRadius: "8px",
                                    border: "1px solid #3B82F6",
                                    fontSize: "0.95rem",
                                    background: "#FFFFFF",
                                    color: "#0F172A",
                                    outline: "none"
                                }}
                            />
                        )}
                    </div>

                    {/* Bio / About */}
                    <div style={{ background: "#F8FAFC", padding: "16px", borderRadius: "12px", border: "1px solid #E2E8F0", gridColumn: "1 / -1" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748B", fontSize: "0.8rem", fontWeight: "700", textTransform: "uppercase", marginBottom: "6px" }}>
                            <InfoIcon style={{ fontSize: "1rem", color: "#6366F1" }} /> About / Trading Bio
                        </div>
                        {!isEditing ? (
                            <strong style={{ fontSize: "0.95rem", color: user?.bio ? "#0F172A" : "#94A3B8", fontWeight: "500" }}>
                                {user?.bio || "No trading bio provided yet."}
                            </strong>
                        ) : (
                            <textarea
                                name="bio"
                                rows="2"
                                value={formData.bio}
                                onChange={handleChange}
                                placeholder="Write a short summary about your trading strategies or background..."
                                style={{
                                    width: "100%",
                                    padding: "8px 12px",
                                    borderRadius: "8px",
                                    border: "1px solid #3B82F6",
                                    fontSize: "0.95rem",
                                    background: "#FFFFFF",
                                    color: "#0F172A",
                                    outline: "none",
                                    resize: "vertical"
                                }}
                            />
                        )}
                    </div>

                </div>
            </div>

            {/* 3. Trading Account Summary (Read-Only) */}
            <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h4 style={{ margin: 0, fontWeight: "700", color: "#0F172A", fontSize: "1.15rem", display: "flex", alignItems: "center", gap: "8px" }}>
                        <AccountTreeIcon style={{ color: "#2563EB", fontSize: "1.2rem" }} /> Trading Account Summary
                    </h4>
                    <span style={{ fontSize: "0.8rem", color: "#64748B", background: "#F8FAFC", padding: "4px 10px", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                        Read-Only Financial Data
                    </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                    
                    {/* Total Net Worth */}
                    <div style={{ background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)", color: "#FFFFFF", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 14px rgba(15, 23, 42, 0.15)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                            <span style={{ fontSize: "0.8rem", color: "#94A3B8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Net Worth</span>
                            <ShowChartIcon style={{ color: "#38BDF8", fontSize: "1.3rem" }} />
                        </div>
                        <h3 style={{ margin: 0, fontWeight: "800", color: "#FFFFFF", fontSize: "1.45rem" }}>
                            ₹{totalNetWorth.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                        <span style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: "4px", display: "block" }}>Cash + Stock Valuation</span>
                    </div>

                    {/* Available Cash */}
                    <div style={{ background: "#FFFFFF", padding: "20px", borderRadius: "16px", border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                            <span style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: "700", textTransform: "uppercase" }}>Available Cash</span>
                            <AccountBalanceWalletIcon style={{ color: "#2563EB", fontSize: "1.3rem" }} />
                        </div>
                        <h3 style={{ margin: 0, fontWeight: "800", color: "#2563EB", fontSize: "1.4rem" }}>
                            ₹{availableMargin.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                        <span style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "4px", display: "block" }}>Margin Ready for Orders</span>
                    </div>

                    {/* Portfolio Value */}
                    <div style={{ background: "#FFFFFF", padding: "20px", borderRadius: "16px", border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                            <span style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: "700", textTransform: "uppercase" }}>Portfolio Value</span>
                            <TrendingUpIcon style={{ color: "#10B981", fontSize: "1.3rem" }} />
                        </div>
                        <h3 style={{ margin: 0, fontWeight: "800", color: "#0F172A", fontSize: "1.4rem" }}>
                            ₹{currentPortfolioValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                        <span style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "4px", display: "block" }}>Invested: ₹{totalSpentOnStocks.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>

                    {/* Holdings & Orders Count */}
                    <div style={{ background: "#FFFFFF", padding: "20px", borderRadius: "16px", border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                            <span style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: "700", textTransform: "uppercase" }}>Holdings & Orders</span>
                            <ShoppingCartIcon style={{ color: "#F59E0B", fontSize: "1.3rem" }} />
                        </div>
                        <h3 style={{ margin: 0, fontWeight: "800", color: "#0F172A", fontSize: "1.4rem" }}>
                            {holdings.length} <small style={{ fontSize: "0.85rem", color: "#64748B", fontWeight: "500" }}>stocks</small>
                        </h3>
                        <span style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "4px", display: "block" }}>{orders.length} Executed Orders</span>
                    </div>

                    {/* Overall P&L */}
                    <div style={{ background: "#FFFFFF", padding: "20px", borderRadius: "16px", border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                            <span style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: "700", textTransform: "uppercase" }}>Overall P&L</span>
                            {isProfit ? (
                                <TrendingUpIcon style={{ color: "#10B981", fontSize: "1.3rem" }} />
                            ) : (
                                <TrendingDownIcon style={{ color: "#EF4444", fontSize: "1.3rem" }} />
                            )}
                        </div>
                        <h3 style={{ margin: 0, fontWeight: "800", color: isProfit ? "#10B981" : "#EF4444", fontSize: "1.4rem" }}>
                            {isProfit ? "+" : ""}₹{totalPnl.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                        <span style={{ fontSize: "0.75rem", color: isProfit ? "#10B981" : "#EF4444", fontWeight: "600", marginTop: "4px", display: "block" }}>
                            {isProfit ? "+" : ""}{pnlPercent}% Total Outcome
                        </span>
                    </div>

                </div>
            </div>

            {/* 4. Account Activity (Dynamic Feed) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginBottom: "24px" }}>
                
                {/* Recent Trading Orders */}
                <div style={{ background: "#FFFFFF", borderRadius: "20px", border: "1px solid #E2E8F0", padding: "24px", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <h4 style={{ margin: 0, fontWeight: "700", color: "#0F172A", fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "8px" }}>
                            <HistoryIcon style={{ color: "#2563EB", fontSize: "1.2rem" }} /> Recent Trading Activity
                        </h4>
                        <Link to="/orders" style={{ textDecoration: "none", color: "#2563EB", fontSize: "0.8rem", fontWeight: "600" }}>
                            View All &rarr;
                        </Link>
                    </div>

                    {recentOrders.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "30px 10px", color: "#94A3B8", fontSize: "0.9rem" }}>
                            No orders placed yet.
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {recentOrders.map((order, idx) => (
                                <div key={order._id || idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#F8FAFC", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <span style={{
                                            padding: "3px 8px",
                                            borderRadius: "6px",
                                            fontSize: "0.75rem",
                                            fontWeight: "700",
                                            background: (order.mode || order.side) === "BUY" ? "#DCFCE7" : "#FEE2E2",
                                            color: (order.mode || order.side) === "BUY" ? "#15803D" : "#B91C1C"
                                        }}>
                                            {order.mode || order.side || "BUY"}
                                        </span>
                                        <div>
                                            <strong style={{ fontSize: "0.9rem", color: "#0F172A", display: "block" }}>
                                                {order.name || order.symbol}
                                            </strong>
                                            <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                                                {order.qty || order.quantity} shares &bull; {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Today"}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <strong style={{ fontSize: "0.9rem", color: "#0F172A", display: "block" }}>
                                            ₹{(order.price || order.executedPrice || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                        </strong>
                                        <span style={{ fontSize: "0.75rem", color: "#10B981", fontWeight: "600" }}>
                                            Executed
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Session & Security Overview */}
                <div style={{ background: "#FFFFFF", borderRadius: "20px", border: "1px solid #E2E8F0", padding: "24px", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <h4 style={{ margin: 0, fontWeight: "700", color: "#0F172A", fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "8px" }}>
                            <SecurityIcon style={{ color: "#10B981", fontSize: "1.2rem" }} /> Account Security & Session
                        </h4>
                        <Link to="/settings" style={{ textDecoration: "none", color: "#2563EB", fontSize: "0.8rem", fontWeight: "600" }}>
                            Manage &rarr;
                        </Link>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ background: "#F8FAFC", padding: "12px 14px", borderRadius: "10px", border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <span style={{ fontSize: "0.8rem", color: "#64748B", display: "block" }}>Authentication Method</span>
                                <strong style={{ fontSize: "0.9rem", color: "#0F172A" }}>JWT HttpOnly Secure Cookie</strong>
                            </div>
                            <span style={{ fontSize: "0.75rem", background: "#DCFCE7", color: "#15803D", padding: "3px 8px", borderRadius: "6px", fontWeight: "700" }}>
                                Active
                            </span>
                        </div>

                        <div style={{ background: "#F8FAFC", padding: "12px 14px", borderRadius: "10px", border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <span style={{ fontSize: "0.8rem", color: "#64748B", display: "block" }}>Session Protection</span>
                                <strong style={{ fontSize: "0.9rem", color: "#0F172A" }}>Cross-Site Request Forgery Safe</strong>
                            </div>
                            <span style={{ fontSize: "0.75rem", background: "#EFF6FF", color: "#2563EB", padding: "3px 8px", borderRadius: "6px", fontWeight: "700" }}>
                                Protected
                            </span>
                        </div>

                        <div style={{ background: "#F8FAFC", padding: "12px 14px", borderRadius: "10px", border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <span style={{ fontSize: "0.8rem", color: "#64748B", display: "block" }}>Wallet & Ledger Audit</span>
                                <strong style={{ fontSize: "0.9rem", color: "#0F172A" }}>{transactions.length} Total Transactions Logged</strong>
                            </div>
                            <Link to="/funds" style={{ textDecoration: "none", fontSize: "0.75rem", color: "#2563EB", fontWeight: "700" }}>
                                Ledger
                            </Link>
                        </div>
                    </div>
                </div>

            </div>

            {/* Quick Action Navigation Buttons */}
            <div style={{ background: "#FFFFFF", borderRadius: "20px", border: "1px solid #E2E8F0", padding: "20px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <Link to="/funds" style={{ textDecoration: "none" }}>
                        <button style={{ background: "#2563EB", color: "#FFFFFF", border: "none", padding: "10px 20px", borderRadius: "10px", fontWeight: "700", fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                            Deposit Funds <ArrowForwardIcon style={{ fontSize: "0.95rem" }} />
                        </button>
                    </Link>

                    <Link to="/holdings" style={{ textDecoration: "none" }}>
                        <button style={{ background: "#F1F5F9", color: "#0F172A", border: "1px solid #CBD5E1", padding: "10px 18px", borderRadius: "10px", fontWeight: "600", fontSize: "0.85rem", cursor: "pointer" }}>
                            View Holdings ({holdings.length})
                        </button>
                    </Link>

                    <Link to="/orders" style={{ textDecoration: "none" }}>
                        <button style={{ background: "#F1F5F9", color: "#0F172A", border: "1px solid #CBD5E1", padding: "10px 18px", borderRadius: "10px", fontWeight: "600", fontSize: "0.85rem", cursor: "pointer" }}>
                            View Orders ({orders.length})
                        </button>
                    </Link>

                    <Link to="/settings" style={{ textDecoration: "none" }}>
                        <button style={{ background: "#F1F5F9", color: "#0F172A", border: "1px solid #CBD5E1", padding: "10px 18px", borderRadius: "10px", fontWeight: "600", fontSize: "0.85rem", cursor: "pointer" }}>
                            Trading Preferences
                        </button>
                    </Link>
                </div>

                <button
                    onClick={handleLogout}
                    style={{
                        background: "#FEF2F2",
                        color: "#EF4444",
                        border: "1px solid #FCA5A5",
                        padding: "10px 18px",
                        borderRadius: "10px",
                        fontWeight: "700",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                    }}
                >
                    <ExitToAppIcon style={{ fontSize: "1rem" }} /> Sign Out Account
                </button>
            </div>

        </div>
    );
};

export default Profile;
