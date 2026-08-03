import React from 'react';

function Features() {
    const featuresList = [
        {
            icon: "⚡",
            title: "Live Market Streaming",
            description: "High-frequency live price tick updates streamed directly via WebSockets and Yahoo Finance API every 10 seconds."
        },
        {
            icon: "📈",
            title: "Dynamic Order Execution",
            description: "Instant BUY and SELL order matching that automatically updates holdings, positions, and average cost basis."
        },
        {
            icon: "📊",
            title: "Interactive Analytics & Depth",
            description: "Built-in Chart.js stock visualization, real-time market depth quotes, and portfolio profit/loss distribution."
        },
        {
            icon: "🔒",
            title: "Isolated Account Privacy",
            description: "JWT session tokens paired with dedicated database scoping ensuring user data concurrency & privacy."
        }
    ];

    return (
        <div className='container py-5 my-4'>
            <div className='text-center mb-5'>
                <h2 className='fw-bold text-dark mb-2'>Engineered for Performance & Speed</h2>
                <p className='text-muted'>Built with a full-stack architecture designed for real-time market interaction.</p>
            </div>

            <div className='row g-4'>
                {featuresList.map((item, idx) => (
                    <div className='col-md-6 col-lg-3' key={idx}>
                        <div className='card h-100 p-4 border-0 shadow-sm' style={{
                            borderRadius: "14px",
                            background: "#FFFFFF",
                            border: "1px solid #E2E8F0",
                            transition: "all 0.3s ease"
                        }}>
                            <div className='display-5 mb-3'>{item.icon}</div>
                            <h5 className='fw-bold text-dark mb-2'>{item.title}</h5>
                            <p className='text-muted small mb-0' style={{ lineHeight: "1.6" }}>{item.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Features;
