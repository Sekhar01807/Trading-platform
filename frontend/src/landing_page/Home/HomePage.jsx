import React from 'react';
import Hero from './Hero';
import Features from './Features';
import DashboardFeatures from './DashboardFeatures';
import DashboardShowcase from './DashboardShowcase';

function HomePage() {
    return (
        <div>
            <Hero />
            <Features />
            <DashboardFeatures />
            <DashboardShowcase />

            {/* Bottom Call-To-Action */}
            <div className='container py-5 text-center my-4'>
                <div className='p-5 rounded-4 shadow-sm text-white' style={{
                    background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
                    border: "1px solid #334155"
                }}>
                    <h2 className='fw-bold mb-3'>Ready to Experience Modern Trading?</h2>
                    <p className='text-light mb-4 opacity-75' style={{ maxWidth: "600px", margin: "0 auto" }}>
                        Launch your PulseTrade workspace to stream live prices and manage your portfolio.
                    </p>
                    <div className='d-flex justify-content-center gap-3'>
                        <a 
                            href="http://localhost:5173/signup" 
                            className='btn btn-success btn-lg px-4 py-3 shadow'
                            style={{
                                background: "#10B981",
                                borderColor: "#10B981",
                                borderRadius: "10px",
                                fontWeight: "600"
                            }}
                        >
                            Create Free Account →
                        </a>
                        <a 
                            href="http://localhost:5173/login" 
                            className='btn btn-outline-light btn-lg px-4 py-3'
                            style={{
                                borderRadius: "10px",
                                fontWeight: "600"
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
