import React from 'react';

function DashboardShowcase() {
    return (
        <div className='container py-5 my-4'>
            <div className='row align-items-center p-5 rounded-4 shadow-sm' style={{
                background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
                border: "1px solid #E2E8F0"
            }}>
                <div className='col-lg-6 mb-4 mb-lg-0'>
                    <span className='badge bg-primary bg-opacity-10 text-primary fw-bold px-3 py-2 mb-3' style={{ fontSize: "0.85rem" }}>
                        TERMINAL PREVIEW
                    </span>
                    <h2 className='fw-bold text-dark mb-3' style={{ letterSpacing: "-0.5px" }}>
                        Experience the PulseTrade Terminal
                    </h2>
                    <p className='text-muted mb-4' style={{ lineHeight: "1.7" }}>
                        Monitor your watchlist, view real-time market depth quotes, analyze stock performance with Chart.js, and place instant buy/sell orders in a clean, light interface.
                    </p>
                    
                    <div className='d-flex flex-column gap-3 mb-4'>
                        <div className='d-flex align-items-center gap-3'>
                            <span className='fw-medium text-dark'>• Live NSE/BSE stock watchlist streaming</span>
                        </div>
                        <div className='d-flex align-items-center gap-3'>
                            <span className='fw-medium text-dark'>• Interactive buy & sell floating action windows</span>
                        </div>
                        <div className='d-flex align-items-center gap-3'>
                            <span className='fw-medium text-dark'>• One-click Light & Dark theme customization</span>
                        </div>
                    </div>

                    <a 
                        href="http://localhost:5173/signup" 
                        className='btn btn-primary px-4 py-2 fw-semibold shadow-sm'
                        style={{ background: "#3B82F6", borderColor: "#3B82F6", borderRadius: "8px" }}
                    >
                        Try Workspace Free →
                    </a>
                </div>

                {/* Terminal Preview Card */}
                <div className='col-lg-6 text-center'>
                    <div className='p-4 rounded-4 shadow-sm' style={{
                        background: "linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 100%)",
                        border: "1px solid #BFDBFE",
                        color: "#0F172A"
                    }}>
                        <div className='d-flex justify-content-between align-items-center border-bottom pb-3 mb-3' style={{ borderColor: "#DBEAFE" }}>
                            <div className='d-flex align-items-center gap-2'>
                                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#EF4444" }}></span>
                                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#F59E0B" }}></span>
                                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10B981" }}></span>
                            </div>
                            <span className='small fw-semibold text-primary'>PulseTrade Terminal v1.0</span>
                        </div>

                        <div className='row text-start g-3'>
                            <div className='col-6'>
                                <div className='p-3 rounded-3 shadow-sm' style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
                                    <div className='small text-muted fw-medium'>RELIANCE</div>
                                    <div className='fs-5 fw-bold text-success'>₹2,112.40 <small className='fs-6'>+1.44%</small></div>
                                </div>
                            </div>
                            <div className='col-6'>
                                <div className='p-3 rounded-3 shadow-sm' style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
                                    <div className='small text-muted fw-medium'>HDFCBANK</div>
                                    <div className='fs-5 fw-bold text-success'>₹1,522.35 <small className='fs-6'>+0.11%</small></div>
                                </div>
                            </div>
                            <div className='col-12'>
                                <div className='p-3 rounded-3 shadow-sm' style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
                                    <div className='d-flex justify-content-between small text-muted mb-2'>
                                        <span className='fw-medium text-dark'>Active Holding: INFY</span>
                                        <span className='text-primary fw-bold'>2 Qty</span>
                                    </div>
                                    <div className='progress' style={{ height: "6px", backgroundColor: "#E2E8F0" }}>
                                        <div className='progress-bar bg-success' style={{ width: "75%" }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DashboardShowcase;
