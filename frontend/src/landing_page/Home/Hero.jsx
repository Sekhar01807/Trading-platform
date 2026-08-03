import React from 'react'

function Hero() {
    return (
        <div className='container p-5 mb-5'>
            <div className='row text-center'>
                <img src="/Images/homeHero.png" alt="HeroImage" />
                <h1 className='mt-5'>Start trading today</h1>
                <p >Online platform to invest in stocks, derivatives, mutual funds, ETFs, bonds, and more.</p>
                <button className='btn btn-primary mb-5' style={{ width: '20%', margin: '0 auto' }}>Signup</button>
            </div>

        </div>
    )
}

export default Hero;