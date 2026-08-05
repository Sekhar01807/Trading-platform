import React from "react";
import { Link } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

const NotFound = () => {
    return (
        <div style={{
            minHeight: "80vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 20px",
            textAlign: "center",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}>
            <div style={{
                width: "80px",
                height: "80px",
                borderRadius: "20px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "24px",
                color: "#EF4444"
            }}>
                <ErrorOutlineIcon style={{ fontSize: "42px" }} />
            </div>

            <h1 style={{
                fontSize: "3.5rem",
                fontWeight: "800",
                color: "#0F172A",
                margin: "0 0 10px 0",
                letterSpacing: "-1px"
            }}>
                404
            </h1>

            <h2 style={{
                fontSize: "1.5rem",
                fontWeight: "700",
                color: "#334155",
                margin: "0 0 12px 0"
            }}>
                Page Not Found
            </h2>

            <p style={{
                fontSize: "15px",
                color: "#64748B",
                maxWidth: "420px",
                margin: "0 0 28px 0",
                lineHeight: "1.6"
            }}>
                The trading route or page you are looking for does not exist, has been moved, or is restricted.
            </p>

            <div style={{ display: "flex", gap: "12px" }}>
                <Link
                    to="/"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px 24px",
                        borderRadius: "8px",
                        background: "#10B981",
                        color: "#FFFFFF",
                        fontWeight: "700",
                        textDecoration: "none",
                        fontSize: "14px",
                        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)"
                    }}
                >
                    <HomeIcon style={{ fontSize: "18px" }} /> Back to Dashboard
                </Link>
            </div>
        </div>
    );
};

export default NotFound;
