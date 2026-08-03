import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import ShowChartIcon from '@mui/icons-material/ShowChart';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import "./Auth.css";

const Login = () => {
    const navigate = useNavigate();
    const [inputValue, setInputValue] = useState({
        email: "",
        password: "",
    });
    const { email, password } = inputValue;

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
                "http://localhost:3000/login",
                {
                    ...inputValue,
                },
                { withCredentials: true }
            );
            console.log("Login response:", data);
            const { success, message, token } = data;
            if (success) {
                if (token) {
                    localStorage.setItem("token", token);
                    document.cookie = `token=${token}; path=/; max-age=${3 * 24 * 60 * 60}; SameSite=Lax`;
                }
                handleSuccess(message || "Welcome back!");
                setTimeout(() => {
                    navigate("/");
                }, 400);
            } else {
                handleError(message || "Incorrect email or password");
            }
        } catch (error) {
            console.error("Login error:", error);
            handleError("Login failed. Please check your network connection.");
        }
        setInputValue({
            email: "",
            password: "",
        });
    };

    return (
        <div className="form_container">
            <div className="auth_brand">
                <div className="auth_brand_icon">
                    <ShowChartIcon />
                </div>
                <div className="auth_brand_title">
                    Pulse<span style={{ color: "#10B981" }}>Trade</span>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <h2>Sign In to PulseTrade</h2>
                <p className="form_subtitle">Access your portfolio & real-time stock market workspace</p>
                <div>
                    <label htmlFor="email" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
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
                    <label htmlFor="password" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
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
                <button type="submit">Sign In to Workspace</button>
                <span>
                    Don't have an account? <Link to={"/signup"}>Create Account</Link>
                </span>
            </form>
            <ToastContainer />
        </div>
    );
};

export default Login;
