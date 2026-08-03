import React from 'react';

function Hero() {
    return (
        <div className="container mt-5 mb-5">
            <div className="row p-5 mt-5 text-center">
                <h2 className='mt-5'>Charges</h2>
                <h3 className="text-muted mt-3 fs-4 mb-5">List of all charges and taxes</h3>
                <div className="col-4 p-5 mt-5 mb-5">
                    <img src="Images/pricing0.svg" style={{ width: "90%", height: "90%" }} />
                    <h3>Free equity delivery</h3>
                    <p className="text-muted mt-3">All equity delivery investments (NSE, BSE), are absolutely free — ₹ 0 brokerage.</p>
                </div>
                <div className="col-4 p-5 mt-5 mb-5">
                    <img src="Images/intradayTrades.svg" style={{ width: "90%", height: "90%" }} />
                    <h3>Intraday and F&O trades</h3>
                    <p className="text-muted mt-3">Flat ₹ 20 or 0.03% (whichever is lower) per executed order on intraday trades across equity, currency, and commodity trades. Flat ₹20 on all option trades.</p>
                </div>
                <div className="col-4 p-5 mt-5 mb-5">
                    <img src="Images/pricing0.svg" style={{ width: "90%", height: "90%" }} />
                    <h3>Free direct MF</h3>
                    <p className="text-muted mt-3">All direct mutual fund investments are absolutely free — ₹ 0 commissions & DP charges.</p>
                </div>
            </div>
        </div>
    );
}

export default Hero;