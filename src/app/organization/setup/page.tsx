'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { OrganizationForm } from '@/components/forms/organization-form';
import { useCreateOrganization, useGetMyOrganization } from '@/hooks/use-organization';
import { useAuthStore } from '@/lib/store/auth-store';
import { CreateOrganizationRequest } from '@/lib/api/organizations';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function OrganizationSetupPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const createOrganizationMutation = useCreateOrganization();
    const { data: orgResponse, isLoading: checkingOrg } = useGetMyOrganization();

    // Redirect if user already has an organization
    useEffect(() => {
        if (orgResponse?.data) {
            toast.info('You already have an organization');
            router.push('/dashboard');
        }
    }, [orgResponse, router]);

    // Redirect if not logged in
    useEffect(() => {
        if (!user) {
            router.push('/auth/signin');
        }
    }, [user, router]);

    const handleOrganizationSubmit = async (data: CreateOrganizationRequest) => {
        try {
            await createOrganizationMutation.mutateAsync(data);

            toast.success('Organization created successfully!', {
                description: 'Redirecting to dashboard...',
            });

            setTimeout(() => {
                router.push('/dashboard');
            }, 1000);
        } catch (error) {
            console.error('Organization creation error:', error);
        }
    };

    if (checkingOrg) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cyan-50 to-white">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-cyan-600 mx-auto mb-4" />
                    <p className="text-gray-600">Checking your organization status...</p>
                </div>
            </div>
        );
    }

    return (
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
                        ONE MORE<br />
                        STEP
                    </h1>
                    <p className="text-lg text-white/80 text-center max-w-md">
                        Complete your organization setup to start managing your scrap collection operations efficiently.
                    </p>
                </div>
            </div>

            {/* Right Section - Organization Form */}
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

                {/* Setup Card */}
                <Card className="w-full max-w-md shadow-lg border-0 bg-white/95 backdrop-blur-sm">
                    <CardContent className="p-8 sm:p-10">
                        <div className="space-y-6">
                            {/* Title */}
                            <div className="text-center">
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">SETUP ORGANIZATION</h2>
                                <div className="w-16 h-0.5 bg-cyan-600 mx-auto" />
                                <p className="text-sm text-gray-600 mt-3">
                                    Welcome, {user?.name || user?.email}! Let's set up your organization.
                                </p>
                            </div>

                            {/* Organization Form */}
                            <OrganizationForm
                                onSubmit={handleOrganizationSubmit}
                                isLoading={createOrganizationMutation.isPending}
                                submitButtonText="Complete Setup"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
