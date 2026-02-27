'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, router]);

    return (
        <div style={{
            minHeight: '100vh',
            background: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 20px',
        }}>
            {children}
        </div>
    );
}
