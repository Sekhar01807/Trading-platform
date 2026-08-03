
import React from 'react'

function LeftSection({ ImageUrl, ProductName, ProductDescription, trydemo, learnmore, googlePlay, appStore }) {
    return (
        <div className='container p-4 mb-5 mt-5'>
            <div className='row'>
                <div className="col-8 p-5">
                    <img src={ImageUrl} alt="ProductImage" />
                </div>
                <div className="col-4 pt-5 mt-5">
                    <h3 className='mb-3 fw-600 text-muted font-size-6'>{ProductName}</h3>
                    <p className='mb-4 fw-400 text-muted' style={{ lineHeight: "1.8", fontSize: "1.2rem" }}>{ProductDescription}</p>
                    <div className="d-flex align-items-center">
                        <a href={trydemo} className="d-flex align-items-center text-decoration-none text-primary" style={{ lineHeight: "1.8", fontSize: "1.2rem" }}>Try demo<i class="fa-solid fa-angle-right ms-2"></i> </a>
                        <a href={learnmore} className="d-flex align-items-center ms-5 text-decoration-none text-primary" style={{ lineHeight: "1.8", fontSize: "1.2rem" }}>Learn more<i class="fa-solid fa-angle-right ms-2"></i> </a>
                    </div>
                    <div className='mt-5'>
                        <a href={googlePlay} className='me-2'><img src="/Images/googlePlayBadge.svg" alt="Google Play" /></a>
                        <a href={appStore} style={{ marginLeft: "20px" }}><img src="/Images/appstoreBadge.svg" alt="App Store" /></a>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LeftSection;