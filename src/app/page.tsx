'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSignIn } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const signInMutation = useSignIn();

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
    
    if (!validateForm()) return;

    signInMutation.mutate({ email, password, role: "USER" });
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Welcome Section */}
      <div className="flex overflow-hidden relative flex-1 justify-center items-center p-12 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900">
        {/* Decorative shapes */}
        <div className="absolute top-20 left-20 w-32 h-8 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full transform rotate-45"></div>
        <div className="absolute top-32 right-40 w-24 h-6 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full transform -rotate-12"></div>
        <div className="absolute left-32 bottom-40 w-28 h-7 bg-gradient-to-r from-orange-300 to-yellow-400 rounded-full transform rotate-12"></div>
        <div className="absolute right-20 bottom-20 w-36 h-8 bg-gradient-to-r from-pink-300 to-orange-400 rounded-full transform -rotate-45"></div>
        
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
                placeholder="1actdrivingdev@gmail.com"
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
                <input type="checkbox" className="rounded border-gray-300" />
                <span className="ml-2 text-sm text-gray-600">Remember</span>
              </label>
              <a href="#" className="text-sm text-purple-600 hover:underline">
                Forgot password?
              </a>
            </div>
            
            <button
              type="submit"
              disabled={signInMutation.isPending}
              className="py-3 w-full font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg transition-colors hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {signInMutation.isPending ? 'SIGNING IN...' : 'LOGIN'}
            </button>
            
            {signInMutation.isError && (
              <p className="text-sm text-center text-red-500">
                {signInMutation.error?.message || 'Sign in failed. Please try again.'}
              </p>
            )}
          </form>
          
          <p className="mt-6 text-sm text-center text-gray-600">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-purple-600 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 