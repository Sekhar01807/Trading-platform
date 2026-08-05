import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { LANDING_URL } from "../config";

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

const Profile = ({ user, onProfileUpdate, onUsernameUpdate }) => {
    const [cookies, setCookie, removeCookie] = useCookies(["token"]);
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

    // Wallet Funds
    const [totalAddedFunds, setTotalAddedFunds] = useState(0);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            axios.get("http://localhost:3000/user/funds", {
                withCredentials: true,
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => {
                if (res.data && res.data.totalAddedFunds !== undefined) {
                    setTotalAddedFunds(res.data.totalAddedFunds);
                }
            })
            .catch(() => {});
        }
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
        axios.get("http://localhost:3000/allHoldings", { withCredentials: true })
            .then(res => setHoldings(res.data))
            .catch(() => {});

        axios.get("http://localhost:3000/allOrders", { withCredentials: true })
            .then(res => setOrders(res.data))
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

    const handleLogout = () => {
        localStorage.removeItem("token");
        removeCookie("token", { path: "/" });
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
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
    const totalSpentOnStocks = holdings.reduce((sum, h) => sum + (h.qty * h.avg), 0);
    const currentPortfolioValue = holdings.reduce((sum, h) => sum + (h.qty * (h.price || h.avg)), 0);
    const totalPnl = currentPortfolioValue - totalSpentOnStocks;
    const isProfit = totalPnl >= 0;
    const availableMargin = Math.max(0, totalAddedFunds - totalSpentOnStocks);

    return (
        <div style={{ padding: "30px 20px", maxWidth: "940px", margin: "0 auto", color: "#0F172A", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
            
            {/* Header & Main Control Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                    <h2 style={{ margin: "0 0 4px 0", fontWeight: "800", fontSize: "1.75rem", color: "#0F172A" }}>
                        My Profile Dashboard
                    </h2>
                    <span style={{ color: "#64748B", fontSize: "0.9rem" }}>
                        Manage your account credentials, contact info, and trading workspace details.
                    </span>
                </div>

                <div>
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
                            <EditIcon style={{ fontSize: "1rem" }} /> Edit Entire Profile
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
                                    gap: "6px"
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

            {/* Profile Overview Header Card */}
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

                        {/* Image upload button (accessible in view or edit mode) */}
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
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
                            <h3 style={{ margin: 0, fontWeight: "800", fontSize: "1.5rem", color: "#0F172A" }}>
                                {user?.username || "Trader"}
                            </h3>
                        </div>

                        <div style={{ color: "#64748B", fontSize: "0.9rem", marginBottom: "8px" }}>
                            Client Code: <strong style={{ color: "#2563EB" }}>{traderCode}</strong> &bull; Member since <strong>{memberSinceDate}</strong>
                        </div>

                        <p style={{ margin: 0, color: "#475569", fontSize: "0.95rem", fontStyle: user?.bio ? "normal" : "italic" }}>
                            {user?.bio || "No bio added yet."}
                        </p>
                    </div>

                </div>
            </div>

            {/* Real Personal Details Form / Cards */}
            <div style={{ background: "#FFFFFF", borderRadius: "20px", border: "1px solid #E2E8F0", padding: "28px", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)", marginBottom: "24px" }}>
                <h4 style={{ margin: "0 0 20px 0", fontWeight: "700", color: "#0F172A", fontSize: "1.1rem" }}>
                    Personal Account Information
                </h4>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                    
                    {/* Username */}
                    <div style={{ background: "#F8FAFC", padding: "16px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748B", fontSize: "0.8rem", fontWeight: "700", textTransform: "uppercase", marginBottom: "6px" }}>
                            <PersonIcon style={{ fontSize: "1rem", color: "#3B82F6" }} /> Username / Display Name
                        </div>
                        {!isEditing ? (
                            <strong style={{ fontSize: "1.05rem", color: "#0F172A" }}>{user?.username || "N/A"}</strong>
                        ) : (
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Enter username..."
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
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748B", fontSize: "0.8rem", fontWeight: "700", textTransform: "uppercase", marginBottom: "6px" }}>
                            <EmailIcon style={{ fontSize: "1rem", color: "#3B82F6" }} /> Registered Email Address
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

            {/* Real Trading & Portfolio Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                
                <div style={{ background: "#FFFFFF", padding: "20px", borderRadius: "16px", border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: "700", textTransform: "uppercase" }}>Available Cash</span>
                        <AccountBalanceWalletIcon style={{ color: "#2563EB", fontSize: "1.3rem" }} />
                    </div>
                    <h3 style={{ margin: 0, fontWeight: "800", color: "#2563EB", fontSize: "1.35rem" }}>
                        ₹{availableMargin.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </h3>
                    <span style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "4px", display: "block" }}>Ready for Buy Orders</span>
                </div>

                <div style={{ background: "#FFFFFF", padding: "20px", borderRadius: "16px", border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: "700", textTransform: "uppercase" }}>Active Holdings</span>
                        <ShowChartIcon style={{ color: "#10B981", fontSize: "1.3rem" }} />
                    </div>
                    <h3 style={{ margin: 0, fontWeight: "800", color: "#0F172A", fontSize: "1.35rem" }}>
                        {holdings.length} <small style={{ fontSize: "0.85rem", color: "#64748B", fontWeight: "500" }}>stocks</small>
                    </h3>
                    <span style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "4px", display: "block" }}>Valuation: ₹{currentPortfolioValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>

                <div style={{ background: "#FFFFFF", padding: "20px", borderRadius: "16px", border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: "700", textTransform: "uppercase" }}>Orders Executed</span>
                        <ShoppingCartIcon style={{ color: "#F59E0B", fontSize: "1.3rem" }} />
                    </div>
                    <h3 style={{ margin: 0, fontWeight: "800", color: "#0F172A", fontSize: "1.35rem" }}>
                        {orders.length} <small style={{ fontSize: "0.85rem", color: "#64748B", fontWeight: "500" }}>orders</small>
                    </h3>
                    <span style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "4px", display: "block" }}>Recorded Activity</span>
                </div>

                <div style={{ background: "#FFFFFF", padding: "20px", borderRadius: "16px", border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: "700", textTransform: "uppercase" }}>Overall P&L</span>
                        <ShowChartIcon style={{ color: isProfit ? "#10B981" : "#EF4444", fontSize: "1.3rem" }} />
                    </div>
                    <h3 style={{ margin: 0, fontWeight: "800", color: isProfit ? "#10B981" : "#EF4444", fontSize: "1.35rem" }}>
                        {isProfit ? "+" : ""}₹{totalPnl.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </h3>
                    <span style={{ fontSize: "0.75rem", color: isProfit ? "#10B981" : "#EF4444", fontWeight: "600", marginTop: "4px", display: "block" }}>Total Portfolio Outcome</span>
                </div>

            </div>

            {/* Quick Action Buttons Bar */}
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
