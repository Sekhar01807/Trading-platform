import React, { useState, useRef } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "./StockChart.css";
import CloseIcon from '@mui/icons-material/Close';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const StockChart = ({ uid, closeChartWindow }) => {
    // Dragging state
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e) => {
        if (e.target.tagName === "BUTTON" || e.target.closest(".chart-container")) {
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

    // Dummy Data for Lines (Rise and Fall)
    const labels = ["9:15", "10:00", "11:00", "12:00", "1:00", "2:00", "3:00", "3:30"];

    // Generate random data based on current price roughly (mock logic)
    const generateRandomData = () => {
        const data = [];
        let base = 1000;
        for (let i = 0; i < labels.length; i++) {
            let change = Math.floor(Math.random() * 100) - 50;
            base += change;
            data.push(base);
        }
        return data;
    }

    const data = {
        labels,
        datasets: [
            {
                label: uid,
                data: generateRandomData(),
                borderColor: "rgb(53, 162, 235)",
                backgroundColor: "rgba(53, 162, 235, 0.5)",
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: `${uid} Intraday`,
            },
        },
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
                    <h3>{uid} <span>NSE</span></h3>
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
