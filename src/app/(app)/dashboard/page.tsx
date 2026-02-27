'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useMealStore, Meal } from '@/store/mealStore';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Plus, Droplets, Flame, Zap, Clock, ChevronRight, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const MACRO_COLORS = { protein: '#ffffff', carbs: '#a1a1a1', fats: '#606060' };

function ProgressRing({ value, max, size = 120, strokeWidth = 10, label, sublabel }: {
    value: number; max: number; size?: number; strokeWidth?: number; label: string; sublabel?: string;
}) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const pct = Math.min(value / max, 1);
    const offset = circumference * (1 - pct);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1f1f1f" strokeWidth={strokeWidth} />
                <motion.circle
                    cx={size / 2} cy={size / 2} r={radius} fill="none"
                    stroke="#fff" strokeWidth={strokeWidth} strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
                    style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                />
                <text x={size / 2} y={size / 2 - 4} textAnchor="middle" fill="#fff" fontSize={16} fontWeight={700} fontFamily="Inter">{label}</text>
                {sublabel && <text x={size / 2} y={size / 2 + 14} textAnchor="middle" fill="#606060" fontSize={10} fontFamily="Inter">{sublabel}</text>}
            </svg>
        </div>
    );
}

function MacroBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
    const pct = Math.min((value / max) * 100, 100);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#a1a1a1', fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>{value}g</span>
            </div>
            <div style={{ height: 4, background: '#1f1f1f', borderRadius: 100, overflow: 'hidden' }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                    style={{ height: '100%', background: color, borderRadius: 100 }}
                />
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const { user, token } = useAuthStore();
    const { meals, setMeals, removeMeal, getTodayCalories, getTodayMacros } = useMealStore();
    const router = useRouter();
    const [water, setWater] = useState(0);
    const [isLoadingMeals, setIsLoadingMeals] = useState(true);

    const fetchMeals = useCallback(async () => {
        if (!token) return;
        setIsLoadingMeals(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const res = await fetch(`/api/meals?date=${today}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.meals) setMeals(data.meals);
        } catch {
            // silent
        } finally {
            setIsLoadingMeals(false);
        }
    }, [token, setMeals]);

    useEffect(() => {
        fetchMeals();
        const saved = localStorage.getItem('nutrameter-water');
        const savedDate = localStorage.getItem('nutrameter-water-date');
        const today = new Date().toDateString();
        if (savedDate === today && saved) {
            setWater(parseInt(saved));
        } else {
            localStorage.setItem('nutrameter-water-date', today);
            setWater(0);
        }
    }, [fetchMeals]);

    const addWater = (amount: number) => {
        const next = Math.min(water + amount, user?.dailyWaterTarget || 2500);
        setWater(next);
        localStorage.setItem('nutrameter-water', next.toString());
    };

    const deleteMeal = async (id: string) => {
        if (!token) return;
        try {
            await fetch(`/api/meals/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            removeMeal(id);
            toast.success('Meal removed');
        } catch {
            toast.error('Failed to delete meal');
        }
    };

    const todayCalories = getTodayCalories();
    const todayMacros = getTodayMacros();
    const calorieTarget = user?.dailyCalorieTarget || 2000;
    const waterTarget = user?.dailyWaterTarget || 2500;
    const todayMeals = meals.filter(m => new Date(m.createdAt).toDateString() === new Date().toDateString());

    const macroData = [
        { name: 'Protein', value: todayMacros.protein, color: '#ffffff' },
        { name: 'Carbs', value: todayMacros.carbs, color: '#a1a1a1' },
        { name: 'Fats', value: todayMacros.fats, color: '#444444' },
    ];

    const mealTypeColors: Record<string, string> = {
        breakfast: '#fff',
        lunch: '#a1a1a1',
        dinner: '#606060',
        snack: '#404040',
    };

    return (
        <div style={{ padding: '0 0 24px' }}>
            {/* Header */}
            <div style={{ padding: '52px 20px 24px', background: '#000' }}>
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <p style={{ color: '#606060', fontSize: 13, margin: '0 0 4px' }}>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>
                        Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
                    </h1>
                </motion.div>
            </div>

            {/* Calorie Ring + Macro Donut */}
            <div style={{ padding: '0 20px 24px' }}>
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    style={{ background: '#1a1a1a', border: '1px solid #262626', borderRadius: 12, padding: '24px 20px' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <div>
                            <p style={{ color: '#606060', fontSize: 12, margin: '0 0 4px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today&apos;s Calories</p>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                                <span style={{ fontSize: 32, fontWeight: 800, color: '#fff' }}>{todayCalories}</span>
                                <span style={{ fontSize: 14, color: '#606060' }}>/ {calorieTarget} kcal</span>
                            </div>
                            <p style={{ color: '#606060', fontSize: 12, margin: '4px 0 0' }}>
                                {Math.max(calorieTarget - todayCalories, 0)} kcal remaining
                            </p>
                        </div>
                        <ProgressRing
                            value={todayCalories}
                            max={calorieTarget}
                            size={88}
                            strokeWidth={8}
                            label={`${Math.round((todayCalories / calorieTarget) * 100)}%`}
                            sublabel="of goal"
                        />
                    </div>

                    {/* Macro bars */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <MacroBar label="Protein" value={todayMacros.protein} max={Math.round(calorieTarget * 0.3 / 4)} color={MACRO_COLORS.protein} />
                        <MacroBar label="Carbs" value={todayMacros.carbs} max={Math.round(calorieTarget * 0.45 / 4)} color={MACRO_COLORS.carbs} />
                        <MacroBar label="Fats" value={todayMacros.fats} max={Math.round(calorieTarget * 0.25 / 9)} color={MACRO_COLORS.fats} />
                    </div>
                </motion.div>
            </div>

            {/* Stats Grid */}
            <div style={{ padding: '0 20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                    { icon: <Flame size={16} />, label: 'Protein', value: `${todayMacros.protein}g`, sub: 'today' },
                    { icon: <Zap size={16} />, label: 'Health Score', value: todayMeals.length ? `${Math.round(todayMeals.reduce((a, m) => a + m.healthScore, 0) / todayMeals.length)}` : '–', sub: '/100 avg' },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 + i * 0.05 }}
                        style={{ background: '#1a1a1a', border: '1px solid #262626', borderRadius: 12, padding: '16px' }}
                    >
                        <div style={{ color: '#606060', marginBottom: 8 }}>{stat.icon}</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{stat.value}</div>
                        <div style={{ fontSize: 11, color: '#606060', marginTop: 2 }}>{stat.label} {stat.sub}</div>
                    </motion.div>
                ))}
            </div>

            {/* Macro donut if meals exist */}
            {todayMeals.length > 0 && (todayMacros.protein + todayMacros.carbs + todayMacros.fats > 0) && (
                <div style={{ padding: '0 20px 24px' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        style={{ background: '#1a1a1a', border: '1px solid #262626', borderRadius: 12, padding: '20px' }}
                    >
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: '0 0 16px' }}>Macro Distribution</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                            <div style={{ width: 100, height: 100 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={macroData} cx="50%" cy="50%" innerRadius={28} outerRadius={44} dataKey="value" paddingAngle={2}>
                                            {macroData.map((entry, index) => (
                                                <Cell key={index} fill={entry.color} stroke="none" />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {macroData.map(m => (
                                    <div key={m.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: 2, background: m.color }} />
                                            <span style={{ fontSize: 12, color: '#a1a1a1' }}>{m.name}</span>
                                        </div>
                                        <span style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>{m.value}g</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Water Tracker */}
            <div style={{ padding: '0 20px 24px' }}>
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.35 }}
                    style={{ background: '#1a1a1a', border: '1px solid #262626', borderRadius: 12, padding: '18px 20px' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Droplets size={16} color="#a1a1a1" />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Water Intake</span>
                        </div>
                        <span style={{ fontSize: 12, color: '#606060' }}>{water} / {waterTarget} ml</span>
                    </div>
                    <div style={{ height: 6, background: '#111', borderRadius: 100, overflow: 'hidden', marginBottom: 14 }}>
                        <motion.div
                            animate={{ width: `${Math.min((water / waterTarget) * 100, 100)}%` }}
                            transition={{ duration: 0.5 }}
                            style={{ height: '100%', background: '#fff', borderRadius: 100 }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {[150, 250, 500].map(ml => (
                            <motion.button key={ml} whileTap={{ scale: 0.95 }} onClick={() => addWater(ml)}
                                style={{
                                    flex: 1, padding: '8px 4px', background: 'transparent', border: '1px solid #262626',
                                    borderRadius: 8, color: '#a1a1a1', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                                    fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
                                }}>
                                +{ml}ml
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Quick Add Button */}
            <div style={{ padding: '0 20px 24px' }}>
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/log')}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    style={{
                        width: '100%', background: '#fff', color: '#000', border: 'none',
                        borderRadius: 10, padding: '14px', fontSize: 14, fontWeight: 600,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        fontFamily: 'Inter, sans-serif',
                    }}
                >
                    <Plus size={16} />
                    Log a Meal
                </motion.button>
            </div>

            {/* Recent Meals */}
            <div style={{ padding: '0 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h2 style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 }}>Today&apos;s Meals</h2>
                    <button onClick={() => router.push('/log')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#606060', fontSize: 12, display: 'flex', alignItems: 'center', gap: 2, fontFamily: 'Inter, sans-serif' }}>
                        View all <ChevronRight size={12} />
                    </button>
                </div>

                {isLoadingMeals ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[1, 2].map(i => (
                            <div key={i} className="skeleton" style={{ height: 72, borderRadius: 10 }} />
                        ))}
                    </div>
                ) : todayMeals.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ background: '#1a1a1a', border: '1px solid #262626', borderRadius: 10, padding: '28px 20px', textAlign: 'center' }}
                    >
                        <Clock size={28} color="#262626" style={{ margin: '0 auto 10px', display: 'block' }} />
                        <p style={{ color: '#606060', fontSize: 13, margin: 0 }}>No meals logged today</p>
                        <p style={{ color: '#404040', fontSize: 12, margin: '4px 0 0' }}>Start by logging your first meal</p>
                    </motion.div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <AnimatePresence>
                            {todayMeals.slice(0, 5).map((meal: Meal, i: number) => (
                                <motion.div
                                    key={meal._id}
                                    initial={{ opacity: 0, x: -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 16 }}
                                    transition={{ duration: 0.3, delay: i * 0.05 }}
                                    style={{
                                        background: '#1a1a1a', border: '1px solid #262626', borderRadius: 10,
                                        padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: 8,
                                            background: `${mealTypeColors[meal.mealType]}15`,
                                            border: `1px solid ${mealTypeColors[meal.mealType]}30`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            <span style={{ fontSize: 14 }}>
                                                {meal.mealType === 'breakfast' ? '🌅' : meal.mealType === 'lunch' ? '☀️' : meal.mealType === 'dinner' ? '🌙' : '🍎'}
                                            </span>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: '0 0 2px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meal.name}</p>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <span style={{ fontSize: 11, color: '#606060', textTransform: 'capitalize' }}>{meal.mealType}</span>
                                                <span style={{ fontSize: 11, color: '#404040' }}>·</span>
                                                <span style={{ fontSize: 11, color: '#606060' }}>P:{meal.macros.protein}g C:{meal.macros.carbs}g F:{meal.macros.fats}g</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{meal.calories}</span>
                                        <button onClick={() => deleteMeal(meal._id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#404040', padding: '4px', display: 'flex', borderRadius: 6 }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
