import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import { API_URL } from "../config";
import { holdingsApi, walletApi } from "../api/client";
import { CardSkeleton } from "./common/LoadingState";

const Summary = ({ user }) => {
    const [holdings, setHoldings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalAddedFunds, setTotalAddedFunds] = useState(0);

    const fetchHoldingsAndFunds = useCallback(async () => {
        try {
            const [fundsRes, holdingsRes] = await Promise.allSettled([
                walletApi.getFunds(),
                holdingsApi.getAllHoldings()
            ]);

            if (fundsRes.status === "fulfilled" && fundsRes.value.data) {
                setTotalAddedFunds(fundsRes.value.data.totalAddedFunds || 0);
            }
            if (holdingsRes.status === "fulfilled" && holdingsRes.value.data) {
                setHoldings(holdingsRes.value.data);
            }
        } catch (e) {
            // Silently handled
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHoldingsAndFunds();

        const socket = io(API_URL, { withCredentials: true });
        socket.on("priceUpdate", (livePrices) => {
            setHoldings(prevHoldings => {
                if (!prevHoldings || prevHoldings.length === 0) return prevHoldings;
                return prevHoldings.map(item => {
                    if (livePrices[item.name]) {
                        return { ...item, price: livePrices[item.name] };
                    }
                    return item;
                });
            });
        });

        const handlePortfolioUpdate = () => fetchHoldingsAndFunds();
        window.addEventListener("portfolioUpdated", handlePortfolioUpdate);

        return () => {
            socket.disconnect();
            window.removeEventListener("portfolioUpdated", handlePortfolioUpdate);
        };
    }, [fetchHoldingsAndFunds]);

    if (loading) {
        return (
            <div style={{ padding: "20px" }}>
                <CardSkeleton />
                <CardSkeleton />
            </div>
        );
    }

    // Portfolio & Margin metrics calculations
    const totalInvestment = holdings.reduce((sum, stock) => sum + (stock.qty * stock.avg), 0);
    const totalCurrentValue = holdings.reduce((sum, stock) => sum + (stock.qty * (stock.price || stock.avg)), 0);
    const totalPnl = totalCurrentValue - totalInvestment;
    const pnlPercentage = totalInvestment > 0 ? ((totalPnl / totalInvestment) * 100).toFixed(2) : "0.00";
    const isProfit = totalPnl >= 0;

    const availableMargin = Math.max(0, totalAddedFunds - totalInvestment);
    const marginsUsed = totalInvestment;
    const openingBalance = totalAddedFunds;

    const formatCurrency = (val) => {
        return "₹" + val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <div style={{ padding: "20px" }}>
            <div className="username" style={{ marginBottom: "16px" }}>
                <h6 style={{ margin: "0 0 8px 0", fontSize: "16px", color: "#1e293b", fontWeight: 700 }}>
                    Hi, {user?.username || "Trader"}!
                </h6>
                <hr className="divider" style={{ border: "none", borderBottom: "1px solid #e2e8f0", margin: 0 }} />
            </div>

            <div className="section" style={{ background: "#fff", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <p style={{ margin: 0, fontWeight: 700, color: "#1e293b", fontSize: "14px" }}>Equity & Margin</p>
                    <Link to="/funds" style={{ textDecoration: "none" }}>
                        <button style={{
                            background: "#10B981", color: "#FFFFFF", border: "none",
                            padding: "6px 14px", borderRadius: "6px", fontWeight: "700",
                            fontSize: "12px", cursor: "pointer", boxShadow: "0 2px 6px rgba(16, 185, 129, 0.2)"
                        }}>
                            + Add Funds
                        </button>
                    </Link>
                </div>

                <div className="data" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                    <div className="first">
                        <h3 style={{ margin: "0 0 4px 0", color: "#2563EB", fontSize: "24px", fontWeight: 800 }}>
                            {formatCurrency(availableMargin)}
                        </h3>
                        <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Margin available</p>
                    </div>

                    <div className="second" style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                        <div>
                            <p style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#64748b" }}>Margins used</p>
                            <span style={{ fontWeight: "700", color: "#D97706", fontSize: "15px" }}>{formatCurrency(marginsUsed)}</span>
                        </div>
                        <div>
                            <p style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#64748b" }}>Opening balance</p>
                            <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px" }}>{formatCurrency(openingBalance)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="section" style={{ background: "#fff", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0" }}>
                <div style={{ marginBottom: "16px" }}>
                    <p style={{ margin: 0, fontWeight: 700, color: "#1e293b", fontSize: "14px" }}>Holdings ({holdings.length})</p>
                </div>

                <div className="data" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                    <div className="first">
                        <h3 style={{ margin: "0 0 4px 0", color: isProfit ? "#10B981" : "#EF4444", fontSize: "24px", fontWeight: 800 }}>
                            {isProfit ? "+" : "-"}{formatCurrency(Math.abs(totalPnl))}{" "}
                            <small style={{ fontSize: "14px", fontWeight: 600 }}>
                                ({isProfit ? "+" : ""}{pnlPercentage}%)
                            </small>
                        </h3>
                        <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>P&L (Profit & Loss)</p>
                    </div>

                    <div className="second" style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                        <div>
                            <p style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#64748b" }}>Current Value</p>
                            <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px" }}>{formatCurrency(totalCurrentValue)}</span>
                        </div>
                        <div>
                            <p style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#64748b" }}>Investment</p>
                            <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px" }}>{formatCurrency(totalInvestment)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Summary;