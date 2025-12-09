'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSignUp, useGoogleSignIn } from '@/hooks/use-auth';
import { GoogleLogin } from '@react-oauth/google';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { AuthGuard } from '@/components/auth-guard';
import { useAuthStore } from '@/lib/store/auth-store';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string }>({});

  const signUpMutation = useSignUp();
  const { isLoading } = useAuthStore();
  const { handleGoogleSuccess } = useGoogleSignIn();

  const validateForm = () => {
    const newErrors: { name?: string; email?: string; password?: string; confirmPassword?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!validateForm()) return;

    try {
      await signUpMutation.mutateAsync({ name, email, password, confirmPassword });
    } catch (error) {
      console.error('Sign up error in component:', error);
      // The error is already handled by the mutation's onError callback
    }
  };

  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Layout */}
        <div className="lg:hidden min-h-screen flex flex-col">
          {/* Mobile Header */}
          <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 p-3 sm:p-4 text-center flex-shrink-0 relative overflow-hidden">
            {/* Mobile decorative elements */}
            <div className="absolute top-2 left-2 w-16 h-4 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full opacity-60"></div>
            <div className="absolute top-4 right-3 w-12 h-3 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full opacity-60"></div>
            <div className="absolute left-3 bottom-4 w-14 h-3 bg-gradient-to-r from-orange-300 to-yellow-400 rounded-full opacity-60"></div>
            <div className="absolute right-2 bottom-2 w-18 h-4 bg-gradient-to-r from-pink-300 to-orange-400 rounded-full opacity-60"></div>
            
            <div className="relative z-10">
              <h1 className="text-lg sm:text-xl font-bold text-white mb-1">
                Scrap Collection
              </h1>
              <p className="text-xs text-white opacity-90">
                Service System
              </p>
              <p className="text-xs text-white opacity-75 mt-2">
                Join Our Community
              </p>
            </div>
          </div>

          {/* Mobile Form */}
          <div className="flex-1 p-3 sm:p-4 bg-white flex items-start justify-center">
            <div className="w-full max-w-sm">
              <h2 className="text-lg font-bold text-center text-gray-900 mb-3">SIGN UP</h2>
              
              <form className="space-y-3" onSubmit={handleSubmit}>
                <div>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`px-3 py-2 w-full rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                  )}
                </div>
                
                <div>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`px-3 py-2 w-full rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>
                
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`px-3 py-2 w-full rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                  )}
                </div>
                
                <div>
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`px-3 py-2 w-full rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={signUpMutation.isPending || isLoading}
                  className="py-2 w-full font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg transition-colors hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {signUpMutation.isPending || isLoading ? 'Creating account...' : 'SIGN UP'}
                </button>
                
                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-gray-500">OR</span>
                  </div>
                </div>

                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => {
                      console.error('Google Login failed');
                    }}
                    useOneTap={false}
                    theme="outline"
                    size="large"
                    text="signup_with"
                    shape="rectangular"
                    width="100%"
                  />
                </div>
                
                {signUpMutation.isError && (
                  <p className="text-xs text-red-500 text-center">
                    {signUpMutation.error?.message || 'An error occurred during sign up'}
                  </p>
                )}
              </form>
              
              <p className="mt-4 text-xs text-center text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/signin" className="text-purple-600 hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex min-h-screen">
          {/* Left side - Welcome Section */}
          <div className="flex relative flex-1 justify-center items-center p-12 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900">
            {/* Simplified decorative elements */}
            <div className="absolute top-20 left-20 w-32 h-8 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full opacity-80"></div>
            <div className="absolute top-32 right-40 w-24 h-6 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full opacity-80"></div>
            <div className="absolute left-32 bottom-40 w-28 h-7 bg-gradient-to-r from-orange-300 to-yellow-400 rounded-full opacity-80"></div>
            <div className="absolute right-20 bottom-20 w-36 h-8 bg-gradient-to-r from-pink-300 to-orange-400 rounded-full opacity-80"></div>
            
            <div className="z-10 text-center text-white">
              <h1 className="mb-6 text-6xl font-bold">
                Join Our<br />
                Scrap Collection<br />
                Community
              </h1>
              <p className="max-w-2xl text-xl opacity-90">
                Create your account and start managing your scrap collection service efficiently.
              </p>
            </div>
            
            <div className="absolute bottom-8 left-1/2 text-sm text-white opacity-75 transform -translate-x-1/2">
              © 2025 All rights reserved
            </div>
          </div>

          {/* Right side - Signup Form */}
          <div className="flex justify-center items-center p-8 w-96 bg-white">
            <div className="w-full max-w-sm">
              <h2 className="mb-8 text-2xl font-bold text-center text-gray-900">SIGN UP</h2>
              
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`px-4 py-3 w-full rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                  )}
                </div>
                
                <div>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`px-4 py-3 w-full rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                  )}
                </div>
                
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`px-4 py-3 w-full rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                  )}
                </div>
                
                <div>
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`px-4 py-3 w-full rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={signUpMutation.isPending || isLoading}
                  className="py-3 w-full font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg transition-colors hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {signUpMutation.isPending || isLoading ? 'Creating account...' : 'SIGN UP'}
                </button>
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">OR</span>
                  </div>
                </div>

                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => {
                      console.error('Google Login failed');
                    }}
                    useOneTap={false}
                    theme="outline"
                    size="large"
                    text="signup_with"
                    shape="rectangular"
                    width="100%"
                  />
                </div>
                
                {signUpMutation.isError && (
                  <p className="text-sm text-red-500 text-center">
                    {signUpMutation.error?.message || 'An error occurred during sign up'}
                  </p>
                )}
              </form>
              
              <p className="mt-6 text-sm text-center text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/signin" className="text-purple-600 hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
} 