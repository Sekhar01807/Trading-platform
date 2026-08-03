import React from 'react'
import Hero from './Hero'
import Team from './Team'
import OpenAccount from '../OpenAccount'

function AboutPage() {
    return (
        <div style={{ paddingTop: "70px" }}>
            <Hero />
            <Team />
            <OpenAccount />
        </div>
    )
}

export default AboutPage;
