import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'

import HomePage from './landing_page/Home/HomePage'
import PickupModel from './landing_page/signUp/SignUp'
import AboutPage from './landing_page/About/AboutPage'
import ProductPage from './landing_page/Products/ProductPage'
import PricingPage from './landing_page/Pricing/PricingPage'
import SupportPage from './landing_page/Support/SupportPage'
import Login from './landing_page/login/Login'

import Navbar from './landing_page/Navbar'
import Footer from './landing_page/Footer'
import NotFound from './landing_page/NotFound'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<> <Navbar /> <HomePage /> <Footer /> </>} />
      <Route path="/signup" element={<> <Navbar /> <PickupModel /> <Footer /> </>} />
      <Route path="/about" element={<> <Navbar /> <AboutPage /> <Footer /> </>} />
      <Route path="/product" element={<> <Navbar /> <ProductPage /> <Footer /> </>} />
      <Route path="/pricing" element={<> <Navbar /> <PricingPage /> <Footer /> </>} />
      <Route path="/support" element={<> <Navbar /> <SupportPage /> <Footer /> </>} />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
)
