'use client';
import React from 'react';
import Link from 'next/link';

const AuthTabs = ({ activeTab }) => {
  return (
    <div className="flex gap-1 p-1 bg-gray-100/80 rounded-lg mb-8">
      <Link
        href="/login"
        className={`flex-1 px-4 py-1.5 text-sm font-medium rounded-md transition-colors text-center ${
          activeTab === 'signin'
            ? 'text-gray-900 bg-white shadow-sm border border-gray-200 font-semibold'
            : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        Sign In
      </Link>
      <Link
        href="/register"
        className={`flex-1 px-4 py-1.5 text-sm font-medium rounded-md transition-colors text-center ${
          activeTab === 'signup'
            ? 'text-gray-900 bg-white shadow-sm border border-gray-200 font-semibold'
            : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        Sign Up
      </Link>
    </div>
  );
};

export default AuthTabs;
