import React from 'react'

function Hero() {
    return (
        <div className='container p-4 mb-5 mt-5 border-bottom'>
            <div className='row text-center p-4'>
                <h2 className='mt-5 mb-3 fw-600 text-muted'>Zerodha Products</h2>
                <h4 className='mb-4 fw-medium text-muted'>Sleek, modern, and intuitive trading platforms.</h4>
                <p style={{ lineHeight: "1.8", fontSize: "1.2rem" }}>Check out our <a href="" className=' mt-5 text-decoration-none text-primary'>investment offerings <i class="fa-solid fa-angle-right"></i></a></p>
            </div>
        </div>
    )
}

export default Hero;
