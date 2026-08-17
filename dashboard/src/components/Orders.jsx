import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ordersApi } from "../api/client";
import { TableSkeleton } from "./common/LoadingState";
import { EmptyState } from "./common/EmptyState";
import { ErrorState } from "./common/ErrorState";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

const Orders = () => {
    const [allOrders, setAllOrders] = useState([]);
    const [pagination, setPagination] = useState({
        totalOrders: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter & Search States
    const [searchSymbol, setSearchSymbol] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [modeFilter, setModeFilter] = useState("ALL");
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");
    const [currentPage, setCurrentPage] = useState(1);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                page: currentPage,
                limit: 10,
                status: statusFilter,
                mode: modeFilter,
                symbol: searchSymbol,
                sortBy,
                sortOrder
            };

            const res = await ordersApi.getAllOrders(params);

            if (res.data && res.data.pagination) {
                setAllOrders(res.data.data);
                setPagination(res.data.pagination);
            } else if (Array.isArray(res.data)) {
                setAllOrders(res.data);
                setPagination({
                    totalOrders: res.data.length,
                    page: 1,
                    limit: res.data.length || 10,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPrevPage: false
                });
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch orders from server.");
        } finally {
            setLoading(false);
        }
    }, [currentPage, statusFilter, modeFilter, searchSymbol, sortBy, sortOrder]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    useEffect(() => {
        const handleUpdate = () => fetchOrders();
        window.addEventListener("portfolioUpdated", handleUpdate);
        return () => window.removeEventListener("portfolioUpdated", handleUpdate);
    }, [fetchOrders]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchOrders();
    };

    const handleResetFilters = () => {
        setSearchSymbol("");
        setStatusFilter("ALL");
        setModeFilter("ALL");
        setSortBy("createdAt");
        setSortOrder("desc");
        setCurrentPage(1);
    };

    const renderStatusBadge = (status, failureReason) => {
        const upper = (status || "EXECUTED").toUpperCase();
        let bg = "#dcfce7";
        let text = "#15803d";
        let border = "#bbf7d0";

        if (upper === "REJECTED") {
            bg = "#fee2e2";
            text = "#b91c1c";
            border = "#fecaca";
        } else if (upper === "PENDING") {
            bg = "#fef3c7";
            text = "#b45309";
            border = "#fde68a";
        }

        return (
            <span 
                title={failureReason || status}
                style={{
                    display: "inline-block",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 600,
                    background: bg,
                    color: text,
                    border: `1px solid ${border}`,
                    letterSpacing: "0.5px"
                }}
            >
                {upper}
            </span>
        );
    };

    return (
        <div className="orders" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                <h3 className="title" style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>
                    Order History ({pagination.totalOrders || allOrders.length})
                </h3>

                {/* Filter & Search Bar */}
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                    {/* Search Input */}
                    <form onSubmit={handleSearchSubmit} style={{ display: "flex", alignItems: "center", background: "#f1f5f9", borderRadius: "8px", padding: "4px 10px", border: "1px solid #e2e8f0" }}>
                        <SearchIcon style={{ fontSize: "18px", color: "#64748b", marginRight: "6px" }} />
                        <input
                            type="text"
                            placeholder="Search stock..."
                            value={searchSymbol}
                            onChange={(e) => setSearchSymbol(e.target.value)}
                            style={{ border: "none", background: "transparent", outline: "none", fontSize: "13px", color: "#1e293b", width: "110px" }}
                        />
                    </form>

                    {/* Mode Filter */}
                    <select
                        value={modeFilter}
                        onChange={(e) => { setModeFilter(e.target.value); setCurrentPage(1); }}
                        style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "13px", color: "#334155", outline: "none", cursor: "pointer" }}
                    >
                        <option value="ALL">All Modes</option>
                        <option value="BUY">BUY</option>
                        <option value="SELL">SELL</option>
                    </select>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                        style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "13px", color: "#334155", outline: "none", cursor: "pointer" }}
                    >
                        <option value="ALL">All Status</option>
                        <option value="EXECUTED">Executed</option>
                        <option value="REJECTED">Rejected</option>
                    </select>

                    {/* Sort Dropdown */}
                    <select
                        value={`${sortBy}_${sortOrder}`}
                        onChange={(e) => {
                            const [field, order] = e.target.value.split("_");
                            setSortBy(field);
                            setSortOrder(order);
                            setCurrentPage(1);
                        }}
                        style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "13px", color: "#334155", outline: "none", cursor: "pointer" }}
                    >
                        <option value="createdAt_desc">Newest First</option>
                        <option value="createdAt_asc">Oldest First</option>
                        <option value="price_desc">Price: High to Low</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="qty_desc">Qty: High to Low</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <TableSkeleton rows={6} columns={6} />
            ) : error ? (
                <ErrorState message={error} onRetry={fetchOrders} />
            ) : allOrders.length === 0 ? (
                <EmptyState
                    icon="📑"
                    title="No Orders Found"
                    description={
                        searchSymbol || statusFilter !== "ALL" || modeFilter !== "ALL"
                            ? "No orders matched your filter criteria."
                            : "You haven't placed any trades yet. Select a stock from the watchlist to execute your first order."
                    }
                    actionLabel={
                        searchSymbol || statusFilter !== "ALL" || modeFilter !== "ALL"
                            ? "Clear Filters"
                            : "Explore Watchlist"
                    }
                    onAction={
                        searchSymbol || statusFilter !== "ALL" || modeFilter !== "ALL"
                            ? handleResetFilters
                            : () => window.dispatchEvent(new CustomEvent("openWatchlist"))
                    }
                />
            ) : (
                <>
                    <div className="order-table" style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                                    <th style={{ padding: "12px 16px", color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>Time</th>
                                    <th style={{ padding: "12px 16px", color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>Instrument</th>
                                    <th style={{ padding: "12px 16px", color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>Mode</th>
                                    <th style={{ padding: "12px 16px", color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>Qty.</th>
                                    <th style={{ padding: "12px 16px", color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>Price (₹)</th>
                                    <th style={{ padding: "12px 16px", color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>Total (₹)</th>
                                    <th style={{ padding: "12px 16px", color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allOrders.map((order, index) => {
                                    const formattedTime = order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";
                                    const totalCost = order.totalCost ? order.totalCost.toLocaleString("en-IN") : (order.qty * order.price).toLocaleString("en-IN");

                                    return (
                                        <tr key={order._id || index} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }}>
                                            <td style={{ padding: "12px 16px", fontSize: "13px", color: "#64748b" }}>{formattedTime}</td>
                                            <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>{order.name}</td>
                                            <td style={{ padding: "12px 16px", fontSize: "13px" }}>
                                                <span style={{
                                                    padding: "2px 6px",
                                                    borderRadius: "4px",
                                                    fontSize: "11px",
                                                    fontWeight: 700,
                                                    background: order.mode === "BUY" ? "#eff6ff" : "#fff1f2",
                                                    color: order.mode === "BUY" ? "#2563eb" : "#e11d48"
                                                }}>
                                                    {order.mode}
                                                </span>
                                            </td>
                                            <td style={{ padding: "12px 16px", fontSize: "13px", color: "#334155" }}>{order.qty}</td>
                                            <td style={{ padding: "12px 16px", fontSize: "13px", color: "#334155" }}>₹{order.price.toFixed(2)}</td>
                                            <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>₹{totalCost}</td>
                                            <td style={{ padding: "12px 16px", fontSize: "13px" }}>
                                                {renderStatusBadge(order.status, order.failureReason)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {pagination.totalPages > 1 && (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", flexWrap: "wrap", gap: "12px" }}>
                            <span style={{ fontSize: "13px", color: "#64748b" }}>
                                Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.totalOrders)} of {pagination.totalOrders} orders
                            </span>

                            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={!pagination.hasPrevPage}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "6px 12px",
                                        borderRadius: "6px",
                                        border: "1px solid #e2e8f0",
                                        background: pagination.hasPrevPage ? "#fff" : "#f8fafc",
                                        cursor: pagination.hasPrevPage ? "pointer" : "not-allowed",
                                        color: pagination.hasPrevPage ? "#1e293b" : "#94a3b8",
                                        fontSize: "13px"
                                    }}
                                >
                                    <ChevronLeftIcon style={{ fontSize: "18px" }} /> Prev
                                </button>

                                <span style={{ fontSize: "13px", fontWeight: 600, color: "#334155", padding: "0 8px" }}>
                                    Page {pagination.page} of {pagination.totalPages}
                                </span>

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                                    disabled={!pagination.hasNextPage}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "6px 12px",
                                        borderRadius: "6px",
                                        border: "1px solid #e2e8f0",
                                        background: pagination.hasNextPage ? "#fff" : "#f8fafc",
                                        cursor: pagination.hasNextPage ? "pointer" : "not-allowed",
                                        color: pagination.hasNextPage ? "#1e293b" : "#94a3b8",
                                        fontSize: "13px"
                                    }}
                                >
                                    Next <ChevronRightIcon style={{ fontSize: "18px" }} />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Orders;