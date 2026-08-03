import React, { useState, useEffect, useContext } from "react";
import { Tooltip, Grow } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import { io } from "socket.io-client";

import { watchlist as initialWatchlist } from "../data/data";
import GeneralContext from "./GeneralContext";
import { DoughnutChart } from "./DoughnoutChart";

const WatchListActions = ({ uid }) => {
    const { openBuyWindow, openSellWindow, openChartWindow, openMoreWindow } = useContext(GeneralContext);

    const handleBuyClick = () => {
        openBuyWindow(uid);
    }

    const handleSellClick = () => {
        openSellWindow(uid);
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
                <button className="action" onClick={() => openChartWindow(uid)}><BarChartOutlinedIcon className="icon" /></button>
            </Tooltip>
            <Tooltip
                title="More (M)"
                placement="top"
                arrow
                TransitionComponent={Grow}
            >
                <button className="action" onClick={() => openMoreWindow(uid)}><MoreHorizIcon className="icon" /></button>
            </Tooltip>
            <Tooltip
                title="Delete (D)"
                placement="top"
                arrow
                TransitionComponent={Grow}
            >
                <button className="action"><DeleteOutline className="icon" /></button>
            </Tooltip>
        </span>

    );
};

const WatchListItem = ({ stock }) => {
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
            {showWatchlistActions && <WatchListActions uid={stock.name} />}
        </li>
    );
};

const WatchList = () => {
    const [stocks, setStocks] = useState(initialWatchlist);

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

    const data = {
        labels: stocks.map((s) => s.name),
        datasets: [
            {
                label: "Price",
                data: stocks.map((stock) => stock.price),
                backgroundColor: stocks.map((item, index) => {
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
                    placeholder="Search eg:infy, bse, nifty fut weekly, gold mcx"
                    className="search"
                />
                <span className="counts">{stocks.length} / 50</span>
            </div>

            <ul className="list">
                {stocks.map((stock, index) => {
                    return (
                        <WatchListItem stock={stock} key={index} />
                    )
                })}
            </ul>
            <DoughnutChart data={data} />
        </div>
    );
};

export default WatchList;
