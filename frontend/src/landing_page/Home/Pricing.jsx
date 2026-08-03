import React from 'react'

function Pricing() {
    return (
        <div className='container mb-5 mt-5'>
            <div className='row mb-5 '>
                <div className='col-4 '>
                    <h1>Unbeatable pricing</h1>
                    <p>We believe that the cost of investing should never be a barrier to financial well-being.</p>
                    <a href="" className='text-decoration-none'>See our pricing <i class="fa-solid fa-angle-right"></i></a>
                </div>
                <div className='col-2 mb-5'></div>
                <div className='col-6 mb-5'>
                    <div className="row text-center">
                        <div className="col p-3 border">
                            <h1 className='mb-3'>₹0</h1>
                            <p>Free equality delivery and direct mutual funds</p>
                        </div>
                        <div className="col p-3 border">
                            <h1 className='mb-3'>₹20</h1>
                            <p> on Intraday and F&O trade</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Pricing;