'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { User, LogOut, Target, Scale, Ruler, ChevronRight, Loader2, Edit2, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const GOALS = [
    { value: 'lose_weight', label: 'Lose Weight', desc: 'Caloric deficit approach', icon: '↓' },
    { value: 'maintain', label: 'Maintain', desc: 'Balanced nutrition', icon: '→' },
    { value: 'gain_muscle', label: 'Gain Muscle', desc: 'High protein intake', icon: '↑' },
];

export default function ProfilePage() {
    const { user, token, updateUser, logout } = useAuthStore();
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState({
        name: user?.name || '',
        weight: user?.weight?.toString() || '',
        height: user?.height?.toString() || '',
        age: user?.age?.toString() || '',
        goal: user?.goal || 'maintain',
        dailyCalorieTarget: user?.dailyCalorieTarget?.toString() || '2000',
        dailyWaterTarget: user?.dailyWaterTarget?.toString() || '2500',
    });

    const handleSave = useCallback(async () => {
        if (!token) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/user', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    name: form.name,
                    weight: parseFloat(form.weight) || user?.weight,
                    height: parseFloat(form.height) || user?.height,
                    age: parseInt(form.age) || user?.age,
                    goal: form.goal,
                    dailyCalorieTarget: parseInt(form.dailyCalorieTarget) || 2000,
                    dailyWaterTarget: parseInt(form.dailyWaterTarget) || 2500,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            updateUser({
                name: data.user.name,
                weight: data.user.weight,
                height: data.user.height,
                age: data.user.age,
                goal: data.user.goal,
                dailyCalorieTarget: data.user.dailyCalorieTarget,
                dailyWaterTarget: data.user.dailyWaterTarget,
            });
            setIsEditing(false);
            toast.success('Profile updated!');
        } catch {
            toast.error('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    }, [token, form, user, updateUser]);

    const handleLogout = () => {
        logout();
        router.push('/login');
        toast.success('Logged out successfully');
    };

    const inputStyle = {
        background: '#111', border: '1px solid #262626', borderRadius: 8,
        padding: '11px 14px', color: '#fff', fontSize: 14, outline: 'none',
        fontFamily: 'Inter, sans-serif', width: '100%',
    };

    const bmi = form.weight && form.height
        ? (parseFloat(form.weight) / Math.pow(parseFloat(form.height) / 100, 2)).toFixed(1)
        : null;

    return (
        <div style={{ padding: '0 0 24px' }}>
            {/* Header */}
            <div style={{ padding: '52px 20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>Profile</h1>
                        <p style={{ fontSize: 13, color: '#606060', margin: 0 }}>Manage your account & goals</p>
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                        disabled={isSaving}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: isEditing ? '#fff' : '#1a1a1a', color: isEditing ? '#000' : '#fff', border: '1px solid #262626', borderRadius: 8, padding: '9px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
                        {isSaving ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : isEditing ? <Check size={14} /> : <Edit2 size={14} />}
                        {isSaving ? 'Saving...' : isEditing ? 'Save' : 'Edit'}
                    </motion.button>
                </div>
            </div>

            {/* Avatar + Name */}
            <div style={{ padding: '0 20px 20px' }}>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                    style={{ background: '#1a1a1a', border: '1px solid #262626', borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 56, height: 56, background: '#262626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <User size={24} color="#606060" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {isEditing ? (
                            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                style={{ ...inputStyle, marginBottom: 4 }}
                                onFocus={e => e.target.style.borderColor = '#fff'}
                                onBlur={e => e.target.style.borderColor = '#262626'} />
                        ) : (
                            <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
                        )}
                        <p style={{ fontSize: 13, color: '#606060', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
                    </div>
                </motion.div>
            </div>

            {/* Body Metrics */}
            <div style={{ padding: '0 20px 20px' }}>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
                    style={{ background: '#1a1a1a', border: '1px solid #262626', borderRadius: 12, padding: 20 }}>
                    <p style={{ fontSize: 12, color: '#606060', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px' }}>Body Metrics</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                        {[
                            { icon: <Scale size={14} />, label: 'Weight', key: 'weight', unit: 'kg', placeholder: '70' },
                            { icon: <Ruler size={14} />, label: 'Height', key: 'height', unit: 'cm', placeholder: '170' },
                            { icon: <User size={14} />, label: 'Age', key: 'age', unit: 'yrs', placeholder: '25' },
                        ].map(field => (
                            <div key={field.key}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#606060', marginBottom: 6 }}>{field.icon}<span style={{ fontSize: 11, color: '#606060', fontWeight: 500 }}>{field.label}</span></div>
                                {isEditing ? (
                                    <input type="number" value={form[field.key as keyof typeof form]}
                                        onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                                        placeholder={field.placeholder} style={{ ...inputStyle, padding: '10px' }}
                                        onFocus={e => e.target.style.borderColor = '#fff'}
                                        onBlur={e => e.target.style.borderColor = '#262626'} />
                                ) : (
                                    <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>
                                        {user?.[field.key as keyof typeof user] || '–'}
                                        <span style={{ fontSize: 11, color: '#606060', fontWeight: 400, marginLeft: 3 }}>{field.unit}</span>
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                    {bmi && !isEditing && (
                        <div style={{ background: '#111', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 12, color: '#606060' }}>BMI</span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{bmi}</span>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Goal Setting */}
            <div style={{ padding: '0 20px 20px' }}>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
                    style={{ background: '#1a1a1a', border: '1px solid #262626', borderRadius: 12, padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <Target size={14} color="#a1a1a1" />
                        <p style={{ fontSize: 12, color: '#606060', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Fitness Goal</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {GOALS.map(goal => {
                            const isActive = (isEditing ? form.goal : user?.goal) === goal.value;
                            return (
                                <button key={goal.value} onClick={() => isEditing && setForm(f => ({ ...f, goal: goal.value }))}
                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent', border: `1px solid ${isActive ? 'rgba(255,255,255,0.15)' : '#1f1f1f'}`, borderRadius: 8, cursor: isEditing ? 'pointer' : 'default', width: '100%', textAlign: 'left', transition: 'all 0.15s', fontFamily: 'Inter, sans-serif' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                            <span style={{ fontSize: 14 }}>{goal.icon}</span>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#fff' : '#a1a1a1' }}>{goal.label}</span>
                                        </div>
                                        <span style={{ fontSize: 11, color: '#606060' }}>{goal.desc}</span>
                                    </div>
                                    {isActive && <ChevronRight size={14} color="#606060" />}
                                </button>
                            );
                        })}
                    </div>
                </motion.div>
            </div>

            {/* Daily Targets */}
            <div style={{ padding: '0 20px 20px' }}>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
                    style={{ background: '#1a1a1a', border: '1px solid #262626', borderRadius: 12, padding: 20 }}>
                    <p style={{ fontSize: 12, color: '#606060', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 14px' }}>Daily Targets</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {[
                            { key: 'dailyCalorieTarget', label: 'Calorie Goal', unit: 'kcal' },
                            { key: 'dailyWaterTarget', label: 'Water Goal', unit: 'ml' },
                        ].map(target => (
                            <div key={target.key}>
                                <label style={{ fontSize: 11, color: '#606060', display: 'block', marginBottom: 6, fontWeight: 500 }}>{target.label}</label>
                                {isEditing ? (
                                    <input type="number" value={form[target.key as keyof typeof form]}
                                        onChange={e => setForm(f => ({ ...f, [target.key]: e.target.value }))}
                                        style={{ ...inputStyle }}
                                        onFocus={e => e.target.style.borderColor = '#fff'}
                                        onBlur={e => e.target.style.borderColor = '#262626'} />
                                ) : (
                                    <p style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>
                                        {user?.[target.key as keyof typeof user] || '–'}
                                        <span style={{ fontSize: 11, color: '#606060', fontWeight: 400, marginLeft: 4 }}>{target.unit}</span>
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Logout */}
            <div style={{ padding: '0 20px' }}>
                <motion.button whileTap={{ scale: 0.98 }} onClick={handleLogout}
                    style={{ width: '100%', background: 'transparent', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '14px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' }}>
                    <LogOut size={16} />
                    Sign Out
                </motion.button>
            </div>
        </div>
    );
}
