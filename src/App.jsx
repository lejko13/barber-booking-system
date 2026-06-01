import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from './pages/Home'
import Admin from "./pages/Admin";
import { ToastProvider } from "./context/ToastProvider";
import CancelBooking from "./pages/CancelBooking";
import AdminLogin from "./pages/AdminLogin";

export default function App() {
  return (
      <ToastProvider>

   
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/zrusit/:token" element={<CancelBooking />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin-login" element={<AdminLogin />} />
      </Routes>
    </BrowserRouter>
       </ToastProvider>
  );
}