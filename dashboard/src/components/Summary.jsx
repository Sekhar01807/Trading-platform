import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import { API_URL } from "../config";

const Summary = ({ user }) => {
    const [holdings, setHoldings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalAddedFunds, setTotalAddedFunds] = useState(0);

    const fetchHoldingsAndFunds = () => {
        axios.get(`${API_URL}/user/funds`, { withCredentials: true })
            .then((res) => {
                if (res.data && res.data.totalAddedFunds !== undefined) {
                    setTotalAddedFunds(res.data.totalAddedFunds);
                }
            })
            .catch(() => {});

        axios.get(`${API_URL}/allHoldings`, { withCredentials: true })
            .then((res) => {
                setHoldings(res.data);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchHoldingsAndFunds();

        const socket = io(API_URL);
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

        const handlePortfolioUpdate = () => {
            fetchHoldingsAndFunds();
        };

        window.addEventListener("portfolioUpdated", handlePortfolioUpdate);

        return () => {
            socket.disconnect();
            window.removeEventListener("portfolioUpdated", handlePortfolioUpdate);
        };
    }, []);

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
        <>
            <div className="username">
                <h6>Hi, {user.username || "Trader"}!</h6>
                <hr className="divider" />
            </div>

            <div className="section">
                <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ margin: 0 }}>Equity & Margin</p>
                    <Link to="/funds" style={{ textDecoration: "none" }}>
                        <button style={{
                            background: "#10B981", color: "#FFFFFF", border: "none",
                            padding: "6px 14px", borderRadius: "6px", fontWeight: "700",
                            fontSize: "12px", cursor: "pointer", boxShadow: "0 2px 6px rgba(16, 185, 129, 0.2)"
                        }}>
                            + Add Funds
                        </button>
                    </Link>
                </span>

                <div className="data">
                    <div className="first">
                        <h3 style={{ color: "#2563EB" }}>{formatCurrency(availableMargin)}</h3>
                        <p>Margin available</p>
                    </div>
                    <hr />

                    <div className="second">
                        <p>
                            Margins used <span style={{ fontWeight: "600", color: "#D97706" }}>{formatCurrency(marginsUsed)}</span>{" "}
                        </p>
                        <p>
                            Opening balance <span>{formatCurrency(openingBalance)}</span>{" "}
                        </p>
                    </div>
                </div>
                <hr className="divider" />
            </div>

            <div className="section">
                <span>
                    <p>Holdings ({holdings.length})</p>
                </span>

                <div className="data">
                    <div className="first">
                        <h3 className={isProfit ? "profit" : "loss"}>
                            {isProfit ? "+" : "-"}{formatCurrency(Math.abs(totalPnl))}{" "}
                            <small style={{ color: isProfit ? "#4caf50" : "#f44336", fontSize: "14px" }}>
                                {isProfit ? "+" : ""}{pnlPercentage}%
                            </small>
                        </h3>
                        <p>P&L (Profit & Loss)</p>
                    </div>
                    <hr />

                    <div className="second">
                        <p>
                            Current Value <span style={{ fontWeight: "600" }}>{formatCurrency(totalCurrentValue)}</span>{" "}
                        </p>
                        <p>
                            Investment <span style={{ fontWeight: "600" }}>{formatCurrency(totalInvestment)}</span>{" "}
                        </p>
                    </div>
                </div>
                <hr className="divider" />
            </div>
        </>
    );
};

export default Summary;