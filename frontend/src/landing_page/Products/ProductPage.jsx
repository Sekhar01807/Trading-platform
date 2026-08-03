import React from 'react'
import Hero from './Hero'
import LeftSection from './LeftSection'
import RightSection from './RightSection'
import Universe from './Universe'
import OpenAccount from '../OpenAccount'

function ProductPage() {
    return (
        <div style={{ marginTop: "70px" }}>
            <Hero />
            <LeftSection
                ImageUrl="/Images/kite.png"
                ProductName="Kite"
                ProductDescription="Our ultra-fast flagship trading platform with streaming market data, advanced charts, an elegant UI, and more. Enjoy the Kite experience seamlessly on your Android and iOS devices."
                trydemo=""
                learnmore=""
                googlePlay=""
                appStore=""
            />
            <RightSection
                ImageUrl="/Images/console.png"
                ProductName="Console "
                ProductDescription="The central dashboard for your Zerodha account. Gain insights into your trades and investments with in-depth reports and visualisations."
                trydemo=""
                learnmore=""
            />
            <LeftSection
                ImageUrl="/Images/coin.png"
                ProductName="Coin"
                ProductDescription="Buy direct mutual funds online, commission-free, delivered directly to your Demat account. Enjoy the investment experience on your Android and iOS devices."
                trydemo=""
                learnmore=""
                googlePlay=""
                appStore=""
            />
            <RightSection
                ImageUrl="/Images/kiteconnect.png"
                ProductName="Kite Connect API"
                ProductDescription="Build powerful trading platforms and experiences with our super simple HTTP/JSON APIs. If you are a startup, build your investment app and showcase it to our clientbase"
                trydemo=""
                learnmore="" />
                
            <LeftSection
                ImageUrl="/Images/varsity.png"
                ProductName="Varsity mobile"
                ProductDescription="An easy to grasp, collection of stock market lessons with in-depth coverage and illustrations. Content is broken down into bite-size cards to help you learn on the go."
                trydemo=""
                learnmore=""
                googlePlay=""
                appStore=""
            />
            <Universe />
        </div>
    )
}

export default ProductPage;