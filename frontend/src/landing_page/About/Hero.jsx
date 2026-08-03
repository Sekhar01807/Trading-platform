import React from "react";

function Hero() {
    return (
        <div className="container">
            <div className="row p-5 mb-5">
                <h1 className="fs-3 p-5 text-center text-muted">
                    We pioneered the discount broking model in India.
                    <br />
                    Now, we are breaking ground with our technology.
                </h1>
            </div>

            <div className="row p-5 mt-5 border-top text-muted" style={{ lineHeight: "1.8", fontSize: "1.2rem" }}>
                <div className="col-6 p-5">
                    <p>
                        We kick-started operations on the 15th of August, 2010 with the goal
                        of breaking all barriers that traders and investors face in India in
                        terms of cost, support, and technology. We named the company
                        Zerodha, a combination of Zero and "Rodha", the Sanskrit word for
                        barrier.
                    </p>
                    <p>
                        Today, our disruptive pricing models and in-house technology have
                        made us the biggest stock broker in India.
                    </p>
                    <p>
                        Over 1.6+ crore clients place billions of orders every year through
                        our powerful ecosystem of investment platforms, contributing over
                        15% of all Indian retail trading volumes.
                    </p>
                </div>
                <div className="col-6 p-5 mb-5">
                    <p>
                        In addition, we run a number of popular open online educational and
                        community initiatives to empower retail traders and investors.
                    </p>
                    <p>
                        <a href="" style={{ textDecoration: "none" }}>
                            Rainmatter
                        </a>
                        , our fintech fund and incubator, has invested in several fintech
                        startups with the goal of growing the Indian capital markets.
                    </p>
                    <p>
                        And yet, we are always up to something new every day. Catch up on
                        the latest updates on our{" "}
                        <a href="" style={{ textDecoration: "none" }}>
                            blog
                        </a>{" "}
                        or see what the media is{" "}
                        <a href="" style={{ textDecoration: "none" }}>
                            saying about us
                        </a>{" "}
                        or learn more about our{" "}
                        <a href="" style={{ textDecoration: "none" }}>
                            business and product philosophies
                        </a>
                        .
                    </p>
                </div>
                <div className="container mt-5 ">
                    <div className="row ">
                        <h1 className="fs-2 text-center ms-5 ps-5 ">
                            People
                        </h1>
                    </div>
                    <div className="row p-5 ">
                        <div className="col-6 text-center ">
                            <img src="Images/nithinKamath.jpg" alt="" style={{ borderRadius: "100%", width: "60%" }} />
                            <h5 className="mt-3 text-muted">Nithin Kamath</h5>
                            <p className="text-muted">Founder, CEO</p>
                        </div>
                        <div className="col-6">

                            <p>Nithin bootstrapped and founded Zerodha in 2010 to overcome the hurdles he faced during his decade long stint as a trader. Today, Zerodha has changed the landscape of the Indian broking industry.</p>

                            <p>He is a member of the SEBI Secondary Market Advisory Committee (SMAC) and the Market Data Advisory Committee (MDAC).</p>

                            <p>Playing basketball is his zen.</p>

                            <p className="text-muted mt-5"> Connect on <a href="" style={{ textDecoration: "none" }}>Homepage</a> / <a href="" style={{ textDecoration: "none" }}>TradingQnA</a> / <a href="" style={{ textDecoration: "none" }}>Twitter</a></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Hero;
