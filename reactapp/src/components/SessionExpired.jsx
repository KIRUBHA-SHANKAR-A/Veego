import React, { useState, useEffect } from 'react';
import { XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SessionExpired({ role = "user" }) {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    document.body.classList.add('hide-navbar');
    
    return () => {
      document.body.classList.remove('hide-navbar');
    };
  }, []);

  // Color schemes based on role
  const getColorScheme = () => {
    if (role === 'admin' || role === 'product-manager') {
      return {
        bg: 'from-blue-50 via-indigo-50 to-purple-50',
        text: 'text-blue-600',
        button: 'from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700',
        circle: 'text-blue-600'
      };
    } else {
      return {
        bg: 'from-green-50 via-emerald-50 to-teal-50',
        text: 'text-green-600',
        button: 'from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700',
        circle: 'text-green-600'
      };
    }
  };

  const colors = getColorScheme();

  useEffect(() => {
    if (countdown === 0) {
      localStorage.removeItem('token');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('vendorEmail');
      localStorage.removeItem('role');
      localStorage.removeItem('userId');
      localStorage.removeItem('vendorId');
      localStorage.removeItem('vendorName');
      localStorage.removeItem('userName');
      localStorage.removeItem('refreshToken');
      navigate('/');
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${colors.bg} flex items-center justify-center p-4`}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className={`w-8 h-8 ${colors.circle}`} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Session Expired</h2>
        <p className="text-gray-600 mb-6">Please login to continue.</p>
        <div className={`text-4xl font-bold ${colors.text} mb-4 animate-pulse`}>{countdown}</div>
        <p className="text-sm text-gray-500">
          Redirecting to home page in {countdown} second{countdown !== 1 ? 's' : ''}
        </p>
        <button 
          onClick={() => {
            localStorage.clear();
            navigate('/');
          }}
          className={`mt-4 bg-gradient-to-r ${colors.button} text-white px-6 py-2 rounded-lg transition-all duration-200`}
        >
          Go to Home Now
        </button>
      </div>
    </div>
  );
}