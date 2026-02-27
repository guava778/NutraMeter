'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useMealStore } from '@/store/mealStore';
import { useAuthStore } from '@/store/authStore';
import { AlertTriangle, CheckCircle, TrendingUp, Lightbulb, Target, Flame } from 'lucide-react';

interface Insight {
    type: 'success' | 'warning' | 'tip' | 'info';
    icon: React.ReactNode;
    title: string;
    message: string;
    badge?: string;
}

export default function InsightsPage() {
    const { meals } = useMealStore();
    const { user } = useAuthStore();

    const insights = useMemo((): Insight[] => {
        const today = new Date().toDateString();
        const todayMeals = meals.filter(m => new Date(m.createdAt).toDateString() === today);
        const totalCals = todayMeals.reduce((s, m) => s + m.calories, 0);
        const totalProtein = todayMeals.reduce((s, m) => s + m.macros.protein, 0);
        const totalSodium = todayMeals.reduce((s, m) => s + (m.micronutrients.sodium || 0), 0);
        const avgHealthScore = todayMeals.length ? todayMeals.reduce((s, m) => s + m.healthScore, 0) / todayMeals.length : 0;
        const calorieTarget = user?.dailyCalorieTarget || 2000;
        const proteinTarget = Math.round(calorieTarget * 0.3 / 4);
        const weekMeals = meals.filter(m => {
            const d = new Date(m.createdAt);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return d >= weekAgo;
        });
        const loggedDays = new Set(weekMeals.map(m => new Date(m.createdAt).toDateString())).size;

        const items: Insight[] = [];

        // Streak insight
        if (loggedDays >= 5) {
            items.push({ type: 'success', icon: <CheckCircle size={16} />, title: 'Great Consistency!', message: `You've logged meals ${loggedDays} out of the last 7 days. Keep it up!`, badge: `${loggedDays}/7` });
        } else if (loggedDays < 3) {
            items.push({ type: 'warning', icon: <AlertTriangle size={16} />, title: 'Track More Consistently', message: `You've only logged ${loggedDays} days this week. Consistent tracking leads to better insights.`, badge: `${loggedDays}/7` });
        }

        // Calorie insight
        if (totalCals > 0) {
            if (totalCals > calorieTarget * 1.1) {
                items.push({ type: 'warning', icon: <Flame size={16} />, title: 'Over Calorie Goal', message: `You're ${totalCals - calorieTarget} kcal over your daily target of ${calorieTarget} kcal.`, badge: `${totalCals} kcal` });
            } else if (totalCals < calorieTarget * 0.6 && todayMeals.length >= 2) {
                items.push({ type: 'tip', icon: <Lightbulb size={16} />, title: 'Low Calorie Intake', message: `You've only had ${totalCals} kcal. Consider a nutritious snack to meet your energy needs.` });
            } else {
                items.push({ type: 'success', icon: <Target size={16} />, title: 'On Track Today!', message: `${totalCals} / ${calorieTarget} kcal consumed. You're pacing well for the day.` });
            }
        }

        // Protein insight
        if (totalProtein > 0) {
            if (totalProtein < proteinTarget * 0.6) {
                items.push({ type: 'warning', icon: <AlertTriangle size={16} />, title: 'Low Protein Intake', message: `You're getting ${totalProtein}g protein vs a target of ~${proteinTarget}g. Add lean meats, eggs, or legumes.`, badge: `${totalProtein}g` });
            } else if (totalProtein >= proteinTarget * 0.9) {
                items.push({ type: 'success', icon: <CheckCircle size={16} />, title: 'Excellent Protein!', message: `Great job hitting ${totalProtein}g protein today. Your muscles will thank you!`, badge: `${totalProtein}g` });
            }
        }

        // Sodium insight
        if (totalSodium > 2000) {
            items.push({ type: 'warning', icon: <AlertTriangle size={16} />, title: 'High Sodium Alert', message: `Today's sodium intake is ${totalSodium}mg, exceeding the 2300mg daily limit. Limit processed foods.`, badge: `${totalSodium}mg` });
        }

        // Health score
        if (avgHealthScore > 0) {
            if (avgHealthScore >= 70) {
                items.push({ type: 'success', icon: <TrendingUp size={16} />, title: 'High Quality Meals', message: `Your average meal health score is ${Math.round(avgHealthScore)}/100. You're making nutritious choices!` });
            } else if (avgHealthScore < 50) {
                items.push({ type: 'tip', icon: <Lightbulb size={16} />, title: 'Improve Meal Quality', message: `Average health score is ${Math.round(avgHealthScore)}/100. Try adding more whole foods and vegetables.` });
            }
        }

        // AI recommendations from recent meals
        const allRecs = weekMeals.flatMap(m => m.recommendations).filter(Boolean);
        const uniqueRecs = [...new Set(allRecs)].slice(0, 3);
        if (uniqueRecs.length > 0) {
            uniqueRecs.forEach(rec => {
                items.push({ type: 'tip', icon: <Lightbulb size={16} />, title: 'AI Nutrition Tip', message: rec });
            });
        }

        // Empty state
        if (items.length === 0) {
            items.push({ type: 'info', icon: <Lightbulb size={16} />, title: 'Start Logging Meals', message: 'Log your first meal to receive personalized AI-powered nutritional insights!' });
        }

        return items;
    }, [meals, user]);

    const getColors = (type: string) => ({
        success: { bg: 'rgba(74,222,128,0.06)', border: 'rgba(74,222,128,0.15)', icon: '#4ade80', badge: 'rgba(74,222,128,0.1)' },
        warning: { bg: 'rgba(248,113,113,0.06)', border: 'rgba(248,113,113,0.15)', icon: '#f87171', badge: 'rgba(248,113,113,0.1)' },
        tip: { bg: 'rgba(250,204,21,0.06)', border: 'rgba(250,204,21,0.15)', icon: '#facc15', badge: 'rgba(250,204,21,0.1)' },
        info: { bg: 'rgba(255,255,255,0.04)', border: '#262626', icon: '#a1a1a1', badge: 'rgba(255,255,255,0.08)' },
    }[type] || { bg: 'rgba(255,255,255,0.04)', border: '#262626', icon: '#a1a1a1', badge: 'rgba(255,255,255,0.08)' });

    // Weekly summary stats
    const weekMealsAll = meals.filter(m => {
        const d = new Date(m.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return d >= weekAgo;
    });
    const avgDailyCalories = weekMealsAll.length
        ? Math.round(weekMealsAll.reduce((s, m) => s + m.calories, 0) / 7)
        : 0;
    const avgHealthScore = weekMealsAll.length
        ? Math.round(weekMealsAll.reduce((s, m) => s + m.healthScore, 0) / weekMealsAll.length)
        : 0;

    return (
        <div style={{ padding: '0 0 24px' }}>
            <div style={{ padding: '52px 20px 24px' }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>Insights</h1>
                <p style={{ fontSize: 13, color: '#606060', margin: 0 }}>Your personalized nutrition analysis</p>
            </div>

            {/* Weekly Summary */}
            <div style={{ padding: '0 20px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                    { label: 'Avg Daily Cal', value: avgDailyCalories || '–', unit: avgDailyCalories ? 'kcal' : '' },
                    { label: 'Meals Logged', value: weekMealsAll.length, unit: 'this week' },
                    { label: 'Avg Health', value: avgHealthScore || '–', unit: avgHealthScore ? '/100' : '' },
                ].map((stat, i) => (
                    <motion.div key={stat.label}
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.07 }}
                        style={{ background: '#1a1a1a', border: '1px solid #262626', borderRadius: 10, padding: '14px 12px', textAlign: 'center' }}>
                        <p style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 2px' }}>{stat.value}</p>
                        <p style={{ fontSize: 10, color: '#606060', margin: 0, fontWeight: 500 }}>{stat.unit}</p>
                        <p style={{ fontSize: 9, color: '#404040', margin: '3px 0 0', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Insight Cards */}
            <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {insights.map((insight, i) => {
                    const colors = getColors(insight.type);
                    return (
                        <motion.div key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 + i * 0.07 }}
                            style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 12, padding: '16px 18px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ color: colors.icon }}>{insight.icon}</div>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{insight.title}</span>
                                </div>
                                {insight.badge && (
                                    <span style={{ fontSize: 11, fontWeight: 600, color: colors.icon, background: colors.badge, borderRadius: 20, padding: '3px 8px', flexShrink: 0, marginLeft: 8 }}>
                                        {insight.badge}
                                    </span>
                                )}
                            </div>
                            <p style={{ fontSize: 13, color: '#a1a1a1', margin: 0, lineHeight: 1.6 }}>{insight.message}</p>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
