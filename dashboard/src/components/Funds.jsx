import React, { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { toast } from "react-toastify";

const Funds = () => {
    const [totalAddedFunds, setTotalAddedFunds] = useState(0);
    const [holdings, setHoldings] = useState([]);
    const [orders, setOrders] = useState([]);

    // Modals & Forms
    const [showAddModal, setShowAddModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [fundAmount, setFundAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("Stripe Checkout");
    const [notification, setNotification] = useState("");

    // Fetch Holdings, Orders & User Funds from Backend DB
    const fetchData = () => {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        axios.get("http://localhost:3000/user/funds", { withCredentials: true, headers })
            .then(res => {
                if (res.data && res.data.totalAddedFunds !== undefined) {
                    setTotalAddedFunds(res.data.totalAddedFunds);
                }
            })
            .catch(err => console.error("Error fetching user funds:", err));

        axios.get("http://localhost:3000/allHoldings", { withCredentials: true, headers })
            .then(res => setHoldings(res.data))
            .catch(err => console.error("Error fetching holdings:", err));

        axios.get("http://localhost:3000/allOrders", { withCredentials: true, headers })
            .then(res => setOrders(res.data))
            .catch(err => console.error("Error fetching orders:", err));
    };

    useEffect(() => {
        fetchData();

        // Check if returning from Stripe Hosted Checkout Page
        const queryParams = new URLSearchParams(window.location.search);
        const isSuccess = queryParams.get("payment_success");
        const depositAmt = parseFloat(queryParams.get("amount"));

        if (isSuccess === "true" && !isNaN(depositAmt) && depositAmt > 0) {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            axios.post("http://localhost:3000/user/funds", { amount: depositAmt, action: "ADD" }, { withCredentials: true, headers })
                .then(res => {
                    if (res.data && res.data.totalAddedFunds !== undefined) {
                        setTotalAddedFunds(res.data.totalAddedFunds);
                    }
                    toast.success(`Stripe Payment Verified! ₹${depositAmt.toLocaleString("en-IN")} deposited.`);
                    window.dispatchEvent(new Event("portfolioUpdated"));
                    // Clean URL query params
                    window.history.replaceState({}, document.title, window.location.pathname);
                })
                .catch(() => {});
        } else if (queryParams.get("payment_cancel") === "true") {
            toast.warn("Payment cancelled on checkout page.");
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        const socket = io("http://localhost:3000");
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
            fetchData();
        };

        window.addEventListener("portfolioUpdated", handlePortfolioUpdate);

        return () => {
            socket.disconnect();
            window.removeEventListener("portfolioUpdated", handlePortfolioUpdate);
        };
    }, []);

    // Financial Metrics
    const totalSpentOnStocks = holdings.reduce((sum, h) => sum + (h.qty * h.avg), 0);
    const currentPortfolioValue = holdings.reduce((sum, h) => sum + (h.qty * (h.price || h.avg)), 0);
    const totalGainsPnl = currentPortfolioValue - totalSpentOnStocks;
    const pnlPercentage = totalSpentOnStocks > 0 ? ((totalGainsPnl / totalSpentOnStocks) * 100).toFixed(2) : "0.00";

    const availableCash = Math.max(0, totalAddedFunds - totalSpentOnStocks);

    const handleAddFunds = async (e) => {
        e.preventDefault();
        const amt = parseFloat(fundAmount);
        if (isNaN(amt) || amt <= 0) {
            toast.error("Please enter a valid deposit amount");
            return;
        }
        if (amt < 1) {
            toast.error("Minimum deposit is ₹1");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            // Step 1: Create a Razorpay order on the backend
            const orderRes = await axios.post("http://localhost:3000/create-razorpay-order",
                { amount: amt },
                { withCredentials: true, headers }
            );

            if (!orderRes.data || !orderRes.data.order_id) {
                toast.error("Failed to create payment order. Please try again.");
                return;
            }

            const { order_id, amount: orderAmount, currency, key_id } = orderRes.data;

            // Step 2: Open Razorpay Standard Checkout modal
            const options = {
                key: key_id,
                amount: orderAmount,
                currency: currency,
                name: "PulseTrade",
                description: `Wallet Deposit — ₹${amt.toLocaleString("en-IN")}`,
                image: "https://i.imgur.com/n5tjHFD.png",
                order_id: order_id,
                handler: async function (response) {
                    // Step 3: Verify payment signature on backend
                    try {
                        const verifyRes = await axios.post(
                            "http://localhost:3000/verify-razorpay-payment",
                            {
                                amount: amt,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                            },
                            { withCredentials: true, headers }
                        );

                        if (verifyRes.data && verifyRes.data.totalAddedFunds !== undefined) {
                            setTotalAddedFunds(verifyRes.data.totalAddedFunds);
                        }
                        toast.success(`✓ ₹${amt.toLocaleString("en-IN")} deposited successfully! Payment ID: ${response.razorpay_payment_id}`);
                        window.dispatchEvent(new Event("portfolioUpdated"));
                    } catch (verifyErr) {
                        console.error("Payment verification failed:", verifyErr);
                        toast.error("Payment verification failed. Payment ID: " + response.razorpay_payment_id);
                    }
                },
                prefill: {
                    name: "PulseTrade User",
                    email: "user@pulsetrade.com",
                    contact: "9999999999",
                },
                notes: {
                    purpose: "PulseTrade wallet deposit",
                },
                theme: {
                    color: "#10B981",
                },
                modal: {
                    ondismiss: function () {
                        toast.info("Payment window closed. No funds deducted.");
                    },
                },
            };

            if (!window.Razorpay) {
                toast.error("Razorpay SDK not loaded. Please refresh the page and try again.");
                return;
            }

            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", function (response) {
                console.error("Razorpay payment failed details:", response.error);
                if (response.error.reason === "international_transaction_not_allowed") {
                    toast.error("International cards are disabled on this Razorpay test account. Please select Netbanking (SBI / HDFC) or UPI in the Razorpay popup for test payments!", { autoClose: 7000 });
                } else {
                    toast.error(`Payment failed: ${response.error.description || response.error.reason}`);
                }
            });
            rzp.open();

        } catch (err) {
            console.error("Razorpay checkout error:", err);
            toast.error("Could not initiate payment. Please check your connection and try again.");
        }

        setFundAmount("");
        setShowAddModal(false);
    };

    const handleWithdrawFunds = async (e) => {
        e.preventDefault();
        const amt = parseFloat(fundAmount);
        if (isNaN(amt) || amt <= 0) {
            toast.error("Please enter a valid withdrawal amount");
            return;
        }
        if (amt > availableCash) {
            toast.error("Withdrawal amount exceeds available cash!");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };
            const res = await axios.post("http://localhost:3000/user/funds", { amount: amt, action: "WITHDRAW" }, { withCredentials: true, headers });

            if (res.data && res.data.totalAddedFunds) {
                setTotalAddedFunds(res.data.totalAddedFunds);
            } else {
                setTotalAddedFunds(prev => prev - amt);
            }
            toast.success(`Withdrawal request of ₹${amt.toLocaleString("en-IN")} processed successfully!`);
            window.dispatchEvent(new Event("portfolioUpdated"));
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to process withdrawal.");
        }

        setFundAmount("");
        setShowWithdrawModal(false);
    };

    return (
        <div style={{ padding: "30px 20px", maxWidth: "1200px", margin: "0 auto", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
            
            {/* Real-time Toast / Banner Notification */}
            {notification && (
                <div style={{
                    padding: "12px 20px",
                    borderRadius: "8px",
                    marginBottom: "20px",
                    background: notification.includes("✓") || notification.includes("Successful") ? "#DEF7EC" : "#FDE8E8",
                    color: notification.includes("✓") || notification.includes("Successful") ? "#03543F" : "#9B1C1C",
                    border: notification.includes("✓") || notification.includes("Successful") ? "1px solid #84E1BC" : "1px solid #F8B4B4",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                }}>
                    {notification}
                </div>
            )}

            {/* Funds Header & Direct Action Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                    <h2 style={{ margin: "0 0 4px 0", fontWeight: "800", fontSize: "1.75rem", color: "#0F172A" }}>
                        Funds & Capital Management
                    </h2>
                    <span style={{ color: "#64748B", fontSize: "0.9rem" }}>
                        Manage wallet deposits, available cash margins, and trading withdrawals via Razorpay Gateway.
                    </span>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                    <button
                        onClick={() => { setShowAddModal(true); setFundAmount(""); }}
                        style={{
                            background: "#10B981", color: "#fff", border: "none",
                            padding: "10px 20px", borderRadius: "8px", fontWeight: "700",
                            cursor: "pointer", fontSize: "14px", transition: "all 0.2s"
                        }}
                    >
                        + Add Funds
                    </button>
                    <button
                        onClick={() => { setShowWithdrawModal(true); setFundAmount(""); }}
                        style={{
                            background: "#3B82F6", color: "#fff", border: "none",
                            padding: "10px 20px", borderRadius: "8px", fontWeight: "700",
                            cursor: "pointer", fontSize: "14px", transition: "all 0.2s"
                        }}
                    >
                        Withdraw Cash
                    </button>
                </div>
            </div>

            {/* Metric Summary Cards Grid */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
                marginBottom: "24px"
            }}>
                <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                    <span style={{ fontSize: "13px", color: "#64748B", fontWeight: "600" }}>TOTAL FUNDS ADDED</span>
                    <h2 style={{ margin: "8px 0 0 0", color: "#0F172A" }}>₹{totalAddedFunds.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h2>
                </div>

                <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                    <span style={{ fontSize: "13px", color: "#64748B", fontWeight: "600" }}>AVAILABLE CASH TO BUY</span>
                    <h2 style={{ margin: "8px 0 0 0", color: "#2563EB" }}>₹{availableCash.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h2>
                </div>

                <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                    <span style={{ fontSize: "13px", color: "#64748B", fontWeight: "600" }}>SPENT ON STOCKS</span>
                    <h2 style={{ margin: "8px 0 0 0", color: "#D97706" }}>₹{totalSpentOnStocks.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h2>
                </div>

                <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                    <span style={{ fontSize: "13px", color: "#64748B", fontWeight: "600" }}>CURRENT PORTFOLIO VALUE</span>
                    <h2 style={{ margin: "8px 0 0 0", color: "#0F172A" }}>₹{currentPortfolioValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h2>
                </div>

                <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                    <span style={{ fontSize: "13px", color: "#64748B", fontWeight: "600" }}>TOTAL GAINS / P&L</span>
                    <h2 style={{ margin: "8px 0 0 0", color: totalGainsPnl >= 0 ? "#10B981" : "#EF4444" }}>
                        {totalGainsPnl >= 0 ? "+" : ""}₹{totalGainsPnl.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        <span style={{ fontSize: "14px", marginLeft: "6px" }}>({totalGainsPnl >= 0 ? "+" : ""}{pnlPercentage}%)</span>
                    </h2>
                </div>
            </div>

            {/* Stock Purchases & Expenditure Breakdown Table */}
            <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", border: "1px solid #E2E8F0", marginBottom: "24px" }}>
                <h4 style={{ margin: "0 0 16px 0", color: "#0F172A" }}>Stock Purchases & Capital Allocation</h4>
                {holdings.length === 0 ? (
                    <p style={{ color: "#64748B", fontSize: "14px", margin: 0 }}>No active stock purchases yet.</p>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                            <thead>
                                <tr style={{ borderBottom: "2px solid #E2E8F0", textAlign: "left", color: "#64748B" }}>
                                    <th style={{ padding: "10px" }}>Instrument</th>
                                    <th style={{ padding: "10px", textAlign: "right" }}>Quantity</th>
                                    <th style={{ padding: "10px", textAlign: "right" }}>Avg. Purchase Price</th>
                                    <th style={{ padding: "10px", textAlign: "right" }}>Total Invested</th>
                                    <th style={{ padding: "10px", textAlign: "right" }}>Current Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {holdings.map((h, i) => {
                                    const invested = h.qty * h.avg;
                                    const curVal = h.qty * (h.price || h.avg);
                                    return (
                                        <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                                            <td style={{ padding: "12px", fontWeight: "600" }}>{h.name}</td>
                                            <td style={{ padding: "12px", textAlign: "right" }}>{h.qty}</td>
                                            <td style={{ padding: "12px", textAlign: "right" }}>₹{h.avg.toFixed(2)}</td>
                                            <td style={{ padding: "12px", textAlign: "right", fontWeight: "600" }}>₹{invested.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                                            <td style={{ padding: "12px", textAlign: "right", fontWeight: "600", color: curVal >= invested ? "#10B981" : "#EF4444" }}>
                                                ₹{curVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Orders Transaction History */}
            <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                <h4 style={{ margin: "0 0 16px 0", color: "#0F172A" }}>Recent Trade Ledger ({orders.length})</h4>
                {orders.length === 0 ? (
                    <p style={{ color: "#64748B", fontSize: "14px", margin: 0 }}>No trade executions recorded.</p>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                            <thead>
                                <tr style={{ borderBottom: "2px solid #E2E8F0", textAlign: "left", color: "#64748B" }}>
                                    <th style={{ padding: "10px" }}>Date</th>
                                    <th style={{ padding: "10px" }}>Type</th>
                                    <th style={{ padding: "10px" }}>Instrument</th>
                                    <th style={{ padding: "10px", textAlign: "right" }}>Qty</th>
                                    <th style={{ padding: "10px", textAlign: "right" }}>Execution Price</th>
                                    <th style={{ padding: "10px", textAlign: "right" }}>Total Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((ord, i) => {
                                    const total = ord.qty * ord.price;
                                    const isBuy = ord.mode === "BUY";
                                    return (
                                        <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                                            <td style={{ padding: "12px", color: "#64748B" }}>
                                                {ord.createdAt ? new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                                            </td>
                                            <td style={{ padding: "12px" }}>
                                                <span style={{
                                                    background: isBuy ? "#DEF7EC" : "#FDE8E8",
                                                    color: isBuy ? "#03543F" : "#9B1C1C",
                                                    padding: "4px 8px", borderRadius: "4px", fontWeight: "700", fontSize: "12px"
                                                }}>
                                                    {ord.mode}
                                                </span>
                                            </td>
                                            <td style={{ padding: "12px", fontWeight: "600" }}>{ord.name}</td>
                                            <td style={{ padding: "12px", textAlign: "right" }}>{ord.qty}</td>
                                            <td style={{ padding: "12px", textAlign: "right" }}>₹{ord.price.toFixed(2)}</td>
                                            <td style={{ padding: "12px", textAlign: "right", fontWeight: "600", color: isBuy ? "#D97706" : "#10B981" }}>
                                                {isBuy ? "-" : "+"}₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Funds Modal */}
            {showAddModal && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(3px)", display: "flex",
                    alignItems: "center", justifyContent: "center", zIndex: 1000
                }}>
                    <div style={{
                        background: "#FFFFFF", padding: "24px", borderRadius: "12px",
                        width: "360px", boxShadow: "0 20px 40px -15px rgba(0,0,0,0.25)", border: "1px solid #E2E8F0"
                    }}>
                        <h3 style={{ margin: "0 0 16px 0", fontSize: "1.15rem", fontWeight: "700", color: "#0F172A" }}>Add Funds</h3>

                        <form onSubmit={handleAddFunds}>
                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "6px" }}>Enter Amount (₹)</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    placeholder="e.g. 10000"
                                    value={fundAmount}
                                    onChange={(e) => setFundAmount(e.target.value)}
                                    style={{
                                        width: "100%", padding: "10px 12px", borderRadius: "8px",
                                        border: "1px solid #CBD5E1", fontSize: "16px", fontWeight: "600", color: "#0F172A",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>

                            <div style={{
                                background: "#ECFDF5",
                                border: "1px solid #A7F3D0",
                                borderRadius: "8px",
                                padding: "10px 12px",
                                marginBottom: "20px",
                                fontSize: "12px",
                                color: "#065F46",
                                lineHeight: "1.4"
                            }}>
                                💡 <strong>Razorpay Test Mode Tip:</strong> In the payment popup, select <strong>Netbanking (SBI/HDFC)</strong> or <strong>UPI</strong> to instantly simulate test deposits!
                            </div>

                            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #CBD5E1", background: "#F8FAFC", cursor: "pointer", fontWeight: "600", color: "#475569" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{ padding: "8px 18px", borderRadius: "6px", border: "none", background: "#10B981", color: "#fff", fontWeight: "700", cursor: "pointer", boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)" }}
                                >
                                    Add Funds
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Withdraw Funds Modal */}
            {showWithdrawModal && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.5)", display: "flex",
                    alignItems: "center", justifyContent: "center", zIndex: 1000
                }}>
                    <div style={{
                        background: "#fff", padding: "24px", borderRadius: "12px",
                        width: "360px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
                    }}>
                        <h4 style={{ margin: "0 0 16px 0", color: "#111" }}>Withdraw Cash to Bank</h4>
                        <form onSubmit={handleWithdrawFunds}>
                            <p style={{ fontSize: "13px", color: "#555", marginBottom: "12px" }}>
                                Available Cash to Withdraw: <strong>₹{availableCash.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                            </p>
                            <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>Withdrawal Amount (₹)</label>
                            <input
                                type="number"
                                required
                                min="1"
                                max={availableCash}
                                placeholder="e.g. 2000"
                                value={fundAmount}
                                onChange={(e) => setFundAmount(e.target.value)}
                                style={{
                                    width: "100%", padding: "10px", borderRadius: "6px",
                                    border: "1px solid #ccc", marginBottom: "20px", fontSize: "16px"
                                }}
                            />

                            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                                <button
                                    type="button"
                                    onClick={() => setShowWithdrawModal(false)}
                                    style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#3B82F6", color: "#fff", fontWeight: "bold", cursor: "pointer" }}
                                >
                                    Confirm Withdrawal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Funds;