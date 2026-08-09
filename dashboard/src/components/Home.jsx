import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import Dashboard from "./Dashboard";
import TopBar from "./TopBar";
import { API_URL } from "../config";

const Home = () => {
    const navigate = useNavigate();
    const [cookies, setCookie, removeCookie] = useCookies(["token"]);
    const [user, setUser] = useState({ username: "", email: "", id: "" });
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const toastShown = useRef(false);

    const clearAuth = () => {
        localStorage.removeItem("token");
        removeCookie("token", { path: "/" });
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    };

    useEffect(() => {
        const verifyCookie = async () => {
            const token = localStorage.getItem("token") || cookies.token;
            if (!token) {
                console.log("No token found, redirecting to login");
                clearAuth();
                navigate("/login", { replace: true });
                return;
            }
            try {
                console.log("Verifying token with backend...");
                const { data } = await axios.post(
                    API_URL,
                    { token },
                    { 
                        withCredentials: true,
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                console.log("Backend response:", data);
                const { status, user: username, email, phone, bio, id, createdAt } = data;
                if (status) {
                    const savedUsername = localStorage.getItem(`username_override_${id}`);
                    const finalUsername = savedUsername || username;

                    setUser({ username: finalUsername, email: email || "", phone: phone || "", bio: bio || "", id, createdAt });
                    setIsAuthenticated(true);
                    if (!toastShown.current) {
                        toast(`Welcome ${finalUsername}`, { position: "top-right" });
                        toastShown.current = true;
                    }
                } else {
                    console.log("Verification failed, redirecting to login...");
                    clearAuth();
                    navigate("/login", { replace: true });
                }
            } catch (error) {
                console.error("Verification error:", error);
                clearAuth();
                navigate("/login", { replace: true });
            }
        };
        verifyCookie();
    }, [cookies, navigate]);

    const handleProfileUpdate = async (updatedFields) => {
        try {
            setUser((prev) => {
                const nextUser = { ...prev, ...updatedFields };
                if (updatedFields.username) {
                    localStorage.setItem(`username_override_${prev.id}`, updatedFields.username);
                }
                return nextUser;
            });

            // Sync with backend MongoDB database
            await axios.post(`${API_URL}/updateProfile`, {
                id: user.id,
                ...updatedFields
            });

            toast.success("Profile updated successfully!");
        } catch (err) {
            console.error("Failed to sync profile update:", err);
            toast.success("Profile updated locally!");
        }
    };

    if (!isAuthenticated) {
        return (
            <div style={{
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "#0F172A",
                color: "#FFFFFF",
                fontFamily: "sans-serif"
            }}>
                <img 
                    src="/logo.svg" 
                    alt="PulseTrade Logo" 
                    style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        marginBottom: "16px",
                        boxShadow: "0 0 20px rgba(59, 130, 246, 0.4)"
                    }} 
                />
                <h3 style={{ margin: "0 0 8px 0", fontWeight: "700", fontSize: "1.3rem" }}>Pulse<span style={{ color: "#10B981" }}>Trade</span></h3>
                <p style={{ margin: 0, color: "#94A3B8", fontSize: "14px" }}>Verifying session security...</p>
            </div>
        );
    }

    return (
        <>
            <div className="home_page">
                <TopBar user={user} onUsernameUpdate={(name) => handleProfileUpdate({ username: name })} />
                <Dashboard user={user} onProfileUpdate={handleProfileUpdate} onUsernameUpdate={(name) => handleProfileUpdate({ username: name })} />
                <ToastContainer />
            </div>
        </>
    );
};

export default Home;