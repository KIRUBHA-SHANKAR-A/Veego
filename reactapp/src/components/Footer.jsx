import React from "react";
import { Leaf, Heart, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-green-900 text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-6 py-16">
        <div className="flex flex-row items-center justify-center gap-12 lg:gap-64 flex-wrap">
          
          {/* Brand Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-full p-3">
                <Leaf size={24} className="text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-white bg-clip-text text-transparent">
                VeeGo
              </span>
            </div>
            
            <p className="text-gray-300 leading-relaxed max-w-md">
              Discover vegan snacks, get inspired, and share your honest reviews.
            </p>
            
            <div className="flex items-center space-x-2 text-green-400">
              <Heart size={16} className="fill-current" />
              <span className="text-sm">Made with love for a better world</span>
            </div>   
          </div>

          {/* Contact Info */}
            <div className="space-y-3 pt-4">
              <div className="flex items-center space-x-3 text-gray-300">
                <Mail size={16} className="text-green-400" />
                <span className="text-sm">veego@gmail.com</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <Phone size={16} className="text-green-400" />
                <span className="text-sm">+91-9876543210</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <MapPin size={16} className="text-green-400" />
                <span className="text-sm">Coimbatore, Tamil Nadu</span>
              </div>
            </div>
        </div>

      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-700 bg-gray-900/50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col justify-center items-center">
            
            {/* Copyright */}
            <div className="text-gray-400 text-sm text-center md:text-left">
              <p>© {currentYear} VeeGo - Vegan Snacks Application. All rights reserved.</p><br />
            </div>
            <div className="text-gray-400 text-sm text-center md:text-left">
              <p className="mt-1">Built with 💚 for the vegan community</p>
            </div>

          </div>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-gray-800 text-center">
            <p className="text-gray-500 text-xs">
              VeeGo is committed to promoting sustainable and ethical snacking choices. 
              All listed products are verified to be 100% vegan and cruelty-free.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}