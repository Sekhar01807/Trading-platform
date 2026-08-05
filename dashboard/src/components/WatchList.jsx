import React, { useState, useEffect, useContext } from "react";
import { Tooltip, Grow } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { io } from "socket.io-client";

import { watchlist as initialWatchlist } from "../data/data";
import GeneralContext from "./GeneralContext";
import { DoughnutChart } from "./DoughnoutChart";

const WatchListActions = ({ stock, onDelete }) => {
    const { openBuyWindow, openSellWindow, openChartWindow, openMoreWindow } = useContext(GeneralContext);

    const handleBuyClick = () => {
        openBuyWindow(stock.name, stock.price);
    }

    const handleSellClick = () => {
        openSellWindow(stock.name, stock.price);
    }
    return (
        <span className="actions">
            <Tooltip
                title="Buy (B)"
                placement="top"
                arrow
                TransitionComponent={Grow}
            >
                <button className="buy" onClick={handleBuyClick}>Buy</button>
            </Tooltip>
            <Tooltip
                title="Sell (S)"
                placement="top"
                arrow
                TransitionComponent={Grow}
            >
                <button className="sell" onClick={handleSellClick}>Sell</button>
            </Tooltip>
            <Tooltip
                title="Chart (C)"
                placement="top"
                arrow
                TransitionComponent={Grow}
            >
                <button className="action" onClick={() => openChartWindow(stock.name)}><BarChartOutlinedIcon className="icon" /></button>
            </Tooltip>
            <Tooltip
                title="More (M)"
                placement="top"
                arrow
                TransitionComponent={Grow}
            >
                <button className="action" onClick={() => openMoreWindow(stock.name)}><MoreHorizIcon className="icon" /></button>
            </Tooltip>
            <Tooltip
                title="Delete (D)"
                placement="top"
                arrow
                TransitionComponent={Grow}
            >
                <button className="action" onClick={() => onDelete && onDelete(stock.name)}><DeleteOutline className="icon" /></button>
            </Tooltip>
        </span>

    );
};

const WatchListItem = ({ stock, onDelete }) => {
    const [showWatchlistActions, setShowWatchlistActions] = useState(false);
    const [priceColor, setPriceColor] = useState("inherit");
    const [prevPrice, setPrevPrice] = useState(stock.price);

    useEffect(() => {
        if (stock.price > prevPrice) {
            setPriceColor("#4caf50"); // Green
            setTimeout(() => setPriceColor("inherit"), 500);
        } else if (stock.price < prevPrice) {
            setPriceColor("#f44336"); // Red
            setTimeout(() => setPriceColor("inherit"), 500);
        }
        setPrevPrice(stock.price);
    }, [stock.price]);

    const handleMouseEnter = () => {
        setShowWatchlistActions(true);
    }

    const handleMouseLeave = () => {
        setShowWatchlistActions(false);
    }

    return (
        <li
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="item">
                <span className={stock.isDown ? "down" : "up"}>{stock.name}</span>
                <div className="item-info">
                    <span className="percent">{stock.percent}</span>
                    {stock.isDown ? (
                        <KeyboardArrowDownIcon className="down" />
                    ) : (
                        <KeyboardArrowUpIcon className="up" />
                    )}
                    <span
                        className="price"
                        style={{
                            color: priceColor,
                            transition: "color 0.3s ease",
                            fontWeight: priceColor !== "inherit" ? "bold" : "normal"
                        }}
                    >
                        {stock.price.toFixed(2)}
                    </span>
                </div>
            </div>
            {showWatchlistActions && <WatchListActions stock={stock} onDelete={onDelete} />}
        </li>
    );
};

