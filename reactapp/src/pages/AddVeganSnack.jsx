import React, { useState, useEffect } from 'react';
import { Leaf, X, Upload } from 'lucide-react';
import { useScrollToTop } from '../hooks/useScrollToTop';
import api, { isVendor, isAuthenticated, getUserId } from '../utils/api';
import SessionExpired from '../components/SessionExpired';

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

export default function AddVeganSnack() {
  useScrollToTop();
  
  // Inject global styles
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = globalStyles;
    document.head.appendChild(styleElement);
    
    document.body.classList.add('no-margin');
    
    return () => {
      document.head.removeChild(styleElement);
      document.body.classList.remove('no-margin');
    };
  }, []);

  const [form, setForm] = useState({
    snackName: '',
    snackType: '',
    description: '',
    ingredients: '',
    nutritionalInfo: '',
    category: '',
    productImage: '',
    vendorId: '',
    receipeInstructions: '',
    preparationTime: '',
    difficultyLevel: ''
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Auth state
  const [authChecked, setAuthChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      const vendor = isVendor();
      
      console.log('Auth Check - Authenticated:', authenticated, 'IsVendor:', vendor);
      
      if (authenticated && vendor) {
        setHasAccess(true);
      } else {
        setHasAccess(false);
      }
      setAuthChecked(true);
    };
    
    checkAuth();
  }, []);

  // Show loading while checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show SessionExpired if not authenticated or not vendor
  if (!hasAccess) {
    return <SessionExpired role="vendor" />;
  }

  const validate = () => {
    const errs = {};
    if (!form.snackName.trim()) errs.snackName = 'Snack Name is required';
    if (!form.snackType.trim()) errs.snackType = 'Snack Type is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.ingredients.trim()) errs.ingredients = 'Ingredients are required';
    if (!form.nutritionalInfo.trim()) errs.nutritionalInfo = 'Nutritional information is required';
    if (!form.category) errs.category = 'Category is required';
    if (!form.receipeInstructions?.trim()) errs.receipeInstructions = 'Receipe instructions are required';
    if (!form.preparationTime) errs.preparationTime = 'Preparation time is required';
    if (form.preparationTime && form.preparationTime <= 0) errs.preparationTime = 'Preparation time must be greater than 0';
    if (!form.difficultyLevel) errs.difficultyLevel = 'Difficulty level is required';
    if (!imageFile && !form.productImage) errs.productImage = 'Product image is required';
    
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    
    setMessage('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setErrors({ ...errors, productImage: 'Please upload a valid image file (JPEG, PNG, GIF, or WEBP)' });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, productImage: 'Image size should be less than 5MB' });
        return;
      }
      
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      if (errors.productImage) {
        setErrors({ ...errors, productImage: '' });
      }
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview('');
    setImageFile(null);
    setForm({...form, productImage: ''});
  };

  const showTemporaryMessage = (msg, isError = false) => {
    setMessage(msg);
    setTimeout(() => {
      setMessage('');
    }, 3000);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    setMessage('');

    if (Object.keys(errs).length === 0) {
      setIsSubmitting(true);
      try {
        // Re-check authentication before submission
        if (!isAuthenticated()) {
          throw new Error('Please login first');
        }

        if (!isVendor()) {
          throw new Error('You need vendor privileges to add snacks');
        }

        const vendorId = getUserId();
        if (!vendorId) {
          throw new Error('Vendor information not found. Please login again.');
        }

        let base64Image = '';
        
        if (imageFile) {
          setIsUploading(true);
          try {
            base64Image = await convertToBase64(imageFile);
            console.log('Image converted to base64 successfully');
          } catch (uploadError) {
            throw new Error('Failed to process image: ' + uploadError.message);
          } finally {
            setIsUploading(false);
          }
        }

        const dataToSend = {
          snackName: form.snackName,
          snackType: form.snackType,
          description: form.description,
          ingredients: form.ingredients,
          nutritionalInfo: form.nutritionalInfo,
          category: form.category,
          productImage: base64Image,
          vendorId: parseInt(vendorId),
          receipeInstructions: form.receipeInstructions,
          preparationTime: Number(form.preparationTime),
          difficultyLevel: form.difficultyLevel
        };

        const responseData = await api.snacks.createSnack(dataToSend);
        
        showTemporaryMessage('Snack submitted successfully! It will be reviewed soon.');
        setErrors({});
        
        setForm({
          snackName: '',
          snackType: '',
          description: '',
          ingredients: '',
          nutritionalInfo: '',
          category: '',
          productImage: '',
          vendorId: '',
          receipeInstructions: '',
          preparationTime: '',
          difficultyLevel: ''
        });
        
        if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
        }
        setImagePreview('');
        setImageFile(null);
        
        scrollToTop();
        
      } catch (error) {
        console.error('Submission error:', error);
        showTemporaryMessage(error.message || 'Submission failed. Please try again.', true);
        setErrors({ submit: error.message || 'Submission failed. Please try again.' });
        scrollToTop();
      } finally {
        setIsSubmitting(false);
      }
    } else {
      scrollToTop();
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Leaf className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-2">Add a Vegan Snack</h2>
            <p className="text-white/90 text-base">
              Share your favorite plant-based snack with our community
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
            {errors.submit && !message && (
              <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg text-base">
                {errors.submit}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Row 1: Snack Name and Snack Type */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="snackName" className="block text-base font-medium text-gray-700 mb-2">
                    Snack Name *
                  </label>
                  <input
                    type="text"
                    id="snackName"
                    name="snackName"
                    value={form.snackName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                      errors.snackName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Crunchy Kale Chips"
                  />
                  {errors.snackName && <p className="mt-1 text-sm text-red-600">{errors.snackName}</p>}
                </div>

                <div>
                  <label htmlFor="snackType" className="block text-base font-medium text-gray-700 mb-2">
                    Snack Type *
                  </label>
                  <input
                    type="text"
                    id="snackType"
                    name="snackType"
                    value={form.snackType}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                      errors.snackType ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Chips, Cookies, Energy Bars"
                  />
                  {errors.snackType && <p className="mt-1 text-sm text-red-600">{errors.snackType}</p>}
                </div>
              </div>

              {/* Row 2: Category and Preparation Time */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="category" className="block text-base font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                      errors.category ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a category</option>
                    <option value="Chips & Crisps">Chips & Crisps</option>
                    <option value="Cookies & Biscuits">Cookies & Biscuits</option>
                    <option value="Energy Bars">Energy Bars</option>
                    <option value="Nuts & Seeds">Nuts & Seeds</option>
                    <option value="Dried Fruits">Dried Fruits</option>
                    <option value="Protein Snacks">Protein Snacks</option>
                    <option value="Chocolate & Sweets">Chocolate & Sweets</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
                </div>

                <div>
                  <label htmlFor="preparationTime" className="block text-base font-medium text-gray-700 mb-2">
                    Preparation Time (minutes) *
                  </label>
                  <input
                    type="number"
                    id="preparationTime"
                    name="preparationTime"
                    min="1"
                    value={form.preparationTime}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                      errors.preparationTime ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., 30"
                  />
                  {errors.preparationTime && <p className="mt-1 text-sm text-red-600">{errors.preparationTime}</p>}
                </div>
              </div>

              {/* Row 3: Difficulty Level */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="difficultyLevel" className="block text-base font-medium text-gray-700 mb-2">
                    Difficulty Level *
                  </label>
                  <select
                    id="difficultyLevel"
                    name="difficultyLevel"
                    value={form.difficultyLevel}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                      errors.difficultyLevel ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select difficulty level</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                  {errors.difficultyLevel && <p className="mt-1 text-sm text-red-600">{errors.difficultyLevel}</p>}
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-base font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={form.description}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Describe the taste, texture, and what makes this snack special..."
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
              </div>

              {/* Ingredients */}
              <div>
                <label htmlFor="ingredients" className="block text-base font-medium text-gray-700 mb-2">
                  Ingredients * (comma separated)
                </label>
                <textarea
                  id="ingredients"
                  name="ingredients"
                  rows={3}
                  value={form.ingredients}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                    errors.ingredients ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="List all ingredients, separated by commas"
                />
                {errors.ingredients && <p className="mt-1 text-sm text-red-600">{errors.ingredients}</p>}
              </div>

              {/* Nutritional Info */}
              <div>
                <label htmlFor="nutritionalInfo" className="block text-base font-medium text-gray-700 mb-2">
                  Nutritional Information * (comma separated)
                </label>
                <textarea
                  id="nutritionalInfo"
                  name="nutritionalInfo"
                  rows={3}
                  value={form.nutritionalInfo}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                    errors.nutritionalInfo ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Calories, protein, carbs, etc. per serving"
                />
                {errors.nutritionalInfo && <p className="mt-1 text-sm text-red-600">{errors.nutritionalInfo}</p>}
              </div>

              {/* Receipe Instructions */}
              <div>
                <label htmlFor="receipeInstructions" className="block text-base font-medium text-gray-700 mb-2">
                  Receipe Instructions * (comma separated)
                </label>
                <input
                  type="text"
                  id="receipeInstructions"
                  name="receipeInstructions"
                  value={form.receipeInstructions}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                    errors.receipeInstructions ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Preheat oven, Mix ingredients, Bake for 20 minutes ,etc."
                />
                {errors.receipeInstructions && <p className="mt-1 text-sm text-red-600">{errors.receipeInstructions}</p>}
                <p className="mt-1 text-sm text-gray-500">Separate each step with a comma</p>
              </div>

              {/* Product Image Upload */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Product Image *
                </label>
                <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  errors.productImage ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-green-500'
                }`}>
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="h-48 w-auto object-contain rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors transform translate-x-1/2 -translate-y-1/2"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <label
                        htmlFor="image-upload"
                        className="relative cursor-pointer block"
                      >
                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                        <div className="flex text-base text-gray-600 justify-center">
                          <span>Upload a file</span>
                          <input
                            id="image-upload"
                            name="image-upload"
                            type="file"
                            className="sr-only"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            onChange={handleImageChange}
                            disabled={isSubmitting}
                          />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          PNG, JPG, GIF, WEBP up to 5MB
                        </p>
                      </label>
                    </>
                  )}
                </div>
                {errors.productImage && <p className="mt-1 text-sm text-red-600">{errors.productImage}</p>}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-4 rounded-lg font-semibold text-base hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting || isUploading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span className="text-base">{isUploading ? 'Processing Image...' : 'Submitting...'}</span>
                    </div>
                  ) : (
                    <span className="text-base font-semibold">Add Vegan Snack</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>All snacks will be reviewed before being published to ensure they meet our quality standards.</p>
        </div>
      </div>
    </div>
  );
}