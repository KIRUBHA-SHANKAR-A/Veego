import React, { useState } from 'react';
import { Eye, EyeOff, User, Lock, Mail, Phone, Store, UserCheck } from 'lucide-react';
import { useScrollToTop } from '../hooks/useScrollToTop';

const API_BASE_URL = 'http://localhost:8080';

export default function UserAuth() {
  useScrollToTop();
  
  const [activeTab, setActiveTab] = useState('login');
  const [userType, setUserType] = useState('user');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [signupData, setSignupData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: ''
  });

  const [vendorSignupData, setVendorSignupData] = useState({
    businessName: '',
    businessDescription: ''
  });

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Set auth token in localStorage
  // In UserAuth.js - Update the setAuthToken function:

const setAuthToken = (token, role, id, name = '', email = '') => {
  localStorage.setItem('token', token);
  localStorage.setItem('role', role);
  
  if (role === 'USER') {
    localStorage.setItem('userId', id);
    localStorage.setItem('userName', name);
    localStorage.setItem('userEmail', email);
  } else if (role === 'VENDOR') {
    localStorage.setItem('vendorId', id);
    localStorage.setItem('vendorName', name);
    localStorage.setItem('vendorEmail', email);
    // ALSO SET userName for navbar to pick up
    localStorage.setItem('userName', name);
    localStorage.setItem('userEmail', email);
  }
  
  // Dispatch events
  window.dispatchEvent(new Event('authChange'));
  window.dispatchEvent(new Event('storage'));
};

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    
    if (name in vendorSignupData) {
      setVendorSignupData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setSignupData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateLogin = () => {
    const newErrors = {};
    
    if (!loginData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(loginData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!loginData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      scrollToTop();
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const validateSignup = () => {
    const newErrors = {};
    
    if (!signupData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (signupData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!signupData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(signupData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!signupData.password) {
      newErrors.password = 'Password is required';
    } else if (signupData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(signupData.password)) {
      newErrors.password = 'Password must include uppercase, lowercase, number and special character';
    }
    
    if (!signupData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (signupData.password !== signupData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!signupData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(signupData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    // Validate business name for vendors
    if (userType === 'vendor' && !vendorSignupData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      scrollToTop();
    }
    
    return Object.keys(newErrors).length === 0;
  };

  // Add this helper function at the top of UserAuth.js component
const fetchUserById = async (userId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (err) {
    console.error('Error fetching user:', err);
    return null;
  }
};

// Then update your handleLogin function:
const handleLogin = async () => {
  if (!validateLogin()) return;
  
  setIsLoading(true);
  setErrors({});
  setSuccessMessage('');
  
  try {
    const endpoint = userType === 'vendor' 
      ? `${API_BASE_URL}/auth/vendor/login`
      : `${API_BASE_URL}/auth/user/login`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: loginData.email,
        password: loginData.password
      })
    });
    
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }
    
    if (!response.ok) {
      setErrors({ general: 'Invalid email or password. Please try again.' });
      scrollToTop();
      setIsLoading(false);
      return;
    }
    
    if (userType === 'user') {
      if (!data || data.role !== 'USER') {
        setErrors({ general: 'Invalid email or password. Please try again.' });
        scrollToTop();
        setIsLoading(false);
        return;
      }
      
      const token = data.token;
      const userId = data.userId;
      
      // Fetch user details to get the actual name
      const userDetails = await fetchUserById(userId, token);
      
      let name = loginData.email.split('@')[0]; // fallback
      if (userDetails) {
        name = userDetails.name || userDetails.username || name;
      }
      
      setAuthToken(token, 'USER', userId, name, loginData.email);
      setSuccessMessage('Login successful! Redirecting...');
      scrollToTop();
      
      setLoginData({ email: '', password: '' });
      
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
      
    } else if (userType === 'vendor') {
      if (!data || data.role !== 'VENDOR') {
        setErrors({ general: 'Invalid email or password. Please try again.' });
        scrollToTop();
        setIsLoading(false);
        return;
      }
      
      const token = data.token;
      const vendorId = data.vendorId;
      
      // Fetch vendor details to get the business name
      const vendorDetails = await fetchUserById(vendorId, token);
      
      let businessName = 'Vendor'; // fallback
      if (vendorDetails) {
        businessName = vendorDetails.businessName || vendorDetails.name || vendorDetails.username || businessName;
      }
      
      setAuthToken(token, 'VENDOR', vendorId, businessName, loginData.email);
      setSuccessMessage('Login successful! Redirecting...');
      scrollToTop();
      
      setLoginData({ email: '', password: '' });
      
      setTimeout(() => {
        window.location.href = '/vendor-home';
      }, 1000);
    }
    
  } catch (error) {
    console.error('Login error:', error);
    setErrors({ general: 'Invalid email or password. Please try again.' });
    scrollToTop();
  } finally {
    setIsLoading(false);
  }
};
  // const handleLogin = async () => {
  //   if (!validateLogin()) return;
    
  //   setIsLoading(true);
  //   setErrors({});
  //   setSuccessMessage('');
    
  //   try {
  //     // Choose the correct endpoint based on userType
  //     const endpoint = userType === 'vendor' 
  //       ? `${API_BASE_URL}/auth/vendor/login`
  //       : `${API_BASE_URL}/auth/user/login`;
      
  //     const response = await fetch(endpoint, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         email: loginData.email,
  //         password: loginData.password
  //       })
  //     });
      
  //     const text = await response.text();
  //     let data;
  //     try {
  //       data = text ? JSON.parse(text) : {};
  //     } catch {
  //       data = { message: text };
  //     }
      
  //     // If response is not ok, show error
  //     if (!response.ok) {
  //       setErrors({ general: 'Invalid email or password. Please try again.' });
  //       scrollToTop();
  //       setIsLoading(false);
  //       return;
  //     }
      
  //     // Check role based on login type
  //     if (userType === 'user') {
  //       // Only allow USER role through user endpoint
  //       if (!data || data.role !== 'USER') {
  //         setErrors({ general: 'Invalid email or password. Please try again.' });
  //         scrollToTop();
  //         setIsLoading(false);
  //         return;
  //       }
  //       console.log('Login successful for USER:', data);
  //       const token = data.token;
  //       const name = signupData.username || data.username || data.name ||"Users";
        
  //       setAuthToken(token, 'USER', data.userId, name, loginData.email);
  //       setSuccessMessage('Login successful! Redirecting...');
  //       scrollToTop();
        
  //       setLoginData({ email: '', password: '' });
        
  //       setTimeout(() => {
  //         window.location.href = '/';
  //       }, 1000);
        
  //     } else if (userType === 'vendor') {
  //       // Only allow VENDOR role through vendor endpoint
  //       if (!data || data.role !== 'VENDOR') {
  //         setErrors({ general: 'Invalid email or password. Please try again.' });
  //         scrollToTop();
  //         setIsLoading(false);
  //         return;
  //       }
        
  //       const token = data.token;
  //       const businessName = data.businessName || vendorSignupData.businessName || 'Vendor';
        
  //       setAuthToken(token, 'VENDOR', data.vendorId, businessName, loginData.email);
  //       setSuccessMessage('Login successful! Redirecting...');
  //       scrollToTop();
        
  //       setLoginData({ email: '', password: '' });
        
  //       setTimeout(() => {
  //         window.location.href = '/vendor-home';
  //       }, 1000);
  //     }
      
  //   } catch (error) {
  //     console.error('Login error:', error);
  //     setErrors({ general: 'Invalid email or password. Please try again.' });
  //     scrollToTop();
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleSignup = async () => {
    if (!validateSignup()) return;
    
    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');
    
    try {
      let endpoint, body;
      
      if (userType === 'vendor') {
        endpoint = `${API_BASE_URL}/auth/vendor/register`;
        body = {
          userRegisterRequest: {
            username: signupData.username,
            email: signupData.email,
            password: signupData.password,
            phoneNumber: signupData.phoneNumber
          },
          businessName: vendorSignupData.businessName,
          businessDescription: vendorSignupData.businessDescription
        };
      } else {
        endpoint = `${API_BASE_URL}/auth/user/register`;
        body = {
          username: signupData.username,
          email: signupData.email,
          password: signupData.password,
          phoneNumber: signupData.phoneNumber
        };
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });
      
      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: text };
      }
      
      if (!response.ok) {
        throw new Error(data.message || data || 'Registration failed');
      }
      
      const successMsg = data.message || data || `${userType === 'vendor' ? 'Vendor' : 'User'} registration successful!`;
      setSuccessMessage(successMsg);
      scrollToTop();
      
      setSignupData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: ''
      });
      
      if (userType === 'vendor') {
        setVendorSignupData({
          businessName: '',
          businessDescription: ''
        });
      }
      
      setTimeout(() => setActiveTab('login'), 2000);
      
    } catch (error) {
      console.error('Signup error:', error);
      setErrors({ general: error.message || 'Registration failed. Please try again.' });
      scrollToTop();
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setLoginData({ email: '', password: '' });
    setSignupData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: ''
    });
    setVendorSignupData({
      businessName: '',
      businessDescription: ''
    });
    setErrors({});
    setSuccessMessage('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    resetForm();
    scrollToTop();
  };

  const switchUserType = (type) => {
    setUserType(type);
    resetForm();
    scrollToTop();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4 py-20">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* User Type Toggle */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-1">
            <div className="flex rounded-xl bg-white/10 p-1">
              <button
                onClick={() => switchUserType('user')}
                className={`flex-1 flex items-center justify-center py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  userType === 'user'
                    ? 'bg-white text-green-600 shadow-md'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                <UserCheck className="w-4 h-4 mr-2" />
                User
              </button>
              <button
                onClick={() => switchUserType('vendor')}
                className={`flex-1 flex items-center justify-center py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  userType === 'vendor'
                    ? 'bg-white text-green-600 shadow-md'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                <Store className="w-4 h-4 mr-2" />
                Vendor
              </button>
            </div>
          </div>

          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                {userType === 'vendor' ? (
                  <Store className="w-8 h-8 text-white" />
                ) : (
                  <User className="w-8 h-8 text-white" />
                )}
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                {activeTab === 'login' ? 'Welcome Back' : 'Join Us'}
              </h2>
              <p className="text-gray-600">
                {activeTab === 'login' 
                  ? `Sign in to your ${userType} account`
                  : `Create your ${userType} account`
                }
              </p>
            </div>

            {/* Success and Error Messages */}
            {successMessage && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
                {successMessage}
              </div>
            )}
            {errors.general && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                {errors.general}
              </div>
            )}

            {/* Tab Navigation */}
            <div className="flex mb-8 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => switchTab('login')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'login'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => switchTab('signup')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'signup'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Login Form */}
            {activeTab === 'login' && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="login-email"
                      name="email"
                      value={loginData.email}
                      onChange={handleLoginChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your email"
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="login-password"
                      name="password"
                      value={loginData.password}
                      onChange={handleLoginChange}
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>

                <button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    `Sign In as ${userType.charAt(0).toUpperCase() + userType.slice(1)}`
                  )}
                </button>
              </div>
            )}

            {/* Signup Form */}
            {activeTab === 'signup' && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="signup-username" className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="signup-username"
                      name="username"
                      value={signupData.username}
                      onChange={handleSignupChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.username ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Choose a username"
                    />
                  </div>
                  {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
                </div>

                <div>
                  <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="signup-email"
                      name="email"
                      value={signupData.email}
                      onChange={handleSignupChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your email address"
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="signup-phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      id="signup-phone"
                      name="phoneNumber"
                      value={signupData.phoneNumber}
                      onChange={handleSignupChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  {errors.phoneNumber && <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>}
                </div>

                <div>
                  <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="signup-password"
                      name="password"
                      value={signupData.password}
                      onChange={handleSignupChange}
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>

                <div>
                  <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="signup-confirm-password"
                      name="confirmPassword"
                      value={signupData.confirmPassword}
                      onChange={handleSignupChange}
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>

                {/* Vendor-specific fields */}
                {userType === 'vendor' && (
                  <>
                    <div>
                      <label htmlFor="business-name" className="block text-sm font-medium text-gray-700 mb-2">
                        Business Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Store className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          id="business-name"
                          name="businessName"
                          value={vendorSignupData.businessName}
                          onChange={handleSignupChange}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                            errors.businessName ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter your business name"
                        />
                      </div>
                      {errors.businessName && <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>}
                    </div>
                    
                    <div>
                      <label htmlFor="business-description" className="block text-sm font-medium text-gray-700 mb-2">
                        Business Description (Optional)
                      </label>
                      <textarea
                        id="business-description"
                        name="businessDescription"
                        value={vendorSignupData.businessDescription}
                        onChange={handleSignupChange}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Tell us about your business"
                      />
                    </div>
                  </>
                )}

                <button
                  onClick={handleSignup}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating Account...
                    </div>
                  ) : (
                    `Create ${userType.charAt(0).toUpperCase() + userType.slice(1)} Account`
                  )}
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                {activeTab === 'login' ? (
                  <>
                    Don't have an account?{' '}
                    <button onClick={() => switchTab('signup')} className="text-green-600 hover:text-green-500 font-medium">
                      Sign up here
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button onClick={() => switchTab('login')} className="text-green-600 hover:text-green-500 font-medium">
                      Sign in here
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}