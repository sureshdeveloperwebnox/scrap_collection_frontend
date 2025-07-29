'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSignUp } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

export default function SignUpPage() {
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
          
          <form className="space-y-6">
            <div>
              <input
                type="text"
                placeholder="Full Name"
                className="px-4 py-3 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <input
                type="email"
                placeholder="Email Address"
                className="px-4 py-3 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <input
                type="password"
                placeholder="Password"
                className="px-4 py-3 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <input
                type="password"
                placeholder="Confirm Password"
                className="px-4 py-3 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <button
              type="submit"
              className="py-3 w-full font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg transition-colors hover:from-purple-700 hover:to-pink-700"
            >
              SIGN UP
            </button>
          </form>
          
          <p className="mt-6 text-sm text-center text-gray-600">
            Already have an account?{' '}
            <a href="/auth/signin" className="text-purple-600 hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 