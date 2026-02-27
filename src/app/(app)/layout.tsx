'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import BottomNav from '@/components/BottomNav';
import { motion } from 'framer-motion';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    if (!isAuthenticated) {
        return (
            <div style={{
                minHeight: '100vh',
                background: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <div style={{ width: 32, height: 32, border: '2px solid #262626', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#000', maxWidth: 480, margin: '0 auto', position: 'relative' }}>
            <motion.main
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{ paddingBottom: 80, minHeight: '100vh' }}
            >
                {children}
            </motion.main>
            <BottomNav />
        </div>
    );
}
