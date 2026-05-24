import React, { useState, useEffect } from 'react';
import { UserPlus, Mail, Key, User, Eye, EyeOff, Phone } from 'lucide-react';
import { useScrollToTop } from '../hooks/useScrollToTop';
import SessionExpired from '../components/SessionExpired';
import { useLocation } from 'react-router-dom';

export default function CreateProductManager() {
  useScrollToTop();
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    phoneNumber: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);

  // Check authentication on mount and when location changes
  useEffect(() => {
    console.log('Checking auth on navigation to:', location.pathname);
    
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');
    
    setIsAuthenticated(!!token);
    setIsAdmin(userRole === 'ADMIN');
  }, [location.pathname]); // Re-run when path changes

  // Show loading while checking
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Auth checks
  if (!isAuthenticated) {
    return <SessionExpired role="admin" />;
  }

  if (!isAdmin) {
    return <SessionExpired role="admin" />;
  }

  // Rest of your component logic
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    
    setMessage('');
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid 10-digit phone number';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.password)) {
      newErrors.password = 'Password must include uppercase, lowercase, number and special character';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showTemporaryMessage = (msg, isError = false) => {
    setMessage(msg);
    setTimeout(() => {
      setMessage('');
    }, 4000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      scrollToTop();
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    setMessage('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }
      
      const response = await fetch('http://localhost:8080/admin/create-product-manager', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          phoneNumber: formData.phoneNumber
        })
      });
      
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        if (response.status === 403) {
          throw new Error('Access denied. Admin permissions required.');
        }
        if (response.status === 409) {
          const errorMessage = data.message || '';
          if (errorMessage.toLowerCase().includes('username')) {
            setErrors({ username: errorMessage });
          } else if (errorMessage.toLowerCase().includes('email')) {
            setErrors({ email: errorMessage });
          } else if (errorMessage.toLowerCase().includes('phone')) {
            setErrors({ phoneNumber: errorMessage });
          }
          throw new Error(errorMessage || 'Resource already exists');
        }
        
        throw new Error(data.message || 'Failed to create product manager');
      }
      
      const successMessage = data.message || 'Product Manager created successfully!';
      showTemporaryMessage(successMessage);
      setFormData({ username: '', email: '', password: '', phoneNumber: '' });
      setShowPassword(false);
      scrollToTop();
      
    } catch (error) {
      console.error('Creation error:', error);
      showTemporaryMessage(error.message || 'Failed to create product manager. Please try again.', true);
      setErrors(prev => ({ ...prev, submit: error.message }));
      scrollToTop();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-8 text-center">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-2">Create Product Manager</h2>
            <p className="text-white/90 text-base">
              Add a new product manager to the system
            </p>
          </div>

          <div className="p-8">
            {message && (
              <div className={`mb-4 p-4 rounded-lg text-base animate-fade-in ${
                errors.submit ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Form fields remain the same */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="username" className="block text-base font-medium text-gray-700 mb-2">
                    Username *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.username ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter username"
                    />
                  </div>
                  {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-base font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter email address"
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="phoneNumber" className="block text-base font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter 10-digit phone number"
                    />
                  </div>
                  {errors.phoneNumber && <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>}
                  <p className="mt-1 text-sm text-gray-500">Enter a valid 10-digit phone number (starts with 6-9)</p>
                </div>

                <div>
                  <label htmlFor="password" className="block text-base font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-12 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                  <p className="mt-1 text-sm text-gray-500">
                    Password must be at least 8 characters with uppercase, lowercase, number and special character
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 px-4 rounded-lg font-semibold text-base hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span className="text-base">Creating Product Manager...</span>
                    </div>
                  ) : (
                    <span className="text-base font-semibold">Create Product Manager</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Product managers can approve vendors, approve snacks, and manage product quality.</p>
        </div>
      </div>
    </div>
  );
}