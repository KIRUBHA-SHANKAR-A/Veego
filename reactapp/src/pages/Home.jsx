import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  Leaf, Heart, Users, Star, CheckCircle, ArrowRight, 
  BookOpen, Utensils, MessageSquare, Clock, TrendingUp, 
  Award, Sparkles, Zap, ThumbsUp, Quote, Search, Filter,
  DollarSign, Globe, Shield, Coffee, Battery, Smile
} from "lucide-react";
import { useScrollToTop } from "../hooks/useScrollToTop";

export default function Home() {
  const navigate = useNavigate();
  useScrollToTop();

  const features = [
    {
      icon: <BookOpen className="text-green-600" size={32} />,
      title: "Discover Recipes",
      description: "Browse our growing collection of vegan snack recipes. Search by category, difficulty, or preparation time to find your perfect snack."
    },
    {
      icon: <Utensils className="text-orange-500" size={32} />,
      title: "Try at Home",
      description: "Each recipe comes with detailed step-by-step instructions, ingredients list, nutritional information, and preparation tips."
    },
    {
      icon: <MessageSquare className="text-blue-500" size={32} />,
      title: "Review & Rate",
      description: "Share your experience after trying a recipe. Rate snacks and help other users discover the best vegan options."
    }
  ];

  const howItWorks = [
    {
      step: "01",
      title: "Browse Recipes",
      description: "Explore our collection of vegan snacks by category, difficulty level, or preparation time.",
      icon: <Search size={24} />
    },
    {
      step: "02",
      title: "Try It Yourself",
      description: "Follow our detailed instructions to create delicious vegan snacks in your own kitchen.",
      icon: <Utensils size={24} />
    },
    {
      step: "03",
      title: "Share Your Review",
      description: "Rate the recipe and share your honest feedback to help the community.",
      icon: <MessageSquare size={24} />
    },
    {
      step: "04",
      title: "Discover More",
      description: "Based on your reviews, get personalized recommendations for new recipes to try.",
      icon: <Sparkles size={24} />
    }
  ];

  const benefits = [
    {
      icon: <Heart className="text-red-500" size={28} />,
      title: "Healthier Lifestyle",
      description: "Adopt a healthier snacking habit with our nutritious, plant-based recipes."
    },
    {
      icon: <Coffee className="text-amber-600" size={28} />,
      title: "Easy to Make",
      description: "Simple ingredients and clear instructions make every recipe accessible to all skill levels."
    },
    {
      icon: <DollarSign className="text-green-600" size={28} />,
      title: "Cost Effective",
      description: "Save money by making delicious vegan snacks at home instead of buying expensive store options."
    },
    {
      icon: <Globe className="text-blue-500" size={28} />,
      title: "Eco-Friendly",
      description: "Reduce your carbon footprint by choosing plant-based snacks that are better for the planet."
    },
    {
      icon: <Battery className="text-yellow-500" size={28} />,
      title: "Energy Boosting",
      description: "Natural ingredients that provide sustained energy without the crash."
    },
    {
      icon: <Smile className="text-purple-500" size={28} />,
      title: "Delicious Taste",
      description: "Proven recipes that taste amazing and satisfy your cravings."
    }
  ];

  const whyChooseUs = [
    {
      icon: <Users className="text-blue-500" size={24} />,
      title: "Active Community",
      description: "Join thousands of vegan snack enthusiasts sharing their experiences."
    },
    {
      icon: <Star className="text-yellow-500" size={24} />,
      title: "Verified Reviews",
      description: "Honest ratings from real users who have actually tried the recipes."
    },
    {
      icon: <Shield className="text-green-500" size={24} />,
      title: "Quality Content",
      description: "All recipes are tested and approved by our community of home cooks."
    },
    {
      icon: <TrendingUp className="text-purple-500" size={24} />,
      title: "Regular Updates",
      description: "New recipes added weekly to keep your snacking options fresh."
    }
  ];

  return (
    <div className="pt-20 min-h-screen bg-gradient-to-r from-green-50 to-emerald-50">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="container mx-auto px-6 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-16">
              <div>
                <h1 className="text-4xl md:text-6xl font-bold text-green-800 leading-tight">
                  Discover Amazing
                  <span className="bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent block">
                    Vegan Snacks
                  </span>
                </h1>
                <p className="text-xl text-green-600 mt-6 leading-relaxed">
                  Join our community of conscious snackers. Discover, try, and review 
                  the best plant-based treats that are good for you and the planet.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                onClick={() => {
                  const token = localStorage.getItem('token');
                  if (token) {
                    navigate("/snacks");
                  } else {
                    navigate("/auth");
                  }
                }} 
                  className="bg-green-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-green-700 transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center group"
                >
                  Explore Snacks
                  <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </div> 
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-green-200 to-green-300 rounded-3xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="bg-white rounded-2xl p-6 shadow-xl">
                  <div className="text-6xl mb-4 text-center">🥗</div>
                  <h3 className="text-xl font-semibold text-green-800 text-center mb-2">
                    Healthy & Delicious
                  </h3>
                  <p className="text-green-600 text-center">
                    Snacks that fuel your body and satisfy your cravings
                  </p>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -left-4 bg-yellow-400 rounded-full p-3 animate-bounce">
                <Star size={20} className="text-yellow-800" />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-red-400 rounded-full p-3 animate-pulse">
                <Heart size={20} className="text-red-800" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose VeeGo?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to discover, create, and share amazing vegan snacks
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group text-center">
                <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Four simple steps to start your vegan snacking journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <div key={index} className="text-center">
                <div className="relative">
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                    {item.step}
                  </div>
                  {index < howItWorks.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-[70%] w-[60%] h-0.5 bg-green-300"></div>
                  )}
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="text-green-600">{item.icon}</div>
                    <h3 className="font-semibold text-gray-800">{item.title}</h3>
                  </div>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Benefits of Vegan Snacking
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover why more people are choosing plant-based snacks
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="group flex items-start gap-4 p-6 bg-white rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="w-14 h-14 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{benefit.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Us?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              What makes VeeGo the best platform for vegan snack lovers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyChooseUs.map((item, index) => (
              <div key={index} className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}