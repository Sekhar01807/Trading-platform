import React from "react";
import Button from "@mui/material/Button";

export const EmptyState = ({
    icon = "📊",
    title = "No Data Found",
    description = "There are no records to display at this moment.",
    actionLabel,
    onAction,
    secondaryLabel,
    onSecondaryAction
}) => {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 24px",
            textAlign: "center",
            background: "#f8fafc",
            borderRadius: "12px",
            border: "1px dashed #cbd5e1",
            margin: "24px 0"
        }}>
            <div style={{ fontSize: "42px", marginBottom: "16px" }}>{icon}</div>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#1e293b", margin: "0 0 8px 0" }}>
                {title}
            </h3>
            <p style={{ fontSize: "14px", color: "#64748b", maxWidth: "420px", margin: "0 0 20px 0", lineHeight: 1.5 }}>
                {description}
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
                {actionLabel && (
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={onAction}
                        style={{ textTransform: "none", borderRadius: "8px", fontWeight: 600 }}
                    >
                        {actionLabel}
                    </Button>
                )}
                {secondaryLabel && (
                    <Button 
                        variant="outlined" 
                        onClick={onSecondaryAction}
                        style={{ textTransform: "none", borderRadius: "8px", fontWeight: 600 }}
                    >
                        {secondaryLabel}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default EmptyState;
