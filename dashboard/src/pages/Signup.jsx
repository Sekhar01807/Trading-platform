import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import { authApi } from "../api/client";
import "./Auth.css";

const Signup = () => {
    const navigate = useNavigate();
    const [inputValue, setInputValue] = useState({
        email: "",
        password: "",
        username: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [flashMessage, setFlashMessage] = useState(null); // { type: 'error' | 'success', text: string }
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { email, password, username } = inputValue;

    React.useEffect(() => {
        authApi.verifySession()
            .then(({ data }) => {
                if (data && data.status) {
                    navigate("/", { replace: true });
                }
            })
            .catch(() => {});
    }, [navigate]);

    const handleOnChange = (e) => {
        const { name, value } = e.target;
        setInputValue((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Dismiss flash error on typing
        if (flashMessage && flashMessage.type === "error") {
            setFlashMessage(null);
        }
    };

    const validateForm = () => {
        const cleanName = (username || "").trim();
        const cleanEmail = (email || "").trim();
        const cleanPass = (password || "");

        if (!cleanName || cleanName.length < 2) {
            setFlashMessage({ type: "error", text: "Please enter your name (minimum 2 characters)." });
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!cleanEmail || !emailRegex.test(cleanEmail)) {
            setFlashMessage({ type: "error", text: "Please enter a valid email address." });
            return false;
        }

        if (!cleanPass || cleanPass.length < 8) {
            setFlashMessage({ type: "error", text: "Password must be at least 8 characters long." });
            return false;
        }

        if (!/[a-zA-Z]/.test(cleanPass) || !/[\d\W]/.test(cleanPass)) {
            setFlashMessage({ type: "error", text: "Password must include both letters and numbers or symbols." });
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setFlashMessage(null);

        try {
            const { data } = await authApi.signup({
                username: username.trim(),
                email: email.trim(),
                password,
            });

            const { success, message } = data;
            if (success) {
                setFlashMessage({ type: "success", text: "Account created successfully! Entering trading terminal..." });
                setTimeout(() => {
                    navigate("/");
                }, 500);
            } else {
                setFlashMessage({ type: "error", text: message || "Signup failed. Please try again." });
            }
        } catch (error) {
            console.error("Signup error:", error);
            const errMsg = error.response?.data?.message || "Signup failed. Please check your details and try again.";
            setFlashMessage({ type: "error", text: errMsg });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="form_container">
            {/* PulseTrade Brand Header */}
            <div className="auth_brand">
                <img 
                    src="/logo.svg" 
                    alt="PulseTrade Logo" 
                    className="auth_brand_logo"
                />
                <div className="auth_brand_title">
                    Pulse<span style={{ color: "#10B981" }}>Trade</span>
                </div>
            </div>

            {/* Registration Form Card */}
            <form onSubmit={handleSubmit} className="auth_form_card" noValidate>
                <h2>Create Free Account</h2>
                <p className="form_subtitle">
                    Join PulseTrade for real-time paper trading & dynamic portfolio analytics
                </p>

                {/* In-Form Flash Alert Banner (Single source of feedback, no popping toasts) */}
                {flashMessage && (
                    <div className={`auth_flash_banner ${flashMessage.type}`} role="alert">
                        <div className="flash_icon_wrap">
                            {flashMessage.type === "success" ? (
                                <CheckCircleOutlineIcon className="flash_icon" />
                            ) : (
                                <ErrorOutlineIcon className="flash_icon" />
                            )}
                        </div>
                        <div className="flash_text">{flashMessage.text}</div>
                        <button 
                            type="button" 
                            className="flash_close_btn" 
                            onClick={() => setFlashMessage(null)}
                            aria-label="Close message"
                        >
                            <CloseIcon style={{ fontSize: "1rem" }} />
                        </button>
                    </div>
                )}

                {/* Field 1: Your Name */}
                <div className="form_group">
                    <label htmlFor="username" className="form_label">
                        <PersonOutlineIcon className="form_label_icon" /> Your Name
                    </label>
                    <div className="input_wrapper">
                        <input
                            id="username"
                            type="text"
                            name="username"
                            value={username}
                            placeholder="John Doe"
                            onChange={handleOnChange}
                            autoComplete="name"
                            required
                        />
                    </div>
                </div>

                {/* Field 2: Email Address */}
                <div className="form_group">
                    <label htmlFor="email" className="form_label">
                        <EmailOutlinedIcon className="form_label_icon" /> Email Address
                    </label>
                    <div className="input_wrapper">
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={email}
                            placeholder="name@example.com"
                            onChange={handleOnChange}
                            autoComplete="email"
                            required
                        />
                    </div>
                </div>

                {/* Field 3: Password */}
                <div className="form_group">
                    <label htmlFor="password" className="form_label">
                        <LockOutlinedIcon className="form_label_icon" /> Password
                    </label>
                    <div className="input_wrapper">
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={password}
                            placeholder="••••••••"
                            onChange={handleOnChange}
                            autoComplete="new-password"
                            required
                        />
                        <button
                            type="button"
                            className="password_toggle_btn"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? (
                                <VisibilityOffOutlinedIcon style={{ fontSize: "1.15rem" }} />
                            ) : (
                                <VisibilityOutlinedIcon style={{ fontSize: "1.15rem" }} />
                            )}
                        </button>
                    </div>
                </div>

                <button type="submit" className="auth_submit_btn" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <span>Creating Account...</span>
                    ) : (
                        <>
                            Create Free Account <RocketLaunchIcon style={{ fontSize: "1.1rem" }} />
                        </>
                    )}
                </button>

                <div className="auth_footer_link">
                    Already have an account? <Link to="/login">Sign In</Link>
                </div>
            </form>
        </div>
    );
};

export default Signup;
