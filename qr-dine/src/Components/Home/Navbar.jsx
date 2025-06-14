// src/components/HomePage/Navbar.jsx

import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-md fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo/Brand */}
        
        <div className="text-2xl font-bold text-orange-600">
          <Link to="/">🍽️ Hotel TARS Mahal</Link>
        </div>

        {/* Navigation Links */}
        <div className="md:flex space-x-6">
          <Link to="/home" className="text-gray-700 hover:text-orange-600 transition">Home</Link>
          <Link to="/menu" className="text-gray-700 hover:text-orange-600 transition">Menu</Link>
          <a href="/about" className="text-gray-700 hover:text-orange-600 transition">About</a>
          <Link to="/contact" className="text-gray-700 hover:text-orange-600 transition">Contact</Link>
        </div>

        {/* Unified Login Button */}
        <div className="flex items-center">
          <Link to="/login">
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md transition text-sm">
              Login
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
