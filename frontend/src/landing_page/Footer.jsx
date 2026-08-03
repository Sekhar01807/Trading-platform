import React from 'react'

function Footer() {
    return (
        <footer className="bg-body-tertiary border-top">
            <div className='container mt-5'>
                <div className="row mt-5">
                    <div className="col-12 col-md-3">
                        <img src="Images/logo.svg" alt="logo" style={{ width: "50%" }} />
                        <p className="mt-3 text-muted" style={{ fontSize: "14px" }}>
                            &copy; 2010 - 2026, Zerodha Broking Ltd.<br />
                            All rights reserved.
                        </p>
                        <ul className="social list-unstyled d-flex gap-3 mb-3 pb-3 ">
                            <li className="nav-item">
                                <a className="nav-link text-muted" href="/"><i className="fa-brands fa-x-twitter fs-5"></i></a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link text-muted" href="/"><i className="fa-brands fa-square-facebook fs-5"></i></a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link text-muted" href="/"><i className="fa-brands fa-instagram fs-5"></i></a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link text-muted" href="/"><i className="fa-brands fa-linkedin-in fs-5"></i></a>
                            </li>
                        </ul>
                        <ul className="social list-unstyled d-flex gap-3">
                            <li className="nav-item">
                                <a className="nav-link text-muted" href="/"><i className="fa-brands fa-youtube fs-5"></i></a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link text-muted" href="/"><i className="fa-brands fa-whatsapp fs-5"></i></a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link text-muted" href="/"><i className="fa-brands fa-telegram fs-5"></i></a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link text-muted" href="/"><i className="fa-brands fa-github fs-5"></i></a>
                            </li>
                        </ul>
                    </div>
                    <div className="col-6 col-md">
                        <p className="fw-medium text-muted h5 mb-4">Account</p>
                        <a href="" className="text-decoration-none text-muted mb-3 d-block">Open demat account</a>
                        <a href="" className="text-decoration-none text-muted mb-3 d-block">Minor demat account</a>
                        <a href="" className="text-decoration-none text-muted mb-3 d-block">NRI demat account</a>
                        <a href="" className="text-decoration-none text-muted mb-3 d-block">Commodity</a>
                        <a href="" className="text-decoration-none text-muted mb-3 d-block">Dematerialisation</a>
                        <a href="" className="text-decoration-none text-muted mb-3 d-block">Fund transfer</a>
                        <a href="" className="text-decoration-none text-muted mb-3 d-block">MTF</a>
                        <a href="" className="text-decoration-none text-muted mb-3 d-block">Referral program</a>
                    </div>
                    <div className="col-6 col-md">
                        <p className="fw-medium text-muted h5 mb-4">Support</p>
                        <a href="" className="text-decoration-none text-muted mb-3 d-block">Contact us</a>
                        <a href="" className="text-decoration-none text-muted mb-3 d-block">Support portal</a>
                        <a href="" className="text-decoration-none text-muted mb-3 d-block">How to file a complaint?</a>
                        <a href="" className="text-decoration-none text-muted mb-3 d-block">Status of your complaints</a>
                        <a href="" className="text-decoration-none text-muted mb-3 d-block">Bulletin</a>
                        <a href="" className="text-decoration-none text-muted mb-3 d-block">Circular</a>
                        <a href="" className="text-decoration-none text-muted mb-3 d-block">Z-Connect blog</a>
                        <a href="" className="text-decoration-none text-muted mb-3 d-block">Downloads</a>
                    </div>
                    <div className="col-6 col-md">
                        <p className="fw-medium text-muted h5 mb-4">Company</p>
                        <a href="" className="text-decoration-none text-muted mb-3 d-block">About</a>
                        <a href="" className="text-decoration-none text-muted mb-3 d-block">Philosophy</a>
                        <a href="" className="text-decoration-none text-muted mb-3 d-block">Press & media</a>
                        <a href="" className="text-decoration-none text-muted mb-3 d-block">Careers</a>
                        <a href="" className="text-decoration-none text-muted mb-3 d-block">Zerodha Cares (CSR)</a>
                        <a href="" className="text-decoration-none text-muted mb-3 d-block">Zerodha.tech</a>
                        <a href="" className="text-decoration-none text-muted mb-3 d-block">Open source</a>
                    </div>
                    <div className="col">
                        <p className="fw-medium text-muted h5 mb-4">Quick Links</p>
                        <a href="" className="text-decoration-none text-muted mb-3 d-block">Upcoming IPOs</a>
                        <a href="" className="text-decoration-none text-muted mb-3 d-block">Brokerage charges</a>
                        <a href="" className="text-decoration-none text-muted mb-3 d-block">Market holidays</a>
                        <a href="" className="text-decoration-none text-muted mb-3 d-block">Economic calendar</a>
                        <a href="" className="text-decoration-none text-muted mb-3 d-block">Calculators</a>
                        <a href="" className="text-decoration-none text-muted mb-3 d-block">Market</a>
                        <a href="" className="text-decoration-none text-muted mb-3 d-block">Sectors</a>
                    </div>
                </div>
                <div className="text-muted mt-5" style={{ fontSize: "12px" }}>
                    <p className='text-muted'>Zerodha Broking Ltd.: Member of NSE, BSE​ &​ MCX – SEBI Registration no.: INZ000031633 CDSL/NSDL: Depository services through Zerodha Broking Ltd. – SEBI Registration no.: IN-DP-431-2019. Commodity Trading through Zerodha Commodities Pvt. Ltd. MCX: 46025; NSE-50001 – SEBI Registration no.: INZ000038238 Registered Address: Zerodha Broking Ltd., #153/154, 4th Cross, Dollars Colony, Opp. Clarence Public School, J.P Nagar 4th Phase, Bengaluru - 560078, Karnataka, India. For any complaints pertaining to securities broking please write to complaints@zerodha.com, for DP related to dp@zerodha.com. Please ensure you carefully read the Risk Disclosure Document as prescribed by SEBI | ICF</p>
                    <p className='text-muted'>Procedure to file a complaint on SEBI SCORES: Register on SCORES portal. Mandatory details for filing complaints on SCORES: Name, PAN, Address, Mobile Number, E-mail ID. Benefits: Effective Communication, Speedy redressal of the grievances</p>
                    <p className='text-muted'>Smart Online Dispute Resolution | Grievances Redressal Mechanism</p>
                    <p className='text-muted'>Investments in securities market are subject to market risks; read all the related documents carefully before investing.</p>
                    <p className='text-muted'>Attention investors: 1) Stock brokers can accept securities as margins from clients only by way of pledge in the depository system w.e.f September 01, 2020. 2) Update your e-mail and phone number with your stock broker / depository participant and receive OTP directly from depository on your e-mail and/or mobile number to create pledge. 3) Check your securities / MF / bonds in the consolidated account statement issued by NSDL/CDSL every month.</p>
                    <p className='text-muted'>"Prevent unauthorised transactions in your account. Update your mobile numbers/email IDs with your stock brokers. Receive information of your transactions directly from Exchange on your mobile/email at the end of the day. Issued in the interest of investors. KYC is one time exercise while dealing in securities markets - once KYC is done through a SEBI registered intermediary (broker, DP, Mutual Fund etc.), you need not undergo the same process again when you approach another intermediary." Dear Investor, if you are subscribing to an IPO, there is no need to issue a cheque. Please write the Bank account number and sign the IPO application form to authorize your bank to make payment in case of allotment. In case of non allotment the funds will remain in your bank account. As a business we don't give stock tips, and have not authorized anyone to trade on behalf of others. If you find anyone claiming to be part of Zerodha and offering such services, please create a ticket here.</p>
                </div>
            </div>
        </footer>
    )
}

export default Footer;