import React, { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { VerticalGraph } from "./VerticalGraph";
import { API_URL } from "../config";

const Holdings = () => {
    const [allHoldings, setAllHoldings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [seedingDemo, setSeedingDemo] = useState(false);

    const fetchHoldings = () => {
        const token = localStorage.getItem("token");
        axios.get(`${API_URL}/allHoldings`, {
            withCredentials: true,
            headers: { Authorization: `Bearer ${token}` }
        })
            .then((res) => {
                setAllHoldings(res.data);
                setLoading(false);
            })
            .catch((err) => {
                setError("Error fetching holdings. Please try again later.");
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchHoldings();

        const socket = io(API_URL);
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

        const handlePortfolioUpdate = () => {
            fetchHoldings();
        };

        window.addEventListener("portfolioUpdated", handlePortfolioUpdate);

        return () => {
            socket.disconnect();
            window.removeEventListener("portfolioUpdated", handlePortfolioUpdate);
        };
    }, []);

    const handleLoadDemoData = async () => {
        try {
            setSeedingDemo(true);
            const token = localStorage.getItem("token");
            await axios.post(
                `${API_URL}/seedDemoData`,
                {},
                {
                    withCredentials: true,
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            fetchHoldings();
            window.dispatchEvent(new Event("portfolioUpdated"));
        } catch (err) {
            console.error("Error seeding demo portfolio", err);
        } finally {
            setSeedingDemo(false);
        }
    };

    const handleResetPortfolio = async () => {
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${API_URL}/resetPortfolio`, {
                withCredentials: true,
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchHoldings();
            window.dispatchEvent(new Event("portfolioUpdated"));
            toast.info("Portfolio reset to clean state.");
        } catch (err) {
            console.error("Error resetting portfolio", err);
        }
    };

    if (loading) {
        return (
            <div className="holdings-container" style={{ textAlign: "center", padding: "50px" }}>
                <p>Loading your holdings...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="holdings-container" style={{ textAlign: "center", padding: "50px", color: "#df4949" }}>
                <p>{error}</p>
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
                    gradient.addColorStop(0, 'rgba(53, 162, 235, 1)');
                    gradient.addColorStop(1, 'rgba(53, 162, 235, 0.4)');
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
        <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 className="title" style={{ margin: 0 }}>Holdings ({allHoldings.length})</h3>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button
                        onClick={handleLoadDemoData}
                        disabled={seedingDemo}
                        style={{ background: "#3B82F6", color: "#fff", border: "none", padding: "6px 14px", borderRadius: "6px", fontWeight: "600", cursor: "pointer", fontSize: "13px" }}
                    >
                        {seedingDemo ? "Loading Demo..." : "Load Demo Portfolio"}
                    </button>
                    {allHoldings.length > 0 && (
                        <button
                            onClick={handleResetPortfolio}
                            style={{ background: "#EF4444", color: "#fff", border: "none", padding: "6px 14px", borderRadius: "6px", fontWeight: "600", cursor: "pointer", fontSize: "13px" }}
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {allHoldings.length === 0 ? (
                <div className="no-orders" style={{
                    textAlign: "center",
                    padding: "60px 20px",
                    background: "#FAFAFA",
                    borderRadius: "12px",
                    border: "1px dashed #E5E7EB",
                    marginTop: "20px"
                }}>
                    <h4 style={{ color: "#1F2937", marginBottom: "8px" }}>Welcome to your PulseTrade Portfolio!</h4>
                    <p style={{ color: "#6B7280", maxWidth: "480px", margin: "0 auto 24px auto", fontSize: "14px", lineHeight: "1.5" }}>
                        You currently have no equity holdings. Buy stocks from the Watchlist on the left to build your long-term portfolio, or load sample demo data to test full trading analytics.
                    </p>
                    <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                        <button
                            onClick={handleLoadDemoData}
                            disabled={seedingDemo}
                            className="btn"
                            style={{ background: "#3B82F6", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}
                        >
                            {seedingDemo ? "Loading Demo..." : "Load Demo Portfolio"}
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="order-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Instrument</th>
                                    <th>Qty.</th>
                                    <th>Avg. cost</th>
                                    <th>LTP</th>
                                    <th>Cur. val</th>
                                    <th>P&L</th>
                                    <th>Net chg.</th>
                                    <th>Day chg.</th>
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
                                        <tr key={index}>
                                            <td>{stock.name}</td>
                                            <td>{stock.qty}</td>
                                            <td>{stock.avg.toFixed(2)}</td>
                                            <td>{(stock.price || stock.avg).toFixed(2)}</td>
                                            <td>{curValue.toFixed(2)}</td>
                                            <td className={profClass}>{(pnl >= 0 ? "+" : "") + pnl.toFixed(2)}</td>
                                            <td className={profClass}>{stock.net || "0.00%"}</td>
                                            <td className={dayClass}>{stock.day || "0.00%"}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="row">
                        <div className="col">
                            <h5>
                                ₹{totalInvestment.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h5>
                            <p>Total investment</p>
                        </div>
                        <div className="col">
                            <h5>
                                ₹{totalCurrentVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h5>
                            <p>Current value</p>
                        </div>
                        <div className="col">
                            <h5 style={{ color: isTotalProfit ? "#10B981" : "#EF4444" }}>
                                {isTotalProfit ? "+" : ""}₹{totalPnl.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({isTotalProfit ? "+" : ""}{pnlPct}%)
                            </h5>
                            <p>P&L</p>
                        </div>
                    </div>
                    <VerticalGraph data={data} />
                </>
            )}
        </>
    );
};

export default Holdings;