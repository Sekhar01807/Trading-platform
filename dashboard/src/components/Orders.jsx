import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API_URL } from "../config";

const Orders = () => {
    const [allOrders, setAllOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchOrders = () => {
        const token = localStorage.getItem("token");
        axios.get(`${API_URL}/allOrders`, {
            withCredentials: true,
            headers: { Authorization: `Bearer ${token}` }
        })
            .then((res) => {
                setAllOrders(res.data);
                setLoading(false);
            })
            .catch((err) => {
                setError("Error fetching orders. Please try again later.");
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchOrders();
        window.addEventListener("portfolioUpdated", fetchOrders);
        return () => {
            window.removeEventListener("portfolioUpdated", fetchOrders);
        };
    }, []);

    if (loading) {
        return (
            <div className="orders">
                <div className="loading-container" style={{ textAlign: "center", padding: "50px" }}>
                    <p>Loading your orders...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="orders">
                <div className="error-container" style={{ textAlign: "center", padding: "50px", color: "#df4949" }}>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="orders">
            <h3 className="title">Orders ({allOrders.length})</h3>
            {allOrders.length === 0 ? (
                <div className="no-orders" style={{ textAlign: "center", padding: "50px" }}>
                    <p>You haven't placed any orders today</p>
                    <Link to={"/"} className="btn" style={{ display: "inline-block", marginTop: "20px" }}>
                        Get started
                    </Link>
                </div>
            ) : (
                <div className="order-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Instrument</th>
                                <th>Qty.</th>
                                <th>Price</th>
                                <th>Mode</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allOrders.map((order, index) => (
                                <tr key={index}>
                                    <td>{order.name}</td>
                                    <td>{order.qty}</td>
                                    <td>{order.price.toFixed(2)}</td>
                                    <td className={order.mode === "BUY" ? "up" : "down"}>{order.mode}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Orders;