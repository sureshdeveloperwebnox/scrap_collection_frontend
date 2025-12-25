'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useGoogleSignIn } from '@/hooks/use-auth';
import { GoogleLogin } from '@react-oauth/google';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { AuthGuard } from '@/components/auth-guard';
import { OrganizationForm } from '@/components/forms/organization-form';
import { CreateOrganizationRequest } from '@/lib/api/organizations';
import { Check, Loader2, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/store/auth-store';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { validatePhoneNumber, getPhonePlaceholder } from '@/lib/phone-utils';
import { CountryCode } from 'libphonenumber-js';

export default function SignUpPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: User Info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [countryId, setCountryId] = useState<number | undefined>(undefined);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>('AU');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    password?: string;
    confirmPassword?: string
  }>({});

  const { handleGoogleSuccess } = useGoogleSignIn();
  const { login } = useAuthStore();

  const validateStep1 = () => {
    const newErrors: {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      password?: string;
      confirmPassword?: string
    } = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (phone) {
      const validation = validatePhoneNumber(phone, selectedCountry);
      if (!validation.isValid) {
        newErrors.phone = validation.error;
      } else if (validation.formatted) {
        // Always store in E.164
        setPhone(validation.formatted);
      }
    } else {
      newErrors.phone = 'Phone number is required';
    }

    if (!address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])/.test(password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain at least one number';
    } else if (!/(?=.*[@$!%*?&])/.test(password)) {
      newErrors.password = 'Password must contain at least one special character (@$!%*?&)';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!validateStep1()) return;

    // Just move to step 2, don't create user yet
    setCurrentStep(2);
    toast.success('Step 1 completed!', {
      description: 'Now let\'s set up your organization',
    });
  };

  const handleOrganizationSubmit = async (organizationData: CreateOrganizationRequest) => {
    setIsSubmitting(true);

    try {
      // Step 1: Create user account
      const signUpResponse = await authApi.signUp({
        name,
        email,
        phone,
        address,
        password,
        ...(countryId && { countryId })
      });

      if (!signUpResponse?.data?.user) {
        throw new Error('Failed to create user account');
      }

      // Store user data (tokens are in httpOnly cookies)
      login(signUpResponse.data.user);

      toast.success('Account created!', {
        description: 'Creating your organization...',
      });

      // Step 2: Create organization (now that user is authenticated)
      const { organizationApi } = await import('@/lib/api/organizations');
      await organizationApi.createOrganization(organizationData);

      toast.success('Registration complete!', {
        description: 'Redirecting to dashboard...',
      });

      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);

    } catch (error: any) {
      console.error('Registration error:', error);

      const errorMessage = error?.response?.data?.message || error?.message || 'Registration failed';
      toast.error('Registration failed', {
        description: errorMessage,
      });

      // If user creation failed, go back to step 1
      if (!error?.response?.data?.user) {
        setCurrentStep(1);
      }
    } finally {
      setIsSubmitting(false);
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

            {/* Stepper Indicator */}
            <div className="mt-12 flex items-center gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${currentStep >= 1 ? 'bg-white text-cyan-600' : 'bg-white/30 text-white'
                  }`}>
                  {currentStep > 1 ? <Check className="w-6 h-6" /> : '1'}
                </div>
                <span className="text-sm mt-2">User Info</span>
              </div>
              <div className={`w-16 h-1 transition-all ${currentStep >= 2 ? 'bg-white' : 'bg-white/30'}`} />
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${currentStep >= 2 ? 'bg-white text-cyan-600' : 'bg-white/30 text-white'
                  }`}>
                  2
                </div>
                <span className="text-sm mt-2">Organization</span>
              </div>
            </div>
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
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {currentStep === 1 ? 'SIGN UP' : 'SETUP ORGANIZATION'}
                  </h2>
                  <div className="w-16 h-0.5 bg-cyan-600 mx-auto" />
                  <p className="text-sm text-gray-600 mt-2">
                    Step {currentStep} of 2
                  </p>
                </div>

                {/* Step 1: User Information */}
                {currentStep === 1 && (
                  <>
                    <form onSubmit={handleStep1Submit} className="space-y-5">
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
                          placeholder="your.email@example.com"
                          className={`h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200/20 transition-all ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''
                            }`}
                          required
                        />
                        {errors.email && (
                          <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                        )}
                      </div>

                      {/* Phone Field */}
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                          Phone
                        </Label>
                        <PhoneInput
                          country={selectedCountry.toLowerCase()}
                          value={phone}
                          onChange={(value, countryData: any) => {
                            if (countryData && countryData.iso2) {
                              const isoCode = countryData.iso2.toUpperCase() as CountryCode;
                              setSelectedCountry(isoCode);
                            }

                            // Re-format to include + if missing
                            const formattedValue = value.startsWith('+') ? value : `+${value}`;
                            setPhone(formattedValue);

                            // Clear error on change
                            if (errors.phone) {
                              setErrors(prev => ({ ...prev, phone: undefined }));
                            }
                          }}
                          inputClass={`!w-full !h-12 !rounded-xl !border-gray-200 !bg-white !shadow-sm focus:!border-cyan-500 focus:!ring-2 focus:!ring-cyan-200/20 transition-all ${errors.phone ? '!border-red-500 focus:!border-red-500 focus:!ring-red-200' : ''
                            }`}
                          buttonClass={`!border-gray-200 !rounded-l-xl ${errors.phone ? '!border-red-500' : ''}`}
                          containerClass={`!w-full ${errors.phone ? 'error' : ''}`}
                          placeholder={getPhonePlaceholder(selectedCountry)}
                          specialLabel=""
                        />
                        {errors.phone && (
                          <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
                        )}
                      </div>

                      {/* Address Field */}
                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                          Address
                        </Label>
                        <Input
                          id="address"
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Enter your address"
                          className={`h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200/20 transition-all ${errors.address ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''
                            }`}
                          required
                        />
                        {errors.address && (
                          <p className="text-sm text-red-600 mt-1">{errors.address}</p>
                        )}
                      </div>

                      {/* Password Field */}
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className={`h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200/20 transition-all pr-12 ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''
                              }`}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-0 bottom-0 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                        {errors.password && (
                          <p className="text-sm text-red-600 mt-1">{errors.password}</p>
                        )}
                        {!errors.password && (
                          <p className="text-xs text-gray-500 mt-1">
                            Must be 8+ characters with uppercase, lowercase, number, and special character (@$!%*?&)
                          </p>
                        )}
                      </div>

                      {/* Confirm Password Field */}
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                          Confirm Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm Password"
                            className={`h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200/20 transition-all pr-12 ${errors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''
                              }`}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-0 bottom-0 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>
                        )}
                      </div>

                      {/* Next Button */}
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-400 hover:from-cyan-700 hover:to-cyan-500 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next: Setup Organization
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
                  </>
                )}

                {/* Step 2: Organization Setup */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <OrganizationForm
                      onSubmit={handleOrganizationSubmit}
                      isLoading={isSubmitting}
                      submitButtonText={isSubmitting ? 'Creating Account...' : 'Complete Registration'}
                    />

                    {/* Back Button */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                      disabled={isSubmitting}
                      className="w-full h-12 rounded-xl border-2 border-gray-300 hover:border-cyan-500 hover:bg-cyan-50 transition-all"
                    >
                      Back to User Info
                    </Button>
                  </div>
                )}

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