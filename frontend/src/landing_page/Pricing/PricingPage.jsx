import React from 'react'
import Hero from './Hero'
import Brokerage from './Brokerage'

import OpenAccount from '../OpenAccount'

function PricingPage() {
    return (
        <div style={{ marginTop: "70px" }}>
            <Hero />
            <Brokerage />
            <OpenAccount />
        </div>
    )
}

export default PricingPage;