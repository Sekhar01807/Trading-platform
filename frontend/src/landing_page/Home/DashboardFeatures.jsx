import React from 'react';

function DashboardFeatures() {
    const modules = [
        {
            tag: "MARKET WATCHLIST",
            title: "Live Stock Price Ticker Feed",
            description: "Keep track of all top NSE/BSE stocks in a unified watchlist. Ticker prices automatically stream and update live via WebSockets every 10 seconds.",
            bullets: ["Live Market Price Stream", "Instant Symbol Search", "Market Depth Bids & Offers"],
            color: "#3B82F6",
            image: "/Images/feature_watchlist.png"
        },
        {
            tag: "ORDER EXECUTION",
            title: "Instant BUY & SELL Matching",
            description: "Submit orders instantly through floating glass action windows. Set stock price, order quantity, and trigger automatic holding updates with clear Toast feedback.",
            bullets: ["Automated Margin Calculation", "Real-Time Toast Alerts", "Order History Audit Trail"],
            color: "#10B981",
            image: "/Images/feature_orders.png"
        },
        {
            tag: "PORTFOLIO TRACKER",
            title: "Dynamic Holdings & Positions",
            description: "Buying stock automatically increases holding quantities and calculates your average buy price. Selling stock dynamically updates net profit/loss and portfolio totals.",
            bullets: ["Automated Avg Buy Costing", "Unrealized P&L Tracker", "Isolated User Portfolio Privacy"],
            color: "#6366F1",
            image: "/Images/feature_portfolio.png"
        },
        {
            tag: "ANALYTICS & CHARTS",
            title: "Interactive Stock Visualizations",
            description: "Analyze portfolio distribution and performance trends with integrated Chart.js graphs and real-time market depth indicators.",
            bullets: ["Chart.js Portfolio Graphs", "Light & Dark Mode Support", "Responsive Multi-Device Layout"],
            color: "#F59E0B",
            image: "/Images/feature_analytics.png"
        }
    ];

    return (
        <div className='container py-5 my-3'>
            <div className='text-center mb-5'>
                <span className='badge bg-primary bg-opacity-10 text-primary fw-bold px-3 py-2 mb-2' style={{ fontSize: "0.85rem" }}>
                    DASHBOARD DEEP DIVE
                </span>
                <h2 className='fw-bold text-dark display-6 mb-3' style={{ letterSpacing: "-0.5px" }}>
                    Inside the PulseTrade Workspace
                </h2>
                <p className='text-muted mx-auto' style={{ maxWidth: "650px", fontSize: "1.1rem" }}>
                    Explore the powerful tools built directly into your trading terminal.
                </p>
            </div>

            <div className='row g-4'>
                {modules.map((mod, idx) => (
                    <div className='col-md-6' key={idx}>
                        <div className='card h-100 p-4 border-0 shadow-sm' style={{
                            borderRadius: "16px",
                            background: "#FFFFFF",
                            border: "1px solid #E2E8F0",
                            transition: "all 0.3s ease"
                        }}>
                            {/* Feature Illustration Container */}
                            <div className='mb-4 text-center rounded-4 overflow-hidden p-2' style={{
                                background: "linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)",
                                border: "1px solid #E2E8F0"
                            }}>
                                <img 
                                    src={mod.image} 
                                    alt={mod.title} 
                                    className='img-fluid rounded-3 shadow-sm'
                                    style={{ 
                                        maxHeight: "220px", 
                                        width: "100%",
                                        objectFit: "cover" 
                                    }}
                                />
                            </div>

                            <div className='d-flex align-items-center gap-2 mb-2'>
                                <span className='badge px-3 py-1' style={{
                                    background: `${mod.color}15`,
                                    color: mod.color,
                                    fontWeight: "700",
                                    fontSize: "0.75rem",
                                    letterSpacing: "0.5px"
                                }}>
                                    {mod.tag}
                                </span>
                            </div>
                            <h4 className='fw-bold text-dark mb-2'>{mod.title}</h4>
                            <p className='text-muted mb-4' style={{ lineHeight: "1.7", fontSize: "0.95rem" }}>
                                {mod.description}
                            </p>
                            <div className='d-flex flex-column gap-2 mt-auto pt-3 border-top'>
                                {mod.bullets.map((b, bIdx) => (
                                    <div key={bIdx} className='d-flex align-items-center gap-2 small text-dark fw-medium'>
                                        <span style={{ color: mod.color, fontWeight: "bold" }}>✓</span> {b}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default DashboardFeatures;
