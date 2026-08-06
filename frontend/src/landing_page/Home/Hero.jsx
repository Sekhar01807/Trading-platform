import React from 'react';
import { DASHBOARD_URL } from '../../config';

function Hero() {
    return (
        <div className='container py-4'>
            {/* Top Brand Header */}
            <div className='d-flex justify-content-between align-items-center py-3 mb-4 border-bottom'>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        background: "linear-gradient(135deg, #3B82F6 0%, #10B981 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontWeight: "bold",
                        fontSize: "1.2rem",
                        boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)"
                    }}>
                        ⚡
                    </div>
                    <span style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0F172A", letterSpacing: "-0.5px" }}>
                        Pulse<span style={{ color: "#10B981" }}>Trade</span>
                    </span>
                </div>

                <div className='d-flex gap-3'>
                    <a 
                        href={`${DASHBOARD_URL}/login`} 
                        className='btn btn-outline-scale px-3 py-2'
                        style={{ borderRadius: "8px", fontWeight: "600", fontSize: "0.9rem", border: "1px solid #CBD5E1", color: "#475569" }}
                    >
                        Sign In
                    </a>
                    <a 
                        href={`${DASHBOARD_URL}/signup`} 
                        className='btn btn-primary btn-scale px-4 py-2 shadow-sm'
                        style={{ background: "#3B82F6", borderColor: "#3B82F6", borderRadius: "8px", fontWeight: "600", fontSize: "0.9rem" }}
                    >
                        Get Started
                    </a>
                </div>
            </div>

            {/* Hero Main Content */}
            <div className='row justify-content-center align-items-center text-center py-5'>
                <div className='col-lg-10'>
                    {/* Headline */}
                    <h1 className='display-4 fw-bold text-dark mb-3' style={{ letterSpacing: "-1px" }}>
                        The Next-Gen Stock Trading & <br />
                        <span style={{
                            background: "linear-gradient(135deg, #3B82F6 0%, #10B981 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent"
                        }}>
                            Portfolio Management Platform
                        </span>
                    </h1>

                    {/* Subheadline */}
                    <p className='lead text-muted mb-5 mx-auto' style={{ maxWidth: "740px", fontSize: "1.15rem", lineHeight: "1.7" }}>
                        Monitor live stock tickers, execute instant BUY & SELL orders, track dynamic portfolio holdings, and analyze market trends in one unified workspace.
                    </p>

                    {/* CTAs */}
                    <div className='d-flex justify-content-center gap-3 mb-4'>
                        <a 
                            href={`${DASHBOARD_URL}/signup`} 
                            className='btn btn-primary btn-scale btn-lg px-4 py-3 shadow'
                            style={{
                                background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
                                border: "none",
                                borderRadius: "10px",
                                fontWeight: "600",
                                fontSize: "1rem"
                            }}
                        >
                            Launch Trading Terminal 🚀
                        </a>
                        <a 
                            href={`${DASHBOARD_URL}/login`} 
                            className='btn btn-outline-scale px-4 py-3'
                            style={{
                                borderRadius: "10px",
                                fontWeight: "600",
                                fontSize: "1rem",
                                border: "1px solid #CBD5E1",
                                color: "#475569"
                            }}
                        >
                            Access My Account
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Hero;