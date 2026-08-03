import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function SignUp() {
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
                "http://localhost:3000/signup",
                {
                    ...inputValue,
                },
                { withCredentials: true }
            );
            const { success, message } = data;
            if (success) {
                handleSuccess(message);
                setTimeout(() => {
                    navigate("/login");
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
        <div className="container" style={{ marginTop: "100px" }}>
            <div className="row">
                <div className="col-12 col-md-7 text-center  mt-5 p-5">
                    <img
                        src="Images/signup.png"
                        style={{ width: "90%" }}
                        alt="Sign up"
                    />
                </div>
                <div className="col-12 col-md-5 p-5">
                    <h3>Signup now</h3>
                    <p className="text-muted">Or track your existing application</p>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="email" className="form-label">Email address</label>
                            <input
                                type="email"
                                className="form-control"
                                name="email"
                                value={email}
                                placeholder="Enter your email"
                                onChange={handleOnChange}
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="username" className="form-label">Username</label>
                            <input
                                type="text"
                                className="form-control"
                                name="username"
                                value={username}
                                placeholder="Enter your username"
                                onChange={handleOnChange}
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="password" className="form-label">Password</label>
                            <input
                                type="password"
                                className="form-control"
                                name="password"
                                value={password}
                                placeholder="Enter your password"
                                onChange={handleOnChange}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-100 mb-3" style={{ backgroundColor: "#387ed1", border: "none" }}>Sign Up</button>
                        <p className="text-muted text-center" style={{ fontSize: "12px" }}>
                            By proceeding, you agree to the Zerodha <Link to="/terms" style={{ textDecoration: "none" }}>terms</Link> & <Link to="/privacy" style={{ textDecoration: "none" }}>privacy policy</Link>
                        </p>
                        <p className="text-center mt-3">
                            Already have an account? <Link to="/login" style={{ textDecoration: "none" }}>Login</Link>
                        </p>
                    </form>
                </div>
            </div>

            <div className="row mt-5">
                <div className="col-8 offset-2 text-center mt-5 mb-5">
                    <h3 className="mb-5">Investment options with Zerodha demat account</h3>
                    <div className="row text-start">
                        <div className="col-6 col-md-6 mb-4 d-flex align-items-start mt-5">
                            <img src="Images/stocks-acop.svg" alt="Stocks" style={{ width: "25%", marginRight: "12px" }} />
                            <div>
                                <h4>Stocks</h4>
                                <p className="text-muted" style={{ fontSize: "1.1rem" }}>Invest in all exchange-listed securities</p>
                            </div>
                        </div>
                        <div className="col-6 col-md-6 mb-4 d-flex align-items-start mt-5">
                            <img src="Images/mf-acop.svg" alt="Mutual Funds" style={{ width: "25%", marginRight: "12px" }} />
                            <div>
                                <h4>Mutual funds</h4>
                                <p className="text-muted" style={{ fontSize: "1.1rem" }}>Invest in commission-free direct mutual funds</p>
                            </div>
                        </div>
                        <div className="col-6 col-md-6 mb-4 d-flex align-items-start mt-5">
                            <img src="Images/ipo-acop.svg" alt="IPO" style={{ width: "25%", marginRight: "12px" }} />
                            <div>
                                <h4>IPO</h4>
                                <p className="text-muted" style={{ fontSize: "1.1rem" }}>Apply to the latest IPOs instantly via UPI</p>
                            </div>
                        </div>
                        <div className="col-6 col-md-6 mb-4 d-flex align-items-start mt-5">
                            <img src="Images/fo-acop.svg" alt="Futures & Options" style={{ width: "25%", marginRight: "12px" }} />
                            <div>
                                <h4>Futures & options</h4>
                                <p className="text-muted" style={{ fontSize: "1.1rem" }}>Hedge and mitigate market risk through simplified F&O trading</p>
                            </div>
                        </div>
                    </div>
                    <div className="text-center mt-4">
                        <button className="btn btn-primary" style={{ backgroundColor: "#387ed1", border: "none" ,height:"3rem",fontSize:"1.4rem"}}>Explore Investments</button>
                    </div>
                </div>
            </div>

            <div className="row mt-5 mb-5 align-items-center">
                <div className="col-12 text-center mb-5">
                    <h3>Steps to open a demat account with Zerodha</h3>
                </div>
                <div className="col-12 col-md-6 text-center">
                    <img src="Images/steps-acop.svg" alt="Steps" className="img-fluid" style={{ maxWidth: "90%" }} />
                </div>
                <div className="col-12 col-md-6 mt-4 mt-md-0">
                    <ul className="list-unstyled">
                        <li className="mb-4 d-flex align-items-center">
                            <span className="badge rounded-circle bg-light text-dark me-3 border" style={{ width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>01</span>
                            <span style={{ fontSize: "1.2rem" }}>Enter the requested details</span>
                        </li>
                        <li className="mb-4 d-flex align-items-center">
                            <span className="badge rounded-circle bg-light text-dark me-3 border" style={{ width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>02</span>
                            <span style={{ fontSize: "1.2rem" }}>Complete e-sign & verification</span>
                        </li>
                        <li className="mb-4 d-flex align-items-center">
                            <span className="badge rounded-circle bg-light text-dark me-3 border" style={{ width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>03</span>
                            <span style={{ fontSize: "1.2rem" }}>Start investing!</span>
                        </li>
                    </ul>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
}

export default SignUp;
