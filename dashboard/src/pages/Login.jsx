import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LoginIcon from '@mui/icons-material/Login';
import { API_URL } from "../config";
import "./Auth.css";

const Login = () => {
    const navigate = useNavigate();
    const [inputValue, setInputValue] = useState({
        email: "",
        password: "",
    });
    const { email, password } = inputValue;

    React.useEffect(() => {
        axios.post(API_URL, {}, { withCredentials: true })
            .then(({ data }) => {
                if (data && data.status) {
                    navigate("/", { replace: true });
                }
            })
            .catch(() => {});
    }, [navigate]);

    const handleOnChange = (e) => {
        const { name, value } = e.target;
        setInputValue({
            ...inputValue,
            [name]: value,
        });
    };

    const handleError = (err) =>
        toast.error(err, {
            position: "top-right",
        });
    const handleSuccess = (msg) =>
        toast.success(msg, {
            position: "top-right",
        });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post(
                `${API_URL}/login`,
                {
                    ...inputValue,
                },
                { withCredentials: true }
            );
            const { success, message } = data;
            if (success) {
                handleSuccess(message || "Welcome back!");
                setTimeout(() => {
                    navigate("/");
                }, 400);
            } else {
                handleError(message || "Incorrect email or password");
            }
        } catch (error) {
            console.error("Login error:", error);
            handleError(error.response?.data?.message || "Login failed. Please check your credentials.");
        }
        setInputValue({
            email: "",
            password: "",
        });
    };

    return (
        <div className="form_container">
            {/* PulseTrade Brand Mark */}
            <div className="auth_brand">
                <img 
                    src="/logo.svg" 
                    alt="PulseTrade Logo" 
                    style={{ width: "44px", height: "44px", borderRadius: "10px", boxShadow: "0 4px 14px rgba(59, 130, 246, 0.3)" }} 
                />
                <div className="auth_brand_title">
                    Pulse<span style={{ color: "#10B981" }}>Trade</span>
                </div>
            </div>

            {/* Login Card */}
            <form onSubmit={handleSubmit}>
                <h2>Sign In to Workspace</h2>
                <p className="form_subtitle">Access your live stock watchlist, orders & portfolio terminal</p>
                <div>
                    <label htmlFor="email">
                        <EmailOutlinedIcon style={{ fontSize: "1rem", color: "#3B82F6" }} /> Email Address
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={email}
                        placeholder="name@example.com"
                        onChange={handleOnChange}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password">
                        <LockOutlinedIcon style={{ fontSize: "1rem", color: "#3B82F6" }} /> Password
                    </label>
                    <input
                        type="password"
                        name="password"
                        value={password}
                        placeholder="••••••••"
                        onChange={handleOnChange}
                        required
                    />
                </div>
                <button type="submit">
                    Sign In to Terminal <LoginIcon style={{ fontSize: "1.1rem" }} />
                </button>
                <span>
                    Don't have an account? <Link to={"/signup"}>Create Free Account</Link>
                </span>
            </form>
            <ToastContainer />
        </div>
    );
};

export default Login;
