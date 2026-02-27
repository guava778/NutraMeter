'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, Activity } from 'lucide-react';

const goals = [
    { value: 'lose_weight', label: 'Lose Weight', icon: '↓' },
    { value: 'maintain', label: 'Maintain', icon: '→' },
    { value: 'gain_muscle', label: 'Gain Muscle', icon: '↑' },
];

export default function RegisterPage() {
    const router = useRouter();
    const { login } = useAuthStore();
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        name: '', email: '', password: '',
        weight: '', height: '', age: '',
        goal: 'maintain',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step === 1) {
            if (!form.name || !form.email || !form.password) {
                toast.error('Please fill in all fields');
                return;
            }
            if (form.password.length < 6) {
                toast.error('Password must be at least 6 characters');
                return;
            }
            setStep(2);
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    weight: parseFloat(form.weight) || 70,
                    height: parseFloat(form.height) || 170,
                    age: parseInt(form.age) || 25,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Registration failed');
            login(data.user, data.token);
            toast.success(`Welcome to NutraMeter, ${data.user.name}!`);
            router.push('/dashboard');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    const inputStyle = {
        width: '100%', background: '#111111', border: '1px solid #262626',
        borderRadius: 8, padding: '13px 16px', color: '#fff', fontSize: 14,
        outline: 'none', transition: 'border-color 0.2s', fontFamily: 'Inter, sans-serif',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ width: '100%', maxWidth: 400 }}
        >
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{
                    width: 48, height: 48, background: '#fff', borderRadius: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 14px',
                }}>
                    <Activity size={24} color="#000" />
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>Create Account</h1>
                <p style={{ color: '#606060', fontSize: 13, margin: '6px 0 0' }}>
                    Step {step} of 2 — {step === 1 ? 'Your details' : 'Body metrics'}
                </p>
            </div>

            {/* Step indicator */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
                {[1, 2].map(s => (
                    <div key={s} style={{
                        flex: 1, height: 3, borderRadius: 100,
                        background: s <= step ? '#fff' : '#262626',
                        transition: 'background 0.3s',
                    }} />
                ))}
            </div>

            <div style={{ background: '#1a1a1a', border: '1px solid #262626', borderRadius: 12, padding: 28 }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {step === 1 ? (
                        <>
                            <div>
                                <label style={{ fontSize: 12, color: '#a1a1a1', display: 'block', marginBottom: 6, fontWeight: 500 }}>Full Name</label>
                                <input type="text" value={form.name} onChange={e => update('name', e.target.value)}
                                    placeholder="John Doe" style={inputStyle}
                                    onFocus={e => e.target.style.borderColor = '#fff'}
                                    onBlur={e => e.target.style.borderColor = '#262626'} />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: '#a1a1a1', display: 'block', marginBottom: 6, fontWeight: 500 }}>Email Address</label>
                                <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                                    placeholder="you@example.com" style={inputStyle}
                                    onFocus={e => e.target.style.borderColor = '#fff'}
                                    onBlur={e => e.target.style.borderColor = '#262626'} />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: '#a1a1a1', display: 'block', marginBottom: 6, fontWeight: 500 }}>Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input type={showPassword ? 'text' : 'password'} value={form.password}
                                        onChange={e => update('password', e.target.value)}
                                        placeholder="Min. 6 characters" style={{ ...inputStyle, paddingRight: 44 }}
                                        onFocus={e => e.target.style.borderColor = '#fff'}
                                        onBlur={e => e.target.style.borderColor = '#262626'} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#606060', display: 'flex', padding: 0 }}>
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 12, color: '#a1a1a1', display: 'block', marginBottom: 6, fontWeight: 500 }}>Weight (kg)</label>
                                    <input type="number" value={form.weight} onChange={e => update('weight', e.target.value)}
                                        placeholder="70" style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = '#fff'}
                                        onBlur={e => e.target.style.borderColor = '#262626'} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: '#a1a1a1', display: 'block', marginBottom: 6, fontWeight: 500 }}>Height (cm)</label>
                                    <input type="number" value={form.height} onChange={e => update('height', e.target.value)}
                                        placeholder="170" style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = '#fff'}
                                        onBlur={e => e.target.style.borderColor = '#262626'} />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: '#a1a1a1', display: 'block', marginBottom: 6, fontWeight: 500 }}>Age</label>
                                <input type="number" value={form.age} onChange={e => update('age', e.target.value)}
                                    placeholder="25" style={inputStyle}
                                    onFocus={e => e.target.style.borderColor = '#fff'}
                                    onBlur={e => e.target.style.borderColor = '#262626'} />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: '#a1a1a1', display: 'block', marginBottom: 8, fontWeight: 500 }}>Your Goal</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                                    {goals.map(g => (
                                        <button key={g.value} type="button" onClick={() => update('goal', g.value)}
                                            style={{
                                                padding: '12px 8px', border: `1px solid ${form.goal === g.value ? '#fff' : '#262626'}`,
                                                borderRadius: 8, background: form.goal === g.value ? 'rgba(255,255,255,0.08)' : 'transparent',
                                                color: form.goal === g.value ? '#fff' : '#606060', cursor: 'pointer',
                                                fontSize: 11, fontWeight: 500, transition: 'all 0.15s', textAlign: 'center',
                                            }}>
                                            <div style={{ fontSize: 18, marginBottom: 4 }}>{g.icon}</div>
                                            {g.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    <motion.button type="submit" disabled={isLoading} whileTap={{ scale: 0.98 }}
                        style={{
                            width: '100%', background: '#fff', color: '#000', border: 'none',
                            borderRadius: 8, padding: '14px', fontSize: 14, fontWeight: 600,
                            cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            fontFamily: 'Inter, sans-serif', marginTop: 6,
                        }}>
                        {isLoading ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : null}
                        {step === 1 ? 'Continue' : (isLoading ? 'Creating account...' : 'Create Account')}
                    </motion.button>
                </form>
            </div>

            {step === 1 && (
                <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#606060' }}>
                    Already have an account?{' '}
                    <Link href="/login" style={{ color: '#fff', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
                </p>
            )}
            {step === 2 && (
                <button onClick={() => setStep(1)} style={{
                    display: 'block', margin: '16px auto 0', background: 'none', border: 'none',
                    color: '#606060', cursor: 'pointer', fontSize: 13, fontFamily: 'Inter, sans-serif',
                }}>← Back</button>
            )}
        </motion.div>
    );
}
