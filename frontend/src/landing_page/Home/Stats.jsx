import React from 'react'

function Stats() {
    return (
        <div className='container mt-5 p-5'>
            <div className='row p-5'>
                <div className='col-6'>
                    <h1 className='mb-5 '>Trusted With confidence</h1>
                    <h2> Coustomer First Always</h2>
                    <p className='mb-5 text-muted'>That's why 1.6+ crore customers trust Zerodha with ~ ₹6 lakh crores of equity investments, making us India’s largest broker; contributing to 15% of daily retail exchange volumes in India.</p>
                    <h2> No spam or gimmicks</h2>
                    <p className='mb-5 text-muted'>No gimmicks, spam, "gamification", or annoying push notifications. High quality apps that you use at your pace, the way you like. Our philosophies.</p>
                    <h2>The Zerodha universe</h2>
                    <p className='mb-5 text-muted'>Not just an app, but a whole ecosystem. Our investments in 30+ fintech startups offer you tailored services specific to your needs.</p>
                    <h2>Do better with money</h2>
                    <p className='mb-5 text-muted'>With initiatives like Nudge and Kill Switch, we don't just facilitate transactions, but actively help you do better with your money.</p>
                </div>
                <div className='col-6 mt-5'>
                    <img src="/Images/ecosystem.png" alt="Ecosystem" style={{ width: '90%' }} />
                    <div className='text-primary mt-5'>
                        <a href="" className='mx-5 mt-5 text-decoration-none'>Explore our Products <i class="fa-solid fa-angle-right"></i></a>
                        <a href="" className='mx-5 mt-5 text-decoration-none'>Try Kite demo  <i class="fa-solid fa-angle-right"></i></a>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Stats;