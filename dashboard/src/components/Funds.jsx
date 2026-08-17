import React, { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { API_URL } from "../config";
import { walletApi, holdingsApi, ordersApi } from "../api/client";
import { CardSkeleton } from "./common/LoadingState";
import { ErrorState } from "./common/ErrorState";

const Funds = () => {
    const [totalAddedFunds, setTotalAddedFunds] = useState(0);
    const [holdings, setHoldings] = useState([]);
    const [orders, setOrders] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modals & Forms
    const [showAddModal, setShowAddModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [fundAmount, setFundAmount] = useState("");

    const fetchData = useCallback(async () => {
        try {
            const [fundsRes, holdingsRes, ordersRes, txRes] = await Promise.allSettled([
                walletApi.getFunds(),
                holdingsApi.getAllHoldings(),
                ordersApi.getAllOrders(),
                walletApi.getTransactions()
            ]);

            if (fundsRes.status === "fulfilled" && fundsRes.value.data) {
                setTotalAddedFunds(fundsRes.value.data.totalAddedFunds || 0);
            }
            if (holdingsRes.status === "fulfilled" && holdingsRes.value.data) {
                setHoldings(holdingsRes.value.data);
            }
            if (ordersRes.status === "fulfilled" && ordersRes.value.data) {
                const orderData = Array.isArray(ordersRes.value.data) ? ordersRes.value.data : ordersRes.value.data.data || [];
                setOrders(orderData);
            }
            if (txRes.status === "fulfilled" && txRes.value.data && txRes.value.data.transactions) {
                setTransactions(txRes.value.data.transactions);
            }
            setError(null);
        } catch (err) {
            setError("Failed to fetch wallet information.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();

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

        const handlePortfolioUpdate = () => fetchData();
        window.addEventListener("portfolioUpdated", handlePortfolioUpdate);

        return () => {
            socket.disconnect();
            window.removeEventListener("portfolioUpdated", handlePortfolioUpdate);
        };
    }, [fetchData]);

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
            // Step 1: Create a Razorpay order on backend
            const orderRes = await walletApi.createRazorpayOrder({ amount: amt });

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
                    // Step 3: Verify payment signature on backend with idempotency
                    try {
                        const verifyRes = await walletApi.verifyRazorpayPayment({
                            amount: amt,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                        });

                        if (verifyRes.data && verifyRes.data.totalAddedFunds !== undefined) {
                            setTotalAddedFunds(verifyRes.data.totalAddedFunds);
                        }
                        toast.success(`✓ ₹${amt.toLocaleString("en-IN")} deposited successfully!`);
                        fetchData();
                        window.dispatchEvent(new Event("portfolioUpdated"));
                    } catch (verifyErr) {
                        toast.error(verifyErr.response?.data?.message || "Payment verification failed.");
                    }
                },
                prefill: {
                    name: "PulseTrade Trader",
                    email: "trader@pulsetrade.com",
                    contact: "9999999999",
                },
                theme: {
                    color: "#10B981",
                },
                modal: {
                    ondismiss: function () {
                        toast.info("Payment window closed.");
                    },
                },
            };

            if (!window.Razorpay) {
                toast.error("Razorpay SDK loading. Please try again in a moment.");
                return;
            }

            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", function (response) {
                toast.error(`Payment failed: ${response.error?.description || "Transaction declined"}`);
            });
            rzp.open();

        } catch (err) {
            toast.error(err.response?.data?.message || "Could not initiate payment.");
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
            toast.error("Withdrawal amount exceeds available cash margin!");
            return;
        }

        try {
            const res = await walletApi.updateFunds({ amount: amt, action: "WITHDRAW" });

            if (res.data && res.data.totalAddedFunds !== undefined) {
                setTotalAddedFunds(res.data.totalAddedFunds);
            }
            toast.success(`Withdrawal of ₹${amt.toLocaleString("en-IN")} processed successfully!`);
            fetchData();
            window.dispatchEvent(new Event("portfolioUpdated"));
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to process withdrawal.");
        }

        setFundAmount("");
        setShowWithdrawModal(false);
    };

    if (loading) {
        return (
            <div style={{ padding: "30px 20px", maxWidth: "1200px", margin: "0 auto" }}>
                <CardSkeleton />
                <CardSkeleton />
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: "30px 20px", maxWidth: "1200px", margin: "0 auto" }}>
                <ErrorState message={error} onRetry={fetchData} />
            </div>
        );
    }

    return (
        <div style={{ padding: "30px 20px", maxWidth: "1200px", margin: "0 auto", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
            
            {/* Header & Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                    <h2 style={{ margin: "0 0 4px 0", fontWeight: "800", fontSize: "1.75rem", color: "#0F172A" }}>
                        Funds & Capital Management
                    </h2>
                    <span style={{ color: "#64748B", fontSize: "0.9rem" }}>
                        Manage wallet balance, margins, and simulated deposits via Razorpay Sandbox.
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

            {/* Financial Ledger Audit Log */}
            <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", border: "1px solid #E2E8F0", marginBottom: "24px" }}>
                <h4 style={{ margin: "0 0 16px 0", color: "#0F172A" }}>Wallet Transaction Ledger ({transactions.length})</h4>
                {transactions.length === 0 ? (
                    <p style={{ color: "#64748B", fontSize: "14px", margin: 0 }}>No wallet transactions recorded yet.</p>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                            <thead>
                                <tr style={{ borderBottom: "2px solid #E2E8F0", textAlign: "left", color: "#64748B" }}>
                                    <th style={{ padding: "10px" }}>Date</th>
                                    <th style={{ padding: "10px" }}>Type</th>
                                    <th style={{ padding: "10px" }}>Description</th>
                                    <th style={{ padding: "10px", textAlign: "right" }}>Amount</th>
                                    <th style={{ padding: "10px", textAlign: "right" }}>Balance After</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((tx, idx) => {
                                    const isCredit = tx.type === "DEPOSIT" || tx.type === "ORDER_SELL";
                                    return (
                                        <tr key={tx._id || idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                                            <td style={{ padding: "12px", color: "#64748B" }}>
                                                {tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                                            </td>
                                            <td style={{ padding: "12px" }}>
                                                <span style={{
                                                    padding: "2px 6px",
                                                    borderRadius: "4px",
                                                    fontSize: "11px",
                                                    fontWeight: 700,
                                                    background: isCredit ? "#dcfce7" : "#fee2e2",
                                                    color: isCredit ? "#15803d" : "#b91c1c"
                                                }}>
                                                    {tx.type}
                                                </span>
                                            </td>
                                            <td style={{ padding: "12px", color: "#334155" }}>{tx.description || tx.referenceId || "—"}</td>
                                            <td style={{ padding: "12px", textAlign: "right", fontWeight: 600, color: isCredit ? "#10B981" : "#EF4444" }}>
                                                {isCredit ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                            </td>
                                            <td style={{ padding: "12px", textAlign: "right", color: "#64748B" }}>
                                                ₹{tx.balanceAfter.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
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
                        <h3 style={{ margin: "0 0 16px 0", fontSize: "1.15rem", fontWeight: "700", color: "#0F172A" }}>Add Funds (Razorpay Sandbox)</h3>

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
                                💡 <strong>Test Mode Tip:</strong> In the payment popup, select <strong>Netbanking (SBI/HDFC)</strong> or <strong>UPI</strong> to instantly simulate deposits!
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
                                    border: "1px solid #ccc", marginBottom: "20px", fontSize: "16px",
                                    boxSizing: "border-box"
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