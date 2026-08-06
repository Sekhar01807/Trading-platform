import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import Menu from "./Menu";
import { API_URL } from "../config";

const TopBar = ({ user, onUsernameUpdate }) => {
    const [nifty, setNifty] = useState({ price: 24512.40, percent: "+0.45%", isUp: true });
    const [sensex, setSensex] = useState({ price: 80245.80, percent: "+0.38%", isUp: true });

    useEffect(() => {
        const socket = io(API_URL);

        socket.on("priceUpdate", (livePrices) => {
            if (livePrices["NIFTY 50"]) {
                setNifty(prev => {
                    const newP = livePrices["NIFTY 50"];
                    const diff = newP - prev.price;
                    const pct = ((diff / prev.price) * 100).toFixed(2);
                    return {
                        price: newP,
                        percent: (diff >= 0 ? "+" : "") + pct + "%",
                        isUp: diff >= 0
                    };
                });
            }

            if (livePrices["SENSEX"]) {
                setSensex(prev => {
                    const newP = livePrices["SENSEX"];
                    const diff = newP - prev.price;
                    const pct = ((diff / prev.price) * 100).toFixed(2);
                    return {
                        price: newP,
                        percent: (diff >= 0 ? "+" : "") + pct + "%",
                        isUp: diff >= 0
                    };
                });
            }
        });

        return () => socket.disconnect();
    }, []);

    return (
        <div className="topbar-container">
            <div className="indices-container">
                <div className="nifty">
                    <p className="index">NIFTY 50</p>
                    <p className="index-points" style={{ color: nifty.isUp ? "#4caf50" : "#f44336", fontWeight: "600" }}>
                        {nifty.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="percent" style={{ color: nifty.isUp ? "#4caf50" : "#f44336", fontSize: "11px" }}>
                        {nifty.percent}
                    </p>
                </div>
                <div className="sensex">
                    <p className="index">SENSEX</p>
                    <p className="index-points" style={{ color: sensex.isUp ? "#4caf50" : "#f44336", fontWeight: "600" }}>
                        {sensex.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="percent" style={{ color: sensex.isUp ? "#4caf50" : "#f44336", fontSize: "11px" }}>
                        {sensex.percent}
                    </p>
                </div>
            </div>

            <Menu user={user} onUsernameUpdate={onUsernameUpdate} />
        </div>
    );
};

export default TopBar;