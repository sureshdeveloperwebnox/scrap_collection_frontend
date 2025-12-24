'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSignUp, useGoogleSignIn } from '@/hooks/use-auth';
import { GoogleLogin } from '@react-oauth/google';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
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
      <div className="min-h-screen flex">
        {/* Left Section - Cyan Gradient */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-b from-cyan-700 to-cyan-400 relative overflow-hidden">
          {/* Decorative Lines */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-full h-px bg-white" style={{ transform: 'rotate(12deg) translateY(20%)' }} />
            <div className="absolute bottom-0 left-0 w-full h-px bg-white" style={{ transform: 'rotate(-12deg) translateY(-20%)' }} />
          </div>

          {/* Logo */}
          <div className="absolute top-8 left-8 z-20 flex items-center gap-3">
            <div className="bg-white rounded-lg p-2">
              <Image
                src="/images/logo/scraplogo.png"
                alt="Aussie ScrapX Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <span className="text-white text-2xl font-black tracking-tight uppercase" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.02em' }}>AUSSIE SCRAPX</span>
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-white">
            <h1 className="text-6xl font-bold uppercase tracking-wider mb-6 text-center">
              JOIN OUR<br />
              SCRAP COLLECTION<br />
              COMMUNITY
            </h1>
            <p className="text-lg text-white/80 text-center max-w-md">
              Create your account and start managing your scrap collection service efficiently.
            </p>
          </div>
        </div>

        {/* Right Section - Signup Form */}
        <div className="w-full lg:w-1/2 bg-white flex items-center justify-center relative overflow-hidden px-4 sm:px-6 lg:px-8">
          {/* Decorative Circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-600 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute top-20 left-8 w-3 h-3 bg-cyan-600 rounded-full opacity-20" />
          <div className="absolute top-32 left-16 w-16 h-16 border-2 border-cyan-600 rounded-full opacity-20" />
          <div className="absolute bottom-0 left-0 w-24 h-24 border-2 border-cyan-600 rounded-full opacity-10 -translate-x-1/2 translate-y-1/2" />

          {/* Mobile Logo */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 lg:hidden z-10 flex items-center gap-2">
            <div className="bg-cyan-600 rounded-lg p-1.5">
              <Image
                src="https://ezycashforcars.com.au/wp-content/uploads/2025/05/ezy-cash-for-cars.png"
                alt="Aussie ScrapX Logo"
                width={35}
                height={35}
                className="object-contain"
              />
            </div>
            <span className="text-cyan-600 text-xl font-black tracking-tight uppercase" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.02em' }}>AUSSIE SCRAPX</span>
          </div>

          {/* Signup Card */}
          <Card className="w-full max-w-md shadow-lg border-0 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-8 sm:p-10">
              <div className="space-y-6">
                {/* Title */}
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">SIGN UP</h2>
                  <div className="w-16 h-0.5 bg-cyan-600 mx-auto" />
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Full Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full Name"
                      className={`h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200/20 transition-all ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''
                        }`}
                      required
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="proveenpushpraj29@gmail.com"
                      className={`h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200/20 transition-all ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''
                        }`}
                      required
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••"
                      className={`h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200/20 transition-all ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''
                        }`}
                      required
                    />
                    {errors.password && (
                      <p className="text-sm text-red-600 mt-1">{errors.password}</p>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm Password"
                      className={`h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200/20 transition-all ${errors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''
                        }`}
                      required
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Error Message */}
                  {signUpMutation.isError && (
                    <p className="text-sm text-red-600 text-center">
                      {signUpMutation.error?.message || 'An error occurred during sign up'}
                    </p>
                  )}

                  {/* Signup Button */}
                  <Button
                    type="submit"
                    disabled={signUpMutation.isPending || isLoading}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-400 hover:from-cyan-700 hover:to-cyan-500 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {signUpMutation.isPending || isLoading ? 'Creating account...' : 'SIGN UP'}
                  </Button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-gray-500">OR</span>
                  </div>
                </div>

                {/* Google Sign Up */}
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

                {/* Footer */}
                <div className="text-center pt-4">
                  <p className="text-sm text-[#6B7280]">
                    Already have an account?{' '}
                    <Link
                      href="/auth/signin"
                      className="font-semibold text-cyan-600 hover:text-cyan-700 transition-colors"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}