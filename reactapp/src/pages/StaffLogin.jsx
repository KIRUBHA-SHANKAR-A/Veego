import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, UserCheck, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useScrollToTop } from '../hooks/useScrollToTop';

const StaffLogin = () => {
  useScrollToTop();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    fetch('http://localhost:8080/auth/staff/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })
      .then((response) => {
        if (!response.ok) {
          return response.text().then(text => {
            throw new Error(text || 'Login failed');
          });
        }
        return response.json();
      })
      .then((data) => {
        // Store token and user info
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('userId', data.userId);
        
        // Redirect based on role
        if (data.role === 'ADMIN') {
          navigate('/admin-dashboard');
        } else if (data.role === 'PRODUCT_MANAGER') {
          navigate('/product-manager-dashboard');
        }
      })
      .catch((err) => {
        setError(err.message || 'An error occurred during login');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4 py-20">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Admin Portal
            </h2>
            <p className="text-white/80">
              Sign in to access your admin account
            </p>
          </div>

          <div className="p-8">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {/* <input
                    type="checkbox"
                    id="remember"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  /> */}
                  {/* <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label> */}
                </div>
                {/* <button
                  type="button"
                  className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  Forgot password?
                </button> */}
              </div>

              <button
  type="submit"
  disabled={loading}
  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
>
  {loading ? (
    <div className="flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
      Signing in...
    </div>
  ) : (
    'Sign In to Staff Portal'
  )}
</button>
            </form>

            {/* Role Information */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center justify-center">
                <UserCheck className="w-4 h-4 mr-2 text-indigo-500" />
                Available Managing Roles
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-2 rounded-lg text-xs font-medium text-center">
                  Administrator
                </div>
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-2 rounded-lg text-xs font-medium text-center">
                  Product Manager
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;