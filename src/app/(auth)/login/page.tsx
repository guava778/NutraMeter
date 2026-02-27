'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, Activity } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error('Please fill in all fields');
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');
            login(data.user, data.token);
            toast.success(`Welcome back, ${data.user.name}!`);
            router.push('/dashboard');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const inputStyle = {
        width: '100%',
        background: '#111111',
        border: '1px solid #262626',
        borderRadius: 8,
        padding: '14px 16px',
        color: '#fff',
        fontSize: 14,
        outline: 'none',
        transition: 'border-color 0.2s',
        fontFamily: 'Inter, sans-serif',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ width: '100%', maxWidth: 400 }}
        >
            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <div style={{
                    width: 48, height: 48, background: '#fff', borderRadius: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px',
                }}>
                    <Activity size={24} color="#000" />
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 }}>NutraMeter</h1>
                <p style={{ color: '#606060', fontSize: 13, margin: '6px 0 0' }}>AI-powered nutritional intelligence</p>
            </div>

            {/* Card */}
            <div style={{ background: '#1a1a1a', border: '1px solid #262626', borderRadius: 12, padding: 28 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff', margin: '0 0 6px' }}>Sign In</h2>
                <p style={{ fontSize: 13, color: '#606060', margin: '0 0 24px' }}>Welcome back to your nutrition journey</p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label style={{ fontSize: 12, color: '#a1a1a1', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            style={inputStyle}
                            onFocus={(e) => e.target.style.borderColor = '#fff'}
                            onBlur={(e) => e.target.style.borderColor = '#262626'}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: 12, color: '#a1a1a1', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                style={{ ...inputStyle, paddingRight: 44 }}
                                onFocus={(e) => e.target.style.borderColor = '#fff'}
                                onBlur={(e) => e.target.style.borderColor = '#262626'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer', color: '#606060',
                                    display: 'flex', padding: 0,
                                }}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <motion.button
                        type="submit"
                        disabled={isLoading}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            width: '100%', background: '#fff', color: '#000', border: 'none',
                            borderRadius: 8, padding: '14px', fontSize: 14, fontWeight: 600,
                            cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            fontFamily: 'Inter, sans-serif', marginTop: 4,
                        }}
                    >
                        {isLoading ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : null}
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </motion.button>
                </form>
            </div>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#606060' }}>
                Don&apos;t have an account?{' '}
                <Link href="/register" style={{ color: '#fff', textDecoration: 'none', fontWeight: 500 }}>
                    Create one
                </Link>
            </p>
        </motion.div>
    );
}
