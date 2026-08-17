import React from "react";

export const TableSkeleton = ({ rows = 5, columns = 6 }) => {
    return (
        <div style={{ width: "100%", padding: "16px 0" }}>
            {Array.from({ length: rows }).map((_, rIdx) => (
                <div 
                    key={rIdx} 
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        padding: "14px 16px",
                        borderBottom: "1px solid #f1f5f9",
                        animation: "pulse 1.5s infinite ease-in-out"
                    }}
                >
                    {Array.from({ length: columns }).map((_, cIdx) => (
                        <div
                            key={cIdx}
                            style={{
                                height: "18px",
                                flex: cIdx === 0 ? "1.5" : "1",
                                background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)",
                                backgroundSize: "200% 100%",
                                borderRadius: "4px"
                            }}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
};

export const CardSkeleton = () => {
    return (
        <div style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "24px",
            border: "1px solid #e2e8f0",
            animation: "pulse 1.5s infinite ease-in-out",
            marginBottom: "16px"
        }}>
            <div style={{ width: "40%", height: "24px", background: "#e2e8f0", borderRadius: "4px", marginBottom: "16px" }} />
            <div style={{ width: "70%", height: "16px", background: "#f1f5f9", borderRadius: "4px", marginBottom: "8px" }} />
            <div style={{ width: "50%", height: "16px", background: "#f1f5f9", borderRadius: "4px" }} />
        </div>
    );
};

export default TableSkeleton;
