import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCookies } from "react-cookie";
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const Menu = ({ user, onUsernameUpdate }) => {
    const [active, setActive] = useState(0);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [cookies, setCookie, removeCookie] = useCookies(["token"]);
    const [profilePic, setProfilePic] = useState(null);
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [tempUsername, setTempUsername] = useState(user.username);

    // Sync tempUsername when user.username changes
    useEffect(() => {
        setTempUsername(user.username);
    }, [user.username]);

    // Load profile picture from localStorage on mount
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
        removeCookie("token");
        window.location.href = "http://localhost:5173";
    };

    const menuClass = "menu";
    const activeMenuClass = "menu selected";

    const initials = user.username
        ? user.username.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)
        : "ZU";

    return (
        <div className="menu-container">
            <img src="logo.svg" style={{ width: "50px" }} alt="logo" />
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
                    <li>
                        <Link style={{ textDecoration: "none" }} to="/apps" onClick={() => handleMenuClick(5)}>
                            <p className={active === 5 ? activeMenuClass : menuClass}>Apps</p>
                        </Link>
                    </li>
                </ul>
                <hr />
                <div className="profile" onClick={handleProfileClick} style={{ cursor: "pointer", position: "relative" }}>
                    <div className="avatar" style={{
                        backgroundColor: profilePic ? "transparent" : "#e0e7ff",
                        color: "#4f46e5",
                        fontWeight: "bold",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}>
                        {profilePic ? (
                            <img src={profilePic} alt="profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                            initials
                        )}
                    </div>
                    <p className="username" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        {user.username} <KeyboardArrowDownIcon />
                    </p>

                    {isProfileDropdownOpen && (
                        <div className="profile-dropdown" style={{
                            position: "absolute",
                            top: "100%",
                            right: "0",
                            backgroundColor: "white",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            borderRadius: "4px",
                            padding: "10px 0",
                            width: "200px",
                            zIndex: 1000,
                            marginTop: "10px"
                        }}>
                            <div style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: "#444" }} onClick={() => setIsProfileModalOpen(true)}>
                                <PersonOutlineIcon fontSize="small" /> My profile
                            </div>
                            <div style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: "#444" }} onClick={() => window.location.reload()}>
                                <RefreshIcon fontSize="small" /> Restart
                            </div>
                            <div style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: "#444" }}>
                                <HelpOutlineIcon fontSize="small" /> Need help?
                            </div>
                            <div style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: "#444", borderTop: "1px solid #eee" }} onClick={handleLogout}>
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
                    backgroundColor: "rgba(0,0,0,0.5)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 2000
                }}>
                    <div style={{
                        backgroundColor: "white",
                        padding: "30px",
                        borderRadius: "8px",
                        width: "400px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h3>My Profile</h3>
                            <button onClick={() => { setIsProfileModalOpen(false); setIsEditingUsername(false); }} style={{ border: "none", background: "none", cursor: "pointer", fontSize: "1.2rem" }}>&times;</button>
                        </div>

                        {/* Profile Pic Upload Section */}
                        <div style={{ textAlign: "center", marginBottom: "25px" }}>
                            <div style={{
                                width: "100px",
                                height: "100px",
                                borderRadius: "50%",
                                backgroundColor: "#f0f2f5",
                                margin: "0 auto 15px",
                                overflow: "hidden",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: "2px solid #eee"
                            }}>
                                {profilePic ? (
                                    <img src={profilePic} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                    <span style={{ fontSize: "2rem", color: "#999" }}>{initials}</span>
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
                                    backgroundColor: "#4f46e5",
                                    color: "white",
                                    padding: "8px 16px",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontSize: "0.9rem",
                                    transition: "background 0.3s"
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = "#4338ca"}
                                onMouseOut={(e) => e.target.style.backgroundColor = "#4f46e5"}
                            >
                                Change Photo
                            </label>
                            {profilePic && (
                                <button
                                    onClick={() => {
                                        setProfilePic(null);
                                        localStorage.removeItem(`profilePic_${user.id}`);
                                    }}
                                    style={{
                                        display: "block",
                                        margin: "10px auto 0",
                                        background: "none",
                                        border: "none",
                                        color: "#ef4444",
                                        cursor: "pointer",
                                        fontSize: "0.8rem"
                                    }}
                                >
                                    Remove Photo
                                </button>
                            )}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                            <div style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                                    <label style={{ display: "block", fontSize: "0.8rem", color: "#888", textTransform: "uppercase", letterSpacing: "1px" }}>User ID</label>
                                    {!isEditingUsername ? (
                                        <button onClick={() => setIsEditingUsername(true)} style={{ color: "#4f46e5", border: "none", background: "none", cursor: "pointer", fontSize: "0.8rem" }}>Edit</button>
                                    ) : (
                                        <div style={{ display: "flex", gap: "10px" }}>
                                            <button onClick={handleSaveUsername} style={{ color: "green", border: "none", background: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold" }}>Save</button>
                                            <button onClick={() => { setIsEditingUsername(false); setTempUsername(user.username); }} style={{ color: "#ef4444", border: "none", background: "none", cursor: "pointer", fontSize: "0.8rem" }}>Cancel</button>
                                        </div>
                                    )}
                                </div>
                                {!isEditingUsername ? (
                                    <div style={{ fontSize: "1.2rem", fontWeight: "500", color: "#333" }}>{user.username}</div>
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
                                            border: "none",
                                            borderBottom: "2px solid #4f46e5",
                                            outline: "none"
                                        }}
                                    />
                                )}
                            </div>
                            <div style={{ padding: "10px" }}>
                                <label style={{ display: "block", fontSize: "0.8rem", color: "#888", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "1px" }}>Email</label>
                                <div style={{ fontSize: "1.2rem", fontWeight: "500", color: "#333" }}>{user.email || "N/A"}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Menu;
