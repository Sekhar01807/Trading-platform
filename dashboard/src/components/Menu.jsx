import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { LANDING_URL } from "../config";

const Menu = ({ user, onUsernameUpdate }) => {
    const location = useLocation();
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [cookies, setCookie, removeCookie] = useCookies(["token"]);
    const [profilePic, setProfilePic] = useState(null);

    useEffect(() => {
        const savedPic = localStorage.getItem(`profilePic_${user.id}`);
        if (savedPic) {
            setProfilePic(savedPic);
        }
    }, [user.id]);

    const handleProfileClick = () => {
        setIsProfileDropdownOpen(!isProfileDropdownOpen);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        removeCookie("token", { path: "/" });
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        window.location.href = LANDING_URL;
    };

    const menuClass = "menu";
    const activeMenuClass = "menu selected";

    const initials = user.username
        ? user.username.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)
        : "PT";

    const traderCode = `PT-${(user.id || '9842').toString().substring(0, 6).toUpperCase()}`;

    return (
        <div className="menu-container">
            {/* PulseTrade Brand Logo - Direct Link to Landing Page */}
            <a href={LANDING_URL} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #3B82F6 0%, #10B981 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 12px rgba(59, 130, 246, 0.3)"
                }}>
                    <ShowChartIcon style={{ color: "#ffffff", fontSize: "1.4rem" }} />
                </div>
                <span style={{
                    fontSize: "1.2rem",
                    fontWeight: "700",
                    letterSpacing: "-0.5px",
                    color: "#0F172A"
                }}>
                    Pulse<span style={{ color: "#10B981" }}>Trade</span>
                </span>
            </a>

            <div className="menus">
                <ul>
                    <li>
                        <Link style={{ textDecoration: "none" }} to="/">
                            <p className={location.pathname === "/" ? activeMenuClass : menuClass}>Dashboard</p>
                        </Link>
                    </li>
                    <li>
                        <Link style={{ textDecoration: "none" }} to="/orders">
                            <p className={location.pathname === "/orders" ? activeMenuClass : menuClass}>Orders</p>
                        </Link>
                    </li>
                    <li>
                        <Link style={{ textDecoration: "none" }} to="/holdings">
                            <p className={location.pathname === "/holdings" ? activeMenuClass : menuClass}>Holdings</p>
                        </Link>
                    </li>
                    <li>
                        <Link style={{ textDecoration: "none" }} to="/positions">
                            <p className={location.pathname === "/positions" ? activeMenuClass : menuClass}>Positions</p>
                        </Link>
                    </li>
                    <li>
                        <Link style={{ textDecoration: "none" }} to="/funds">
                            <p className={location.pathname === "/funds" ? activeMenuClass : menuClass}>Funds</p>
                        </Link>
                    </li>
                </ul>

                <hr />

                {/* Real-Time Trading Profile Dropdown Popover */}
                <div 
                    className="profile-trigger" 
                    onClick={handleProfileClick} 
                    style={{ 
                        cursor: "pointer", 
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "4px 10px 4px 6px",
                        borderRadius: "24px",
                        border: "1px solid #E2E8F0",
                        background: isProfileDropdownOpen ? "#F1F5F9" : "#FFFFFF",
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                        transition: "all 0.2s ease"
                    }}
                >
                    <div className="avatar" style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        backgroundColor: profilePic ? "transparent" : "#EFF6FF",
                        color: "#2563EB",
                        fontWeight: "700",
                        fontSize: "0.85rem",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid #BFDBFE"
                    }}>
                        {profilePic ? (
                            <img src={profilePic} alt="profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                            initials
                        )}
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#0F172A" }}>
                        {user.username}
                    </span>
                    <KeyboardArrowDownIcon style={{ 
                        fontSize: "1.1rem", 
                        color: "#64748B",
                        transform: isProfileDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease" 
                    }} />

                    {isProfileDropdownOpen && (
                        <div className="profile-dropdown" style={{
                            position: "absolute",
                            top: "125%",
                            right: "0",
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #E2E8F0",
                            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
                            borderRadius: "14px",
                            padding: "0",
                            width: "250px",
                            zIndex: 1000,
                            overflow: "hidden"
                        }}>
                            {/* Profile Header Status Card */}
                            <div style={{
                                padding: "14px 16px",
                                background: "linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 100%)",
                                borderBottom: "1px solid #E2E8F0"
                            }}>
                                <div style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A" }}>
                                    {user.username}
                                </div>
                                <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                                    {user.email || "Trader"}
                                </div>
                            </div>

                            {/* Dropdown Menu Items */}
                            <div style={{ padding: "6px 0" }}>
                                <Link 
                                    to="/profile" 
                                    onClick={() => setIsProfileDropdownOpen(false)}
                                    style={{ textDecoration: "none", padding: "10px 16px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: "#0F172A", fontSize: "13px", fontWeight: "600" }} 
                                >
                                    <PersonOutlineIcon fontSize="small" style={{ color: "#3B82F6" }} /> My Profile
                                </Link>
                                <div 
                                    style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: "#0F172A", fontSize: "13px", fontWeight: "500" }} 
                                    onClick={() => window.location.reload()}
                                >
                                    <RefreshIcon fontSize="small" style={{ color: "#64748B" }} /> Refresh Market Quotes
                                </div>
                                <div 
                                    style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: "#EF4444", fontSize: "13px", fontWeight: "600", borderTop: "1px solid #E2E8F0", marginTop: "4px" }} 
                                    onClick={handleLogout}
                                >
                                    <ExitToAppIcon fontSize="small" /> Logout Account
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Menu;


