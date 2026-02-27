'use client';

import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, PlusCircle, TrendingUp, Lightbulb, User } from 'lucide-react';

const navItems = [
    { label: 'Home', icon: Home, path: '/dashboard' },
    { label: 'Log', icon: PlusCircle, path: '/log' },
    { label: 'Progress', icon: TrendingUp, path: '/progress' },
    { label: 'Insights', icon: Lightbulb, path: '/insights' },
    { label: 'Profile', icon: User, path: '/profile' },
];

export default function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();

    return (
        <nav
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'rgba(17,17,17,0.95)',
                borderTop: '1px solid #262626',
                padding: '8px 0 env(safe-area-inset-bottom)',
                backdropFilter: 'none',
                zIndex: 50,
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                {navItems.map((item) => {
                    const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.path}
                            onClick={() => router.push(item.path)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '8px 16px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                position: 'relative',
                                minWidth: 60,
                            }}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="nav-indicator"
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: 24,
                                        height: 2,
                                        background: '#fff',
                                        borderRadius: 100,
                                    }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                />
                            )}
                            <motion.div
                                animate={{
                                    scale: isActive ? 1 : 0.9,
                                    color: isActive ? '#ffffff' : '#606060',
                                }}
                                transition={{ duration: 0.15 }}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Icon size={20} />
                            </motion.div>
                            <span style={{
                                fontSize: 10,
                                fontWeight: isActive ? 600 : 400,
                                color: isActive ? '#ffffff' : '#606060',
                                letterSpacing: '0.02em',
                                transition: 'all 0.15s ease',
                            }}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
