import React from 'react';

function Brokerage() {
    return (
        <div className="container mt-5">
            <div className="row p-5 mt-5 border-top">
                <div className="col-12 p-4 mt-5">
                    <a href="" style={{ textDecoration: "none" }}>
                        <h3 className="fs-5 text-start">Calculate your costs upfront using our brokerage calculator</h3>
                    </a>
                    <ul style={{ textAlign: "left", lineHeight: "2.5", fontSize: "20px" }} className="text-muted list-unstyled mt-5">
                        <li>Call & Trade and RMS auto-squareoff: Additional charges of ₹50 + GST per order.</li>
                        <li>Digital contract notes will be sent via e-mail.</li>
                        <li>Physical copies of contract notes, if required, shall be charged ₹20 per contract note. Courier charges apply.</li>
                        <li>For NRI account (non-PIS), 0.5% or ₹100 per executed order for equity (whichever is lower).</li>
                        <li>For NRI account (PIS), 0.5% or ₹200 per executed order for equity (whichever is lower).</li>
                        <li>If the account is in debit balance, any order placed will be charged ₹40 per executed order instead of ₹20 per executed order.</li>
                    </ul>
                </div>
                <div className="col-4 p-4">
                    <a href="" style={{ textDecoration: "none" }}>
                        <h3 className="fs-5"></h3>
                    </a>
                </div>
            </div>
            <div className="row p-5 text-center mb-5">
                <div className="col-12 p-4 ">
                    <h3 className="fs-3 mb-5 text-start">Charges for account opening</h3>
                    <table className="table border text-start brokerage-table">
                        <thead>
                            <tr>
                                <th scope="col">Type of account</th>
                                <th scope="col">Charges</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Online account</td>
                                <td><button className="btn btn-success btn-sm">FREE</button></td>
                            </tr>
                            <tr>
                                <td>Offline account</td>
                                <td><button className="btn btn-success btn-sm">FREE</button></td>
                            </tr>
                            <tr>
                                <td>NRI account (offline only)</td>
                                <td>₹ 500</td>
                            </tr>
                            <tr>
                                <td>Partnership, LLP, HUF, or Corporate accounts (offline only)</td>
                                <td>₹ 500</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="col-12 p-4 mt-5 mb-5">
                    <h3 className="fs-3 mb-5 text-start">Charges for optional value added services</h3>
                    <table className="table border text-start brokerage-table">
                        <thead>
                            <tr>
                                <th scope="col">Service</th>
                                <th scope="col">Billing Frequency</th>
                                <th scope="col">Charges</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Tickertape</td>
                                <td>Monthly / Annual</td>
                                <td>Free: 0 | Pro: 249/2399</td>
                            </tr>
                            <tr>
                                <td>Smallcase</td>
                                <td>Per transaction</td>
                                <td>Buy & Invest More: 100 | SIP: 10</td>
                            </tr>
                            <tr>
                                <td>Kite Connect</td>
                                <td>Monthly</td>
                                <td>Connect: 500 | Personal: Free</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="col-12 p-4 mt-5 mb-5">
                    <h3 className="fs-3 mb-5 text-start">Demat AMC (Annual Maintenance Charge)</h3>
                    <table className="table border text-start brokerage-table">
                        <thead>
                            <tr>
                                <th scope="col">Value of holdings</th>
                                <th scope="col">AMC</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Up to ₹4 lakh</td>
                                <td><button className="btn btn-success btn-sm">FREE</button></td>
                            </tr>
                            <tr>
                                <td>₹4 lakh - ₹10 lakh</td>
                                <td>₹ 100 per year, charged quarterly*</td>
                            </tr>
                            <tr>
                                <td>Above ₹10 lakh</td>
                                <td>₹ 300 per year, charged quarterly</td>
                            </tr>
                        </tbody>
                    </table>
                    <p className="text-start text-muted mt-3" style={{ fontSize: "12px" }}>* Lower AMC is applicable only if the account qualifies as a Basic Services Demat Account (BSDA). BSDA account holders cannot hold more than one demat account. To learn more about BSDA, <a href="" style={{ textDecoration: "none" }}>click here</a>.</p>
                </div>
            </div>
            <div className='row text-center border-top p-5 mt-5'>
                <div className='col-12 text-start'>
                    <h3 className='fs-5'>Charges explained</h3>
                </div>
                <div className='col-6 p-4 text-start text-muted' style={{ fontSize: "14px" }}>
                    <h5 className='fs-6 mt-4'>Securities/Commodities transaction tax</h5>
                    <p>Tax by the government when transacting on the exchanges. Charged as above on both buy and sell sides when trading equity delivery. Charged only on selling side when trading intraday or on F&O.</p>
                    <p>When trading at Zerodha, STT/CTT can be a lot more than the brokerage we charge. Important to keep a tab.</p>

                    <h5 className='fs-6 mt-4'>Transaction/Turnover Charges</h5>
                    <p>Charged by exchanges (NSE, BSE, MCX) on the value of your transactions.</p>
                    <p>BSE has revised transaction charges in XC, XD, XT, Z and ZP groups to ₹10,000 per crore w.e.f 01.01.2016. (XC and XD groups have been merged into a new group X w.e.f 01.12.2017)</p>
                    <p>BSE has revised transaction charges in SS and ST groups to ₹1,00,000 per crore of gross turnover.</p>
                    <p>BSE has revised transaction charges for group A, B and other non exclusive scrips (non-exclusive scrips from group E, F, FC, G, GC, W, T) at ₹375 per crore of turnover on flat rate basis w.e.f. December 1, 2022.</p>
                    <p>BSE has revised transaction charges in M, MT, TS and MS groups to ₹275 per crore of gross turnover.</p>

                    <h5 className='fs-6 mt-4'>Call & trade</h5>
                    <p>Additional charges of ₹50 per order for orders placed through a dealer at Zerodha including auto square off orders.</p>

                    <h5 className='fs-6 mt-4'>Stamp charges</h5>
                    <p>Stamp charges by the Government of India as per the Indian Stamp Act of 1899 for transacting in instruments on the stock exchanges and depositories.</p>

                    <h5 className='fs-6 mt-4'>NRI brokerage charges</h5>
                    <ul style={{ listStyleType: "none", padding: 0, lineHeight: 2 }}>
                        <li>* For a non-PIS account, 0.5% or ₹50 per executed order for equity and F&O (whichever is lower).</li>
                        <li>* For a PIS account, 0.5% or ₹200 per executed order for equity (whichever is lower).</li>
                        <li>* ₹500 + GST as yearly account maintenance charges (AMC) charges.</li>
                    </ul>

                    <h5 className='fs-6 mt-4'>Account with debit balance</h5>
                    <p>If the account is in debit balance, any order placed will be charged ₹40 per executed order instead of ₹20 per executed order.</p>

                    <h5 className='fs-6 mt-4'>Charges for Investor's Protection Fund Trust (IPFT) by NSE</h5>
                    <ul style={{ listStyleType: "none", padding: 0, lineHeight: 2 }}>
                        <li>* Equity and Futures - ₹10 per crore + GST of the traded value.</li>
                        <li>* Options - ₹50 per crore + GST traded value (premium value).</li>
                        <li>* Currency - ₹0.05 per lakh + GST of turnover for Futures and ₹2 per lakh + GST of premium for Options.</li>
                    </ul>

                </div>
                <div className='col-6 p-4 text-start text-muted' style={{ fontSize: "14px" }}>
                    <h5 className='fs-6 mt-4'>GST</h5>
                    <p>Tax levied by the government on the services rendered. 18% of ( brokerage + SEBI charges + transaction charges)</p>

                    <h5 className='fs-6 mt-4'>SEBI Charges</h5>
                    <p>Charged at ₹10 per crore + GST by Securities and Exchange Board of India for regulating the markets.</p>

                    <h5 className='fs-6 mt-4'>DP (Depository participant) charges</h5>
                    <p>₹15.34 per scrip (₹3.5 CDSL fee + ₹9.5 Zerodha fee + ₹2.34 GST) is charged on the trading account ledger when stocks are sold, irrespective of quantity.</p>
                    <p>Female demat account holders (as first holder) will enjoy a discount of ₹0.25 per transaction on the CDSL fee.</p>
                    <p>Debit transactions of mutual funds & bonds get an additional discount of ₹0.25 on the CDSL fee.</p>

                    <h5 className='fs-6 mt-4'>Pledging charges</h5>
                    <p>₹30 + GST per pledge request per ISIN.</p>

                    <h5 className='fs-6 mt-4'>AMC (Account maintenance charges)</h5>
                    <p>For BSDA demat account: Zero charges if the holding value is less than ₹4,00,000. To learn more about BSDA, <a href="" style={{ textDecoration: "none" }}>click here</a></p>
                    <p>For non-BSDA demat accounts: ₹300/year + 18% GST charged quarterly (90 days). To learn more about AMC, <a href="" style={{ textDecoration: "none" }}>click here</a></p>

                    <h5 className='fs-6 mt-4'>Corporate action order charges</h5>
                    <p>₹20 plus GST will be charged for OFS / buyback / takeover / delisting orders placed through Console.</p>

                    <h5 className='fs-6 mt-4'>Off-market transfer charges</h5>
                    <p>₹25 per transaction.</p>

                    <h5 className='fs-6 mt-4'>Physical CMR request</h5>
                    <p>First CMR request is free. ₹20 + ₹100 (courier charge) + 18% GST for subsequent requests.</p>

                    <h5 className='fs-6 mt-4'>Payment gateway charges</h5>
                    <p>₹9 + GST (Not levied on transfers done via UPI)</p>

                    <h5 className='fs-6 mt-4'>Delayed Payment Charges</h5>
                    <p>Interest is levied at 18% a year or 0.05% per day on the debit balance in your trading account. <a href="" style={{ textDecoration: "none" }}>Learn more</a></p>

                    <h5 className='fs-6 mt-4'>Trading using 3-in-1 account with block functionality</h5>
                    <ul style={{ listStyleType: "none", padding: 0, lineHeight: 2 }}>
                        <li>* Delivery & MTF Brokerage: 0.5% per executed order.</li>
                        <li>* Intraday Brokerage: 0.05% per executed order.</li>
                    </ul>
                </div>
                <div className='col-12 p-4 text-start text-muted' style={{ fontSize: "14px" }}>
                    <h5 className='fs-6 mt-4'>Disclaimer</h5>
                    <p>For Delivery based trades, a minimum of ₹0.01 will be charged per contract note. Clients who opt to receive physical contract notes will be charged ₹20 per contract note plus courier charges. Brokerage will not exceed the rates specified by SEBI and the exchanges. All statutory and regulatory charges will be levied at actuals. Brokerage is also charged on expired, exercised, and assigned options contracts. Free investments are available only for our retail individual clients. Companies, Partnerships, Trusts, and HUFs need to pay 0.1% or ₹20 (whichever is less) as delivery brokerage. A brokerage of 0.25% of the contract value will be charged for contracts where physical delivery happens. For netted off positions in physically settled contracts, a brokerage of 0.1% will be charged.</p>
                </div>
            </div>

        </div>

    )
}

export default Brokerage;
