import React, { useState, useEffect } from 'react';
import { 
  Users, Package, CheckCircle, XCircle, Clock, TrendingUp, 
  Calendar, AlertCircle, Shield, UserCheck, UserPlus,
  Activity, Leaf, Building, ShoppingBag,
  Eye, Zap, Target, Sparkles, RefreshCw, UserCog,
  Award, BarChart3, PieChart, Star, AlertTriangle, Bell, ArrowUpRight
} from 'lucide-react';
import { useScrollToTop } from '../hooks/useScrollToTop';
import { Doughnut } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import SessionExpired from '../components/SessionExpired';
import {
  Chart as ChartJS,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const ProductManagerDashboard = () => {
  useScrollToTop();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    vendors: { PENDING: 0, APPROVED: 0, REJECTED: 0, TOTAL: 0 },
    snacks: { PENDING_APPROVAL: 0, APPROVED: 0, REJECTED: 0, TOTAL: 0 }
  });
  const [pendingVendorsList, setPendingVendorsList] = useState([]);
  const [pendingSnacksList, setPendingSnacksList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserName, setCurrentUserName] = useState('');

  // Get JWT token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Get current user ID from localStorage
  const getCurrentUserId = () => {
    return localStorage.getItem('userId');
  };

  
  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch current user name
