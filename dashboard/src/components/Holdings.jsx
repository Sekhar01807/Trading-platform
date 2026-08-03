import React, { useState, useEffect } from "react";
import axios from "axios";

import { VerticalGraph } from "./VerticalGraph";




const Holdings = () => {
    const [allHoldings, setAllHoldings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        axios.get("http://localhost:3000/allHoldings")
            .then((res) => {
                setAllHoldings(res.data);
                setLoading(false);
            })
            .catch((err) => {
                setError("Error fetching holdings. Please try again later.");
                setLoading(false);
            });
    }, []);

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
    const labels = allHoldings.map((stock) => stock.name);
    const data = {
        labels,
        datasets: [
            {
                label: "Stock Value",
                data: allHoldings.map((stock) => stock.price),
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
            <h3 className="title">Holdings ({allHoldings.length})</h3>

            <div className="order-table">
                <table>
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
                    {allHoldings.map((stock, index) => {
                        const curValue = (stock.qty * stock.price);
                        const isProfit = curValue - (stock.avg * stock.qty) >= 0;
                        const profClass = isProfit ? "profit" : "loss";
                        const dayClass = stock.isLoss ? "loss" : "profit";

                        return (
                            <tr key={index}>
                                <td>{stock.name}</td>
                                <td>{stock.qty}</td>
                                <td>{stock.avg.toFixed(2)}</td>
                                <td>{stock.price.toFixed(2)}</td>
                                <td>{curValue.toFixed(2)}</td>
                                <td className={profClass}>{(curValue - (stock.avg * stock.qty)).toFixed(2)}</td>
                                <td className={profClass}>{stock.net}</td>
                                <td className={dayClass}>{stock.day}</td>
                            </tr>
                        )
                    })}

                </table>
            </div>

            <div className="row">
                <div className="col">
                    <h5>
                        29,875.<span>55</span>{" "}
                    </h5>
                    <p>Total investment</p>
                </div>
                <div className="col">
                    <h5>
                        31,428.<span>95</span>{" "}
                    </h5>
                    <p>Current value</p>
                </div>
                <div className="col">
                    <h5>1,553.40 (+5.20%)</h5>
                    <p>P&L</p>
                </div>
            </div>
            <VerticalGraph data={data} />
        </>
    );
};

export default Holdings;