'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SettingsPage() {
  const router = useRouter();

  // Redirect to admin settings by default
  useEffect(() => {
    router.replace('/settings/admin');
  }, [router]);

  return null;
}
