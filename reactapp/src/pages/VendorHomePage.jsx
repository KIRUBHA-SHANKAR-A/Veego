import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, Plus, Star, Clock, CheckCircle, XCircle, 
  AlertCircle, TrendingUp, 
  User, Award, BarChart3, AlertTriangle, ArrowUpRight, Zap, Target,
} from 'lucide-react';
import { useScrollToTop } from '../hooks/useScrollToTop';
import api, { isVendor, isAuthenticated, getUserId } from '../utils/api';
import SessionExpired from '../components/SessionExpired';
const VendorHomePage = () => {
  useScrollToTop();
  const navigate = useNavigate();
  
  const [vendorName, setVendorName] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // Stats state
  const [stats, setStats] = useState({
    totalProducts: 0,
    approvedProducts: 0,
    pendingProducts: 0,
    rejectedProducts: 0,
    totalReviews: 0,
    averageRating: 0,
    totalSales: 0
  });
  
  // Priority items
  const [pendingProductsList, setPendingProductsList] = useState([]);
  const [rejectedProductsList, setRejectedProductsList] = useState([]);
  
  // Chart data
  const [chartData, setChartData] = useState({
    monthlyProducts: [],
    categoryDistribution: {},
    ratingDistribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 }
  });

  // All reviews state
  const [allReviews, setAllReviews] = useState([]);

  useEffect(() => {
    if (isAuthenticated() && isVendor()) {
      fetchVendorName();
      fetchDashboardData();
      fetchAllReviews();
    }
  }, []);

  const fetchVendorName = async () => {
    try {
      const vendorId = getUserId();
      if (!vendorId) return;
      
      const response = await api.vendors.getVendorNameById(vendorId);
      
      let name = '';
      if (typeof response === 'string') {
        name = response;
      } else if (response && typeof response === 'object') {
        name = response.message || response.name || response.username || 'Vendor';
      } else {
        name = 'Vendor';
      }
      
      setVendorName(name);
      localStorage.setItem('vendorName', name);
      
      const email = localStorage.getItem('vendorEmail') || '';
      setVendorEmail(email);
      
    } catch (err) {
      console.error('Error fetching vendor name:', err);
      const savedName = localStorage.getItem('vendorName') || 'Vendor';
      const savedEmail = localStorage.getItem('vendorEmail') || '';
      setVendorName(savedName);
      setVendorEmail(savedEmail);
    }
  };

  // Fetch all reviews from the reviews endpoint
  const fetchAllReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const vendorId = getUserId();
      const response = await fetch(`http://localhost:8080/reviews/vendor/${vendorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const reviews = await response.json();
        setAllReviews(reviews);
        return reviews;
      }
    } catch (err) {
      console.error('Error fetching all reviews:', err);
    }
    return [];
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const vendorId = getUserId();
      if (!vendorId) throw new Error('Vendor not found');
      
      const response = await api.snacks.getSnacksByVendor(vendorId);
      const snacksList = Array.isArray(response) ? response : [];
      
      // Calculate stats
      const approved = snacksList.filter(s => s.status === 'APPROVED').length;
      const pending = snacksList.filter(s => s.status === 'PENDING_APPROVAL').length;
      const rejected = snacksList.filter(s => s.status === 'REJECTED').length;
      
      // Get pending and rejected products for priority list
      const pendingProducts = snacksList
        .filter(s => s.status === 'PENDING_APPROVAL')
        .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
        .slice(0, 3);
      
      const rejectedProducts = snacksList
        .filter(s => s.status === 'REJECTED')
        .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
        .slice(0, 3);
      
      setPendingProductsList(pendingProducts);
      setRejectedProductsList(rejectedProducts);
      
      // Fetch all reviews for accurate stats
      let reviews = allReviews;
      if (reviews.length === 0) {
        reviews = await fetchAllReviews();
      }
      
      // Calculate review stats from all reviews
      let totalReviews = 0;
      let totalRating = 0;
      const ratingCounts = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
      
      // Process all reviews
      reviews.forEach(review => {
        if (review.rating) {
          totalReviews++;
          totalRating += review.rating;
          const ratingKey = Math.floor(review.rating).toString();
          if (ratingCounts[ratingKey]) {
            ratingCounts[ratingKey]++;
          }
        }
      });
      
      // Calculate average rating (rounded to 1 decimal)
      const averageRating = totalReviews > 0 ? (totalRating / totalReviews).toFixed(1) : 0;
      
      // Category distribution
      const categoryDist = {};
      snacksList.forEach(snack => {
        if (snack.category) {
          categoryDist[snack.category] = (categoryDist[snack.category] || 0) + 1;
        }
      });
      
      // Monthly products (last 6 months)
      const monthlyData = [];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentDate = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentDate.getMonth() - i + 12) % 12;
        monthlyData.push({ month: months[monthIndex], count: 0 });
      }
      
      snacksList.forEach(snack => {
        if (snack.createdDate) {
          const createdDate = new Date(snack.createdDate);
          const monthDiff = (currentDate.getMonth() - createdDate.getMonth() + 12) % 12;
          if (monthDiff < 6) {
            monthlyData[5 - monthDiff].count++;
          }
        }
      });
      
      setStats({
        totalProducts: snacksList.length,
        approvedProducts: approved,
        pendingProducts: pending,
        rejectedProducts: rejected,
        totalReviews: totalReviews,
        averageRating: parseFloat(averageRating),
        totalSales: approved * 50 + Math.floor(Math.random() * 500)
      });
      
      setChartData({
        monthlyProducts: monthlyData,
        categoryDistribution: categoryDist,
        ratingDistribution: ratingCounts
      });
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Simple Bar Chart Component
  const BarChart = ({ data, title, color = 'from-green-500 to-emerald-500' }) => {
    const maxCount = Math.max(...data.map(d => d.count), 1);
    return (
      <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
        <div className="flex items-end justify-around h-48">
          {data.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center group">
              <div className="relative">
                <div 
                  className={`w-10 bg-gradient-to-t ${color} rounded-t-lg transition-all duration-500 group-hover:opacity-80`}
                  style={{ height: `${(item.count / maxCount) * 100}px` }}
                >
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {item.count} products
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-600 mt-2 font-medium">{item.month}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Donut Chart Component
  const DonutChart = ({ data, title, colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'] }) => {
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    if (total === 0) {
      return (
        <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
          <div className="flex items-center justify-center h-48 text-gray-400">
            No data available
          </div>
        </div>
      );
    }
    
    let currentAngle = 0;
    const radius = 70;
    const center = 100;
    
    return (
      <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
        <div className="relative flex justify-center">
          <svg width="200" height="200" viewBox="0 0 200 200">
            {Object.entries(data).map(([key, value], idx) => {
              const percentage = (value / total) * 100;
              const angle = (percentage / 100) * 360;
              const startAngle = currentAngle;
              const endAngle = currentAngle + angle;
              currentAngle = endAngle;
              
              const startRad = (startAngle - 90) * Math.PI / 180;
              const endRad = (endAngle - 90) * Math.PI / 180;
              
              const x1 = center + radius * Math.cos(startRad);
              const y1 = center + radius * Math.sin(startRad);
              const x2 = center + radius * Math.cos(endRad);
              const y2 = center + radius * Math.sin(endRad);
              
              const largeArc = angle > 180 ? 1 : 0;
              
              return (
                <path
                  key={idx}
                  d={`M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={colors[idx % colors.length]}
                  className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                />
              );
            })}
            <circle cx={center} cy={center} r="40" fill="white" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {Object.entries(data).map(([key, value], idx) => (
            <div key={idx} className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: colors[idx % colors.length] }}></div>
              <span className="text-xs text-gray-600">{key}: {value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Star Rating Component
  const StarRating = ({ rating }) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const totalPending = stats.pendingProducts;
  const approvalRate = stats.totalProducts > 0 
    ? ((stats.approvedProducts / stats.totalProducts) * 100).toFixed(1)
    : 0;

  // if (!isAuthenticated() || !isVendor()) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4 pt-24">
  //       <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md">
  //         <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
  //           <X className="w-8 h-8 text-red-600" />
  //         </div>
  //         <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
  //         <p className="text-gray-600 mb-6">Please login as a vendor to access this page.</p>
  //         <button onClick={() => navigate('/auth')} className="bg-green-500 text-white px-6 py-2 rounded-lg">
  //           Go to Login
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  const userRole = localStorage.getItem('role');

  if (!isAuthenticated || userRole !== 'VENDOR') {
    return <SessionExpired role="vendor" />;
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 pt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                <User className="h-8 w-8 text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                  Welcome back, {vendorName}!
                </h1>
                <p className="text-gray-600 mt-1">{vendorEmail}</p>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-2">
              <div className="bg-green-100 rounded-full px-3 py-1">
                <span className="text-sm text-green-700">Vendor Account</span>
              </div>
              {/* <button
                onClick={() => navigate('/add-snack')}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </button> */}
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-6 p-4 bg-green-100 border border-green-200 text-green-700 rounded-lg flex items-center animate-fade-in">
            <CheckCircle className="h-5 w-5 mr-2" /> {message}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg flex items-center animate-fade-in">
            <AlertCircle className="h-5 w-5 mr-2" /> {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Products</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalProducts}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Approved Products</p>
                <p className="text-3xl font-bold text-blue-600">{stats.approvedProducts}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pending Approval</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendingProducts}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Avg Customer Rating</p>
                <div className="flex items-center">
                  <p className="text-3xl font-bold text-purple-600">{stats.averageRating}</p>
                  <Star className="h-5 w-5 text-yellow-400 fill-current ml-1" />
                </div>
                <p className="text-xs text-gray-400 mt-1">from {stats.totalReviews} reviews</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <BarChart 
            data={chartData.monthlyProducts} 
            title="Products Added (Last 6 Months)"
            color="from-green-500 to-emerald-500"
          />
          <DonutChart 
            data={chartData.categoryDistribution} 
            title="Products by Category"
            colors={['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']}
          />
        </div>

        {/* Priority Action Items & Performance Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Priority Action Items */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Priority Action Items
              </h3>
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                {totalPending + stats.rejectedProducts} Items
              </span>
            </div>
            
            {/* Pending Products */}
            {pendingProductsList.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-yellow-500" />
                  Pending Approval ({pendingProductsList.length})
                </h4>
                <div className="space-y-2">
                  {pendingProductsList.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 text-sm">{product.snackName}</p>
                        <p className="text-xs text-gray-500">Submitted: {formatDate(product.createdDate)}</p>
                      </div>
                      <button
                        onClick={() => navigate('/inventory')}
                        className="px-3 py-1.5 bg-yellow-500 text-white text-xs rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-1"
                      >
                        View <ArrowUpRight className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rejected Products */}
            {rejectedProductsList.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-red-500" />
                  Needs Attention ({rejectedProductsList.length})
                </h4>
                <div className="space-y-2">
                  {rejectedProductsList.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 text-sm">{product.snackName}</p>
                        <p className="text-xs text-red-600">Rejected - Please resubmit</p>
                      </div>
                      <button
                        onClick={() => navigate('/add-snack')}
                        className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
                      >
                        Resubmit <ArrowUpRight className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingProductsList.length === 0 && rejectedProductsList.length === 0 && (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-gray-500">All caught up! No pending items.</p>
              </div>
            )}

            {(pendingProductsList.length > 0 || rejectedProductsList.length > 0) && (
              <button
                onClick={() => navigate('/inventory')}
                className="mt-4 w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All Products →
              </button>
            )}
          </div>

          {/* Performance Insights */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              Performance Insights
            </h3>
            
            <div className="space-y-4">
              {/* Approval Rate */}
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Product Approval Rate</span>
                  <span className="text-xl font-bold text-green-600">{approvalRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${approvalRate}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {stats.approvedProducts} approved out of {stats.totalProducts} total products
                </p>
              </div>

              {/* Customer Satisfaction - FIXED with accurate data */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Customer Satisfaction</span>
                  <div className="flex items-center">
                    <span className="text-xl font-bold text-purple-600">{stats.averageRating}</span>
                    <Star className="h-4 w-4 text-yellow-400 fill-current ml-1" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(stats.averageRating / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{stats.totalReviews} reviews</span>
                </div>
                {/* Rating Distribution Bars
                {stats.totalReviews > 0 && (
                  <div className="mt-3 space-y-1">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = chartData.ratingDistribution[star.toString()] || 0;
                      const percentage = (count / stats.totalReviews) * 100;
                      return (
                        <div key={star} className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 w-6">{star}★</span>
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-400 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-8">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )} */}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Target className="h-4 w-4 text-blue-500" />
                    <span className="text-xs text-gray-500">Success Rate</span>
                  </div>
                  <p className="text-lg font-bold text-gray-800">{approvalRate}%</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="text-xs text-gray-500">Active Products</span>
                  </div>
                  <p className="text-lg font-bold text-gray-800">{stats.approvedProducts}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate('/add-snack')}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-2xl hover:shadow-xl transition-all duration-200 text-left group"
          >
            <div className="flex items-center justify-between">
              <div>
                <Plus className="h-8 w-8 mb-2 opacity-90" />
                <h3 className="text-xl font-bold">Add New Product</h3>
                <p className="text-white/80 text-sm mt-1">Expand your product line</p>
              </div>
              <div className="text-center bg-white/20 rounded-xl p-3">
                <Plus className="h-6 w-6 opacity-80" />
                <p className="text-xs opacity-80"></p>
              </div>
            </div>
          </button>
          <button
            onClick={() => navigate('/inventory')}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-2xl hover:shadow-xl transition-all duration-200 text-left group"
          >
            <div className="flex items-center justify-between">
              <div>
                <Package className="h-8 w-8 mb-2 opacity-90" />
                <h3 className="text-xl font-bold">Manage Inventory</h3>
                <p className="text-white/80 text-sm mt-1">View and edit your products</p>
              </div>
              <div className="text-center bg-white/20 rounded-xl p-3">
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
                <p className="text-xs opacity-80">Products</p>
              </div>
            </div>
          </button>
        </div>

        {/* Tip Box */}
        <div className="mt-8 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
          <div className="flex items-start">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
              <TrendingUp className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Pro Tip</h4>
              <p className="text-sm text-gray-600">
                Products with high-quality images and detailed descriptions are 3x more likely to get approved quickly. 
                Make sure to include clear nutritional information and step-by-step instructions!
              </p>
            </div>
          </div>
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
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default VendorHomePage;