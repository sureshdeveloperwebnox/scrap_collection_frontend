'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSignUp } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const signUpMutation = useSignUp();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    signUpMutation.mutate(formData);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 lg:flex-row">
      {/* Left Side - Welcome Section */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-16 relative overflow-hidden min-h-[40vh] lg:min-h-screen">
        {/* Geometric Shapes */}
        <div className="absolute inset-0">
          {/* Large rounded rectangles - adjusted for mobile */}
          <div className="absolute left-5 top-10 w-20 h-5 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full opacity-80 transform rotate-45 sm:top-20 sm:left-10 sm:w-32 sm:h-8"></div>
          <div className="absolute left-10 top-16 w-16 h-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full opacity-70 transform rotate-12 sm:top-32 sm:left-20 sm:w-24 sm:h-6"></div>
          <div className="absolute left-16 top-20 h-4 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full opacity-75 transform -rotate-12 sm:top-40 sm:left-32 w-18 sm:w-28 sm:h-7"></div>
          
          <div className="absolute left-8 bottom-20 w-24 h-6 bg-gradient-to-r from-orange-500 to-red-400 rounded-full opacity-70 transform sm:bottom-40 sm:left-16 sm:w-36 sm:h-9 rotate-30"></div>
          <div className="absolute left-14 w-12 h-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full opacity-80 transform -rotate-45 bottom-26 sm:bottom-52 sm:left-28 sm:w-20 sm:h-5"></div>
          <div className="absolute left-20 w-20 h-5 bg-gradient-to-r from-pink-500 to-orange-400 rounded-full transform bottom-30 sm:bottom-60 sm:left-40 sm:w-32 sm:h-8 opacity-65 rotate-15"></div>
          
          {/* Right side shapes - adjusted for mobile */}
          <div className="absolute right-10 top-12 h-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full opacity-75 transform sm:top-24 sm:right-20 w-18 sm:w-28 sm:h-7 -rotate-30"></div>
          <div className="absolute right-16 w-16 h-4 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full opacity-70 transform rotate-45 top-18 sm:top-36 sm:right-32 sm:w-24 sm:h-6"></div>
          <div className="absolute right-12 top-24 w-12 h-3 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full opacity-80 transform sm:top-48 sm:right-24 sm:w-20 sm:h-5 -rotate-15"></div>
          
          <div className="absolute right-6 bottom-16 h-6 bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full opacity-70 transform sm:bottom-32 sm:right-12 w-26 sm:w-40 sm:h-10 rotate-60"></div>
          <div className="absolute right-12 w-16 h-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full opacity-75 transform bottom-22 sm:bottom-44 sm:right-24 sm:w-24 sm:h-6 -rotate-30"></div>
          <div className="absolute bottom-28 w-20 h-5 bg-gradient-to-r from-pink-500 to-orange-400 rounded-full transform rotate-45 sm:bottom-56 right-18 sm:right-36 sm:w-32 sm:h-8 opacity-65"></div>
        </div>

        {/* Welcome Content */}
        <div className="relative z-10 max-w-lg text-center text-white lg:text-left">
          <h1 className="mb-4 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl xl:text-6xl lg:mb-6">
            Join Our Scrap Collection Service
          </h1>
          <p className="px-4 text-base leading-relaxed opacity-90 sm:text-lg lg:text-xl sm:px-0">
            Create your account today and start connecting with local collectors to manage your waste pickups efficiently and sustainably.
          </p>
        </div>
      </div>

      {/* Right Side - Sign Up Form */}
      <div className="w-full lg:w-2/5 bg-white flex items-center justify-center p-4 sm:p-6 lg:p-8 min-h-[60vh] lg:min-h-screen">
        <div className="w-full max-w-sm sm:max-w-md">
          <div className="mb-6 text-center sm:mb-8">
            <h2 className="text-xl font-semibold tracking-wide text-gray-700 sm:text-2xl">
              CREATE ACCOUNT
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Name Input */}
            <div className="relative">
              <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <Input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                className={`pl-8 sm:pl-10 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border-0 rounded-lg focus:bg-white focus:ring-2 focus:ring-purple-500 transition-all ${
                  errors.name ? 'ring-2 ring-red-500' : ''
                }`}
              />
              {errors.name && <p className="mt-1 text-xs text-red-600 sm:text-sm">{errors.name}</p>}
            </div>

            {/* Email Input */}
            <div className="relative">
              <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <Input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className={`pl-8 sm:pl-10 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border-0 rounded-lg focus:bg-white focus:ring-2 focus:ring-purple-500 transition-all ${
                  errors.email ? 'ring-2 ring-red-500' : ''
                }`}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600 sm:text-sm">{errors.email}</p>}
            </div>

            {/* Password Input */}
            <div className="relative">
              <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <Input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className={`pl-8 sm:pl-10 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border-0 rounded-lg focus:bg-white focus:ring-2 focus:ring-purple-500 transition-all ${
                  errors.password ? 'ring-2 ring-red-500' : ''
                }`}
              />
              {errors.password && <p className="mt-1 text-xs text-red-600 sm:text-sm">{errors.password}</p>}
            </div>

            {/* Confirm Password Input */}
            <div className="relative">
              <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <Input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`pl-8 sm:pl-10 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border-0 rounded-lg focus:bg-white focus:ring-2 focus:ring-purple-500 transition-all ${
                  errors.confirmPassword ? 'ring-2 ring-red-500' : ''
                }`}
              />
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-600 sm:text-sm">{errors.confirmPassword}</p>}
            </div>

            {/* Error Message */}
            {signUpMutation.error && (
              <div className="text-xs text-center text-red-600 sm:text-sm">
                {signUpMutation.error.message || 'Sign up failed. Please try again.'}
              </div>
            )}

            {/* Sign Up Button */}
            <Button
              type="submit"
              disabled={signUpMutation.isPending}
              className="w-full py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none"
            >
              {signUpMutation.isPending ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
            </Button>

            {/* Sign In Link */}
            <div className="text-center">
              <span className="text-xs text-gray-600 sm:text-sm">
                Already have an account?{' '}
                <Link href="/" className="font-medium text-purple-600 transition-colors hover:text-purple-700">
                  Sign in
                </Link>
              </span>
            </div>
          </form>
        </div>
      </div>

      {/* Attribution - Hidden on mobile for space */}
      <div className="hidden absolute bottom-4 left-1/2 text-xs text-white opacity-70 transform -translate-x-1/2 sm:block sm:text-sm">
        @ {new Date().getFullYear()} <span className="font-semibold">All rights reserved</span>
      </div>
    </div>
  );
} 