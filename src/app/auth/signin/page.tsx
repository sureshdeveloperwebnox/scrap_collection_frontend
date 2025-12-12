'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSignIn, useGoogleSignIn } from '@/hooks/use-auth';
import { GoogleLogin } from '@react-oauth/google';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { AuthGuard } from '@/components/auth-guard';
import { useAuthStore } from '@/lib/store/auth-store';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const signInMutation = useSignIn();
  const { isLoading } = useAuthStore();
  const { handleGoogleSuccess } = useGoogleSignIn();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!validateForm()) return;

    try {
      await signInMutation.mutateAsync({ email, password, role: "USER" });
    } catch (error) {
      console.error('Sign in error in component:', error);
      // The error is already handled by the mutation's onError callback
    }
  };

  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Layout */}
        <div className="lg:hidden min-h-screen flex flex-col">
          {/* Mobile Header */}
          <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 p-3 sm:p-4 text-center flex-shrink-0 relative overflow-hidden">
            {/* Mobile decorative elements */}
            <div className="absolute top-2 left-2 w-16 h-4 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full opacity-60"></div>
            <div className="absolute top-4 right-3 w-12 h-3 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full opacity-60"></div>
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
                Welcome Back
              </p>
            </div>
          </div>

          {/* Mobile Form */}
          <div className="flex-1 p-3 sm:p-4 bg-white flex items-start justify-center">
            <div className="w-full max-w-sm">
              <h2 className="text-lg font-bold text-center text-gray-900 mb-3">LOGIN</h2>
              
              <form className="space-y-3" onSubmit={handleSubmit}>
                <div>
                  <input
                    type="email"
                    placeholder="johncena@gmail.com"
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
                    placeholder="••••"
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
                
                <div className="flex flex-col space-y-2">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-gray-300" 
                    />
                    <span className="ml-2 text-xs text-gray-600">Remember</span>
                  </label>
                  <a href="#" className="text-xs text-cyan-600 hover:underline text-center">
                    Forgot password?
                  </a>
                </div>
                
                <button
                  type="submit"
                  disabled={signInMutation.isPending || isLoading}
                  className="py-2 w-full font-medium text-white bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg transition-colors hover:from-cyan-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {signInMutation.isPending || isLoading ? 'Signing in...' : 'LOGIN'}
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
                    text="signin_with"
                    shape="rectangular"
                    width="100%"
                  />
                </div>
                
                {signInMutation.isError && (
                  <p className="text-xs text-red-500 text-center">
                    {signInMutation.error?.message || 'An error occurred during sign in'}
                  </p>
                )}
              </form>
              
              <p className="mt-4 text-xs text-center text-gray-600">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="text-cyan-600 hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex min-h-screen">
          {/* Left side - Welcome Section */}
          <div className="flex relative flex-1 justify-center items-center p-12 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900">
            {/* Simplified decorative elements */}
            <div className="absolute top-20 left-20 w-32 h-8 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full opacity-80"></div>
            <div className="absolute top-32 right-40 w-24 h-6 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full opacity-80"></div>
            <div className="absolute left-32 bottom-40 w-28 h-7 bg-gradient-to-r from-cyan-300 to-purple-400 rounded-full opacity-80"></div>
            <div className="absolute right-20 bottom-20 w-36 h-8 bg-gradient-to-r from-cyan-300 to-purple-400 rounded-full opacity-80"></div>
            
            <div className="z-10 text-center text-white">
              <h1 className="mb-6 text-6xl font-bold">
                Welcome to<br />
                Scrap Collection<br />
                Service System
              </h1>
              <p className="max-w-2xl text-xl opacity-90">
                A Scrap Collection Service System connects users with collectors to schedule and manage waste pickups efficiently.
              </p>
            </div>
            
            <div className="absolute bottom-8 left-1/2 text-sm text-white opacity-75 transform -translate-x-1/2">
              © 2025 All rights reserved
            </div>
          </div>

          {/* Right side - Login Form */}
          <div className="flex justify-center items-center p-8 w-96 bg-white">
            <div className="w-full max-w-sm">
              <h2 className="mb-8 text-2xl font-bold text-center text-gray-900">LOGIN</h2>
              
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <input
                    type="email"
                    placeholder="admin@scrapc.com"
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
                    placeholder="••••"
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
                
                <div className="flex justify-between items-center">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-gray-300" 
                    />
                    <span className="ml-2 text-sm text-gray-600">Remember</span>
                  </label>
                  <a href="#" className="text-sm text-cyan-600 hover:underline">
                    Forgot password?
                  </a>
                </div>
                
                <button
                  type="submit"
                  disabled={signInMutation.isPending || isLoading}
                  className="py-3 w-full font-medium text-white bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg transition-colors hover:from-cyan-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {signInMutation.isPending || isLoading ? 'Signing in...' : 'LOGIN'}
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
                    text="signin_with"
                    shape="rectangular"
                    width="100%"
                  />
                </div>
                
                {signInMutation.isError && (
                  <p className="text-sm text-red-500 text-center">
                    {signInMutation.error?.message || 'An error occurred during sign in'}
                  </p>
                )}
              </form>
              
              <p className="mt-6 text-sm text-center text-gray-600">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="text-cyan-600 hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
} 