import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import ShowChartIcon from '@mui/icons-material/ShowChart';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import "./Auth.css";

const Signup = () => {
    const navigate = useNavigate();
    const [inputValue, setInputValue] = useState({
        email: "",
        password: "",
        username: "",
    });
    const { email, password, username } = inputValue;

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
                "http://localhost:3000/signup",
                {
                    ...inputValue,
                },
                { withCredentials: true }
            );
            const { success, message, token } = data;
            if (success) {
                // Instant Auto-Login on Registration
                if (token) {
                    localStorage.setItem("token", token);
                    document.cookie = `token=${token}; path=/; max-age=${3 * 24 * 60 * 60}; SameSite=Lax`;
                }
                handleSuccess("Account created! Entering workspace...");
                setTimeout(() => {
                    navigate("/");
                }, 400);
            } else {
                handleError(message || "Signup failed");
            }
        } catch (error) {
            console.error("Signup error:", error);
            handleError("Signup failed. Please try again.");
        }
        setInputValue({
            email: "",
            password: "",
            username: "",
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
                <h2>Create Free Account</h2>
                <p className="form_subtitle">Join PulseTrade for real-time stock trading & portfolio tracking</p>
                <div>
                    <label htmlFor="username" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <PersonOutlineIcon style={{ fontSize: "1rem", color: "#3B82F6" }} /> Full Name / Username
                    </label>
                    <input
                        type="text"
                        name="username"
                        value={username}
                        placeholder="John Doe"
                        onChange={handleOnChange}
                        required
                    />
                </div>
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
                <button type="submit">Create Free Account</button>
                <span>
                    Already have an account? <Link to={"/login"}>Sign In</Link>
                </span>
            </form>
            <ToastContainer />
        </div>
    );
};

export default Signup;
