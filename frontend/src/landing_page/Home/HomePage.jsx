import React from 'react';
import { DASHBOARD_URL } from '../../config';
import Hero from './Hero';
import LiveChartsShowcase from './LiveChartsShowcase';
import Features from './Features';
import DashboardFeatures from './DashboardFeatures';
import DashboardShowcase from './DashboardShowcase';

function HomePage() {
    return (
        <div>
            <Hero />
            <LiveChartsShowcase />
            <Features />
            <DashboardFeatures />
            <DashboardShowcase />

            {/* Bottom Call-To-Action */}
            <div className='container py-5 text-center my-4'>
                <div className='p-5 rounded-4 shadow-sm' style={{
                    background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
                    border: "1px solid #BFDBFE"
                }}>
                    <h2 className='fw-bold text-dark mb-3' style={{ letterSpacing: "-0.5px" }}>
                        Ready to Experience Modern Trading?
                    </h2>
                    <p className='text-secondary mb-4' style={{ maxWidth: "600px", margin: "0 auto", fontSize: "1.05rem" }}>
                        Launch your PulseTrade workspace to stream live prices and manage your portfolio.
                    </p>
                    <div className='d-flex justify-content-center gap-3'>
                        <a 
                            href={`${DASHBOARD_URL}/signup`} 
                            className='btn btn-primary btn-scale btn-lg px-4 py-3 shadow-sm'
                            style={{
                                background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
                                borderColor: "#3B82F6",
                                borderRadius: "10px",
                                fontWeight: "600"
                            }}
                        >
                            Create Free Account →
                        </a>
                        <a 
                            href={`${DASHBOARD_URL}/login`} 
                            className='btn btn-outline-scale px-4 py-3'
                            style={{
                                borderRadius: "10px",
                                fontWeight: "600",
                                border: "1px solid #3B82F6",
                                color: "#3B82F6",
                                fontSize: "1rem"
                            }}
                        >
                            Sign In
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HomePage;
