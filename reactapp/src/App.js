import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import UserAuth from "./pages/UserAuth";
import DisplayVeganSnacks from "./pages/DisplayVeganSnacks";
import AddVeganSnack from "./pages/AddVeganSnack";
import Inventory from "./pages/Inventory";
import ApproveVendors from "./pages/ApproveVendors";
import ApproveSnacks from "./pages/ApproveSnacks";
import AdminDashboard from "./pages/AdminDashboard";
import CreateProductManager from "./pages/CreateProductManager";
import StaffLogin from "./pages/StaffLogin";
import VendorHomePage from "./pages/VendorHomePage";
import ProductManagerDashboard from "./pages/ProductManagerDashboard";

function App() {
  const [authUpdateTrigger, setAuthUpdateTrigger] = useState(0);

  const handleAuthChange = () => {
    setAuthUpdateTrigger(prev => prev + 1);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('vendorId');
    handleAuthChange();
  };

  // Protected Route Component
  const ProtectedRoute = ({ children, requiredRoles = [] }) => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token) {
      return <Navigate to="/" replace />;
    }
    
    if (requiredRoles.length > 0 && !requiredRoles.includes(role)) {
      return <Navigate to="/" replace />;
    }
    
    return children;
  };

  return (
    <Router>
      <div className="App flex flex-col min-h-screen">
     
        <NavBar onLogout={handleLogout} authUpdateTrigger={authUpdateTrigger} />
        <main className="flex-grow pt-16">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<UserAuth onAuthChange={handleAuthChange} />} />
            
            {/* User Routes */}
            <Route 
              path="/snacks" 
              element={
                <ProtectedRoute>
                   <DisplayVeganSnacks />
                </ProtectedRoute>
              } 
            />
            
            {/* Vendor Routes */}
            <Route 
              path="/add-snack" 
              element={
                <ProtectedRoute requiredRoles={['VENDOR']}>
                  <AddVeganSnack />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/vendor-home" 
              element={
                <ProtectedRoute requiredRoles={['VENDOR']}>
                  <VendorHomePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/inventory" 
              element={
                <ProtectedRoute requiredRoles={['VENDOR']}>
                  <Inventory />
                </ProtectedRoute>
              } 
            />
            <Route path="/staff-login" element={<StaffLogin />} />
            <Route path="/create-product-manager" element={<CreateProductManager />} />
            {/* Product Manager & Admin Routes */}
            <Route 
              path="/approve-vendors" 
              element={
                <ProtectedRoute requiredRoles={['PRODUCT_MANAGER', 'ADMIN']}>
                  <ApproveVendors />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/approve-snacks" 
              element={
                <ProtectedRoute requiredRoles={['PRODUCT_MANAGER', 'ADMIN']}>
                  <ApproveSnacks />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Only Routes */}
            <Route 
              path="/admin-dashboard" 
              element={
                <ProtectedRoute requiredRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/product-manager-dashboard" 
              element={
                <ProtectedRoute requiredRoles={['PRODUCT_MANAGER']}>
                  <ProductManagerDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;