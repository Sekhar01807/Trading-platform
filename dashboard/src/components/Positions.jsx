import React, { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { API_URL } from "../config";

const Positions = () => {
    const [allPositions, setAllPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPositions = () => {
        const token = localStorage.getItem("token");
        axios.get(`${API_URL}/allPositions`, {
            withCredentials: true,
            headers: { Authorization: `Bearer ${token}` }
        })
            .then((res) => {
                setAllPositions(res.data);
                setLoading(false);
            })
            .catch((err) => {
                setError("Error fetching positions. Please try again later.");
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchPositions();

        const socket = io(API_URL);
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

        const handlePortfolioUpdate = () => {
            fetchPositions();
        };

        window.addEventListener("portfolioUpdated", handlePortfolioUpdate);

        return () => {
            socket.disconnect();
            window.removeEventListener("portfolioUpdated", handlePortfolioUpdate);
        };
    }, []);

    if (loading) {
        return (
            <div className="positions-container" style={{ textAlign: "center", padding: "50px" }}>
                <p>Loading your positions...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="positions-container" style={{ textAlign: "center", padding: "50px", color: "#df4949" }}>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <>
            <h3 className="title">Positions ({allPositions.length})</h3>

            {allPositions.length === 0 ? (
                <div className="no-orders" style={{
                    textAlign: "center",
                    padding: "50px 20px",
                    background: "#FAFAFA",
                    borderRadius: "12px",
                    border: "1px dashed #E5E7EB",
                    marginTop: "20px"
                }}>
                    <p style={{ color: "#6B7280", margin: 0, fontSize: "14px" }}>
                        You currently have no open intraday or derivative positions today.
                    </p>
                </div>
            ) : (
                <div className="order-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Instrument</th>
                                <th>Qty.</th>
                                <th>Avg.</th>
                                <th>LTP</th>
                                <th>P&L</th>
                                <th>Chg.</th>
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
                                    <tr key={index}>
                                        <td>{stock.product || "CNC"}</td>
                                        <td>{stock.name}</td>
                                        <td>{stock.qty}</td>
                                        <td>{stock.avg.toFixed(2)}</td>
                                        <td>{(stock.price || stock.avg).toFixed(2)}</td>
                                        <td className={profClass}>{(pnl >= 0 ? "+" : "") + pnl.toFixed(2)}</td>
                                        <td className={dayClass}>{stock.day || "0.00%"}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
};

export default Positions;