import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCookies } from "react-cookie";
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import LanguageIcon from '@mui/icons-material/Language';

const Menu = ({ user, onUsernameUpdate }) => {
    const [active, setActive] = useState(0);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [cookies, setCookie, removeCookie] = useCookies(["token"]);
    const [profilePic, setProfilePic] = useState(null);
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [tempUsername, setTempUsername] = useState(user.username);
    
    // Theme state (light / dark)
    const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
    };

    useEffect(() => {
        setTempUsername(user.username);
    }, [user.username]);

    useEffect(() => {
        const savedPic = localStorage.getItem(`profilePic_${user.id}`);
        if (savedPic) {
            setProfilePic(savedPic);
        }
    }, [user.id]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result;
                setProfilePic(base64String);
                localStorage.setItem(`profilePic_${user.id}`, base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveUsername = () => {
        if (tempUsername.trim()) {
            onUsernameUpdate(tempUsername);
            setIsEditingUsername(false);
        }
    };

    const handleMenuClick = (index) => {
        setActive(index);
    };

    const handleProfileClick = () => {
        setIsProfileDropdownOpen(!isProfileDropdownOpen);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        removeCookie("token");
        window.location.href = "/login";
    };

    const menuClass = "menu";
    const activeMenuClass = "menu selected";

    const initials = user.username
        ? user.username.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)
        : "PT";

    return (
        <div className="menu-container">
            {/* PulseTrade Custom Brand Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
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
                    color: "var(--text-primary)"
                }}>
                    Pulse<span style={{ color: "#10B981" }}>Trade</span>
                </span>
            </div>

            <div className="menus">
                <ul>
                    <li>
                        <Link style={{ textDecoration: "none" }} to="/" onClick={() => handleMenuClick(0)}>
                            <p className={active === 0 ? activeMenuClass : menuClass}>Dashboard</p>
                        </Link>
                    </li>
                    <li>
                        <Link style={{ textDecoration: "none" }} to="/orders" onClick={() => handleMenuClick(1)}>
                            <p className={active === 1 ? activeMenuClass : menuClass}>Orders</p>
                        </Link>
                    </li>
                    <li>
                        <Link style={{ textDecoration: "none" }} to="/holdings" onClick={() => handleMenuClick(2)}>
                            <p className={active === 2 ? activeMenuClass : menuClass}>Holdings</p>
                        </Link>
                    </li>
                    <li>
                        <Link style={{ textDecoration: "none" }} to="/positions" onClick={() => handleMenuClick(3)}>
                            <p className={active === 3 ? activeMenuClass : menuClass}>Positions</p>
                        </Link>
                    </li>
                    <li>
                        <Link style={{ textDecoration: "none" }} to="/funds" onClick={() => handleMenuClick(4)}>
                            <p className={active === 4 ? activeMenuClass : menuClass}>Funds</p>
                        </Link>
                    </li>
                </ul>

                {/* Theme Switcher Button (☀️ / 🌙) */}
                <button
                    onClick={toggleTheme}
                    title="Toggle Light/Dark Theme"
                    style={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "8px",
                        padding: "6px 12px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        color: "var(--text-primary)",
                        fontSize: "0.8rem",
                        fontWeight: "500",
                        marginLeft: "12px",
                        transition: "all 0.2s"
                    }}
                >
                    {theme === "light" ? (
                        <>
                            <NightsStayIcon style={{ fontSize: "1rem", color: "#6366F1" }} /> Dark
                        </>
                    ) : (
                        <>
                            <WbSunnyIcon style={{ fontSize: "1rem", color: "#F59E0B" }} /> Light
                        </>
                    )}
                </button>

                <hr />

                <div className="profile" onClick={handleProfileClick} style={{ cursor: "pointer", position: "relative" }}>
                    <div className="avatar" style={{
                        backgroundColor: profilePic ? "transparent" : "var(--bg-surface)",
                        color: "var(--accent-primary)",
                        fontWeight: "600",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid var(--border-color)"
                    }}>
                        {profilePic ? (
                            <img src={profilePic} alt="profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                            initials
                        )}
                    </div>
                    <p className="username" style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--text-primary)" }}>
                        {user.username} <KeyboardArrowDownIcon style={{ fontSize: "1rem", color: "var(--text-secondary)" }} />
                    </p>

                    {isProfileDropdownOpen && (
                        <div className="profile-dropdown" style={{
                            position: "absolute",
                            top: "100%",
                            right: "0",
                            backgroundColor: "var(--bg-card)",
                            border: "1px solid var(--border-color)",
                            boxShadow: "var(--shadow-card)",
                            borderRadius: "8px",
                            padding: "8px 0",
                            width: "210px",
                            zIndex: 1000,
                            marginTop: "10px"
                        }}>
                            <div style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: "var(--text-primary)" }} onClick={() => setIsProfileModalOpen(true)}>
                                <PersonOutlineIcon fontSize="small" style={{ color: "var(--accent-primary)" }} /> My Profile
                            </div>
                            <a href="http://localhost:5174" target="_blank" rel="noreferrer" style={{ textDecoration: "none", padding: "10px 20px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: "var(--text-primary)" }}>
                                <LanguageIcon fontSize="small" style={{ color: "var(--accent-green)" }} /> Marketing Site
                            </a>
                            <div style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: "var(--text-primary)" }} onClick={() => window.location.reload()}>
                                <RefreshIcon fontSize="small" style={{ color: "var(--text-secondary)" }} /> Refresh Data
                            </div>
                            <div style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: "var(--accent-red)", borderTop: "1px solid var(--border-color)" }} onClick={handleLogout}>
                                <ExitToAppIcon fontSize="small" /> Logout
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isProfileModalOpen && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 2000
                }}>
                    <div style={{
                        backgroundColor: "var(--bg-card)",
                        border: "1px solid var(--border-color)",
                        padding: "30px",
                        borderRadius: "12px",
                        width: "400px",
                        boxShadow: "var(--shadow-card)",
                        color: "var(--text-primary)"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h3 style={{ margin: 0, color: "var(--text-primary)" }}>My Profile</h3>
                            <button onClick={() => { setIsProfileModalOpen(false); setIsEditingUsername(false); }} style={{ border: "none", background: "none", cursor: "pointer", fontSize: "1.4rem", color: "var(--text-secondary)" }}>&times;</button>
                        </div>

                        <div style={{ textAlign: "center", marginBottom: "25px" }}>
                            <div style={{
                                width: "100px",
                                height: "100px",
                                borderRadius: "50%",
                                backgroundColor: "var(--bg-surface)",
                                margin: "0 auto 15px",
                                overflow: "hidden",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: "2px solid var(--border-color)"
                            }}>
                                {profilePic ? (
                                    <img src={profilePic} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                    <span style={{ fontSize: "2rem", color: "var(--accent-primary)" }}>{initials}</span>
                                )}
                            </div>
                            <input
                                type="file"
                                id="profile-upload"
                                hidden
                                accept="image/*,.jpeg,.jpg,.png"
                                onChange={handleImageUpload}
                            />
                            <label
                                htmlFor="profile-upload"
                                style={{
                                    backgroundColor: "var(--accent-primary)",
                                    color: "white",
                                    padding: "8px 16px",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontSize: "0.9rem",
                                    fontWeight: "500",
                                    transition: "all 0.2s"
                                }}
                            >
                                Change Photo
                            </label>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                            <div style={{ padding: "10px", borderBottom: "1px solid var(--border-color)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>User ID</label>
                                    {!isEditingUsername ? (
                                        <button onClick={() => setIsEditingUsername(true)} style={{ color: "var(--accent-primary)", border: "none", background: "none", cursor: "pointer", fontSize: "0.8rem" }}>Edit</button>
                                    ) : (
                                        <div style={{ display: "flex", gap: "10px" }}>
                                            <button onClick={handleSaveUsername} style={{ color: "var(--accent-green)", border: "none", background: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold" }}>Save</button>
                                            <button onClick={() => { setIsEditingUsername(false); setTempUsername(user.username); }} style={{ color: "var(--accent-red)", border: "none", background: "none", cursor: "pointer", fontSize: "0.8rem" }}>Cancel</button>
                                        </div>
                                    )}
                                </div>
                                {!isEditingUsername ? (
                                    <div style={{ fontSize: "1.2rem", fontWeight: "500", color: "var(--text-primary)" }}>{user.username}</div>
                                ) : (
                                    <input
                                        type="text"
                                        value={tempUsername}
                                        onChange={(e) => setTempUsername(e.target.value)}
                                        autoFocus
                                        style={{
                                            width: "100%",
                                            fontSize: "1.1rem",
                                            padding: "5px 0",
                                            background: "transparent",
                                            color: "var(--text-primary)",
                                            border: "none",
                                            borderBottom: "2px solid var(--accent-primary)",
                                            outline: "none"
                                        }}
                                    />
                                )}
                            </div>
                            <div style={{ padding: "10px" }}>
                                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "1px" }}>Email</label>
                                <div style={{ fontSize: "1.2rem", fontWeight: "500", color: "var(--text-primary)" }}>{user.email || "N/A"}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Menu;
