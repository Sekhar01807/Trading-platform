import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'

import HomePage from './landing_page/Home/HomePage'
import Footer from './landing_page/Footer'
import NotFound from './landing_page/NotFound'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<> <HomePage /> <Footer /> </>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
)
