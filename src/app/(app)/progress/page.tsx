'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useMealStore } from '@/store/mealStore';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar
} from 'recharts';
import { TrendingUp, Scale, Calculator, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProgressEntry {
    _id: string;
    weight: number;
    waterIntake: number;
    date: string;
}

interface WeekData {
    day: string;
    calories: number;
    protein: number;
}

export default function ProgressPage() {
    const { token, user } = useAuthStore();
    const { meals } = useMealStore();
    const [entries, setEntries] = useState<ProgressEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [weightInput, setWeightInput] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [bmiHeight, setBmiHeight] = useState(user?.height?.toString() || '');
    const [bmiWeight, setBmiWeight] = useState(user?.weight?.toString() || '');

    const fetchProgress = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const res = await fetch('/api/progress?limit=30', { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.entries) setEntries(data.entries);
        } catch {
            // silent
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => { fetchProgress(); }, [fetchProgress]);

    const logWeight = async () => {
        if (!token || !weightInput) { toast.error('Enter your weight first'); return; }
        setIsSaving(true);
        try {
            const res = await fetch('/api/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ weight: parseFloat(weightInput) }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setEntries(prev => [data.entry, ...prev]);
            setWeightInput('');
            toast.success('Weight logged!');
        } catch {
            toast.error('Failed to log weight');
        } finally {
            setIsSaving(false);
        }
    };

    // Build weekly calorie data from meals store
    const buildWeeklyData = (): WeekData[] => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date();
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() - (6 - i));
            const dateStr = d.toDateString();
            const dayMeals = meals.filter(m => new Date(m.createdAt).toDateString() === dateStr);
            return {
                day: days[d.getDay()],
                calories: dayMeals.reduce((s, m) => s + m.calories, 0),
                protein: dayMeals.reduce((s, m) => s + m.macros.protein, 0),
            };
        });
    };

    const weeklyData = buildWeeklyData();

    // Weight chart data
    const weightData = entries.slice(0, 10).reverse().map(e => ({
        date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: e.weight,
    }));

    // BMI calculator
    const bmi = bmiWeight && bmiHeight
        ? (parseFloat(bmiWeight) / Math.pow(parseFloat(bmiHeight) / 100, 2)).toFixed(1)
        : null;
    const bmiCategory = bmi ? (
        parseFloat(bmi) < 18.5 ? 'Underweight' :
            parseFloat(bmi) < 25 ? 'Normal' :
                parseFloat(bmi) < 30 ? 'Overweight' : 'Obese'
    ) : null;
    const bmiColor = bmiCategory === 'Normal' ? '#4ade80' : bmiCategory === 'Underweight' ? '#60a5fa' : '#f87171';

    // Nutritional consistency score
    const loggedDays = new Set(meals.map(m => new Date(m.createdAt).toDateString())).size;
    const consistencyScore = Math.min(Math.round((loggedDays / 7) * 100), 100);

    const tooltipStyle = { background: '#1a1a1a', border: '1px solid #262626', borderRadius: 8, color: '#fff', fontSize: 12 };

    const inputStyle = { background: '#111', border: '1px solid #262626', borderRadius: 8, padding: '12px 14px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif', width: '100%' };

    return (
        <div style={{ padding: '0 0 24px' }}>
            <div style={{ padding: '52px 20px 24px' }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>Progress</h1>
                <p style={{ fontSize: 13, color: '#606060', margin: 0 }}>Your nutrition trends over time</p>
            </div>

            {/* Consistency Score */}
            <div style={{ padding: '0 20px 20px' }}>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                    style={{ background: '#1a1a1a', border: '1px solid #262626', borderRadius: 12, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ fontSize: 12, color: '#606060', margin: '0 0 6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Weekly Consistency</p>
                            <p style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: 0 }}>{consistencyScore}%</p>
                            <p style={{ fontSize: 12, color: '#606060', margin: '4px 0 0' }}>Logged {loggedDays}/7 days</p>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                            {Array.from({ length: 7 }, (_, i) => {
                                const d = new Date();
                                d.setDate(d.getDate() - (6 - i));
                                const hasData = meals.some(m => new Date(m.createdAt).toDateString() === d.toDateString());
                                return (
                                    <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.05 }}
                                        style={{ width: 24, height: 24, borderRadius: 6, background: hasData ? '#fff' : '#1f1f1f', border: '1px solid #262626' }} />
                                );
                            })}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Weekly Calorie Chart */}
            <div style={{ padding: '0 20px 20px' }}>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
                    style={{ background: '#1a1a1a', border: '1px solid #262626', borderRadius: 12, padding: '20px 16px' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: '0 0 20px', paddingLeft: 4 }}>Weekly Calories</p>
                    <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={weeklyData} barCategoryGap="35%">
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                            <XAxis dataKey="day" tick={{ fill: '#606060', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#606060', fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
                            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v) => [`${v} kcal`, 'Calories']} />
                            <Bar dataKey="calories" fill="#fff" radius={[4, 4, 0, 0]} maxBarSize={32} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Protein Trend */}
            <div style={{ padding: '0 20px 20px' }}>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
                    style={{ background: '#1a1a1a', border: '1px solid #262626', borderRadius: 12, padding: '20px 16px' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: '0 0 20px', paddingLeft: 4 }}>Protein Intake (7 days)</p>
                    <ResponsiveContainer width="100%" height={140}>
                        <LineChart data={weeklyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                            <XAxis dataKey="day" tick={{ fill: '#606060', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#606060', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}g`, 'Protein']} />
                            <Line type="monotone" dataKey="protein" stroke="#fff" strokeWidth={2} dot={{ fill: '#fff', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Weight Tracker */}
            <div style={{ padding: '0 20px 20px' }}>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
                    style={{ background: '#1a1a1a', border: '1px solid #262626', borderRadius: 12, padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <Scale size={16} color="#a1a1a1" />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Weight Tracker</span>
                    </div>

                    {weightData.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                            <ResponsiveContainer width="100%" height={120}>
                                <LineChart data={weightData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fill: '#606060', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#606060', fontSize: 10 }} axisLine={false} tickLine={false} width={36} domain={['auto', 'auto']} />
                                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} kg`, 'Weight']} />
                                    <Line type="monotone" dataKey="weight" stroke="#fff" strokeWidth={2} dot={{ fill: '#fff', r: 3, strokeWidth: 0 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 10 }}>
                        <input type="number" value={weightInput} onChange={e => setWeightInput(e.target.value)}
                            placeholder="Enter weight (kg)" style={{ ...inputStyle, flex: 1 }}
                            onFocus={e => e.target.style.borderColor = '#fff'}
                            onBlur={e => e.target.style.borderColor = '#262626'} />
                        <motion.button whileTap={{ scale: 0.95 }} onClick={logWeight} disabled={isSaving}
                            style={{ background: '#fff', color: '#000', border: 'none', borderRadius: 8, padding: '12px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13, fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>
                            {isSaving ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Plus size={14} />}
                            Log
                        </motion.button>
                    </div>

                    {isLoading && <div style={{ color: '#606060', fontSize: 12, marginTop: 10 }}>Loading entries...</div>}
                    {entries.length > 0 && (
                        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {entries.slice(0, 5).map(e => (
                                <div key={e._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1f1f1f' }}>
                                    <span style={{ fontSize: 12, color: '#606060' }}>{new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                    <span style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>{e.weight} kg</span>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* BMI Calculator */}
            <div style={{ padding: '0 20px' }}>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}
                    style={{ background: '#1a1a1a', border: '1px solid #262626', borderRadius: 12, padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <Calculator size={16} color="#a1a1a1" />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>BMI Calculator</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 11, color: '#606060', display: 'block', marginBottom: 5 }}>Weight (kg)</label>
                            <input type="number" value={bmiWeight} onChange={e => setBmiWeight(e.target.value)}
                                placeholder="70" style={{ ...inputStyle }}
                                onFocus={e => e.target.style.borderColor = '#fff'}
                                onBlur={e => e.target.style.borderColor = '#262626'} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 11, color: '#606060', display: 'block', marginBottom: 5 }}>Height (cm)</label>
                            <input type="number" value={bmiHeight} onChange={e => setBmiHeight(e.target.value)}
                                placeholder="170" style={{ ...inputStyle }}
                                onFocus={e => e.target.style.borderColor = '#fff'}
                                onBlur={e => e.target.style.borderColor = '#262626'} />
                        </div>
                    </div>
                    {bmi && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            style={{ background: '#111', borderRadius: 10, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ fontSize: 11, color: '#606060', margin: '0 0 4px', fontWeight: 500 }}>Your BMI</p>
                                <p style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: 0 }}>{bmi}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: bmiColor }}>{bmiCategory}</span>
                                <p style={{ fontSize: 11, color: '#606060', margin: '2px 0 0' }}>18.5–24.9 is normal</p>
                            </div>
                        </motion.div>
                    )}
                    {!bmi && (
                        <div style={{ background: '#111', borderRadius: 10, padding: '12px 16px' }}>
                            <p style={{ fontSize: 12, color: '#606060', margin: 0 }}>Enter weight and height to calculate</p>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                        {[{ label: 'Underweight', range: '<18.5' }, { label: 'Normal', range: '18.5–24.9' }, { label: 'Overweight', range: '25–29.9' }, { label: 'Obese', range: '≥30' }].map(c => (
                            <div key={c.label} style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: 9, color: '#404040', margin: '0 0 2px', fontWeight: 600 }}>{c.label}</p>
                                <p style={{ fontSize: 9, color: '#606060', margin: 0 }}>{c.range}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
