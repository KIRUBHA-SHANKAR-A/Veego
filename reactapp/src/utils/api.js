const API_BASE_URL = 'http://localhost:8080';

// Global flag to prevent multiple redirects
let isRedirecting = false;

// Generic API call function
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get token from localStorage
  const token = getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add Authorization header if token exists
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const text = await response.text();
    
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }

    if (!response.ok) {
      // Handle specific status codes
      if (response.status === 401) {
        // Token expired or invalid - logout and redirect to home
        console.warn('Token expired or invalid. Logging out...');
        logoutAndRedirect();
        throw new Error('Session expired. Please login again.');
      }
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// Generic GET request
async function get(endpoint) {
  return apiCall(endpoint, { method: 'GET' });
}

// Generic POST request
async function post(endpoint, body) {
  return apiCall(endpoint, { method: 'POST', body });
}

// Generic PUT request
async function put(endpoint, body) {
  return apiCall(endpoint, { method: 'PUT', body });
}

// Generic DELETE request
async function del(endpoint) {
  return apiCall(endpoint, { method: 'DELETE' });
}

// Function to logout and redirect to home
export const logoutAndRedirect = () => {
  // Prevent multiple redirects
  if (isRedirecting) return;
  isRedirecting = true;
  
  // Clear all auth data
  removeAuthToken();
  
  // Check if we're not already on home page
  const currentPath = window.location.pathname;
  if (currentPath !== '/' && currentPath !== '/home') {
    // Redirect to home page
    window.location.href = '/';
  }
  
  // Reset redirect flag after a delay
  setTimeout(() => {
    isRedirecting = false;
  }, 1000);
};

// Auth API functions
export const authAPI = {
  // User login
  userLogin: (email, password) => 
    apiCall('/auth/user/login', {
      method: 'POST',
      body: { email, password }
    }),

  // Vendor login
  vendorLogin: (email, password) => 
    apiCall('/auth/vendor/login', {
      method: 'POST',
      body: { email, password }
    }),

  // User registration
  userRegister: (userData) => 
    apiCall('/auth/user/register', {
      method: 'POST',
      body: userData
    }),

  // Vendor registration
  vendorRegister: (vendorData) => 
    apiCall('/auth/vendor/register', {
      method: 'POST',
      body: vendorData
    }),
};

// Vendor API functions
export const vendorAPI = {
  // Get vendor by ID
  getVendorById: (vendorId) => 
    apiCall(`/vendor/${vendorId}`, {
      method: 'GET',
    }),
  
    getVendorNameById: (vendorId) => 
    apiCall(`/vendor/${vendorId}/name`, {
      method: 'GET',
    }),
  // Update vendor profile
  updateVendor: (vendorId, vendorData) => 
    apiCall(`/vendor/${vendorId}`, {
      method: 'PUT',
      body: vendorData,
    }),
  
  // Get vendor stats
  getVendorStats: (vendorId) => 
    apiCall(`/vendor/${vendorId}/stats`, {
      method: 'GET',
    }),
};

// Snack API functions
export const snackAPI = {
  // Get all snacks
  getAllSnacks: () => 
    apiCall('/snacks', {
      method: 'GET',
    }),

  // Get snack by ID
  getSnackById: (id) => 
    apiCall(`/snacks/${id}`, {
      method: 'GET',
    }),

  // Get snacks by vendor ID
  getSnacksByVendor: (vendorId) => 
    apiCall(`/snacks/vendor/${vendorId}`, {
      method: 'GET',
    }),

  // Create new snack (for vendors)
  createSnack: (snackData) => 
    apiCall('/snacks', {
      method: 'POST',
      body: snackData,
    }),

  // Update snack (for vendors)
  updateSnack: (id, snackData) => 
    apiCall(`/snacks/${id}`, {
      method: 'PUT',
      body: snackData,
    }),

  // Delete snack (for vendors)
  deleteSnack: (id) => 
    apiCall(`/snacks/${id}`, {
      method: 'DELETE',
    }),

  // Get snacks by category
  getSnacksByCategory: (category) => 
    apiCall(`/snacks/category/${category}`, {
      method: 'GET',
    }),

  // Get snacks by difficulty level
  getSnacksByDifficulty: (difficulty) => 
    apiCall(`/snacks/difficulty/${difficulty}`, {
      method: 'GET',
    }),

  // Search snacks
  searchSnacks: (query) => 
    apiCall(`/snacks/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
    }),
};

// Review API functions
export const reviewAPI = {
  // Get reviews for a snack
  getReviewsBySnack: (snackId) => 
    apiCall(`/reviews/snack/${snackId}`, {
      method: 'GET',
    }),

  // Get reviews by user
  getReviewsByUser: (userId) => 
    apiCall(`/reviews/user/${userId}`, {
      method: 'GET',
    }),

  // Create a review (for users)
  createReview: (reviewData) => 
    apiCall('/reviews', {
      method: 'POST',
      body: reviewData,
    }),

  // Update a review (for users)
  updateReview: (id, reviewData) => 
    apiCall(`/reviews/${id}`, {
      method: 'PUT',
      body: reviewData,
    }),

  // Delete a review (for users or admins)
  deleteReview: (id) => 
    apiCall(`/reviews/${id}`, {
      method: 'DELETE',
    }),
};

// Admin API functions
export const adminAPI = {
  // Get all snacks (admin)
  getAllSnacksAdmin: () => 
    apiCall('/admin/snacks', {
      method: 'GET',
    }),

  // Approve snack (admin)
  approveSnack: (snackId) => 
    apiCall(`/admin/snacks/${snackId}/approve`, {
      method: 'PUT',
    }),

  // Reject snack (admin)
  rejectSnack: (snackId, reason) => 
    apiCall(`/admin/snacks/${snackId}/reject`, {
      method: 'PUT',
      body: { reason },
    }),

  // Get all vendors (admin)
  getAllVendors: () => 
    apiCall('/admin/vendors', {
      method: 'GET',
    }),

  // Toggle vendor status (admin)
  toggleVendorStatus: (vendorId) => 
    apiCall(`/admin/vendors/${vendorId}/toggle-status`, {
      method: 'PUT',
    }),
};

// Store token in localStorage
export const setAuthToken = (token, role, id, name = '', email = '') => {
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
  }
};

// Get token from localStorage
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Get user role
export const getUserRole = () => {
  return localStorage.getItem('role');
};

// Get user/vendor ID
export const getUserId = () => {
  const role = getUserRole();
  if (role === 'USER') {
    return localStorage.getItem('userId');
  } else if (role === 'VENDOR') {
    return localStorage.getItem('vendorId');
  }
  return null;
};

// Get user/vendor name
export const getUserName = () => {
  const role = getUserRole();
  if (role === 'USER') {
    return localStorage.getItem('userName') || 'User';
  } else if (role === 'VENDOR') {
    return localStorage.getItem('vendorName') || 'Vendor';
  }
  return 'Guest';
};

// Get user/vendor email
export const getUserEmail = () => {
  const role = getUserRole();
  if (role === 'USER') {
    return localStorage.getItem('userEmail') || '';
  } else if (role === 'VENDOR') {
    return localStorage.getItem('vendorEmail') || '';
  }
  return '';
};

// Remove token from localStorage (logout)
export const removeAuthToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('userId');
  localStorage.removeItem('vendorId');
  localStorage.removeItem('userName');
  localStorage.removeItem('vendorName');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('vendorEmail');
  localStorage.removeItem('vendorName');
  localStorage.removeItem('productManagerName');
};

export const isTokenExpired = () => {
  const token = getAuthToken();
  if (!token) return true;
  
  try {
    // If your JWT contains exp field
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expired = payload.exp * 1000 < Date.now();
    
    if (expired) {
      removeAuthToken();
      return true;
    }
    return false;
  } catch {
    return true;
  }
};


// Check if user is authenticated
export const isAuthenticated = () => {
  const token = getAuthToken();

  // No token
  if (!token) return false;

  try {
    // Decode JWT payload
    const payload = JSON.parse(atob(token.split('.')[1]));

    // Check expiry
    const isExpired = payload.exp * 1000 < Date.now();

    if (isExpired) {
      // Remove everything
      removeAuthToken();

      // Redirect to home
      window.location.href = '/';

      return false;
    }

    return true;

  } catch (error) {
    // Invalid token
    removeAuthToken();
    window.location.href = '/';
    return false;
  }
};

// Check if user is vendor
export const isVendor = () => {
  return getUserRole() === 'VENDOR';
};

// Check if user is admin
export const isAdmin = () => {
  return getUserRole() === 'ADMIN';
};

// Check if user is product manager
export const isProductManager = () => {
  return getUserRole() === 'PRODUCT_MANAGER';
};

// Manual logout function (for user-initiated logout)
export const logout = () => {
  removeAuthToken();
  window.location.href = '/';
};

// Default export for convenience
const api = {
  get,
  post,
  put,
  delete: del,
  auth: authAPI,
  vendors: vendorAPI,
  snacks: snackAPI,
  reviews: reviewAPI,
  admin: adminAPI,
  setAuthToken,
  getAuthToken,
  removeAuthToken,
  isAuthenticated,
  getUserRole,
  getUserId,
  getUserName,
  getUserEmail,
  isVendor,
  isAdmin,
  isProductManager,
  logout,
  logoutAndRedirect,
};

export default api;