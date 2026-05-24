import React, { useState, useEffect } from 'react';
import { User, CheckCircle, XCircle, Clock, AlertCircle, Eye, Mail, Phone, MapPin, Calendar, Building, X, Shield, Users, FileText, Award, Hash, Store, CreditCard } from 'lucide-react';
import { useScrollToTop } from '../hooks/useScrollToTop';
import SessionExpired from '../components/SessionExpired';
// Add this style to remove all margins and padding from body
const globalStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    margin: 0;
    padding: 0;
    overflow-x: hidden;
  }
  
  #root {
    margin: 0;
    padding: 0;
  }
  
  html {
    margin: 0;
    padding: 0;
  }
`;

const ApproveVendors = () => {
  useScrollToTop();
  
  // Inject global styles
  React.useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = globalStyles;
    document.head.appendChild(styleElement);
    
    document.body.classList.add('no-margin');
    
    return () => {
      document.head.removeChild(styleElement);
      document.body.classList.remove('no-margin');
    };
  }, []);

  const [vendors, setVendors] = useState([]);
  const [vendorDetails, setVendorDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [viewingVendor, setViewingVendor] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actioningVendorId, setActioningVendorId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'

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

  // Get current user name
  const getCurrentUserName = () => {
    return localStorage.getItem('userName') || localStorage.getItem('vendorName') || 'Admin';
  };

  // Fetch all vendor details with user info (pre-fetch everything)
  const fetchAllVendorDetails = async (vendorsList) => {
    const token = getAuthToken();
    const detailsMap = {};
    
    // Fetch details for all vendors in parallel
    const fetchPromises = vendorsList.map(async (vendor) => {
      try {
        const response = await fetch(`http://localhost:8080/admin/vendor/${vendor.id}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const vendorData = await response.json();
          detailsMap[vendor.id] = vendorData;
          console.log(`Fetched details for vendor ${vendor.id}:`, vendorData);
        }
      } catch (err) {
        console.error(`Error fetching vendor ${vendor.id}:`, err);
      }
    });
    
    await Promise.all(fetchPromises);
    setVendorDetails(detailsMap);
  };

  // Check authentication and admin role
  const role = localStorage.getItem('role');
  const isAdmin = role === 'ADMIN' || role === 'PRODUCT_MANAGER';
  const isAuthenticated = !!getAuthToken();

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      const userId = getCurrentUserId();
      setCurrentUserId(userId);
      fetchVendors();
    }
  }, [isAuthenticated, isAdmin]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      const response = await fetch('http://localhost:8080/admin/vendors', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        if (response.status === 403) {
          throw new Error('Access denied. Admin permissions required.');
        }
        throw new Error('Failed to fetch vendors');
      }
      
      const data = await response.json();
      console.log('Fetched vendors:', data);
      setVendors(Array.isArray(data) ? data : []);
      
      // Pre-fetch all vendor details with user info
      if (Array.isArray(data) && data.length > 0) {
        await fetchAllVendorDetails(data);
      }
      
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to fetch vendors');
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (vendorId) => {
    if (!currentUserId) {
      setError('User authentication required. Please login again.');
      return;
    }
    
    setIsSubmitting(true);
    setActioningVendorId(vendorId);
    setActionType('approve');
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      const response = await fetch(`http://localhost:8080/admin/vendor/approve/${vendorId}?approvedBy=${currentUserId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        if (response.status === 403) {
          throw new Error('Access denied. Admin permissions required.');
        }
        if (response.status === 404) {
          throw new Error('Vendor not found.');
        }
        throw new Error('Failed to approve vendor');
      }

      const responseData = await response.text();
      console.log('Approve response:', responseData);

      // Update vendor in state
      setVendors(prevVendors => prevVendors.map(vendor => 
        vendor.id === vendorId 
          ? { 
              ...vendor, 
              approvalStatus: 'APPROVED', 
              approvalDate: new Date().toISOString(),
              approvedBy: { id: currentUserId, username: getCurrentUserName() }
            }
          : vendor
      ));
      
      // Refresh vendor details for this vendor
      const token2 = getAuthToken();
      const detailResponse = await fetch(`http://localhost:8080/admin/vendor/${vendorId}`, {
        headers: { 'Authorization': `Bearer ${token2}` }
      });
      if (detailResponse.ok) {
        const updatedVendor = await detailResponse.json();
        setVendorDetails(prev => ({ ...prev, [vendorId]: updatedVendor }));
      }
      
      setMessage('Vendor approved successfully!');
      setError('');
      setViewingVendor(null);
    } catch (err) {
      setError(err.message || 'Failed to approve vendor. Please try again.');
    } finally {
      setIsSubmitting(false);
      setActioningVendorId(null);
      setActionType(null);
    }
  };

  const handleReject = async (vendorId) => {
    if (!currentUserId) {
      setError('User authentication required. Please login again.');
      return;
    }
    
    setIsSubmitting(true);
    setActioningVendorId(vendorId);
    setActionType('reject');
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      const response = await fetch(`http://localhost:8080/admin/vendor/reject/${vendorId}?approvedBy=${currentUserId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        if (response.status === 403) {
          throw new Error('Access denied. Admin permissions required.');
        }
        if (response.status === 404) {
          throw new Error('Vendor not found.');
        }
        throw new Error('Failed to reject vendor');
      }

      // Update vendor in state
      setVendors(prevVendors => prevVendors.map(vendor => 
        vendor.id === vendorId 
          ? { 
              ...vendor, 
              approvalStatus: 'REJECTED', 
              approvalDate: new Date().toISOString(),
              approvedBy: { id: currentUserId, username: getCurrentUserName() }
            }
          : vendor
      ));
      
      // Refresh vendor details for this vendor
      const token2 = getAuthToken();
      const detailResponse = await fetch(`http://localhost:8080/admin/vendor/${vendorId}`, {
        headers: { 'Authorization': `Bearer ${token2}` }
      });
      if (detailResponse.ok) {
        const updatedVendor = await detailResponse.json();
        setVendorDetails(prev => ({ ...prev, [vendorId]: updatedVendor }));
      }
      
      setMessage('Vendor rejected successfully!');
      setError('');
      setViewingVendor(null);
    } catch (err) {
      setError(err.message || 'Failed to reject vendor. Please try again.');
    } finally {
      setIsSubmitting(false);
      setActioningVendorId(null);
      setActionType(null);
    }
  };

  const getStatusBadge = (approvalStatus) => {
    const statusConfig = {
      'APPROVED': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, text: 'Approved' },
      'PENDING': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, text: 'Pending Review' },
      'REJECTED': { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, text: 'Rejected' },
      'SUSPENDED': { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XCircle, text: 'Suspended' }
    };
    
    const config = statusConfig[approvalStatus] || statusConfig['PENDING'];
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

  const filteredVendors = vendors.filter(vendor => {
    if (filter === 'ALL') return true;
    return vendor.approvalStatus === filter;
  });

  const getFilterCounts = () => {
    return {
      ALL: vendors.length,
      PENDING: vendors.filter(v => v.approvalStatus === 'PENDING').length,
      APPROVED: vendors.filter(v => v.approvalStatus === 'APPROVED').length,
      REJECTED: vendors.filter(v => v.approvalStatus === 'REJECTED').length
    };
  };

  const filterCounts = getFilterCounts();

  // Authentication checks
  // if (!isAuthenticated) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
  //       <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md">
  //         <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
  //           <X className="w-8 h-8 text-red-600" />
  //         </div>
  //         <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
  //         <p className="text-gray-600 mb-6">Please login as an admin to manage vendors.</p>
  //         <button 
  //           onClick={() => window.location.href = '/auth'}
  //           className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
  //         >
  //           Go to Login
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  const userRole = localStorage.getItem('role');
  if (!isAuthenticated || userRole !== 'ADMIN' && userRole !== 'PRODUCT_MANAGER') {
    return <SessionExpired role="admin" />;
  }



  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Admin Access Required</h2>
          <p className="text-gray-600">You need administrator privileges to approve vendors.</p>
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
          <h2 className="text-xl font-semibold text-gray-800">Loading vendor applications...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-8 text-center">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Vendor Management</h1>
            <p className="text-white/90 text-base">Review and manage all vendor applications</p>
          </div>

          {/* Filter Tabs */}
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
                All Vendors
                <span className="ml-2 text-xs opacity-75">({filterCounts.ALL})</span>
              </button>
              <button
                onClick={() => setFilter('PENDING')}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                  filter === 'PENDING'
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending
                <span className="ml-2 text-xs opacity-75">({filterCounts.PENDING})</span>
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
                <span className="ml-2 text-xs opacity-75">({filterCounts.APPROVED})</span>
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
                <span className="ml-2 text-xs opacity-75">({filterCounts.REJECTED})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
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

        {/* Content - 3 Cards in a row */}
        {filteredVendors.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No vendors found</h3>
            <p className="text-gray-500">
              {filter === 'ALL' 
                ? 'There are no vendor applications yet.' 
                : `There are no ${filter.toLowerCase()} vendor applications.`
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredVendors.map((vendor) => {
              const fullVendor = vendorDetails[vendor.id];
              return (
                <div key={vendor.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
                  <div className="p-6">
                    {/* Header with Business Name and Status */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Store className="h-5 w-5 text-blue-500" />
                          <h3 className="text-lg font-bold text-gray-900 truncate">
                            {vendor.businessName || 'Unnamed Business'}
                          </h3>
                        </div>
                        <p className="text-xs text-gray-500">
                          ID: #{vendor.id || 'N/A'}
                        </p>
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        {getStatusBadge(vendor.approvalStatus)}
                      </div>
                    </div>
                    
                    {/* User Information from pre-fetched vendor details */}
                    {fullVendor?.user && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-xl">
                        <h4 className="text-xs font-semibold text-blue-800 mb-2 flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          Account Details
                        </h4>
                        <div className="space-y-1">
                          <p className="text-xs text-gray-700 truncate">
                            <span className="font-medium">Username:</span> {fullVendor.user.username || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-700 truncate">
                            <span className="font-medium">Email:</span> {fullVendor.user.email || vendor.email || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-700">
                            <span className="font-medium">Phone:</span> {fullVendor.user.phoneNumber || vendor.phoneNumber || 'N/A'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Business Description */}
                    {vendor.businessDescription && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          <FileText className="h-3 w-3 inline mr-1 text-gray-400" />
                          {vendor.businessDescription}
                        </p>
                      </div>
                    )}

                    {/* Timeline */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                      <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Timeline
                      </h4>
                      <div className="space-y-1">
                        {vendor.createdAt && (
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">Registered:</span> {formatDate(vendor.createdAt)}
                          </p>
                        )}
                        {vendor.approvalDate && (
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">Processed:</span> {formatDate(vendor.approvalDate)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Approval Details */}
                    {vendor.approvedBy && vendor.approvalStatus !== 'PENDING' && (
                      <div className="mb-4 p-3 bg-purple-50 rounded-xl">
                        <h4 className="text-xs font-semibold text-purple-800 mb-2 flex items-center">
                          <Shield className="h-3 w-3 mr-1" />
                          Approval Details
                        </h4>
                        <p className="text-xs text-gray-700 truncate">
                          <span className="font-medium">Processed by:</span> {vendor.approvedBy.username || 'N/A'}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <button
                        onClick={() => setViewingVendor(vendor)}
                        className="w-full bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 flex items-center justify-center transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </button>
                      
                      {vendor.approvalStatus === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(vendor.id)}
                            disabled={isSubmitting && actioningVendorId === vendor.id && actionType === 'approve'}
                            className="flex-1 bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-100 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting && actioningVendorId === vendor.id && actionType === 'approve' ? (
                              <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(vendor.id)}
                            disabled={isSubmitting && actioningVendorId === vendor.id && actionType === 'reject'}
                            className="flex-1 bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting && actioningVendorId === vendor.id && actionType === 'reject' ? (
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
              );
            })}
          </div>
        )}

        {/* View Vendor Details Modal */}
        {viewingVendor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white sticky top-0">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mr-4">
                      <Store className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{viewingVendor.businessName || 'Vendor Details'}</h2>
                      <p className="text-white/90">Vendor Application Details</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewingVendor(null)}
                    className="text-white/70 hover:text-white p-2 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Contact Information Section */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <User className="h-5 w-5 mr-2 text-blue-600" />
                        Account Information
                      </h3>
                      <div className="space-y-3 text-sm bg-gray-50 p-4 rounded-lg">
                        <p><span className="font-medium">Username:</span> {vendorDetails[viewingVendor.id]?.user?.username || viewingVendor.username || 'N/A'}</p>
                        <p><span className="font-medium">Email Address:</span> {vendorDetails[viewingVendor.id]?.user?.email || viewingVendor.email || 'N/A'}</p>
                        <p><span className="font-medium">Phone Number:</span> {vendorDetails[viewingVendor.id]?.user?.phoneNumber || viewingVendor.phoneNumber || 'N/A'}</p>
                        <p><span className="font-medium">Role:</span> 
                          <span className="ml-2 px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                            {vendorDetails[viewingVendor.id]?.user?.role || 'VENDOR'}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Business Information Section */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Building className="h-5 w-5 mr-2 text-blue-600" />
                        Business Information
                      </h3>
                      <div className="space-y-3 text-sm bg-gray-50 p-4 rounded-lg">
                        <p><span className="font-medium">Business Name:</span> {viewingVendor.businessName || 'N/A'}</p>
                        <p><span className="font-medium">Business Description:</span></p>
                        <p className="text-gray-600 whitespace-pre-wrap">{viewingVendor.businessDescription || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Timeline Information */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                        Registration Timeline
                      </h3>
                      <div className="space-y-3 text-sm bg-gray-50 p-4 rounded-lg">
                        {/* <p><span className="font-medium">Registered On:</span> {formatDate(viewingVendor.createdAt)}</p> */}
                        <p><span className="font-medium">Vendor ID:</span> {viewingVendor.id}</p>
                        <p><span className="font-medium">Number of Snacks:</span> {viewingVendor.veganSnacks?.length || 0}</p>
                      </div>
                    </div>

                    {/* Approval Information */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Shield className="h-5 w-5 mr-2 text-blue-600" />
                        Approval Information
                      </h3>
                      <div className="space-y-3 text-sm bg-gray-50 p-4 rounded-lg">
                        <p><span className="font-medium">Status:</span> {getStatusBadge(viewingVendor.approvalStatus)}</p>
                        {viewingVendor.approvalDate && (
                          <p><span className="font-medium">Processed On:</span> {formatDate(viewingVendor.approvalDate)}</p>
                        )}
                        {viewingVendor.approvedBy && (
                          <>
                            <p><span className="font-medium">Processed By:</span> {viewingVendor.approvedBy.username || viewingVendor.approvedBy.email}</p>
                            {/* <p><span className="font-medium">Processor Role:</span> {viewingVendor.approvedBy.role || 'N/A'}</p> */}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action buttons for pending vendors */}
                {viewingVendor.approvalStatus === 'PENDING' && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={() => handleReject(viewingVendor.id)}
                        disabled={isSubmitting && actioningVendorId === viewingVendor.id && actionType === 'reject'}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {isSubmitting && actioningVendorId === viewingVendor.id && actionType === 'reject' ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Reject Application
                      </button>
                      <button
                        onClick={() => handleApprove(viewingVendor.id)}
                        disabled={isSubmitting && actioningVendorId === viewingVendor.id && actionType === 'approve'}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {isSubmitting && actioningVendorId === viewingVendor.id && actionType === 'approve' ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Approve Vendor
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Animation styles */}
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
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default ApproveVendors;
