import React, { useState, useEffect, useRef } from "react";
import { Menu, X, User, Leaf, LogOut, UserPlus, Plus, Package, Shield, CheckCircle, LayoutDashboard } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export default function NavBar({ onLogout = () => {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  
  const profileDropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Simple auth check without toast
const checkAuthStatus = () => {
  const token = localStorage.getItem("token");
  
  if (!token) {
    setIsAuthenticated(false);
    setUserEmail("");
    setUserRole("");
    setUserName("");
    return;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = payload.exp * 1000 < Date.now();
    
    if (isExpired) {
      localStorage.clear();
      setIsAuthenticated(false);
      setUserEmail("");
      setUserRole("");
      setUserName("");
      return;
    }

    const role = localStorage.getItem("role");
    const email = localStorage.getItem("userEmail") || localStorage.getItem("vendorEmail");

    // Wait 1 second before getting the name
    setTimeout(() => {
      let name = "";
      
      if (role === "VENDOR") {
        name = localStorage.getItem("vendorName") || email?.split("@")[0] || "Vendor";
      } else if (role === "PRODUCT_MANAGER") {
        name = localStorage.getItem("productManagerName") || localStorage.getItem("userName") || email?.split("@")[0] || "Product Manager";
      } else if (role === "ADMIN") {
        name = localStorage.getItem("adminName") || localStorage.getItem("userName") || email?.split("@")[0] || "Admin";
      } else if (role === "USER"){
        name = localStorage.getItem("userName") || email?.split("@")[0] || "User";
      }

      setIsAuthenticated(true);
      setUserEmail(email || "");
      setUserRole(role || "");
      setUserName(name);
    }, 150);

  } catch (error) {
    console.error("Auth check error:", error);
    localStorage.clear();
    setIsAuthenticated(false);
  }
};
  useEffect(() => {
    checkAuthStatus();
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const getNavLinks = () => {
    const baseLinks = [
      { href: "/", label: "Home", icon: <Leaf size={16} className="mr-1" /> },
    ];
    
    if (userRole === "USER") {
      return [
        { href: "/", label: "Home", icon: <Leaf size={16} className="mr-1" /> },
        { href: "/snacks", label: "Snacks", icon: <Package size={16} className="mr-1" /> },
      ];
    }
    
    if (userRole === "VENDOR") {
      return [
        { href: "/vendor-home", label: "Dashboard", icon: <LayoutDashboard size={16} className="mr-1" /> },
        { href: "/add-snack", label: "Add Snack", icon: <Plus size={16} className="mr-1" /> },
        { href: "/inventory", label: "Inventory", icon: <Package size={16} className="mr-1" /> },
      ];
    }

    if (userRole === "PRODUCT_MANAGER") {
      return [
        { href: "/product-manager-dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} className="mr-1" /> },
        { href: "/approve-vendors", label: "Approve Vendors", icon: <CheckCircle size={16} className="mr-1" /> },
        { href: "/approve-snacks", label: "Approve Snacks", icon: <CheckCircle size={16} className="mr-1" /> },
      ];
    }

    if (userRole === "ADMIN") {
      return [
        { href: "/admin-dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} className="mr-1" /> },
        { href: "/approve-vendors", label: "Approve Vendors", icon: <CheckCircle size={16} className="mr-1" /> },
        { href: "/approve-snacks", label: "Approve Snacks", icon: <CheckCircle size={16} className="mr-1" /> },
        { href: "/create-product-manager", label: "Create PM", icon: <UserPlus size={16} className="mr-1" /> }, 
      ];
    }

    return baseLinks;
  };

  const navLinks = getNavLinks();

  const handleLogoutClick = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('vendorEmail');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('vendorId');
    localStorage.removeItem('vendorName');
    localStorage.removeItem('userName');
    localStorage.removeItem('productManagerName');
    
    setIsAuthenticated(false);
    setUserEmail("");
    setUserRole("");
    setUserName("");
    setIsProfileDropdownOpen(false);
    
    window.dispatchEvent(new Event('authChange'));
    if (onLogout) onLogout();
    navigate("/");
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const isActiveRoute = (path) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const getNavbarBg = () => {
    if (userRole === "ADMIN" || userRole === "PRODUCT_MANAGER") {
      return isScrolled 
        ? 'bg-blue-900/95 backdrop-blur-md shadow-2xl' 
        : 'bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-lg';
    }
    return isScrolled 
      ? 'bg-green-900/95 backdrop-blur-md shadow-2xl' 
      : 'bg-gradient-to-r from-green-600 via-green-700 to-green-800 shadow-lg';
  };

  const getRoleBadgeColor = () => {
    switch(userRole) {
      case 'ADMIN': return 'bg-red-500';
      case 'PRODUCT_MANAGER': return 'bg-blue-500';
      case 'VENDOR': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${getNavbarBg()} ${
      isScrolled ? 'h-16' : 'h-20'
    } text-white flex items-center`}>
      <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between w-full">
        {/* Logo */}
        <div className="flex items-center space-x-2 sm:space-x-3 group cursor-pointer" onClick={() => navigate("/")}>
          <img 
            src="/logo-new.png" 
            alt="VeeGo Logo" 
            className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-full transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 shadow-lg bg-white p-1"
          />
          <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
            VeeGo
          </span>
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex space-x-1 text-sm lg:text-base font-medium">
          {navLinks.map((link, index) => (
            <button
              key={index}
              onClick={() => handleNavigation(link.href)}
              className={`flex items-center px-3 lg:px-4 py-2 rounded-lg transition-all duration-300 hover:text-yellow-200 hover:bg-white/10 hover:scale-105 hover:shadow-lg group relative ${
                isActiveRoute(link.href) ? 'bg-white/20 text-yellow-200' : ''
              }`}
            >
              {link.icon}
              <span className="relative z-10">{link.label}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-green-300/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              {isActiveRoute(link.href) && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-yellow-200"></div>
              )}
            </button>
          ))}
        </div>

        {/* Right Section */}
        <div className="hidden md:flex items-center space-x-2">
          {isAuthenticated ? (
            <div className="relative" ref={profileDropdownRef}>
              <button 
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center space-x-2 bg-white/10 p-1.5 sm:p-2 rounded-full hover:bg-white/20 transition-all duration-300"
              >
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r ${getRoleBadgeColor()} to-purple-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm`}>
                  {userName ? userName.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="text-xs sm:text-sm hidden lg:block max-w-[120px] truncate">{userName}</span>
              </button>
              
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-1 text-gray-800 z-50 animate-fade-in">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800 truncate">{userName}</p>
                    <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor()} text-white`}>
                        {userRole || 'User'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogoutClick}
                    className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                  >
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate("/staff-login")}
                className="bg-white text-blue-600 font-medium py-1.5 px-3 sm:py-2 sm:px-4 rounded-full hover:bg-blue-50 transition-all duration-300 hover:shadow-lg flex items-center space-x-1 text-sm sm:text-base"
              >
                <Shield size={16} />
                <span className="hidden sm:inline">Admin Login</span>
                <span className="sm:hidden">Admin</span>
              </button>
              
              <button
                onClick={() => navigate("/auth")}
                className="bg-white text-green-600 font-medium py-1.5 px-3 sm:py-2 sm:px-4 rounded-full hover:bg-green-50 transition-all duration-300 hover:shadow-lg flex items-center space-x-1 text-sm sm:text-base"
              >
                <User size={16} />
                <span className="hidden sm:inline">Login/SignUp</span>
                <span className="sm:hidden">Login</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden focus:outline-none p-2 rounded-lg hover:bg-white/10 transition-all duration-300"
        >
          <div className="relative w-6 h-6">
            <Menu size={24} className={`absolute inset-0 transition-all duration-300 ${isOpen ? 'rotate-180 opacity-0' : 'rotate-0 opacity-100'}`} />
            <X size={24} className={`absolute inset-0 transition-all duration-300 ${isOpen ? 'rotate-0 opacity-100' : 'rotate-180 opacity-0'}`} />
          </div>
        </button>
      </div>

      {/* Mobile Dropdown */}
      <div className={`absolute top-full left-0 w-full ${userRole === 'ADMIN' || userRole === 'PRODUCT_MANAGER' ? 'bg-blue-800/95' : 'bg-green-800/95'} backdrop-blur-md transition-all duration-500 md:hidden ${
        isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
      } overflow-hidden`}>
        <div className="px-4 py-3 space-y-1">
          {navLinks.map((link, index) => (
            <button
              key={index}
              onClick={() => {
                handleNavigation(link.href);
                setIsOpen(false);
              }}
              className={`flex items-center w-full text-left px-4 py-3 rounded-lg transition-all duration-300 transform hover:translate-x-2 ${
                isActiveRoute(link.href) ? 'bg-white/20 text-yellow-200' : 'hover:text-yellow-200 hover:bg-white/10'
              }`}
            >
              {link.icon && <span className="mr-2">{link.icon}</span>}
              <span>{link.label}</span>
            </button>
          ))}
          
          {isAuthenticated ? (
            <div className="pt-4 mt-2 border-t border-white/20">
              <div className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-white/10">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${getRoleBadgeColor()} to-purple-500 flex items-center justify-center text-white font-bold text-sm`}>
                  {userName ? userName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{userName}</p>
                  <p className="text-xs text-white/70 truncate">{userEmail}</p>
                  <p className="text-xs text-yellow-200 mt-0.5">{userRole || 'User'}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  handleLogoutClick();
                  setIsOpen(false);
                }}
                className="flex items-center space-x-3 w-full text-left px-4 py-3 rounded-lg hover:text-yellow-200 hover:bg-white/10 transition-all duration-300 text-red-300"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="pt-4 mt-2 border-t border-white/20 space-y-2">
              <button
                onClick={() => {
                  navigate("/auth");
                  setIsOpen(false);
                }}
                className="flex items-center justify-center space-x-2 w-full px-4 py-3 rounded-lg bg-white text-green-600 font-medium hover:bg-green-50 transition-all duration-300"
              >
                <User size={18} />
                <span>Login/SignUp</span>
              </button>
              <button
                onClick={() => {
                  navigate("/staff-login");
                  setIsOpen(false);
                }}
                className="flex items-center justify-center space-x-2 w-full px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all duration-300"
              >
                <Shield size={18} />
                <span>Admin Login</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </nav>
  );
}