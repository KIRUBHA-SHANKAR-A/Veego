import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Package, AlertCircle, Plus, Eye, Star, User, CheckCircle, XCircle, Clock, Leaf, X, MessageSquare, FileText } from 'lucide-react';
import api from '../utils/api';
import { useScrollToTop} from '../hooks/useScrollToTop';
import SessionExpired from '../components/SessionExpired';
const SnackInventoryManager = () => {
  useScrollToTop();
  
  const [snacks, setSnacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editingSnack, setEditingSnack] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [viewingSnack, setViewingSnack] = useState(null);
  const [viewingReviews, setViewingReviews] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [editErrors, setEditErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Helper function to convert comma-separated string to numbered list
  const formatNumberedList = (text) => {
    if (!text || text.trim() === '') return <p className="text-gray-500 italic">Not provided</p>;
    
    // Split by comma, trim each item, filter out empty ones
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

  // Helper function to format recipe instructions (could be comma-separated or plain text)
  const formatInstructions = (instructions) => {
    if (!instructions || instructions.trim() === '') return <p className="text-gray-500 italic">No instructions provided</p>;
    
    // Check if it contains commas (likely a list)
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
    
    // If no commas, return as plain text with line breaks
    return <p className="text-gray-700 whitespace-pre-wrap">{instructions}</p>;
  };

  // Get JWT token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Check authentication and vendor role
  const isVendor = localStorage.getItem('role') === 'VENDOR';
  const isAuthenticated = !!getAuthToken();

  useEffect(() => {
    if (isAuthenticated && isVendor) {
      fetchUserSnacks();
    }
  }, [isAuthenticated, isVendor]);

  const fetchUserSnacks = async () => {
    try {
      setLoading(true);
      setError('');
      
      const vendorId = localStorage.getItem('vendorId');
      if (!vendorId) {
        throw new Error('Vendor information not found');
      }
      
      const response = await api.snacks.getSnacksByVendor(vendorId);
      
      const snacksWithDefaults = (Array.isArray(response) ? response : []).map(snack => ({
        id: snack.id || '',
        snackName: snack.snackName || '',
        snackType: snack.snackType || '',
        description: snack.description || '',
        ingredients: snack.ingredients || '',
        nutritionalInfo: snack.nutritionalInfo || '',
        category: snack.category || '',
        status: snack.status || 'PENDING_APPROVAL',
        difficultyLevel: snack.difficultyLevel || '',
        preparationTime: snack.preparationTime || 0,
        productImage: snack.productImage || '',
        receipeInstructions: snack.receipeInstructions || snack.recipeInstructions || '', // Support both spellings
        reviews: Array.isArray(snack.reviews) ? snack.reviews : [],
        createdDate: snack.createdDate,
        lastModified: snack.lastModified,
        approvalDate: snack.approvalDate
      }));
      
      setSnacks(snacksWithDefaults);
    } catch (err) {
      setError(err.message || 'Failed to fetch snacks');
    } finally {
      setLoading(false);
    }
  };

  const validateEdit = () => {
    const errs = {};
    if (!editingSnack.snackName?.trim()) errs.snackName = 'Snack Name is required';
    if (!editingSnack.snackType?.trim()) errs.snackType = 'Snack Type is required';
    if (!editingSnack.description?.trim()) errs.description = 'Description is required';
    if (!editingSnack.ingredients?.trim()) errs.ingredients = 'Ingredients are required';
    if (!editingSnack.nutritionalInfo?.trim()) errs.nutritionalInfo = 'Nutritional information is required';
    if (!editingSnack.category) errs.category = 'Category is required';
    if (!editingSnack.difficultyLevel) errs.difficultyLevel = 'Difficulty level is required';
    if (!editingSnack.preparationTime) errs.preparationTime = 'Preparation time is required';
    if (editingSnack.preparationTime && editingSnack.preparationTime <= 0) errs.preparationTime = 'Preparation time must be greater than 0';
    
    return errs;
  };

  const handleEdit = (snack) => {
    setEditingSnack({ ...snack });
    setEditErrors({});
    setError('');
    setMessage('');
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    
    setEditingSnack(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (editErrors[name]) {
      setEditErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    setError('');
    setMessage('');
  };

 const handleSaveEdit = async () => {
  const errs = validateEdit();
  setEditErrors(errs);
  
  if (Object.keys(errs).length === 0) {
    setIsSubmitting(true);
    try {
      if (!editingSnack.id) {
        throw new Error('Snack ID is missing. Cannot update.');
      }
      
      const dataToSend = {
        snackName: editingSnack.snackName,
        snackType: editingSnack.snackType,
        description: editingSnack.description,
        ingredients: editingSnack.ingredients,
        nutritionalInfo: editingSnack.nutritionalInfo,
        category: editingSnack.category,
        difficultyLevel: editingSnack.difficultyLevel,
        preparationTime: Number(editingSnack.preparationTime),
        productImage: editingSnack.productImage,
        receipeInstructions: editingSnack.receipeInstructions
      };

      const updatedSnack = await api.snacks.updateSnack(editingSnack.id, dataToSend);
      
      setSnacks(snacks.map(snack => 
        snack.id === updatedSnack.id ? {
          ...snack,
          ...updatedSnack
        } : snack
      ));
      
      setEditingSnack(null);
      setEditErrors({});
      setMessage('Snack updated successfully!');
      
      // ✅ Direct scroll - NO hook call
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      
      setTimeout(() => {
        setMessage("");
      }, 3000);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to update snack. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }
};

  const handleDelete = async (snackId) => {
    setIsSubmitting(true);
    try {
      await api.snacks.deleteSnack(snackId);
      
      setSnacks(snacks.filter(snack => snack.id !== snackId));
      setShowDeleteModal(null);
      setMessage('Snack deleted successfully!');
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      
      setTimeout(() => {
        setMessage("");
      }, 3000);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to delete snack. Please try again.');
      setShowDeleteModal(null);
    } finally {
      setIsSubmitting(false);
    }
  };

 const fetchSnackReviews = async (snackId) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`http://localhost:8080/reviews/snack/${snackId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Handle different response formats
    if (Array.isArray(data)) {
      return data;
    } else if (data && typeof data === 'object') {
      return data.reviews || data.content || [];
    }
    return [];
  } catch (err) {
    console.error('Error fetching reviews:', err);
    return [];
  }
};
  const handleViewReviews = async (snack) => {
    setLoadingReviews(true);
    setViewingReviews(snack);
    
    try {
      const reviews = await fetchSnackReviews(snack.id);
      setViewingReviews(prev => ({
        ...prev,
        reviews: reviews
      }));
    } catch (err) {
      setError('Failed to load reviews. Please try again.');
    } finally {
      setLoadingReviews(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'APPROVED': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, text: 'Approved' },
      'PENDING_APPROVAL': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, text: 'Pending' },
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

  const getDifficultyIcon = (level) => {
    const levels = {
      'EASY': '🟢',
      'MEDIUM': '🟡',
      'HARD': '🔴',
    };
    return levels[level] || '🟢';
  };

  const getAverageRating = (reviews) => {
    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) return 0;
    
    const validReviews = reviews.filter(review => review.rating !== undefined);
    if (validReviews.length === 0) return 0;
    
    return validReviews.reduce((sum, review) => sum + review.rating, 0) / validReviews.length;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredSnacks = snacks.filter(snack => {
    if (filter === 'ALL') return true;
    return snack.status === filter;
  });
  
  const userRole = localStorage.getItem('role');

  if (!isAuthenticated || userRole !== 'VENDOR') {
    return <SessionExpired role="vendor" />;
  }


  if (!isVendor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Vendor Access Required</h2>
          <p className="text-gray-600">You need vendor privileges to manage snacks.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Loading your snacks...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-3">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mr-4">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">My Snack Products</h1>
                  <p className="text-white/90">Manage your vegan snack inventory</p>
                </div>
              </div>
      
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="p-6 border-b">
            <div className="flex flex-wrap gap-2">
              {['ALL', 'APPROVED', 'PENDING_APPROVAL', 'REJECTED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    filter === status
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'ALL' ? 'All Products' : status === 'APPROVED' ? 'Approved' : status === 'PENDING_APPROVAL' ? 'Pending Approval' : 'Rejected'}
                  <span className="ml-2 text-xs opacity-75">
                    ({status === 'ALL' ? snacks.length : snacks.filter(s => s.status === status).length})
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-6 p-4 bg-green-100 border border-green-200 text-green-700 rounded-lg flex items-center animate-fade-in">
            <CheckCircle className="h-5 w-5 mr-2" />
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg flex items-center animate-fade-in">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {/* Content */}
        {filteredSnacks.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No snacks found</h3>
            <p className="text-gray-500 mb-6">Start by adding your first vegan snack product.</p>
            <button 
              onClick={() => window.location.href = '/add-snack'}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              Add Your First Snack
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredSnacks.map((snack) => {
              const avgRating = getAverageRating(snack.reviews);
              
              return (
                <div key={snack.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
                  {/* Product Image at the top of card */}
                  {snack.productImage && (
                    <div className="h-48 overflow-hidden bg-gray-100">
                      <img 
                        src={snack.productImage} 
                        alt={snack.snackName}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
                        {snack.snackName}
                      </h3>
                      {getStatusBadge(snack.status)}
                    </div>
                    
                    <div className="space-y-2 mb-4 text-sm text-gray-600">
                      <p><span className="font-medium text-gray-800">Type:</span> {snack.snackType}</p>
                      <p><span className="font-medium text-gray-800">Category:</span> {snack.category}</p>
                      <p><span className="font-medium text-gray-800">Difficulty:</span> {getDifficultyIcon(snack.difficultyLevel)} {snack.difficultyLevel}</p>
                      <p><span className="font-medium text-gray-800">Prep Time:</span> {snack.preparationTime} mins</p>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      {avgRating > 0 && (
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="ml-1 text-sm text-gray-600">
                            {avgRating.toFixed(1)} ({Array.isArray(snack.reviews) ? snack.reviews.length : 0})
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                      {snack.description}
                    </p>

                    <div className="text-xs text-gray-500 mb-6 space-y-1">
                      <p>Created: {formatDate(snack.createdDate)}</p>
                      <p>Modified: {formatDate(snack.lastModified)}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setViewingSnack(snack)}
                        className="bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 flex items-center justify-center transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => handleViewReviews(snack)}
                        className="bg-purple-50 text-purple-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-purple-100 flex items-center justify-center transition-colors"
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Reviews 
                      </button>
                      <button
                        onClick={() => handleEdit(snack)}
                        className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 flex items-center justify-center transition-colors"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => setShowDeleteModal(snack.id)}
                        className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100 flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Reviews Modal */}
        {viewingReviews && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mr-4">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{viewingReviews.snackName}</h2>
                      <p className="text-white/90">Customer Reviews & Feedback</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewingReviews(null)}
                    className="text-white/70 hover:text-white p-2"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
                {loadingReviews ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Reviews</h3>
                    <p className="text-gray-500">Fetching customer reviews...</p>
                  </div>
                ) : viewingReviews.reviews && Array.isArray(viewingReviews.reviews) && viewingReviews.reviews.length > 0 ? (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Reviews Overview</h3>
                          <p className="text-gray-600">Total Reviews: {viewingReviews.reviews.length}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center justify-end mb-2">
                            <Star className="h-6 w-6 text-yellow-400 fill-current mr-2" />
                            <span className="text-2xl font-bold text-gray-900">
                              {getAverageRating(viewingReviews.reviews).toFixed(1)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">Average Rating</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Reviews</h3>
                      {viewingReviews.reviews.map((review, index) => (
                        <div key={index} className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-r from-emerald-200 to-green-200 rounded-full flex items-center justify-center mr-3">
                                <User className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {review.customer?.username || 'Customer'}
                                </p>
                                <div className="flex items-center mt-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < (review.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                  <span className="ml-2 text-sm text-gray-600">({review.rating || 0}/5)</span>
                                </div>
                                    <span className="ml-2 text-xs text-gray-500">
                                {formatDate(review.reviewDate)}
                              </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <p className="text-gray-700 leading-relaxed">
                              {review.reviewText || 'No comment provided'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reviews Yet</h3>
                    <p className="text-gray-500">This product hasn't received any customer reviews yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* View Modal - ADDED RECIPE INSTRUCTIONS SECTION */}
        {viewingSnack && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white sticky top-0">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mr-4">
                      <Leaf className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{viewingSnack.snackName}</h2>
                      <p className="text-white/90">{viewingSnack.snackType}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewingSnack(null)}
                    className="text-white/70 hover:text-white p-2"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-8">
                {/* Product Image at the top of View Modal */}
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
                  {/* Left Column */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Package className="h-5 w-5 mr-2 text-green-600" />
                        Product Details
                      </h3>
                      <div className="space-y-3 text-sm bg-gray-50 p-4 rounded-lg">
                        <p><span className="font-medium">Type:</span> {viewingSnack.snackType}</p>
                        <p><span className="font-medium">Category:</span> {viewingSnack.category}</p>
                        <p><span className="font-medium">Difficulty Level:</span> {viewingSnack.difficultyLevel}</p>
                        <p><span className="font-medium">Preparation Time:</span> {viewingSnack.preparationTime} minutes</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
                      <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">{viewingSnack.description}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Ingredients</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        {formatNumberedList(viewingSnack.ingredients)}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Nutritional Info</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        {formatNumberedList(viewingSnack.nutritionalInfo)}
                      </div>
                    </div>

                    {/* NEW: Recipe Instructions Section */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-green-600" />
                        Receipe Instructions
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        {formatInstructions(viewingSnack.receipeInstructions)}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Status & Dates</h3>
                      <div className="space-y-3 text-sm bg-gray-50 p-4 rounded-lg">
                        <p><span className="font-medium">Status:</span> <span className="ml-2">{getStatusBadge(viewingSnack.status)}</span></p>
                        <p><span className="font-medium">Created:</span> {formatDate(viewingSnack.createdDate)}</p>
                        <p><span className="font-medium">Last Modified:</span> {formatDate(viewingSnack.lastModified)}</p>
                        {viewingSnack.approvalDate && (
                          <p><span className="font-medium">Approved:</span> {formatDate(viewingSnack.approvalDate)}</p>
                        )}
                      </div>
                    </div>

                    {/* Reviews Summary in View Modal */}
                    {viewingSnack.reviews && viewingSnack.reviews.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <Star className="h-5 w-5 mr-2 text-yellow-400 fill-current" />
                          Customer Reviews Summary
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <Star className="h-5 w-5 text-yellow-400 fill-current mr-1" />
                              <span className="font-semibold text-lg">
                                {getAverageRating(viewingSnack.reviews).toFixed(1)}
                              </span>
                              <span className="text-gray-600 ml-1">out of 5</span>
                            </div>
                            <span className="text-sm text-gray-600">
                              {viewingSnack.reviews.length} review{viewingSnack.reviews.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <button
                            onClick={async () => {
                              setViewingSnack(null);
                              await handleViewReviews(viewingSnack);
                            }}
                            className="w-full bg-purple-50 text-purple-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors"
                          >
                            View All Reviews
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingSnack && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white sticky top-0">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mr-4">
                      <Edit className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Edit Snack Product</h2>
                      <p className="text-white/90">Update your vegan snack details</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingSnack(null)}
                    className="text-white/70 hover:text-white p-2 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {Object.keys(editErrors).length > 0 && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                    <div className="flex items-center mb-2">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      <p className="font-medium">Please fix the following errors:</p>
                    </div>
                    <ul className="list-disc list-inside text-sm space-y-1 ml-6">
                      {Object.values(editErrors).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Snack Name *
                      </label>
                      <input
                        type="text"
                        name="snackName"
                        value={editingSnack.snackName}
                        onChange={handleEditChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                          editErrors.snackName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter snack name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Snack Type *
                      </label>
                      <input
                        type="text"
                        name="snackType"
                        value={editingSnack.snackType}
                        onChange={handleEditChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                          editErrors.snackType ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="e.g., Cookies, Chips, Bars"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        name="category"
                        value={editingSnack.category}
                        onChange={handleEditChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                          editErrors.category ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select Category</option>
                        <option value="Chips & Crisps">Chips & Crisps</option>
                        <option value="Cookies & Biscuits">Cookies & Biscuits</option>
                        <option value="Energy Bars">Energy Bars</option>
                        <option value="Nuts & Seeds">Nuts & Seeds</option>
                        <option value="Dried Fruits">Dried Fruits</option>
                        <option value="Protein Snacks">Protein Snacks</option>
                        <option value="Chocolate & Sweets">Chocolate & Sweets</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Difficulty Level *
                      </label>
                      <select
                        name="difficultyLevel"
                        value={editingSnack.difficultyLevel}
                        onChange={handleEditChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                          editErrors.difficultyLevel ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select Difficulty Level</option>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preparation Time (minutes) *
                      </label>
                      <input
                        type="number"
                        name="preparationTime"
                        value={editingSnack.preparationTime}
                        onChange={handleEditChange}
                        min="1"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                          editErrors.preparationTime ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="30"
                      />
                    </div>

                    {/* <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity Available *
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        value={editingSnack.quantity}
                        onChange={handleEditChange}
                        min="0"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                          editErrors.quantity ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="0"
                      />
                    </div> */}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                      </label>
                      <textarea
                        name="description"
                        value={editingSnack.description}
                        onChange={handleEditChange}
                        rows="3"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                          editErrors.description ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Describe your snack product"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ingredients *
                      </label>
                      <textarea
                        name="ingredients"
                        value={editingSnack.ingredients}
                        onChange={handleEditChange}
                        rows="3"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                          editErrors.ingredients ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="List all ingredients (comma separated)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nutritional Information *
                      </label>
                      <textarea
                        name="nutritionalInfo"
                        value={editingSnack.nutritionalInfo}
                        onChange={handleEditChange}
                        rows="3"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                          editErrors.nutritionalInfo ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Nutrition facts and information (comma separated)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Receipe Instructions *
                      </label>
                      <textarea
                        name="receipeInstructions"
                        value={editingSnack.receipeInstructions || ''}
                        onChange={handleEditChange}
                        rows="3"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                          editErrors.receipeInstructions ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Step 1, Step 2, Step 3 (comma separated)"
                      />
                    </div>

                    {editingSnack.productImage && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Image
                        </label>
                        <img 
                          src={editingSnack.productImage} 
                          alt={editingSnack.snackName}
                          className="max-w-full h-32 object-contain rounded-lg border"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex justify-end space-x-4">
                  <button
                    onClick={() => setEditingSnack(null)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Update Snack
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
                    <p className="text-gray-600">This action cannot be undone</p>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-6">
                  Are you sure you want to delete this snack product? All associated data will be permanently removed.
                </p>
                
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowDeleteModal(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(showDeleteModal)}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SnackInventoryManager;