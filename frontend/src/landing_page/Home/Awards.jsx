import React from 'react'

function Awards() {
    return (
        <div className='container mt-5 mb-5'>
            <div className='row'>
                <div className='col-6 p-5'>
                    <img src="/Images/largestBroker.svg" alt="Awards" />
                </div>
                <div className='col-6 p-5 mt-3'>
                    <h1>Largest Stock Broker In India</h1>
                    <p className='mb-5'>2+ million Zerodha clinets contibute to over 15% of Indian stock market trading volume
                        ,more than 150000 users trade on Zerodha every day
                    </p>

                    <div className='row mb-3'>
                        <div className='col-6'>
                            <ul>
                                <li>
                                    <p>Future and Options</p>
                                </li>
                                <li>
                                    <p>Commodity derivatives</p>
                                </li>
                                <li>
                                    <p>Currency derivatives</p>
                                </li>
                            </ul>
                        </div>
                        <div className='col-6 '>
                            <ul>
                                <li>
                                    <p>Stocks & IPOs</p>
                                </li>
                                <li>
                                    <p>Direct Mutual Funds</p>
                                </li>
                                <li>
                                    <p>Bonds and Govt.Securities</p>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <img src="/Images/pressLogos.png" alt="PressLogos" style={{ width: '80%' }} />
                </div>
            </div>

        </div>
    )
}

export default Awards;