const WatchList = () => {
    const [stocks, setStocks] = useState(initialWatchlist);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const handleDeleteStock = (stockName) => {
        setStocks(prev => prev.filter(s => s.name !== stockName));
    };

    useEffect(() => {
        const socket = io("http://localhost:3000");

        socket.on("connect", () => {
            console.log("Connected to live price server at http://localhost:3000");
            socket.emit("subscribe", stocks.map(s => s.name));
        });

        socket.on("priceUpdate", (livePrices) => {
            setStocks((prevStocks) => {
                return prevStocks.map((stock) => {
                    if (livePrices[stock.name]) {
                        const newPrice = livePrices[stock.name];
                        const isDown = newPrice < stock.price;
                        // Calculate percentage change conceptually
                        const diff = newPrice - stock.price;
                        const percentChange = ((diff / stock.price) * 100).toFixed(2);

                        return {
                            ...stock,
                            price: newPrice,
                            isDown: isDown,
                            percent: (diff >= 0 ? "+" : "") + percentChange + "%"
                        };
                    }
                    return stock;
                });
            });
        });

        return () => socket.disconnect();
    }, []);

    const filteredStocks = stocks.filter(stock =>
        stock.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredStocks.length / pageSize) || 1;
    const activePage = Math.min(currentPage, totalPages);
    const startIndex = (activePage - 1) * pageSize;
    const visibleStocks = filteredStocks.slice(startIndex, startIndex + pageSize);
    const currentCount = Math.min(activePage * pageSize, filteredStocks.length);

    const data = {
        labels: visibleStocks.map((s) => s.name),
        datasets: [
            {
                label: "Price",
                data: visibleStocks.map((stock) => stock.price),
                backgroundColor: visibleStocks.map((item, index) => {
                    const colors = [
                        "#2563EB", // Blue
                        "#059669", // Emerald
                        "#F59E0B", // Amber
                        "#DC2626", // Red
                        "#7C3AED", // Purple
                        "#0891B2", // Cyan
                        "#EA580C", // Orange
                        "#DB2777", // Pink
                        "#65A30D", // Lime
                        "#4F46E5"  // Indigo
                    ];
                    return colors[index % colors.length];
                }),
                borderColor: "transparent",

                offset: 10,
                hoverOffset: 40,
                borderWidth: 2,
                hoverBorderWidth: 5,
                opacity: 0.2,
                hoverOpacity: 10,
            },
        ],
    };

    return (
        <div className="watchlist-container">
            <div className="search-container">
                <input
                    type="text"
                    name="search"
                    id="search"
                    placeholder="Search eg: infy, tcs, sbin, reliance, tata..."
                    className="search"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                />
                <span className="counts">{currentCount} / {stocks.length}</span>
            </div>

            <ul className="list">
                {visibleStocks.map((stock, index) => {
                    return (
                        <WatchListItem stock={stock} key={stock.name || index} onDelete={handleDeleteStock} />
                    )
                })}
            </ul>

            {/* Premium Watchlist Pagination / Tabs Bar */}
            <div className="pagination-bar" style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
                borderTop: "1px solid #E2E8F0",
                borderBottom: "1px solid #E2E8F0",
                background: "#F8FAFC",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            }}>
                <button
                    disabled={activePage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "1px solid #E2E8F0",
                        background: activePage === 1 ? "#F1F5F9" : "#FFFFFF",
                        color: activePage === 1 ? "#94A3B8" : "#334155",
                        cursor: activePage === 1 ? "not-allowed" : "pointer",
                        fontWeight: "600",
                        fontSize: "12px",
                        boxShadow: activePage === 1 ? "none" : "0 1px 2px rgba(0,0,0,0.05)",
                        transition: "all 0.15s ease"
                    }}
                >
                    <ChevronLeftIcon style={{ fontSize: "16px" }} /> Prev
                </button>

                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <span style={{
                        color: "#64748B",
                        fontSize: "11px",
                        fontWeight: "700",
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                        marginRight: "6px"
                    }}>
                        Watchlist:
                    </span>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                        const isActive = activePage === pageNum;
                        return (
                            <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                style={{
                                    width: "30px",
                                    height: "30px",
                                    borderRadius: "50%",
                                    border: isActive ? "none" : "1px solid #CBD5E1",
                                    background: isActive ? "linear-gradient(135deg, #10B981 0%, #059669 100%)" : "#FFFFFF",
                                    color: isActive ? "#FFFFFF" : "#334155",
                                    fontWeight: "700",
                                    fontSize: "12px",
                                    cursor: "pointer",
                                    boxShadow: isActive ? "0 2px 8px rgba(16, 185, 129, 0.3)" : "0 1px 2px rgba(0,0,0,0.03)",
                                    transition: "all 0.2s ease",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}
                            >
                                {pageNum}
                            </button>
                        );
                    })}
                </div>

                <button
                    disabled={activePage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "1px solid #E2E8F0",
                        background: activePage === totalPages ? "#F1F5F9" : "#FFFFFF",
                        color: activePage === totalPages ? "#94A3B8" : "#334155",
                        cursor: activePage === totalPages ? "not-allowed" : "pointer",
                        fontWeight: "600",
                        fontSize: "12px",
                        boxShadow: activePage === totalPages ? "none" : "0 1px 2px rgba(0,0,0,0.05)",
                        transition: "all 0.15s ease"
                    }}
                >
                    Next <ChevronRightIcon style={{ fontSize: "16px" }} />
                </button>
            </div>

            <DoughnutChart data={data} />
        </div>
    );
};

export default WatchList;
