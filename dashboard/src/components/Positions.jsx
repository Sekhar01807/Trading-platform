import React, { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../config";
import { holdingsApi } from "../api/client";
import { TableSkeleton } from "./common/LoadingState";
import { EmptyState } from "./common/EmptyState";
import { ErrorState } from "./common/ErrorState";

const Positions = () => {
    const [allPositions, setAllPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPositions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await holdingsApi.getAllPositions();
            setAllPositions(res.data);
        } catch (err) {
            setError("Failed to fetch positions. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPositions();

        const socket = io(API_URL, { withCredentials: true });
        socket.on("priceUpdate", (livePrices) => {
            setAllPositions((prevPositions) => {
                if (!prevPositions || prevPositions.length === 0) return prevPositions;
                return prevPositions.map((item) => {
                    if (livePrices[item.name]) {
                        return { ...item, price: livePrices[item.name] };
                    }
                    return item;
                });
            });
        });

        const handlePortfolioUpdate = () => fetchPositions();
        window.addEventListener("portfolioUpdated", handlePortfolioUpdate);

        return () => {
            socket.disconnect();
            window.removeEventListener("portfolioUpdated", handlePortfolioUpdate);
        };
    }, [fetchPositions]);

    if (loading) {
        return (
            <div style={{ padding: "20px" }}>
                <TableSkeleton rows={4} columns={7} />
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: "20px" }}>
                <ErrorState message={error} onRetry={fetchPositions} />
            </div>
        );
    }

    return (
        <div style={{ padding: "20px" }}>
            <h3 className="title" style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>
                Positions ({allPositions.length})
            </h3>

            {allPositions.length === 0 ? (
                <EmptyState
                    icon="📊"
                    title="No Open Positions"
                    description="You currently have no active intraday (MIS) or derivative positions today. Trade intraday from the watchlist to see active positions here."
                    actionLabel="Explore Watchlist"
                    onAction={() => window.dispatchEvent(new CustomEvent("openWatchlist"))}
                />
            ) : (
                <div className="order-table" style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                                <th style={{ padding: "12px 16px", color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>Product</th>
                                <th style={{ padding: "12px 16px", color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>Instrument</th>
                                <th style={{ padding: "12px 16px", color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>Qty.</th>
                                <th style={{ padding: "12px 16px", color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>Avg.</th>
                                <th style={{ padding: "12px 16px", color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>LTP</th>
                                <th style={{ padding: "12px 16px", color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>P&L</th>
                                <th style={{ padding: "12px 16px", color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>Chg.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allPositions.map((stock, index) => {
                                const curValue = (stock.qty * (stock.price || stock.avg));
                                const pnl = curValue - (stock.avg * stock.qty);
                                const isProfit = pnl >= 0;
                                const profClass = isProfit ? "profit" : "loss";
                                const dayClass = stock.isLoss ? "loss" : "profit";

                                return (
                                    <tr key={stock._id || index} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                        <td style={{ padding: "12px 16px", fontSize: "13px" }}>
                                            <span style={{ padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: 700, background: "#f1f5f9", color: "#475569" }}>
                                                {stock.product || "CNC"}
                                            </span>
                                        </td>
                                        <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>{stock.name}</td>
                                        <td style={{ padding: "12px 16px", fontSize: "13px", color: "#334155" }}>{stock.qty}</td>
                                        <td style={{ padding: "12px 16px", fontSize: "13px", color: "#334155" }}>₹{stock.avg.toFixed(2)}</td>
                                        <td style={{ padding: "12px 16px", fontSize: "13px", color: "#334155" }}>₹{(stock.price || stock.avg).toFixed(2)}</td>
                                        <td className={profClass} style={{ padding: "12px 16px", fontSize: "13px" }}>{(pnl >= 0 ? "+" : "") + pnl.toFixed(2)}</td>
                                        <td className={dayClass} style={{ padding: "12px 16px", fontSize: "13px" }}>{stock.day || "0.00%"}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Positions;