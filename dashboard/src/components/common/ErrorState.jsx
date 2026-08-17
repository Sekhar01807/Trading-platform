import React from "react";
import Button from "@mui/material/Button";
import RefreshIcon from "@mui/icons-material/Refresh";

export const ErrorState = ({
    title = "Failed to load data",
    message = "An unexpected error occurred while communicating with the server.",
    onRetry
}) => {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "32px 24px",
            textAlign: "center",
            background: "#fef2f2",
            borderRadius: "12px",
            border: "1px solid #fecaca",
            margin: "24px 0"
        }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>⚠️</div>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#991b1b", margin: "0 0 6px 0" }}>
                {title}
            </h3>
            <p style={{ fontSize: "13px", color: "#b91c1c", maxWidth: "450px", margin: "0 0 16px 0", lineHeight: 1.5 }}>
                {message}
            </p>
            {onRetry && (
                <Button 
                    variant="outlined" 
                    color="error" 
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={onRetry}
                    style={{ textTransform: "none", borderRadius: "8px", fontWeight: 600 }}
                >
                    Retry Connection
                </Button>
            )}
        </div>
    );
};

export default ErrorState;
