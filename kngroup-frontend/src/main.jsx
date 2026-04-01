import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import AdminDashboard from './AdminDashboard'
import './index.css'
import Login from './Login'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
  <BrowserRouter>
  <Routes>
  <Route path="/" element={<App />} />
  <Route path="/admin" element={<AdminDashboard />} />
  <Route path="/login" element={<Login />} /> {/* Add this line */}
  </Routes>
  </BrowserRouter>
  </React.StrictMode>
)
