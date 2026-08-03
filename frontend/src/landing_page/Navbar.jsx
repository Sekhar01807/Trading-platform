import React from 'react'
import { Link, NavLink } from 'react-router-dom';

function Navbar() {
    return (
        <nav className="navbar navbar-expand-lg bg-white border-bottom fixed-top">
            <div className="container p-2">
                <Link className="navbar-brand ms-5" to="/">
                    <img src="Images/logo.svg" style={{ width: "25%" }} alt="Logo" />
                </Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul className="navbar-nav ms-auto mb-2 mb-lg-0 me-5">


                        <li className="nav-item">
                            <Link className="nav-link fw-medium ms-5" to="/signup">Signup</Link>
                        </li>
                        <li className="nav-item">
                            <NavLink className={({ isActive }) => `nav-link fw-medium ms-5 ${isActive ? "active" : ""}`} to="/about">About</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className={({ isActive }) => `nav-link fw-medium ms-5 ${isActive ? "active" : ""}`} to="/product">Products</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className={({ isActive }) => `nav-link fw-medium ms-5 ${isActive ? "active" : ""}`} to="/pricing">Pricing</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className={({ isActive }) => `nav-link fw-medium ms-5 ${isActive ? "active" : ""}`} to="/support">Support</NavLink>
                        </li>
                        <li className="nav-item">
                            <div className="nav-link cursor-pointer fw-medium ">
                                <i className="fa-solid fa-bars"></i>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    )
}

export default Navbar;
