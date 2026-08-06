import React from 'react';
import { DASHBOARD_URL } from '../config';

function Footer() {
    return (
        <footer className="bg-light border-top py-5 mt-5">
            <div className="container">
                <div className="row gy-4">
                    <div className="col-lg-4 col-md-6">
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                            <div style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "8px",
                                background: "linear-gradient(135deg, #3B82F6 0%, #10B981 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                fontWeight: "bold"
                            }}>
                                ⚡
                            </div>
                            <span style={{ fontSize: "1.3rem", fontWeight: "700", color: "#0F172A", letterSpacing: "-0.5px" }}>
                                Pulse<span style={{ color: "#10B981" }}>Trade</span>
                            </span>
                        </div>
                        <p className="text-muted small">
                            A next-generation full-stack stock trading and portfolio management platform built with WebSockets, Node.js, Express, React, and MongoDB.
                        </p>
                        <p className="text-muted small">
                            © {new Date().getFullYear()} PulseTrade Inc. All rights reserved.
                        </p>
                    </div>

                    <div className="col-lg-2 col-md-6">
                        <h6 className="fw-bold text-dark mb-3">Platform</h6>
                        <ul className="list-unstyled text-muted small d-flex flex-direction-column gap-2">
                            <li><a href={`${DASHBOARD_URL}/signup`} className="text-decoration-none text-muted">Sign Up</a></li>
                            <li><a href={`${DASHBOARD_URL}/login`} className="text-decoration-none text-muted">Sign In</a></li>
                            <li><a href={DASHBOARD_URL} className="text-decoration-none text-muted">Trading Terminal</a></li>
                        </ul>
                    </div>

                    <div className="col-lg-3 col-md-6">
                        <h6 className="fw-bold text-dark mb-3">Features</h6>
                        <ul className="list-unstyled text-muted small d-flex flex-direction-column gap-2">
                            <li>Real-Time Market Feeds</li>
                            <li>Dynamic Order Matching</li>
                            <li>Portfolio Analytics</li>
                            <li>Isolated User Security</li>
                        </ul>
                    </div>

                    <div className="col-lg-3 col-md-6">
                        <h6 className="fw-bold text-dark mb-3">Technology Stack</h6>
                        <ul className="list-unstyled text-muted small d-flex flex-direction-column gap-2">
                            <li>React 19 & Vite</li>
                            <li>Node.js & Express REST API</li>
                            <li>Socket.io & Yahoo Finance API</li>
                            <li>MongoDB Atlas & Docker</li>
                        </ul>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;