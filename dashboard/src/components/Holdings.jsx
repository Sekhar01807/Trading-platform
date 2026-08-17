import React, { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { VerticalGraph } from "./VerticalGraph";
import { API_URL } from "../config";
import { holdingsApi } from "../api/client";
import { TableSkeleton } from "./common/LoadingState";
import { EmptyState } from "./common/EmptyState";
import { ErrorState } from "./common/ErrorState";

const Holdings = () => {
    const [allHoldings, setAllHoldings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [seedingDemo, setSeedingDemo] = useState(false);

    const fetchHoldings = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await holdingsApi.getAllHoldings();
            setAllHoldings(res.data);
        } catch (err) {
            setError("Failed to fetch holdings. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHoldings();

        const socket = io(API_URL, { withCredentials: true });
        socket.on("priceUpdate", (livePrices) => {
            setAllHoldings((prevHoldings) => {
                if (!prevHoldings || prevHoldings.length === 0) return prevHoldings;
                return prevHoldings.map((item) => {
                    if (livePrices[item.name]) {
                        return { ...item, price: livePrices[item.name] };
                    }
                    return item;
                });
            });
        });

        const handlePortfolioUpdate = () => fetchHoldings();
        window.addEventListener("portfolioUpdated", handlePortfolioUpdate);

        return () => {
            socket.disconnect();
            window.removeEventListener("portfolioUpdated", handlePortfolioUpdate);
        };
    }, [fetchHoldings]);

    const handleLoadDemoData = async () => {
        try {
            setSeedingDemo(true);
            await holdingsApi.seedDemoData();
            fetchHoldings();
            window.dispatchEvent(new Event("portfolioUpdated"));
            toast.success("Loaded demo portfolio with ₹50,000 balance!");
        } catch (err) {
            toast.error("Failed to seed demo portfolio.");
        } finally {
            setSeedingDemo(false);
        }
    };

    const handleResetPortfolio = async () => {
        try {
            await holdingsApi.resetPortfolio();
            fetchHoldings();
            window.dispatchEvent(new Event("portfolioUpdated"));
            toast.info("Portfolio reset to clean state.");
        } catch (err) {
            toast.error("Failed to reset portfolio.");
        }
    };

    if (loading) {
        return (
            <div style={{ padding: "20px" }}>
                <TableSkeleton rows={6} columns={8} />
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: "20px" }}>
                <ErrorState message={error} onRetry={fetchHoldings} />
            </div>
        );
    }

    const totalInvestment = allHoldings.reduce((sum, h) => sum + (h.qty * h.avg), 0);
    const totalCurrentVal = allHoldings.reduce((sum, h) => sum + (h.qty * (h.price || h.avg)), 0);
    const totalPnl = totalCurrentVal - totalInvestment;
    const pnlPct = totalInvestment > 0 ? ((totalPnl / totalInvestment) * 100).toFixed(2) : "0.00";
    const isTotalProfit = totalPnl >= 0;

    const labels = allHoldings.map((stock) => stock.name);
    const data = {
        labels,
        datasets: [
            {
                label: "Stock Value (₹)",
                data: allHoldings.map((stock) => (stock.price || stock.avg)),
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, "rgba(53, 162, 235, 1)");
                    gradient.addColorStop(1, "rgba(53, 162, 235, 0.4)");
                    return gradient;
                },
                borderColor: "rgba(53, 162, 235, 1)",
                borderWidth: 1,
                hoverBackgroundColor: "rgba(53, 162, 235, 1)",
                hoverBorderColor: "rgba(53, 162, 235, 1)",
                hoverBorderWidth: 5,
            },
        ],
    };

    return (
        <div style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                <h3 className="title" style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>
                    Holdings ({allHoldings.length})
                </h3>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button
                        onClick={handleLoadDemoData}
                        disabled={seedingDemo}
                        style={{
                            background: "#3B82F6",
                            color: "#fff",
                            border: "none",
                            padding: "6px 14px",
                            borderRadius: "6px",
                            fontWeight: "600",
                            cursor: "pointer",
                            fontSize: "13px"
                        }}
                    >
                        {seedingDemo ? "Loading Demo..." : "Load Demo Portfolio"}
                    </button>
                    {allHoldings.length > 0 && (
                        <button
                            onClick={handleResetPortfolio}
                            style={{
                                background: "#EF4444",
                                color: "#fff",
                                border: "none",
                                padding: "6px 14px",
                                borderRadius: "6px",
                                fontWeight: "600",
                                cursor: "pointer",
                                fontSize: "13px"
                            }}
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {allHoldings.length === 0 ? (
                <EmptyState
                    icon="💼"
                    title="No Holdings in Portfolio"
                    description="You currently have no equity stock holdings. Place a BUY order from the Watchlist to start your portfolio, or load pre-populated demo data."
                    actionLabel={seedingDemo ? "Loading Demo..." : "Load Demo Portfolio"}
                    onAction={handleLoadDemoData}
                    secondaryLabel="Explore Watchlist"
                    onSecondaryAction={() => window.dispatchEvent(new CustomEvent("openWatchlist"))}
                />
            ) : (
                <>
                    <div className="order-table" style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                                    <th style={{ padding: "12px 16px", color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>Instrument</th>
                                    <th style={{ padding: "12px 16px", color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>Qty.</th>
                                    <th style={{ padding: "12px 16px", color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>Avg. cost</th>
                                    <th style={{ padding: "12px 16px", color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>LTP</th>
                                    <th style={{ padding: "12px 16px", color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>Cur. val</th>
                                    <th style={{ padding: "12px 16px", color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>P&L</th>
                                    <th style={{ padding: "12px 16px", color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>Net chg.</th>
                                    <th style={{ padding: "12px 16px", color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>Day chg.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allHoldings.map((stock, index) => {
                                    const curValue = (stock.qty * (stock.price || stock.avg));
                                    const pnl = curValue - (stock.avg * stock.qty);
                                    const isProfit = pnl >= 0;
                                    const profClass = isProfit ? "profit" : "loss";
                                    const dayClass = stock.isLoss ? "loss" : "profit";

                                    return (
                                        <tr key={stock._id || index} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                            <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>{stock.name}</td>
                                            <td style={{ padding: "12px 16px", fontSize: "13px", color: "#334155" }}>{stock.qty}</td>
                                            <td style={{ padding: "12px 16px", fontSize: "13px", color: "#334155" }}>₹{stock.avg.toFixed(2)}</td>
                                            <td style={{ padding: "12px 16px", fontSize: "13px", color: "#334155" }}>₹{(stock.price || stock.avg).toFixed(2)}</td>
                                            <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>₹{curValue.toFixed(2)}</td>
                                            <td className={profClass} style={{ padding: "12px 16px", fontSize: "13px" }}>{(pnl >= 0 ? "+" : "") + pnl.toFixed(2)}</td>
                                            <td className={profClass} style={{ padding: "12px 16px", fontSize: "13px" }}>{stock.net || "0.00%"}</td>
                                            <td className={dayClass} style={{ padding: "12px 16px", fontSize: "13px" }}>{stock.day || "0.00%"}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="row" style={{ display: "flex", gap: "16px", marginTop: "24px", flexWrap: "wrap" }}>
                        <div className="col" style={{ flex: 1, background: "#f8fafc", padding: "16px 20px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                            <h5 style={{ margin: "0 0 4px 0", fontSize: "18px", color: "#1e293b" }}>
                                ₹{totalInvestment.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h5>
                            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Total investment</p>
                        </div>
                        <div className="col" style={{ flex: 1, background: "#f8fafc", padding: "16px 20px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                            <h5 style={{ margin: "0 0 4px 0", fontSize: "18px", color: "#1e293b" }}>
                                ₹{totalCurrentVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h5>
                            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Current value</p>
                        </div>
                        <div className="col" style={{ flex: 1, background: "#f8fafc", padding: "16px 20px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                            <h5 style={{ margin: "0 0 4px 0", fontSize: "18px", color: isTotalProfit ? "#10B981" : "#EF4444" }}>
                                {isTotalProfit ? "+" : ""}₹{totalPnl.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({isTotalProfit ? "+" : ""}{pnlPct}%)
                            </h5>
                            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>P&L</p>
                        </div>
                    </div>
                    <VerticalGraph data={data} />
                </>
            )}
        </div>
    );
};

export default Holdings;