import React, { useState, useEffect } from "react";
import axios from "axios";
import { positions } from "../data/data";

const Positions = () => {
    const [allPositions, setAllPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        axios.get("http://localhost:3000/allPositions")
            .then((res) => {
                setAllPositions(res.data);
                setLoading(false);
            })
            .catch((err) => {
                setError("Error fetching positions. Please try again later.");
                setLoading(false);
            });
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

            <div className="order-table">
                <table>
                    <tr>
                        <th>Product</th>
                        <th>Instrument</th>
                        <th>Qty.</th>
                        <th>Avg.</th>
                        <th>LTP</th>
                        <th>P&L</th>
                        <th>Chg.</th>
                    </tr>
                    {allPositions.map((stock, index) => {
                        const curValue = (stock.qty * stock.price);
                        const isProfit = curValue - (stock.avg * stock.qty) >= 0;
                        const profClass = isProfit ? "profit" : "loss";
                        const dayClass = stock.isLoss ? "loss" : "profit";

                        return (
                            <tr key={index}>
                                <td>{stock.product}</td>
                                <td>{stock.name}</td>
                                <td>{stock.qty}</td>
                                <td>{stock.avg.toFixed(2)}</td>
                                <td>{stock.price.toFixed(2)}</td>
                                <td className={profClass}>{(curValue - stock.avg * stock.qty).toFixed(2)}</td>
                                <td className={dayClass}>{stock.day}</td>
                            </tr>
                        )
                    })}
                </table>
            </div>
        </>
    );
};

export default Positions;