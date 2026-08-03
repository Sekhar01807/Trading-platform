import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Login() {
    const [inputValue, setInputValue] = useState({
        email: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const { email, password } = inputValue;
    const navigate = useNavigate();

    const handleOnChange = (e) => {
        const { name, value } = e.target;
        setInputValue({
            ...inputValue,
            [name]: value,
        });
    };

    const handleError = (err) =>
        toast.error(err, {
            position: "bottom-left",
        });
    const handleSuccess = (msg) =>
        toast.success(msg, {
            position: "bottom-left",
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
            const { success, message } = data;
            if (success) {
                handleSuccess(message);
                setTimeout(() => {
                    window.location.href = "http://localhost:5174";
                }, 1000);
            } else {
                handleError(message);
            }
        } catch (error) {
            console.log(error);
            handleError(error.response?.data?.message || "Something went wrong!");
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-12 col-md-4">
                    <div className="text-center mb-4">
                        <img src="/Images/logo_copy.svg" alt="Logo" style={{ width: "50px" }} />
                    </div>
                    <h2 className="text-center mb-4" style={{ color: "#444" }}>Login to Kite</h2>

                    <div className="card p-4 shadow-sm" style={{ border: "1px solid #eee" }}>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label htmlFor="email" className="form-label text-muted" style={{ fontSize: "14px", position: "absolute", marginTop: "-10px", marginLeft: "10px", backgroundColor: "white", padding: "0 5px" }}>Email or User ID</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    id="email"
                                    name="email"
                                    value={email}
                                    onChange={handleOnChange}
                                    style={{ height: "50px", borderRadius: "2px" }}
                                />
                            </div>

                            <div className="mb-3 position-relative">
                                <label htmlFor="password" className="form-label text-muted" style={{ fontSize: "14px", position: "absolute", marginTop: "-10px", marginLeft: "10px", backgroundColor: "white", padding: "0 5px", zIndex: 1 }}>Password</label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="form-control"
                                    id="password"
                                    name="password"
                                    value={password}
                                    onChange={handleOnChange}
                                    style={{ height: "50px", borderRadius: "2px" }}
                                />
                                <span
                                    className="position-absolute"
                                    style={{ right: "15px", top: "15px", cursor: "pointer", color: "#999" }}
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                                </span>
                            </div>

                            <button type="submit" className="btn w-100 mt-2" style={{ backgroundColor: "#387ed1", color: "white", fontWeight: "600", padding: "10px", borderRadius: "2px" }}>Login</button>
                        </form>

                        <div className="text-center mt-3">
                            <a href="#" className="text-muted" style={{ fontSize: "12px", textDecoration: "none" }}>Forgot user ID or password?</a>
                        </div>
                    </div>

                    <div className="text-center mt-5">
                        <img src="/Images/googlePlayBadge.svg" alt="Google Play" className="mx-2" style={{ height: "40px" }} />
                        <img src="/Images/appstoreBadge.svg" alt="App Store" className="mx-2" style={{ height: "40px" }} />
                    </div>

                    <div className="text-center mt-4">
                        <img src="/Images/logo.svg" alt="Zerodha" style={{ width: "100px", opacity: "0.6" }} />
                    </div>

                    <div className="text-center mt-3">
                        <p className="text-muted" style={{ fontSize: "14px" }}>Don't have an account? <Link to="/signup" style={{ textDecoration: "none", color: "#387ed1" }}>Sign up for free!</Link></p>
                    </div>

                    <div className="text-center mt-4 text-muted" style={{ fontSize: "11px", lineHeight: "1.6" }}>
                        <p>Zerodha Broking Limited: Member of NSE, BSE, MCX - SEBI Reg. no. INZ000031633, CDSL - SEBI Reg. no. IN-DP-431-2019 | Smart Online Dispute Resolution | SEBI SCORES</p>
                        <p>v3.0.0</p>
                    </div>

                </div>
            </div>
            <ToastContainer />
        </div>
    );
}

export default Login;
