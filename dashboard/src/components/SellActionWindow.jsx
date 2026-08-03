import React, { useState, useRef } from "react";
import CloseIcon from '@mui/icons-material/Close';
import axios from "axios";
import { toast } from "react-toastify";

import "./SellActionWindow.css";

const SellActionWindow = ({ uid, closeSellWindow }) => {
    const [stockQuantity, setStockQuantity] = useState(1);
    const [stockPrice, setStockPrice] = useState(0.0);

    // Dragging state
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e) => {
        if (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON") {
            return;
        }

        isDragging.current = true;
        dragStart.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const handleMouseMove = (e) => {
        if (!isDragging.current) return;
        const newX = e.clientX - dragStart.current.x;
        const newY = e.clientY - dragStart.current.y;
        setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
    };

    const handleSellClick = async () => {
        try {
            await axios.post(
                "http://localhost:3000/newOrders",
                {
                    name: uid,
                    qty: Number(stockQuantity),
                    price: Number(stockPrice) > 0 ? Number(stockPrice) : 1450,
                    mode: "SELL",
                },
                { withCredentials: true }
            );
            toast.success(`Sold ${stockQuantity} share(s) of ${uid}!`);
            closeSellWindow();
        } catch (err) {
            toast.error("Failed to place sell order.");
            closeSellWindow();
        }
    };

    const handleCancelClick = () => {
        closeSellWindow();
    };

    return (
        <div
            className="sell-window-container"
            id="sell-window"
            draggable="false"
            style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
            onMouseDown={handleMouseDown}
        >
            <div className="header">
                <div className="title">
                    <h3>Sell {uid} <span>NSE</span></h3>
                    <span className="price-tag">₹{stockPrice > 0 ? stockPrice : "1450.00"}</span>
                </div>
                <button className="close-btn" onClick={closeSellWindow}>
                    <CloseIcon style={{ fontSize: "1.2rem" }} />
                </button>
            </div>

            <div className="sell-window-body">
                <div className="inputs-section">
                    <fieldset>
                        <legend>Qty.</legend>
                        <input
                            type="number"
                            name="qty"
                            id="qty"
                            onChange={(e) => setStockQuantity(e.target.value)}
                            value={stockQuantity}
                        />
                    </fieldset>
                    <fieldset>
                        <legend>Price</legend>
                        <input
                            type="number"
                            name="price"
                            id="price"
                            step="0.05"
                            onChange={(e) => setStockPrice(e.target.value)}
                            value={stockPrice}
                        />
                    </fieldset>
                </div>

                <div className="market-depth">
                    <div className="depth-header">
                        <span>Bid</span>
                        <span>Orders</span>
                        <span>Qty</span>
                        <span>Offer</span>
                        <span>Orders</span>
                        <span>Qty</span>
                    </div>
                    <div className="depth-row">
                        <span className="blue">1449.00</span>
                        <span>2</span>
                        <span>100</span>
                        <span className="red">1450.50</span>
                        <span>1</span>
                        <span>50</span>
                    </div>
                    <div className="depth-row">
                        <span className="blue">1448.50</span>
                        <span>5</span>
                        <span>250</span>
                        <span className="red">1451.00</span>
                        <span>3</span>
                        <span>150</span>
                    </div>
                    <div className="depth-row">
                        <span className="blue">1448.00</span>
                        <span>1</span>
                        <span>50</span>
                        <span className="red">1451.50</span>
                        <span>2</span>
                        <span>100</span>
                    </div>
                    <div className="depth-row">
                        <span className="blue">1447.00</span>
                        <span>8</span>
                        <span>400</span>
                        <span className="red">1452.00</span>
                        <span>4</span>
                        <span>200</span>
                    </div>
                </div>
            </div>

            <div className="buttons-section">
                <div className="margin-info">
                    <span>Margin: ₹{(Number(stockQuantity) * (Number(stockPrice) || 1450) / 5).toFixed(2)}</span>
                </div>
                <div className="action-buttons">
                    <button className="btn btn-red" onClick={handleSellClick}>
                        Sell
                    </button>
                    <button className="btn btn-grey" onClick={handleCancelClick}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SellActionWindow;
