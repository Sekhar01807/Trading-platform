import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import Dashboard from "./Dashboard";
import TopBar from "./TopBar";

const Home = () => {
    const navigate = useNavigate();
    const [cookies, removeCookie] = useCookies([]);
    const [user, setUser] = useState({ username: "", email: "", id: "" });
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const toastShown = useRef(false);

    useEffect(() => {
        const verifyCookie = async () => {
            const token = localStorage.getItem("token") || cookies.token;
            if (!token) {
                console.log("No token found, redirecting to login");
                navigate("/login");
                return;
            }
            try {
                console.log("Verifying token with backend...");
                const { data } = await axios.post(
                    "http://localhost:3000",
                    { token },
                    { 
                        withCredentials: true,
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                console.log("Backend response:", data);
                const { status, user: username, email, id } = data;
                if (status) {
                    const savedUsername = localStorage.getItem(`username_override_${id}`);
                    const finalUsername = savedUsername || username;

                    setUser({ username: finalUsername, email, id });
                    setIsAuthenticated(true);
                    if (!toastShown.current) {
                        toast(`Welcome ${finalUsername}`, { position: "top-right" });
                        toastShown.current = true;
                    }
                } else {
                    console.log("Verification failed, redirecting to login...");
                    localStorage.removeItem("token");
                    removeCookie("token");
                    navigate("/login");
                }
            } catch (error) {
                console.error("Verification error:", error);
                localStorage.removeItem("token");
                removeCookie("token");
                navigate("/login");
            }
        };
        verifyCookie();
    }, [cookies, navigate, removeCookie]);

    const handleUsernameUpdate = (newUsername) => {
        setUser((prev) => {
            const updatedUser = { ...prev, username: newUsername };
            localStorage.setItem(`username_override_${prev.id}`, newUsername);
            return updatedUser;
        });
        toast.success("Profile updated successfully!");
    };

    if (!isAuthenticated) {
        return (
            <div style={{
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#0B0F19",
                color: "#9CA3AF"
            }}>
                Authenticating...
            </div>
        );
    }

    return (
        <>
            <div className="home_page">
                <TopBar user={user} onUsernameUpdate={handleUsernameUpdate} />
                <Dashboard user={user} />
                <ToastContainer />
            </div>
        </>
    );
};

export default Home;