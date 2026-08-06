import React, { useState, useEffect, useRef } from "react";
import CloseIcon from '@mui/icons-material/Close';
import axios from "axios";
import { toast } from "react-toastify";
import { io } from "socket.io-client";
import { API_URL } from "../config";

import "./BuyActionWindow.css";

const BuyActionWindow = ({ uid, initialPrice = 0, closeBuyWindow }) => {
  const [productType, setProductType] = useState("CNC"); // CNC, MIS
  const [orderType, setOrderType] = useState("MARKET"); // MARKET, LIMIT
  const [stockQuantity, setStockQuantity] = useState(1);
  const [liveLtp, setLiveLtp] = useState(initialPrice > 0 ? initialPrice : 1450.00);
  const [stockPrice, setStockPrice] = useState(initialPrice > 0 ? initialPrice : 1450.00);
  const [availableCash, setAvailableCash] = useState(0);

  // Dragging state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const fetchUserFunds = () => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    axios.get(`${API_URL}/user/funds`, { withCredentials: true, headers })
      .then((res) => {
        if (res.data && res.data.availableCash !== undefined) {
          setAvailableCash(res.data.availableCash);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchUserFunds();

    const handlePortfolioUpdate = () => {
      fetchUserFunds();
    };

    window.addEventListener("portfolioUpdated", handlePortfolioUpdate);

    const socket = io(API_URL);
    socket.on("connect", () => {
      socket.emit("subscribe", [uid]);
    });

    socket.on("priceUpdate", (livePrices) => {
      if (livePrices && livePrices[uid]) {
        const newPrice = livePrices[uid];
        setLiveLtp(newPrice);
        if (orderType === "MARKET") {
          setStockPrice(newPrice);
        }
      }
    });

    return () => {
      socket.disconnect();
      window.removeEventListener("portfolioUpdated", handlePortfolioUpdate);
    };
  }, [uid, orderType]);

  const handleMouseDown = (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON" || e.target.closest(".tab-btn")) {
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

  const handleBuyClick = async () => {
    try {
      const finalPrice = orderType === "MARKET" ? liveLtp : (Number(stockPrice) > 0 ? Number(stockPrice) : liveLtp);
      const totalMarginReq = Number(stockQuantity) * finalPrice;

      if (totalMarginReq > availableCash) {
        toast.warning("Margin required exceeds available cash in wallet!");
      }

      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/newOrders`,
        {
          name: uid,
          qty: Number(stockQuantity),
          price: finalPrice,
          mode: "BUY",
        },
        { 
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success(`Bought ${stockQuantity} share(s) of ${uid} @ ₹${finalPrice.toFixed(2)} (${productType})!`);
      window.dispatchEvent(new Event("portfolioUpdated"));
      closeBuyWindow();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to place buy order.";
      toast.error(msg);
      closeBuyWindow();
    }
  };

  const basePrice = liveLtp || stockPrice || 1450;
  const marginReq = (Number(stockQuantity) * (orderType === "MARKET" ? liveLtp : (Number(stockPrice) || liveLtp))).toFixed(2);

  // Dynamic market depth bid/offer tick data
  const bids = [
    { price: (basePrice - 0.25).toFixed(2), orders: 4, qty: 150 },
    { price: (basePrice - 0.60).toFixed(2), orders: 9, qty: 320 },
    { price: (basePrice - 1.10).toFixed(2), orders: 15, qty: 580 },
  ];

  const offers = [
    { price: (basePrice + 0.25).toFixed(2), orders: 2, qty: 90 },
    { price: (basePrice + 0.55).toFixed(2), orders: 6, qty: 240 },
    { price: (basePrice + 1.05).toFixed(2), orders: 12, qty: 450 },
  ];

  return (
    <div
      className="buy-window-container"
      id="buy-window"
      draggable="false"
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      onMouseDown={handleMouseDown}
    >
      <div className="header">
        <div className="title">
          <h3>Buy {uid} <span>NSE</span></h3>
          <span className="price-tag">₹{liveLtp.toFixed(2)}</span>
        </div>
        <button className="close-btn" onClick={closeBuyWindow}>
          <CloseIcon style={{ fontSize: "1.2rem" }} />
        </button>
      </div>

      <div className="buy-window-body">
        {/* Product Type & Order Type Tabs */}
        <div className="order-options">
          <div className="option-group">
            <label>Product:</label>
            <button
              className={`tab-btn ${productType === "CNC" ? "active" : ""}`}
              onClick={() => setProductType("CNC")}
            >
              Longterm CNC
            </button>
            <button
              className={`tab-btn ${productType === "MIS" ? "active" : ""}`}
              onClick={() => setProductType("MIS")}
            >
              Intraday MIS
            </button>
          </div>

          <div className="option-group">
            <label>Type:</label>
            <button
              className={`tab-btn ${orderType === "MARKET" ? "active" : ""}`}
              onClick={() => {
                setOrderType("MARKET");
                setStockPrice(liveLtp);
              }}
            >
              Market
            </button>
            <button
              className={`tab-btn ${orderType === "LIMIT" ? "active" : ""}`}
              onClick={() => setOrderType("LIMIT")}
            >
              Limit
            </button>
          </div>
        </div>

        {/* Inputs */}
        <div className="inputs-section">
          <fieldset>
            <legend>Qty.</legend>
            <input
              type="number"
              name="qty"
              id="qty"
              min="1"
              onChange={(e) => setStockQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              value={stockQuantity}
            />
          </fieldset>
          <fieldset style={{ opacity: orderType === "MARKET" ? 0.7 : 1 }}>
            <legend>Price</legend>
            <input
              type="number"
              name="price"
              id="price"
              step="0.05"
              disabled={orderType === "MARKET"}
              onChange={(e) => setStockPrice(e.target.value)}
              value={orderType === "MARKET" ? liveLtp.toFixed(2) : stockPrice}
            />
          </fieldset>
        </div>

        {/* 2-Column Market Depth Table */}
        <div className="market-depth-wrapper">
          <div className="market-depth-title">Live Market Depth ({uid})</div>
          <div className="market-depth-columns">
            {/* Bid Column */}
            <div>
              <table className="depth-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Bid</th>
                    <th style={{ textAlign: "center" }}>Orders</th>
                    <th style={{ textAlign: "right" }}>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {bids.map((b, i) => (
                    <tr key={i}>
                      <td className="blue" style={{ textAlign: "left" }}>{b.price}</td>
                      <td style={{ textAlign: "center" }}>{b.orders}</td>
                      <td style={{ textAlign: "right" }}>{b.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="depth-divider"></div>

            {/* Offer Column */}
            <div>
              <table className="depth-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Offer</th>
                    <th style={{ textAlign: "center" }}>Orders</th>
                    <th style={{ textAlign: "right" }}>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((o, i) => (
                    <tr key={i}>
                      <td className="red" style={{ textAlign: "left" }}>{o.price}</td>
                      <td style={{ textAlign: "center" }}>{o.orders}</td>
                      <td style={{ textAlign: "right" }}>{o.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="buttons-section">
        <div className="margin-info">
          <span className="req">Margin required: ₹{marginReq}</span>
          <span className="avail">Available cash: ₹{availableCash.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="action-buttons">
          <button className="btn btn-blue" onClick={handleBuyClick}>
            Buy
          </button>
          <button className="btn btn-grey" onClick={closeBuyWindow}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuyActionWindow;