import React, { useState, useRef } from "react";
import "./StockDetails.css";
import CloseIcon from '@mui/icons-material/Close';

const StockDetails = ({ uid, closeMoreWindow }) => {
    // Dragging state
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e) => {
        if (e.target.tagName === "BUTTON") {
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

    return (
        <div
            className="details-window-container"
            id="details-window"
            draggable="false"
            style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
            onMouseDown={handleMouseDown}
        >
            <div className="header">
                <div className="title">
                    <h3>{uid} <span>Fundamentals</span></h3>
                </div>
                <button className="close-btn" onClick={closeMoreWindow}>
                    <CloseIcon style={{ fontSize: "1.2rem" }} />
                </button>
            </div>
            <div className="details-content">
                <div className="performance-row">
                    <div className="item">
                        <span>Open</span>
                        <p>1,450.50</p>
                    </div>
                    <div className="item">
                        <span>High</span>
                        <p>1,480.00</p>
                    </div>
                    <div className="item">
                        <span>Low</span>
                        <p>1,440.00</p>
                    </div>
                    <div className="item">
                        <span>Close</span>
                        <p>1,460.00</p>
                    </div>
                </div>

                <div className="stats-grid">
                    <div className="stat-item">
                        <small>Market Cap</small>
                        <p>₹5.4L Cr</p>
                    </div>
                    <div className="stat-item">
                        <small>P/E Ratio</small>
                        <p>24.5</p>
                    </div>
                    <div className="stat-item">
                        <small>Dividend Yield</small>
                        <p>1.2%</p>
                    </div>
                    <div className="stat-item">
                        <small>52W High</small>
                        <p>1,600.00</p>
                    </div>
                    <div className="stat-item">
                        <small>52W Low</small>
                        <p>1,200.00</p>
                    </div>
                </div>

                <div className="about-section">
                    <h4>About {uid}</h4>
                    <p>
                        This is a sample description for {uid}. It is a leading company in its sector, known for strong fundamentals and consistent growth.
                        (Note: This is mock data for demonstration purposes).
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StockDetails;
