import React, { useState, useEffect } from 'react';
import { Package, CheckCircle, XCircle, Clock, Eye, AlertCircle, Calendar, User, X, Shield, MapPin, Mail, Phone, Building, Leaf } from 'lucide-react';
import { useScrollToTop } from '../hooks/useScrollToTop';
import SessionExpired from '../components/SessionExpired';
const ApproveSnacks = () => {

  useScrollToTop();
  const [snacks, setSnacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendorDetails, setVendorDetails] = useState({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [viewingSnack, setViewingSnack] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actioningSnackId, setActioningSnackId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState('');
  const [actionType, setActionType] = useState(null);
  const [snackCounts, setSnackCounts] = useState({
    PENDING_APPROVAL: 0,
    APPROVED: 0,
    REJECTED: 0,
    TOTAL: 0
  });

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  // Get JWT token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Get current user ID from localStorage
  const getCurrentUserId = () => {
    const userId = localStorage.getItem('userId');
    const vendorId = localStorage.getItem('vendorId');
    return userId || vendorId;
  };

  // Fetch current user name from backend using userId
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
        const name = userData.name || userData.username || userData.email || 'Admin';
        setCurrentUserName(name);
        localStorage.setItem('userName', name);
        return name;
      }
    } catch (err) {
      console.error('Error fetching user name:', err);
    }
    return localStorage.getItem('userName') || 'Admin';
  };

  // Fetch vendor details by vendor ID
  const fetchVendorDetails = async (vendorId) => {
    if (!vendorId) return null;
    
    try {
      const token = getAuthToken();
      const response = await fetch(`http://localhost:8080/admin/vendor/${vendorId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const vendorData = await response.json();
        console.log(`Fetched vendor details for ID ${vendorId}:`, vendorData);
        setVendorDetails(prev => ({ ...prev, [vendorId]: vendorData }));
        return vendorData;
      } else {
        console.error(`Failed to fetch vendor ${vendorId}:`, response.status);
      }
    } catch (err) {
      console.error('Error fetching vendor details:', err);
    }
    return null;
  };

  // Fetch vendor details when viewing a snack
  useEffect(() => {
    if (viewingSnack?.vendorId && !vendorDetails[viewingSnack.vendorId]) {
      fetchVendorDetails(viewingSnack.vendorId);
    }
  }, [viewingSnack]);

  // Fetch snack counts by status
  const fetchSnackCounts = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch('http://localhost:8080/admin/snacks/count-by-status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const counts = await response.json();
        setSnackCounts({
          PENDING_APPROVAL: counts.PENDING_APPROVAL || 0,
          APPROVED: counts.APPROVED || 0,
          REJECTED: counts.REJECTED || 0,
          TOTAL: counts.TOTAL || 0
        });
        return counts;
      }
    } catch (err) {
      console.error('Error fetching snack counts:', err);
    }
    return null;
  };

  // Check authentication and admin role
  const role = localStorage.getItem('role');
  const isAdmin = role === 'ADMIN' || role === 'PRODUCT_MANAGER';
  const isAuthenticated = !!getAuthToken();

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      const userId = getCurrentUserId();
      setCurrentUserId(userId);
      if (userId) {
        fetchCurrentUserName(userId);
      }
      fetchSnacks();
      fetchSnackCounts();
    }
  }, [isAuthenticated, isAdmin]);

  const fetchSnacks = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      const response = await fetch('http://localhost:8080/admin/snacks-with-vendor', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('vendorEmail');
          localStorage.removeItem('role');
          localStorage.removeItem('userId');
          localStorage.removeItem('vendorId');
          localStorage.removeItem('vendorName');
          localStorage.removeItem('userName');
          window.dispatchEvent(new Event('authChange'));
          throw new Error('Session expired. Please login again.');
        }
        if (response.status === 403) {
          throw new Error('Access denied. Admin permissions required.');
        }
        throw new Error('Failed to fetch snacks');
      }
      
      const data = await response.json();
      console.log('Fetched snacks with vendor info:', data);
      setSnacks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch snacks');
      setSnacks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (snackId) => {
    if (!currentUserId) {
      setError('User authentication required. Please login again.');
      return;
    }
    
    setIsSubmitting(true);
    setActioningSnackId(snackId);
    setActionType('approve');
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      const userName = currentUserName || await fetchCurrentUserName(currentUserId);

      const response = await fetch(`http://localhost:8080/admin/snack/approve/${snackId}?approvedBy=${currentUserId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const responseText = await response.text();
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.dispatchEvent(new Event('authChange'));
          throw new Error('Session expired. Please login again.');
        }
        if (response.status === 403) {
          throw new Error('Access denied. Admin permissions required.');
        }
        throw new Error(responseText || 'Failed to approve snack');
      }

      await fetchSnacks();
      await fetchSnackCounts();
      
      setMessage(`Snack approved successfully by ${userName}!`);
      setError('');
      setViewingSnack(null);
    } catch (err) {
      console.error('Approve error:', err);
      setError(err.message || 'Failed to approve snack. Please try again.');
    } finally {
      setIsSubmitting(false);
      setActioningSnackId(null);
      setActionType(null);
    }
  };

  const handleReject = async (snackId) => {
    if (!currentUserId) {
      setError('User authentication required. Please login again.');
      return;
    }
    
    setIsSubmitting(true);
    setActioningSnackId(snackId);
    setActionType('reject');
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      const userName = currentUserName || await fetchCurrentUserName(currentUserId);

      const response = await fetch(`http://localhost:8080/admin/snack/reject/${snackId}?approvedBy=${currentUserId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const responseText = await response.text();
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.dispatchEvent(new Event('authChange'));
          throw new Error('Session expired. Please login again.');
        }
        if (response.status === 403) {
          throw new Error('Access denied. Admin permissions required.');
        }
        throw new Error(responseText || 'Failed to reject snack');
      }

      await fetchSnacks();
      await fetchSnackCounts();
      
      setMessage(`Snack rejected successfully by ${userName}!`);
      setError('');
      setViewingSnack(null);
    } catch (err) {
      console.error('Reject error:', err);
      setError(err.message || 'Failed to reject snack. Please try again.');
    } finally {
      setIsSubmitting(false);
      setActioningSnackId(null);
      setActionType(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'APPROVED': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, text: 'Approved' },
      'PENDING_APPROVAL': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, text: 'Pending Review' },
      'REJECTED': { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, text: 'Rejected' }
    };
    
    const config = statusConfig[status] || statusConfig['PENDING_APPROVAL'];
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatNumberedList = (text) => {
    if (!text || text.trim() === '') return <p className="text-gray-500 italic">Not provided</p>;
    
    const items = text.split(',').map(item => item.trim()).filter(item => item !== '');
    
    if (items.length === 0) return <p className="text-gray-500 italic">Not provided</p>;
    
    return (
      <ol className="list-decimal list-inside space-y-1 ml-2">
        {items.map((item, index) => (
          <li key={index} className="text-gray-700">{item}</li>
        ))}
      </ol>
    );
  };

  const formatRecipeInstructions = (instructions) => {
    if (!instructions || instructions.trim() === '') {
      return <p className="text-gray-500 italic">Not provided</p>;
    }
    
    if (instructions.includes('\n')) {
      const steps = instructions.split('\n').filter(step => step.trim() !== '');
      return (
        <ol className="list-decimal list-inside space-y-2 ml-2">
          {steps.map((step, index) => (
            <li key={index} className="text-gray-700">{step.trim()}</li>
          ))}
        </ol>
      );
    }
    
    if (instructions.includes(',')) {
      const steps = instructions.split(',').map(step => step.trim()).filter(step => step !== '');
      return (
        <ol className="list-decimal list-inside space-y-2 ml-2">
          {steps.map((step, index) => (
            <li key={index} className="text-gray-700">{step}</li>
          ))}
        </ol>
      );
    }
    
    return (
      <ol className="list-decimal list-inside space-y-2 ml-2">
        <li className="text-gray-700">{instructions}</li>
      </ol>
    );
  };

  const filteredSnacks = snacks.filter(snack => {
    if (filter === 'ALL') return true;
    return snack.status === filter;
  });

  const getVendorInfo = (vendorId) => {
    if (!vendorId) return null;
    return vendorDetails[vendorId];
  };



  const userRole = localStorage.getItem('role');
  if (!isAuthenticated || userRole !== 'ADMIN' && userRole !== 'PRODUCT_MANAGER') {
    return <SessionExpired role="admin" />;
  }


  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 pt-20">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Admin Access Required</h2>
          <p className="text-gray-600">You need administrator privileges to approve snacks.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center pt-20">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Loading snack applications...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pt-2">
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mr-4">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Snack Approvals</h1>
                  <p className="text-white/90">Review and manage snack applications</p>
                </div>
              </div>
              <Leaf className="h-8 w-8 text-white/50" />
            </div>
          </div>

          <div className="p-6 border-b">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('ALL')}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                  filter === 'ALL'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
                <span className="ml-2 text-xs opacity-75">({snackCounts.TOTAL})</span>
              </button>
              <button
                onClick={() => setFilter('APPROVED')}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                  filter === 'APPROVED'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Approved
                <span className="ml-2 text-xs opacity-75">({snackCounts.APPROVED})</span>
              </button>
              <button
                onClick={() => setFilter('PENDING_APPROVAL')}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                  filter === 'PENDING_APPROVAL'
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending
                <span className="ml-2 text-xs opacity-75">({snackCounts.PENDING_APPROVAL})</span>
              </button>
              <button
                onClick={() => setFilter('REJECTED')}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                  filter === 'REJECTED'
                    ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Rejected
                <span className="ml-2 text-xs opacity-75">({snackCounts.REJECTED})</span>
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-green-100 border border-green-200 text-green-700 rounded-lg flex items-center animate-fade-in">
            <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg flex items-center animate-fade-in">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {filteredSnacks.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No snack applications found</h3>
            <p className="text-gray-500">
              {filter === 'ALL' 
                ? 'There are no snack applications yet.' 
                : `There are no ${filter.replace('_', ' ').toLowerCase()} snack applications.`
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredSnacks.map((snack) => (
              <div key={snack.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
                {snack.productImage && (
                  <div className="h-40 overflow-hidden bg-gray-100">
                    <img 
                      src={snack.productImage} 
                      alt={snack.snackName}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {snack.snackName || 'Unnamed Snack'}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        {getVendorInfo(snack.vendorId)?.businessName || 
                         getVendorInfo(snack.vendorId)?.user?.username || 
                         `Vendor ID: ${snack.vendorId || 'N/A'}`}
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      {getStatusBadge(snack.status)}
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    <p className="flex items-center">
                      <Package className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{snack.category || 'N/A'}</span>
                    </p>
                    <p className="flex items-center">
                      <span className="font-medium mr-1">Type:</span> 
                      <span className="truncate">{snack.snackType || 'N/A'}</span>
                    </p>
                    <p className="flex items-center">
                      <span className="font-medium mr-1">Prep Time:</span> 
                      <span>{snack.preparationTime || 'N/A'} mins</span>
                    </p>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {snack.description || 'No description provided'}
                  </p>

                  <div className="text-xs text-gray-500 mb-6 space-y-1">
                    <p>Created: {formatDate(snack.createdDate)}</p>
                    {snack.approvalDate && (
                      <p>Processed: {formatDate(snack.approvalDate)}</p>
                    )}
                    {snack.approvedBy && snack.status !== 'PENDING_APPROVAL' && (
                      <p>By: {snack.approvedBy.username || 'Admin'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => setViewingSnack(snack)}
                      className="w-full bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 flex items-center justify-center transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </button>
                    
                    {snack.status === 'PENDING_APPROVAL' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(snack.id)}
                          disabled={isSubmitting && actioningSnackId === snack.id && actionType === 'approve'}
                          className="flex-1 bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-100 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting && actioningSnackId === snack.id && actionType === 'approve' ? (
                            <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(snack.id)}
                          disabled={isSubmitting && actioningSnackId === snack.id && actionType === 'reject'}
                          className="flex-1 bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting && actioningSnackId === snack.id && actionType === 'reject' ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                          ) : (
                            <XCircle className="h-4 w-4 mr-2" />
                          )}
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewingSnack && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white sticky top-0">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mr-4">
                      <Package className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{viewingSnack.snackName || 'Unnamed Snack'}</h2>
                      <p className="text-white/90">Snack Application Details</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewingSnack(null)}
                    className="text-white/70 hover:text-white p-2 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-8">
                {viewingSnack.productImage && (
                  <div className="mb-8">
                    <img 
                      src={viewingSnack.productImage} 
                      alt={viewingSnack.snackName}
                      className="w-full max-h-96 object-contain rounded-xl shadow-lg"
                    />
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Package className="h-5 w-5 mr-2 text-blue-600" />
                        Product Information
                      </h3>
                      <div className="space-y-3 text-sm bg-gray-50 p-4 rounded-lg">
                        <p><span className="font-medium">Name:</span> {viewingSnack.snackName || 'N/A'}</p>
                        <p><span className="font-medium">Type:</span> {viewingSnack.snackType || 'N/A'}</p>
                        <p><span className="font-medium">Category:</span> {viewingSnack.category || 'N/A'}</p>
                        <p><span className="font-medium">Difficulty:</span> {viewingSnack.difficultyLevel || 'N/A'}</p>
                        <p><span className="font-medium">Preparation Time:</span> {viewingSnack.preparationTime || 'N/A'} mins</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Building className="h-5 w-5 mr-2 text-blue-600" />
                        Vendor Information
                      </h3>
                      <div className="space-y-3 text-sm bg-gray-50 p-4 rounded-lg">
                        {vendorDetails[viewingSnack.vendorId]?.user && (
                          <>
                            <p>
                              <span className="font-medium">Vendor ID : </span> 
                              {viewingSnack.vendorId || 'N/A'}
                            </p>
                            <p>
                              <span className="font-medium">Vendor name : </span> 
                              {vendorDetails[viewingSnack.vendorId]?.user?.username || 'N/A'}
                            </p>
                            <p>
                              <span className="font-medium">Email : </span> 
                              {vendorDetails[viewingSnack.vendorId]?.user?.email || 'N/A'}
                            </p>
                            <p>
                              <span className="font-medium">Phone Number : </span> 
                              {vendorDetails[viewingSnack.vendorId]?.user?.phoneNumber || 'N/A'}
                            </p>
                            <p>
                              <span className="font-medium">Role :</span> 
                              <span className="ml-2 px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                                {vendorDetails[viewingSnack.vendorId]?.user?.role || 'N/A'}
                              </span>
                            </p>
                          </>
                        )}
                        
                        <div className="border-t border-gray-200 pt-2 mt-2">
                          <p className="font-medium text-blue-600 mb-2">Business Details : </p>
                        </div>
                        <p>
                          <span className="font-medium">Business Name : </span> 
                          {vendorDetails[viewingSnack.vendorId]?.businessName || 'N/A'}
                        </p>
                        <p>
                          <span className="font-medium">Business Description : </span> 
                          {vendorDetails[viewingSnack.vendorId]?.businessDescription || 'N/A'}
                        </p>
                        
                        <div className="border-t border-gray-200 pt-2 mt-2">
                          <p className="font-medium text-blue-600 mb-2">Vendor Status:</p>
                        </div>
                        <p>
                          <span className="font-medium">Approval Status : </span> 
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                            vendorDetails[viewingSnack.vendorId]?.approvalStatus === 'APPROVED' 
                              ? 'bg-green-100 text-green-700' 
                              : vendorDetails[viewingSnack.vendorId]?.approvalStatus === 'REJECTED'
                              ? 'bg-red-100 text-red-700'
                              : vendorDetails[viewingSnack.vendorId]?.approvalStatus === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {vendorDetails[viewingSnack.vendorId]?.approvalStatus || 'N/A'}
                          </span>
                        </p>
                        {vendorDetails[viewingSnack.vendorId]?.approvalDate && (
                          <p>
                            <span className="font-medium">Approval Date : </span> 
                            {formatDate(vendorDetails[viewingSnack.vendorId]?.approvalDate)}
                          </p>
                        )}
                      </div>
                    </div>

                    {viewingSnack.ingredients && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Ingredients</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          {formatNumberedList(viewingSnack.ingredients)}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                        Application Status
                      </h3>
                      <div className="space-y-3 text-sm bg-gray-50 p-4 rounded-lg">
                        <p><span className="font-medium">Status:</span> {getStatusBadge(viewingSnack.status)}</p>
                        <p><span className="font-medium">Created:</span> {formatDate(viewingSnack.createdDate)}</p>
                        {viewingSnack.approvalDate && (
                          <p><span className="font-medium">Processed On:</span> {formatDate(viewingSnack.approvalDate)}</p>
                        )}
                        {viewingSnack.approvedBy && viewingSnack.status !== 'PENDING_APPROVAL' && (
                          <p><span className="font-medium">Processed By:</span> {viewingSnack.approvedBy.username || 'Admin'}</p>
                        )}
                      </div>
                    </div>

                    {viewingSnack.description && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
                        <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                          {viewingSnack.description}
                        </div>
                      </div>
                    )}

                    {viewingSnack.nutritionalInfo && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Nutritional Information</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          {formatNumberedList(viewingSnack.nutritionalInfo)}
                        </div>
                      </div>
                    )}

                    {viewingSnack.receipeInstructions && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Recipe Instructions</h3>
                        <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                          {formatRecipeInstructions(viewingSnack.receipeInstructions)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {viewingSnack.status === 'PENDING_APPROVAL' && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={() => handleReject(viewingSnack.id)}
                        disabled={isSubmitting && actioningSnackId === viewingSnack.id && actionType === 'reject'}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {isSubmitting && actioningSnackId === viewingSnack.id && actionType === 'reject' ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Reject Application
                      </button>
                      <button
                        onClick={() => handleApprove(viewingSnack.id)}
                        disabled={isSubmitting && actioningSnackId === viewingSnack.id && actionType === 'approve'}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {isSubmitting && actioningSnackId === viewingSnack.id && actionType === 'approve' ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Approve Snack
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
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

export default ApproveSnacks;