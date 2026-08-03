import React from 'react'

function RightSection({
    ImageUrl,
    ProductName,
    ProductDescription,
    learnmore,
    padding,

}) {
    return (
        <div className='container p-4 mt-5 mb-5'>
            <div className='row'>
                <div className="col-4 pt-5 mt-5" style={{ padding: padding }}>
                    <h3 className='mb-3 fw-600 text-muted font-size-6'>{ProductName}</h3>
                    <p className='mb-4 fw-400 text-muted' style={{ lineHeight: "1.8", fontSize: "1.2rem" }}>{ProductDescription}</p>
                    <div className="d-flex align-items-center">
                        <a href={learnmore} className="d-flex align-items-center text-decoration-none text-primary" style={{ lineHeight: "1.8", fontSize: "1.2rem" }}>Learn more<i class="fa-solid fa-angle-right ms-2"></i> </a>
                    </div>
                </div>
                <div className="col-6" style={{ paddingLeft: "10%" }}>
                    <img src={ImageUrl} alt="ProductImage" />
                </div>
            </div>
        </div>
    )
}

export default RightSection;