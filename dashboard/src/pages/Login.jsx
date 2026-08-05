import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import ShowChartIcon from '@mui/icons-material/ShowChart';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LoginIcon from '@mui/icons-material/Login';
import "./Auth.css";

const Login = () => {
    const navigate = useNavigate();
    const [inputValue, setInputValue] = useState({
        email: "",
        password: "",
    });
    const { email, password } = inputValue;

    React.useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            navigate("/", { replace: true });
        }
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
                "http://localhost:3000/login",
                {
                    ...inputValue,
                },
                { withCredentials: true }
            );
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
            {/* PulseTrade Brand Mark */}
            <div className="auth_brand">
                <div className="auth_brand_icon">
                    <ShowChartIcon fontSize="large" />
                </div>
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