// Fetch current user name
const fetchCurrentUserName = async (userId) => {
  try {
    const token = getAuthToken();
    if (!token) return;

    const response = await fetch(`http://localhost:8080/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const userData = await response.json();
      const name = userData.name || userData.username || userData.email || 'Product Manager';
      setCurrentUserName(name);
      // Store in role-specific key instead of generic 'userName'
      localStorage.setItem('productManagerName', name);
      // Also store in userName as fallback for components that expect it
      localStorage.setItem('userName', name);
      return name;
    }
  } catch (err) {
    console.error('Error fetching user name:', err);
  }
  // Try to get from role-specific key first, then fallback to userName
  return localStorage.getItem('productManagerName') || localStorage.getItem('userName') || 'Product Manager';
};

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch('http://localhost:8080/admin/statistics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const stats = await response.json();
        setDashboardData(stats);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    }
  };

  // Fetch pending vendors
  const fetchPendingVendors = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch('http://localhost:8080/admin/vendors', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const vendors = await response.json();
        const pending = vendors.filter(v => v.approvalStatus === 'PENDING').slice(0, 3);
        setPendingVendorsList(pending);
      }
    } catch (err) {
      console.error('Error fetching pending vendors:', err);
    }
  };

  // Fetch pending snacks
  const fetchPendingSnacks = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch('http://localhost:8080/admin/snacks-with-vendor', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const snacks = await response.json();
        const pending = snacks.filter(s => s.status === 'PENDING_APPROVAL').slice(0, 3);
        setPendingSnacksList(pending);
      }
    } catch (err) {
      console.error('Error fetching pending snacks:', err);
    }
  };

  // Check authentication
  const role = localStorage.getItem('role');
  const isProductManager = role === 'PRODUCT_MANAGER';
  const isAuthenticated = !!getAuthToken();

  useEffect(() => {
    if (isAuthenticated && isProductManager) {
      const userId = getCurrentUserId();
      if (userId) {
        fetchCurrentUserName(userId);
      }
      Promise.all([
        fetchDashboardStats(),
        fetchPendingVendors(),
        fetchPendingSnacks()
      ]).finally(() => setLoading(false));
    }
  }, [isAuthenticated, isProductManager]);

  // Handle refresh
  const handleRefresh = async () => {
    setLoading(true);
    scrollToTop();
    await Promise.all([
      fetchDashboardStats(),
      fetchPendingVendors(),
      fetchPendingSnacks()
    ]);
    setLoading(false);
  };

  // Chart data for vendors
  const vendorChartData = {
    labels: ['Pending', 'Approved', 'Rejected'],
    datasets: [
      {
        label: 'Vendors',
        data: [
          dashboardData.vendors.PENDING,
          dashboardData.vendors.APPROVED,
          dashboardData.vendors.REJECTED
        ],
        backgroundColor: ['#F59E0B', '#10B981', '#EF4444'],
        borderColor: ['#D97706', '#059669', '#DC2626'],
        borderWidth: 1,
      },
    ],
  };

  // Chart data for snacks
  const snackChartData = {
    labels: ['Pending', 'Approved', 'Rejected'],
    datasets: [
      {
        label: 'Snacks',
        data: [
          dashboardData.snacks.PENDING_APPROVAL,
          dashboardData.snacks.APPROVED,
          dashboardData.snacks.REJECTED
        ],
        backgroundColor: ['#F59E0B', '#10B981', '#EF4444'],
        borderColor: ['#D97706', '#059669', '#DC2626'],
        borderWidth: 1,
      },
    ],
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            size: 12
          }
        }
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const vendorApprovalRate = dashboardData.vendors.TOTAL > 0 
    ? ((dashboardData.vendors.APPROVED / dashboardData.vendors.TOTAL) * 100).toFixed(1)
    : 0;
  
  const snackApprovalRate = dashboardData.snacks.TOTAL > 0
    ? ((dashboardData.snacks.APPROVED / dashboardData.snacks.TOTAL) * 100).toFixed(1)
    : 0;

  const totalPending = dashboardData.vendors.PENDING + dashboardData.snacks.PENDING_APPROVAL;

  // Authentication checks
  // if (!isAuthenticated) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
  //       <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md">
  //         <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
  //           <XCircle className="w-8 h-8 text-red-600" />
  //         </div>
  //         <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
  //         <p className="text-gray-600 mb-6">Please login as a Product Manager to access the dashboard.</p>
  //         <button 
  //           onClick={() => navigate('/staff-login')}
  //           className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
  //         >
  //           Go to Login
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  const userRole = localStorage.getItem('role');

  if (!isAuthenticated || userRole !== 'PRODUCT_MANAGER') {
    return <SessionExpired role="product-manager" />;
  }
  
  if (!isProductManager) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Product Manager Access Required</h2>
          <p className="text-gray-600">You need product manager privileges to access this dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Loading Dashboard...</h2>
          <p className="text-gray-500 mt-2">Fetching analytics data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <UserCog className="h-8 w-8 text-blue-500" />
            Welcome back, {currentUserName}!
          </h1>
          <p className="text-gray-600 mt-1">Product Manager Dashboard - Review and manage approvals.</p>
          
        </div>


        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-3xl font-bold text-gray-800">{dashboardData.vendors.TOTAL}</span>
            </div>
            <h3 className="text-gray-600 font-medium">Total Vendors</h3>
            <p className="text-sm text-gray-400 mt-1">All registered vendors</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-3xl font-bold text-gray-800">{dashboardData.snacks.TOTAL}</span>
            </div>
            <h3 className="text-gray-600 font-medium">Total Snacks</h3>
            <p className="text-sm text-gray-400 mt-1">All snack submissions</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <span className="text-3xl font-bold text-gray-800">{totalPending}</span>
            </div>
            <h3 className="text-gray-600 font-medium">Pending Approvals</h3>
            <p className="text-sm text-gray-400 mt-1">
              {dashboardData.vendors.PENDING} vendors, {dashboardData.snacks.PENDING_APPROVAL} snacks
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-3xl font-bold text-gray-800">
                {((dashboardData.vendors.APPROVED + dashboardData.snacks.APPROVED) / 
                  (dashboardData.vendors.TOTAL + dashboardData.snacks.TOTAL || 1) * 100).toFixed(1)}%
              </span>
            </div>
            <h3 className="text-gray-600 font-medium">Overall Approval Rate</h3>
            <p className="text-sm text-gray-400 mt-1">Across all submissions</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Vendors Overview
              </h3>
              <div className="text-sm text-gray-500">
                Approval Rate: {vendorApprovalRate}%
              </div>
            </div>
            <div className="h-64">
              <Doughnut data={vendorChartData} options={donutOptions} />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{dashboardData.vendors.PENDING}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{dashboardData.vendors.APPROVED}</p>
                <p className="text-xs text-gray-500">Approved</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{dashboardData.vendors.REJECTED}</p>
                <p className="text-xs text-gray-500">Rejected</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Package className="h-5 w-5 text-green-500" />
                Snacks Overview
              </h3>
              <div className="text-sm text-gray-500">
                Approval Rate: {snackApprovalRate}%
              </div>
            </div>
            <div className="h-64">
              <Doughnut data={snackChartData} options={donutOptions} />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{dashboardData.snacks.PENDING_APPROVAL}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{dashboardData.snacks.APPROVED}</p>
                <p className="text-xs text-gray-500">Approved</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{dashboardData.snacks.REJECTED}</p>
                <p className="text-xs text-gray-500">Rejected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Priority Action Items & Performance Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Priority Action Items - Pending Vendors */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Priority Action Items
              </h3>
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                {dashboardData.vendors.PENDING + dashboardData.snacks.PENDING_APPROVAL} Pending
              </span>
            </div>
            
            {/* Pending Vendors */}
            {pendingVendorsList.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  Pending Vendors ({pendingVendorsList.length})
                </h4>
                <div className="space-y-2">
                  {pendingVendorsList.map((vendor) => (
                    <div key={vendor.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 text-sm">{vendor.businessName || 'Unnamed Business'}</p>
                        {/* <p className="text-xs text-gray-500">Registered: {formatDate(vendor.createdAt)}</p> */}
                      </div>
                      <button
                        onClick={() => navigate('/approve-vendors')}
                        className="px-3 py-1.5 bg-yellow-500 text-white text-xs rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-1"
                      >
                        Review <ArrowUpRight className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Snacks */}
            {pendingSnacksList.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  Pending Snacks ({pendingSnacksList.length})
                </h4>
                <div className="space-y-2">
                  {pendingSnacksList.map((snack) => (
                    <div key={snack.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 text-sm">{snack.snackName || 'Unnamed Snack'}</p>
                        <p className="text-xs text-gray-500">Submitted: {formatDate(snack.createdDate)}</p>
                      </div>
                      <button
                        onClick={() => navigate('/approve-snacks')}
                        className="px-3 py-1.5 bg-yellow-500 text-white text-xs rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-1"
                      >
                        Review <ArrowUpRight className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingVendorsList.length === 0 && pendingSnacksList.length === 0 && (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-gray-500">No pending items! All caught up.</p>
              </div>
            )}

            {(pendingVendorsList.length > 0 || pendingSnacksList.length > 0) && (
              <button
                onClick={() => navigate(pendingVendorsList.length > 0 ? '/approve-vendors' : '/approve-snacks')}
                className="mt-4 w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All Pending Items →
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
              {/* Vendor Performance */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Vendor Approval Rate</span>
                  <span className="text-xl font-bold text-blue-600">{vendorApprovalRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${vendorApprovalRate}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {dashboardData.vendors.APPROVED} approved out of {dashboardData.vendors.TOTAL} total vendors
                </p>
              </div>

              {/* Snack Performance */}
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Snack Approval Rate</span>
                  <span className="text-xl font-bold text-green-600">{snackApprovalRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${snackApprovalRate}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {dashboardData.snacks.APPROVED} approved out of {dashboardData.snacks.TOTAL} total snacks
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-xs text-gray-500">Success Rate</span>
                  </div>
                  <p className="text-lg font-bold text-gray-800">
                    {((dashboardData.vendors.APPROVED + dashboardData.snacks.APPROVED) / 
                      (dashboardData.vendors.TOTAL + dashboardData.snacks.TOTAL || 1) * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-xs text-gray-500">Workload</span>
                  </div>
                  <p className="text-lg font-bold text-gray-800">{totalPending}</p>
                  <p className="text-xs text-gray-400">Pending reviews</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => navigate('/approve-vendors')}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-2xl hover:shadow-xl transition-all duration-200 text-left group"
          >
            <div className="flex items-center justify-between">
              <div>
                <Users className="h-8 w-8 mb-2 opacity-90" />
                <h3 className="text-xl font-bold">Approve Vendors</h3>
                <p className="text-white/80 text-sm mt-1">Review and approve vendor applications</p>
              </div>
              <div className="text-center bg-white/20 rounded-xl p-3">
                <p className="text-2xl font-bold">{dashboardData.vendors.PENDING}</p>
                <p className="text-xs opacity-80">Pending</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/approve-snacks')}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-2xl hover:shadow-xl transition-all duration-200 text-left group"
          >
            <div className="flex items-center justify-between">
              <div>
                <Package className="h-8 w-8 mb-2 opacity-90" />
                <h3 className="text-xl font-bold">Approve Snacks</h3>
                <p className="text-white/80 text-sm mt-1">Review and approve snack submissions</p>
              </div>
              <div className="text-center bg-white/20 rounded-xl p-3">
                <p className="text-2xl font-bold">{dashboardData.snacks.PENDING_APPROVAL}</p>
                <p className="text-xs opacity-80">Pending</p>
              </div>
            </div>
          </button>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-100">
            <div className="flex items-center gap-3 mb-3">
              <Award className="h-8 w-8 text-yellow-600" />
              <h3 className="font-semibold text-gray-800">Quality Score</h3>
            </div>
            <p className="text-3xl font-bold text-yellow-700">
              {((dashboardData.vendors.APPROVED + dashboardData.snacks.APPROVED) / 
                (dashboardData.vendors.TOTAL + dashboardData.snacks.TOTAL || 1) * 100).toFixed(0)}%
            </p>
            <p className="text-sm text-gray-600 mt-2">Approval quality rating</p>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <h3 className="font-semibold text-gray-800">Approved Items</h3>
            </div>
            <p className="text-3xl font-bold text-green-700">
              {dashboardData.vendors.APPROVED + dashboardData.snacks.APPROVED}
            </p>
            <p className="text-sm text-gray-600 mt-2">Successfully approved submissions</p>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
            <div className="flex items-center gap-3 mb-3">
              <Target className="h-8 w-8 text-purple-600" />
              <h3 className="font-semibold text-gray-800">Platform Health</h3>
            </div>
            <p className="text-3xl font-bold text-purple-700">
              {((dashboardData.vendors.APPROVED + dashboardData.snacks.APPROVED) / 
                (dashboardData.vendors.TOTAL + dashboardData.snacks.TOTAL || 1) * 100).toFixed(0)}%
            </p>
            <p className="text-sm text-gray-600 mt-2">Overall platform health score</p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          
          
        </div>
      </div>
    </div>
  );
};

export default ProductManagerDashboard;