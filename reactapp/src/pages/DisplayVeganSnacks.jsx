import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, Star, Search, User, Eye, X, AlertCircle, 
  CheckCircle, MessageSquare, Send, Clock, Leaf, FileText,
  Calendar, Award, SortAsc, Timer, ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import { useScrollToTop } from '../hooks/useScrollToTop';
import SessionExpired from '../components/SessionExpired';
const DisplayVeganSnacks = () => {
  useScrollToTop();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('latest');
  const [sortOrder, setSortOrder] = useState('desc');
  const [categories, setCategories] = useState([]);
  const [imageErrors, setImageErrors] = useState({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [productToReview, setProductToReview] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState('');
  const [reviewedProducts, setReviewedProducts] = useState(new Set());
  const [reviewCheckComplete, setReviewCheckComplete] = useState(false);

  // Clear messages
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  const getAuthToken = () => localStorage.getItem('token');
  const isAuthenticated = !!getAuthToken();
  const userId = localStorage.getItem('userId');

  // Fetch current user name
  const fetchCurrentUserName = async () => {
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
        const name = userData.name || userData.username || userData.email || 'User';
        setCurrentUserName(name);
        localStorage.setItem('userName', name);
      }
    } catch (err) {
      console.error('Error fetching user name:', err);
    }
  };

  // OPTIMIZED: Fetch all products reviewed by the current customer (ONE API call)
  const fetchUserReviewedProducts = async () => {
    try {
      const token = getAuthToken();
      if (!token || !currentUserId) return new Set();
      
      const response = await fetch(`http://localhost:8080/reviews/customer/${currentUserId}/products`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const reviewedProductsList = await response.json();
        // Create a Set of product IDs that the user has reviewed
        const reviewedProductIds = new Set(
          reviewedProductsList.map(product => product.id)
            .filter(id => id != null)
        );
        return reviewedProductIds;
      }
    } catch (err) {
      console.error('Error fetching user reviewed products:', err);
    }
    return new Set();
  };

  // OPTIMIZED: Get all products with their reviews in minimal API calls
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const token = getAuthToken();
      if (!token) throw new Error('Authentication required');

      // Fetch approved snacks
      const snacksResponse = await fetch('http://localhost:8080/snacks/approved', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!snacksResponse.ok) {
        if (snacksResponse.status === 401) throw new Error('Session expired');
        throw new Error('Failed to fetch products');
      }
      
      let snacks = await snacksResponse.json();
      
      // If backend doesn't include reviews, fetch them in batch
      if (snacks.length > 0 && !snacks[0].productReviews) {
        // Fetch all reviews for all snacks in ONE batch call
        const snackIds = snacks.map(s => s.id);
        
        const reviewsResponse = await fetch('http://localhost:8080/reviews/batch', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(snackIds)
        });
        
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          // Attach reviews to corresponding snacks
          snacks = snacks.map(snack => ({
            ...snack,
            productReviews: reviewsData[snack.id] || []
          }));
        } else {
          // Fallback: initialize empty reviews
          snacks = snacks.map(snack => ({ ...snack, productReviews: [] }));
        }
      }
      
      setProducts(snacks);
      
      // Get unique categories
      const uniqueCategories = [...new Set(snacks.map(p => p.category).filter(Boolean))];
      setCategories(uniqueCategories);
      
    } catch (err) {
      setError(err.message || 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Check which products the user has reviewed
  const checkUserReviewedProducts = async () => {
    if (!currentUserId || products.length === 0) {
      setReviewCheckComplete(true);
      return;
    }
    
    try {
      // Single API call to get all products reviewed by the user
      const reviewedProductIds = await fetchUserReviewedProducts();
      setReviewedProducts(reviewedProductIds);
    } catch (err) {
      console.error('Error checking reviewed products:', err);
    } finally {
      setReviewCheckComplete(true);
    }
  };

  // Load all data when component mounts
  useEffect(() => {
    if (isAuthenticated && userId) {
      setCurrentUserId(parseInt(userId));
      fetchCurrentUserName();
      fetchProducts();
    } else {
      setLoading(false);
      setReviewCheckComplete(true);
    }
  }, [isAuthenticated, userId]);

  // Check reviewed products after products are loaded
  useEffect(() => {
    if (products.length > 0 && currentUserId) {
      checkUserReviewedProducts();
    } else if (products.length === 0) {
      setReviewCheckComplete(true);
    }
  }, [products, currentUserId]);

  const hasUserReviewed = (productId) => {
    return reviewedProducts.has(productId);
  };

  const submitReview = async () => {
    const userIdNum = currentUserId || (userId ? parseInt(userId) : null);
    const userName = currentUserName || localStorage.getItem('userName') || 'User';
    const userEmail = localStorage.getItem('userEmail') || '';
    
    if (!productToReview || !productToReview.id) {
      setError('Please select a product to review.');
      return;
    }

    if (!userIdNum) {
      setError('User information not found. Please login again.');
      return;
    }

    if (!reviewText || reviewText.trim().length === 0) {
      setError('Please write a review.');
      return;
    }

    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      setError('Please provide a valid rating (1-5 stars).');
      return;
    }

    try {
      setSubmittingReview(true);
      const token = getAuthToken();
      
      if (!token) {
        setError('Authentication token not found. Please login again.');
        setSubmittingReview(false);
        return;
      }

      const reviewData = {
        rating: reviewRating,
        reviewText: reviewText.trim(),
        veganSnack: { id: productToReview.id },
        customer: { 
          id: userIdNum,
          username: userName,
          email: userEmail
        }
      };

      const response = await fetch('http://localhost:8080/reviews', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewData)
      });
      
      if (response.status === 409) {
        setShowReviewModal(false);
        setError('You have already reviewed this snack. You can only review a snack once.');
        setTimeout(() => setError(''), 4000);
        setReviewedProducts(prev => new Set([...prev, productToReview.id]));
        return;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        setError(`Error: ${response.status} - ${errorText}`);
        return;
      }

      const savedReview = await response.json();
      
      // Update products state with the new review
      const updatedProducts = products.map(product => {
        if (product.id === productToReview.id) {
          const updatedReviews = [...(product.productReviews || []), savedReview];
          return { ...product, productReviews: updatedReviews };
        }
        return product;
      });
      
      setProducts(updatedProducts);
      setReviewedProducts(prev => new Set([...prev, productToReview.id]));
      
      if (selectedProduct && selectedProduct.id === productToReview.id) {
        setSelectedProduct({
          ...selectedProduct,
          productReviews: [...(selectedProduct.productReviews || []), savedReview]
        });
      }
      
      setShowReviewModal(false);
      setReviewText('');
      setReviewRating(5);
      setProductToReview(null);
      setMessage('Review submitted successfully! Thank you for your feedback!');
      
    } catch (err) {
      console.error('Network error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const openReviewModal = (product) => {
    if (hasUserReviewed(product.id)) {
      setError('You have already reviewed this snack. You can only review a snack once.');
      setTimeout(() => setError(''), 4000);
      return;
    }
    setProductToReview(product);
    setShowReviewModal(true);
  };

  const handleImageError = (productId) => {
    setImageErrors(prev => ({ ...prev, [productId]: true }));
  };

  const getAverageRating = (reviews) => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + (review.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
  };

  const renderStars = (rating, size = "h-4 w-4") => (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} ${
            star <= rating
              ? 'text-yellow-400 fill-current'
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Recently';
    }
  };

  const formatNumberedList = (text) => {
    if (!text || text.trim() === '') return <p className="text-gray-500 italic">Not provided</p>;
    
    const items = text.split(',').map(item => item.trim()).filter(item => item !== '');
    
    if (items.length === 0) return <p className="text-gray-500 italic">Not provided</p>;
    
    return (
      <ol className="list-decimal list-inside space-y-2 ml-2">
        {items.map((item, index) => (
          <li key={index} className="text-gray-700">{item}</li>
        ))}
      </ol>
    );
  };

  const formatInstructions = (instructions) => {
    if (!instructions || instructions.trim() === '') return <p className="text-gray-500 italic">No instructions provided</p>;
    
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

  const getSortedProducts = (productsToSort) => {
    const sorted = [...productsToSort];
    let result = [];
    
    switch(sortBy) {
      case 'rating':
        result = sorted.sort((a, b) => {
          const ratingA = getAverageRating(a.productReviews);
          const ratingB = getAverageRating(b.productReviews);
          return ratingB - ratingA;
        });
        break;
      case 'name':
        result = sorted.sort((a, b) => (a.snackName || '').localeCompare(b.snackName || ''));
        break;
      case 'prepTime':
        result = sorted.sort((a, b) => (a.preparationTime || 0) - (b.preparationTime || 0));
        break;
      case 'latest':
      default:
        result = sorted.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
        break;
    }
    
    if (sortOrder === 'asc') {
      return result.reverse();
    }
    return result;
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  const handleSortChange = (type) => {
    if (sortBy === type) {
      toggleSortOrder();
    } else {
      setSortBy(type);
      setSortOrder('desc');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.snackName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'ALL' || product.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const sortedProducts = getSortedProducts(filteredProducts);

  const getSortIcon = (type) => {
    if (sortBy !== type) return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    return sortOrder === 'desc' ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />;
  };

  // Authentication check
//   if (!isAuthenticated) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
//         <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md">
//           <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
//             <X className="w-8 h-8 text-red-600" />
//           </div>
//           <h2 className="text-2xl font-bold text-gray-800 mb-4">Please Login</h2>
//           <p className="text-gray-600 mb-6">You need to login to view and review products.</p>
//           <button 
//             onClick={() => window.location.href = '/auth'}
//             className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-3 rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all duration-200 font-medium"
//           >
//             Go to Login
//           </button>
//         </div>
//       </div>
//     );
//   }


  if (!isAuthenticated) {
    return <SessionExpired role="user" />;
  }

  // Keep loading until products are fetched AND review check is complete
  if (loading || !reviewCheckComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center pt-20">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Loading delicious vegan snacks...</h2>
          <p className="text-gray-500 mt-2">Please wait while we load your preferences</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 pt-2">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mr-4">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Vegan Snacks</h1>
                  <p className="text-white/90">Discover and review plant-based snacks</p>
                </div>
              </div>
              <Leaf className="h-8 w-8 text-white/50" />
            </div>
          </div>

          {/* Search, Filters and Sorting */}
          <div className="p-6 border-b">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search snacks by name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                
                <div className="w-full sm:w-48">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                  >
                    <option value="ALL">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Sorting Options */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSortChange('latest')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    sortBy === 'latest'
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  Latest First
                  {getSortIcon('latest')}
                </button>
                <button
                  onClick={() => handleSortChange('rating')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    sortBy === 'rating'
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Award className="h-4 w-4" />
                  Top Rated
                  {getSortIcon('rating')}
                </button>
                <button
                  onClick={() => handleSortChange('name')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    sortBy === 'name'
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <SortAsc className="h-4 w-4" />
                  Name A-Z
                  {getSortIcon('name')}
                </button>
                <button
                  onClick={() => handleSortChange('prepTime')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    sortBy === 'prepTime'
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Timer className="h-4 w-4" />
                  Prep Time
                  {getSortIcon('prepTime')}
                </button>
              </div>
              
              <div className="text-sm text-gray-500">
                Found {sortedProducts.length} {sortedProducts.length === 1 ? 'snack' : 'snacks'}
              </div>
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

        {/* Products Grid */}
        {sortedProducts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">
              {searchQuery || categoryFilter !== 'ALL' 
                ? 'Try adjusting your search, filter, or sort criteria.' 
                : 'No approved products are available yet.'
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedProducts.map((product) => {
              const reviewed = hasUserReviewed(product.id);
              const userReview = product.productReviews?.find(
                review => review.customer?.id === currentUserId
              );
              
              return (
                <div key={product.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
                  <div className="h-56 overflow-hidden bg-gradient-to-br from-emerald-100 to-green-100 relative">
                    {product.productImage && !imageErrors[product.id] ? (
                      <img 
                        src={product.productImage} 
                        alt={product.snackName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={() => handleImageError(product.id)}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-500 flex flex-col items-center justify-center">
                        <Package className="h-16 w-16 text-white/80 mb-2" />
                        <span className="text-white/60 text-sm">No Image</span>
                      </div>
                    )}
                    
                    <div className="absolute top-3 right-3">
                      <span className="bg-white/90 backdrop-blur-sm text-gray-700 px-2.5 py-1 rounded-lg text-xs font-medium shadow-sm">
                        {product.category || 'Snack'}
                      </span>
                    </div>
                    
                    {/* Show user's rating badge if reviewed */}
                    {reviewed && userReview && (
                      <div className="absolute top-3 left-3 bg-emerald-500 text-white px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                        <Star className="h-3 w-3 fill-current" />
                        <span className="text-xs font-medium">Your rating: {userReview.rating}</span>
                      </div>
                    )}
                    
                    {product.productReviews && product.productReviews.length > 0 && (
                      <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-yellow-400 fill-current" />
                        <span className="text-xs font-medium">{getAverageRating(product.productReviews)}</span>
                        <span className="text-xs text-gray-300">({product.productReviews.length})</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="mb-3">
                      <h3 className="text-xl font-semibold text-gray-900 line-clamp-1">
                        {product.snackName || 'Unnamed Snack'}
                      </h3>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {product.description?.substring(0, 100)}{product.description && product.description.length > 100 ? '...' : ''}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
                      {product.snackType && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Package className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-gray-700">{product.snackType}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="h-3.5 w-3.5 text-emerald-500" />
                        <span>{product.preparationTime || 'N/A'} mins</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600 col-span-2">
                        <span className="font-medium text-gray-800">Difficulty:</span>
                        <span>
                          {product.difficultyLevel === 'EASY' && '🟢 Easy'}
                          {product.difficultyLevel === 'MEDIUM' && '🟡 Medium'}
                          {product.difficultyLevel === 'HARD' && '🔴 Hard'}
                          {!product.difficultyLevel && 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 flex items-center justify-center gap-2 transition-all duration-200"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </button>
                      
                      {/* Show Write Review button ONLY if NOT reviewed */}
                      {!reviewed && (
                        <button
                          onClick={() => openReviewModal(product)}
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:from-emerald-600 hover:to-green-700 flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Write Review
                        </button>
                      )}
                      
                      {/* Show Already Reviewed badge if reviewed */}
                      {reviewed && (
                        <div className="flex-1 bg-emerald-50 text-emerald-600 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 border border-emerald-200">
                          <CheckCircle className="h-4 w-4" />
                          Already Reviewed
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && productToReview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-6 text-white sticky top-0">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mr-4">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Write a Review</h2>
                      <p className="text-white/90 line-clamp-1">{productToReview.snackName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowReviewModal(false);
                      setProductToReview(null);
                      setReviewText('');
                      setReviewRating(5);
                    }}
                    className="text-white/70 hover:text-white p-2 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Your Rating
                  </label>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="focus:outline-none hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`h-8 w-8 ${
                            star <= reviewRating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-gray-700 font-medium">
                      {reviewRating} {reviewRating === 1 ? 'star' : 'stars'}
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Review
                  </label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your experience with this recipe. What did you like or dislike?"
                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    maxLength={500}
                  />
                  <div className="text-right mt-1 text-xs text-gray-500">
                    {reviewText.length}/500 characters
                  </div>
                </div>

                <button
                  onClick={submitReview}
                  disabled={submittingReview || !reviewText.trim()}
                  className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center transition-all ${
                    submittingReview || !reviewText.trim()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700'
                  }`}
                >
                  {submittingReview ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Review
                    </>
                  )}
                </button>
                
                <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                  <p className="text-xs text-emerald-800">
                    <strong className="text-emerald-900">Tips for a great review:</strong> Be specific about what you liked or didn't like. Mention taste, texture, and ease of preparation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Details Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-6 text-white sticky top-0">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mr-4">
                      <Package className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{selectedProduct.snackName}</h2>
                      <p className="text-white/90">Snack Details</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="text-white/70 hover:text-white p-2 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-5">
                    <div className="h-64 bg-gray-100 rounded-xl overflow-hidden">
                      {selectedProduct.productImage && !imageErrors[selectedProduct.id] ? (
                        <img 
                          src={selectedProduct.productImage} 
                          alt={selectedProduct.snackName}
                          className="w-full h-full object-cover"
                          onError={() => handleImageError(selectedProduct.id)}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                          <Package className="h-16 w-16 text-white/80" />
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Package className="h-5 w-5 mr-2 text-emerald-600" />
                        Product Information
                      </h3>
                      <div className="space-y-2 text-sm bg-gray-50 p-4 rounded-lg">
                        <p><span className="font-medium">Name:</span> {selectedProduct.snackName || 'N/A'}</p>
                        <p><span className="font-medium">Type:</span> {selectedProduct.snackType || 'N/A'}</p>
                        <p><span className="font-medium">Category:</span> {selectedProduct.category || 'N/A'}</p>
                        <p><span className="font-medium">Difficulty:</span> {selectedProduct.difficultyLevel || 'N/A'}</p>
                        <p><span className="font-medium">Prep Time:</span> {selectedProduct.preparationTime || 'N/A'} mins</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Ingredients</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        {formatNumberedList(selectedProduct.ingredients)}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-5">
                    {selectedProduct.description && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
                        <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                          {selectedProduct.description}
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-emerald-600" />
                        Recipe Instructions
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        {formatInstructions(selectedProduct.receipeInstructions)}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Nutritional Information</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        {formatNumberedList(selectedProduct.nutritionalInfo)}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-gray-900">
                          Customer Reviews ({selectedProduct.productReviews?.length || 0})
                        </h3>
                        {selectedProduct.productReviews && selectedProduct.productReviews.length > 0 && (
                          <div className="flex items-center">
                            {renderStars(getAverageRating(selectedProduct.productReviews), "h-4 w-4")}
                            <span className="ml-2 text-sm font-medium text-gray-700">
                              {getAverageRating(selectedProduct.productReviews)}/5
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        {selectedProduct.productReviews && selectedProduct.productReviews.length > 0 ? (
                          selectedProduct.productReviews.map((review, index) => {
                            const isUserReview = review.customer?.id === currentUserId;
                            return (
                              <div key={review.id || index} className={`border p-3 rounded-lg transition-colors ${
                                isUserReview ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 hover:bg-gray-50'
                              }`}>
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center">
                                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-2">
                                      <User className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900 text-sm">
                                        {review.customer?.username || 'Customer'}
                                        {isUserReview && (
                                          <span className="ml-2 text-xs text-emerald-600 font-normal">(You)</span>
                                        )}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {formatDate(review.reviewDate)}
                                      </p>
                                    </div>
                                  </div>
                                  {renderStars(review.rating, "h-4 w-4")}
                                </div>
                                <p className="text-gray-700 text-sm mt-1">{review.reviewText}</p>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center text-gray-500 py-6 bg-gray-50 rounded-lg">
                            <MessageSquare className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                            <p className="text-sm">No reviews yet</p>
                            <p className="text-xs mt-1">Be the first to review!</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Show Write Review button in modal only if NOT reviewed */}
                    {!hasUserReviewed(selectedProduct.id) && (
                      <button
                        onClick={() => {
                          setSelectedProduct(null);
                          openReviewModal(selectedProduct);
                        }}
                        className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-2 rounded-lg font-medium hover:from-emerald-600 hover:to-green-700 flex items-center justify-center transition-all duration-200"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Write a Review
                      </button>
                    )}
                  </div>
                </div>
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
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
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

export default DisplayVeganSnacks;