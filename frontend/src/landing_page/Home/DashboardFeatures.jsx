import React from 'react';

function DashboardFeatures() {
    const modules = [
        {
            tag: "MARKET WATCHLIST",
            title: "Live Stock Price Ticker Feed",
            description: "Keep track of all top NSE/BSE stocks in a unified watchlist. Ticker prices automatically stream and update live via WebSockets every 10 seconds.",
            bullets: ["Live Market Price Stream", "Instant Symbol Search", "Market Depth Bids & Offers"],
            color: "#3B82F6",
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
            ),
            preview: (
                <div className='p-3 rounded-3 shadow-sm' style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <div className='d-flex justify-content-between align-items-center mb-2 p-2 bg-white rounded border'>
                        <span className='fw-bold text-dark small'>RELIANCE</span>
                        <span className='fw-bold text-success small'>₹2,112.40 <small>+1.44%</small></span>
                    </div>
                    <div className='d-flex justify-content-between align-items-center p-2 bg-white rounded border'>
                        <span className='fw-bold text-dark small'>HDFCBANK</span>
                        <span className='fw-bold text-success small'>₹1,522.35 <small>+0.11%</small></span>
                    </div>
                </div>
            )
        },
        {
            tag: "ORDER EXECUTION",
            title: "Instant BUY & SELL Matching",
            description: "Submit orders instantly through floating glass action windows. Set stock price, order quantity, and trigger automatic holding updates with clear Toast feedback.",
            bullets: ["Automated Margin Calculation", "Real-Time Toast Alerts", "Order History Audit Trail"],
            color: "#10B981",
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
            ),
            preview: (
                <div className='p-3 rounded-3 shadow-sm' style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <div className='d-flex gap-2 mb-2'>
                        <button className='btn btn-primary btn-sm flex-fill fw-bold' style={{ background: "#3B82F6", borderColor: "#3B82F6" }}>BUY (2 Qty)</button>
                        <button className='btn btn-danger btn-sm flex-fill fw-bold' style={{ background: "#EF4444", borderColor: "#EF4444" }}>SELL (1 Qty)</button>
                    </div>
                    <div className='small text-muted text-center fw-medium'>Instant Execution • Toast Confirmed</div>
                </div>
            )
        },
        {
            tag: "PORTFOLIO TRACKER",
            title: "Dynamic Holdings & Positions",
            description: "Buying stock automatically increases holding quantities and calculates your average buy price. Selling stock dynamically updates net profit/loss and portfolio totals.",
            bullets: ["Automated Avg Buy Costing", "Unrealized P&L Tracker", "Isolated User Portfolio Privacy"],
            color: "#6366F1",
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                    <line x1="2" y1="10" x2="22" y2="10"></line>
                </svg>
            ),
            preview: (
                <div className='p-3 rounded-3 shadow-sm' style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <div className='d-flex justify-content-between text-dark fw-bold small mb-1'>
                        <span>Holding Balance</span>
                        <span className='text-success'>+₹15,420.00</span>
                    </div>
                    <div className='progress' style={{ height: "8px", backgroundColor: "#E2E8F0" }}>
                        <div className='progress-bar bg-success' style={{ width: "80%" }}></div>
                    </div>
                </div>
            )
        },
        {
            tag: "ANALYTICS & CHARTS",
            title: "Interactive Stock Visualizations",
            description: "Analyze portfolio distribution and performance trends with integrated Chart.js graphs and real-time market depth indicators.",
            bullets: ["Chart.js Portfolio Graphs", "Light & Dark Mode Support", "Responsive Multi-Device Layout"],
            color: "#F59E0B",
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
            ),
            preview: (
                <div className='p-3 rounded-3 shadow-sm' style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <div className='d-flex justify-content-between align-items-center text-muted small fw-medium mb-1'>
                        <span>Market Trend</span>
                        <span className='badge bg-success bg-opacity-10 text-success'>BULLISH 📈</span>
                    </div>
                    <div className='d-flex align-items-center gap-1 justify-content-center py-2'>
                        <div style={{ width: "8px", height: "30px", background: "#10B981", borderRadius: "2px" }}></div>
                        <div style={{ width: "8px", height: "45px", background: "#10B981", borderRadius: "2px" }}></div>
                        <div style={{ width: "8px", height: "25px", background: "#EF4444", borderRadius: "2px" }}></div>
                        <div style={{ width: "8px", height: "55px", background: "#10B981", borderRadius: "2px" }}></div>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className='container py-5 my-3'>
            <div className='text-center mb-5'>
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
                            {/* SVG Trading Icon & Tag Header */}
                            <div className='d-flex align-items-center justify-content-between mb-3'>
                                <div className='p-2 rounded-3' style={{ background: `${mod.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {mod.icon}
                                </div>
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

                            {/* Live Natural Trading UI Mini Widget */}
                            <div className='mb-4'>
                                {mod.preview}
                            </div>

                            <div className='d-flex flex-column gap-2 mt-auto pt-3 border-top'>
                                {mod.bullets.map((b, bIdx) => (
                                    <div key={bIdx} className='small text-dark fw-medium'>
                                        • {b}
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
