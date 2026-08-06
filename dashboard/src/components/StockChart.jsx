import React, { useState, useEffect, useRef } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from "chart.js";
import { Line } from "react-chartjs-2";
import "./StockChart.css";
import CloseIcon from '@mui/icons-material/Close';
import { io } from "socket.io-client";
import { API_URL } from "../config";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const StockChart = ({ uid, closeChartWindow }) => {
    const [liveLtp, setLiveLtp] = useState(1450.00);
    const [priceHistory, setPriceHistory] = useState([]);

    // Dragging state
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const socket = io(API_URL);

        socket.on("connect", () => {
            socket.emit("subscribe", [uid]);
        });

        socket.on("priceUpdate", (livePrices) => {
            if (livePrices && livePrices[uid]) {
                const currentPrice = livePrices[uid];
                setLiveLtp(currentPrice);

                setPriceHistory((prev) => {
                    if (prev.length === 0) {
                        // Initialize realistic intraday baseline around current live stock price
                        const baseline = [];
                        let p = currentPrice * 0.985;
                        for (let i = 0; i < 7; i++) {
                            p += (Math.random() - 0.48) * (currentPrice * 0.005);
                            baseline.push(parseFloat(p.toFixed(2)));
                        }
                        baseline.push(currentPrice);
                        return baseline;
                    }
                    const updated = [...prev.slice(-7), currentPrice];
                    return updated;
                });
            }
        });

        return () => socket.disconnect();
    }, [uid]);

    const handleMouseDown = (e) => {
        if (e.target.tagName === "BUTTON" || e.target.closest(".chart-content")) {
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

    const labels = ["9:15", "10:00", "11:00", "12:00", "1:00", "2:00", "3:00", "LIVE"];

    const isUp = priceHistory.length > 1 ? priceHistory[priceHistory.length - 1] >= priceHistory[0] : true;
    const strokeColor = isUp ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)";
    const fillColor = isUp ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)";

    const data = {
        labels,
        datasets: [
            {
                label: `${uid} Price (₹)`,
                data: priceHistory.length > 0 ? priceHistory : [liveLtp],
                borderColor: strokeColor,
                backgroundColor: fillColor,
                fill: true,
                tension: 0.35,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: `${uid} Live Intraday Chart - ₹${liveLtp.toFixed(2)}`,
                color: "#1F2937",
                font: {
                    size: 15,
                    weight: "bold",
                }
            },
            tooltip: {
                callbacks: {
                    label: (context) => ` Price: ₹${context.raw}`
                }
            }
        },
        scales: {
            y: {
                ticks: {
                    callback: (value) => `₹${value}`
                }
            }
        }
    };

    return (
        <div
            className="chart-window-container"
            id="chart-window"
            draggable="false"
            style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
            onMouseDown={handleMouseDown}
        >
            <div className="header">
                <div className="title">
                    <h3>{uid} <span>NSE</span> — ₹{liveLtp.toFixed(2)}</h3>
                </div>
                <button className="close-btn" onClick={closeChartWindow}>
                    <CloseIcon style={{ fontSize: "1.2rem" }} />
                </button>
            </div>
            <div className="chart-content">
                <Line options={options} data={data} />
            </div>
        </div>
    );
};

export default StockChart;
