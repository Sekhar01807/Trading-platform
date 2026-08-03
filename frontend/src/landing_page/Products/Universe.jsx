import React from 'react';

function Universe() {
    return (
        <div className="container mt-3">
            <div className="row text-center">
                <div className="col-12 p-3 mb-5">
                    <p className="text-center mt-5 mb-5 text-muted fs-4">Want to know more about our technology stack? Check out the <a href="" className="text-decoration-none" style={{ color: "#387ed1" }}>Zerodha.tech</a> blog.</p>
                </div>

                <h3 className='mb-3'> The Zerodha Universe</h3>
                <p className="mt-2 mb-3" style={{fontSize:"1.2rem"}}>Extend your trading and investment experience even further with our partner platforms</p>

                <div className="col-4 p-3 mt-5">
                    <img src="Images/zerodhaFundhouse.png" style={{ width: "50%" }} />
                    <p className="text-muted mt-3 p-3" style={{fontSize:"0.9rem"}}>Our asset management venture that is creating simple and transparent index funds to help you save for your goals.</p>
                </div>
                <div className="col-4 p-3 mt-5">
                    <img src="Images/sensibullLogo.svg" style={{ width: "55%" }} />
                    <p className="text-muted mt-3 p-3" style={{fontSize:"0.9rem"}}>Options trading platform that lets you create strategies, analyze positions, and examine data points like open interest, FII/DII, and more.</p>
                </div>
                <div className="col-4 p-3 mt-5">
                    <img src="Images/tijori.svg" style={{ width: "35%" }} />
                    <p className="text-muted mt-3 p-3" style={{fontSize:"0.9rem"}}>Investment research platform that offers detailed insights on stocks, sectors, supply chains, and more.</p>
                </div>

                <div className="col-4 p-3 mt-5">
                    <img src="Images/streakLogo.png" style={{ width: "45%" }} />
                    <p className="text-muted mt-3 p-3" style={{fontSize:"0.9rem"}}>Systematic trading platform that allows you to create and backtest strategies without coding.</p>
                </div>
                <div className="col-4 p-3 mt-5">
                    <img src="Images/smallcaseLogo.png" style={{ width: "55%" }} />
                    <p className="text-muted mt-3 p-3" style={{fontSize:"0.9rem"}}>Thematic investing platform that helps you invest in diversified baskets of stocks on ETFs.</p>
                </div>
                <div className="col-4 p-3 mt-5">
                    <img src="Images/dittoLogo.png" style={{ width: "35%" }} />
                    <p className="text-muted mt-3 p-3" style={{fontSize:"0.9rem"}}>Personalized advice on life and health insurance. No spam and no mis-selling.</p>
                </div>

                <button className="p-2 btn btn-primary fs-5 mb-5 mt-5" style={{ width: "20%", margin: "0 auto" }}>Sign up for free</button>
            </div>
        </div>
    );
}

export default Universe;
