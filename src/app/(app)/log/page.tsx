'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useMealStore } from '@/store/mealStore';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { Camera, Upload, X, Sparkles, Save, ChevronDown, Loader2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_ICONS: Record<string, string> = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' };

interface NutritionResult {
    food_items: string[];
    calories: number;
    macros: { protein: number; carbs: number; fats: number; fiber: number; sugar: number };
    micronutrients: Record<string, number>;
    health_score: number;
    recommendations: string[];
}

function HealthGauge({ score }: { score: number }) {
    const data = [{ value: score, fill: score >= 70 ? '#4ade80' : score >= 40 ? '#facc15' : '#f87171' }];
    return (
        <div style={{ position: 'relative', width: 120, height: 120 }}>
            <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={data} startAngle={180} endAngle={-180}>
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar dataKey="value" cornerRadius={6} background={{ fill: '#1f1f1f' }} />
                </RadialBarChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{score}</span>
                <span style={{ fontSize: 9, color: '#606060', fontWeight: 500 }}>HEALTH</span>
            </div>
        </div>
    );
}

export default function LogMealPage() {
    const { token } = useAuthStore();
    const { addMeal } = useMealStore();
    const [tab, setTab] = useState<'manual' | 'camera'>('camera');
    const [mealType, setMealType] = useState('lunch');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [imageMime, setImageMime] = useState('image/jpeg');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<NutritionResult | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [mealName, setMealName] = useState('');
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraRef = useRef<HTMLInputElement>(null);

    // Manual form state
    const [manualForm, setManualForm] = useState({
        name: '', calories: '', protein: '', carbs: '', fats: '', mealType: 'lunch',
    });

    const processImage = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            setImagePreview(result);
            const base64 = result.split(',')[1];
            setImageBase64(base64);
            setImageMime(file.type || 'image/jpeg');
            setResult(null);
        };
        reader.readAsDataURL(file);
    }, []);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processImage(file);
    };

    const analyzeImage = async () => {
        if (!imageBase64 || !token) return;
        setIsAnalyzing(true);
        setResult(null);
        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ imageBase64, mimeType: imageMime }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Analysis failed');
            setResult(data.data);
            if (data.data.food_items?.length > 0) {
                setMealName(data.data.food_items.slice(0, 2).join(' & '));
            }
            toast.success('Meal analyzed!');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Analysis failed. Check your API key.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const saveMeal = async () => {
        if (!token || !result) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/meals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    name: mealName || result.food_items.join(', ') || 'Analyzed Meal',
                    mealType,
                    calories: result.calories,
                    macros: result.macros,
                    micronutrients: result.micronutrients,
                    healthScore: result.health_score,
                    recommendations: result.recommendations,
                    foodItems: result.food_items,
                    isAiAnalyzed: true,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            addMeal(data.meal);
            toast.success('Meal saved!');
            setResult(null);
            setImagePreview(null);
            setImageBase64(null);
            setMealName('');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    const saveManualMeal = async () => {
        if (!token || !manualForm.name || !manualForm.calories) {
            toast.error('Name and calories are required');
            return;
        }
        setIsSaving(true);
        try {
            const res = await fetch('/api/meals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    name: manualForm.name,
                    mealType: manualForm.mealType,
                    calories: parseFloat(manualForm.calories) || 0,
                    macros: {
                        protein: parseFloat(manualForm.protein) || 0,
                        carbs: parseFloat(manualForm.carbs) || 0,
                        fats: parseFloat(manualForm.fats) || 0,
                    },
                    micronutrients: {},
                    healthScore: 50,
                    recommendations: [],
                    foodItems: [manualForm.name],
                    isAiAnalyzed: false,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            addMeal(data.meal);
            toast.success('Meal logged!');
            setManualForm({ name: '', calories: '', protein: '', carbs: '', fats: '', mealType: 'lunch' });
        } catch {
            toast.error('Failed to save meal');
        } finally {
            setIsSaving(false);
        }
    };

    const inputStyle = {
        width: '100%', background: '#111', border: '1px solid #262626', borderRadius: 8,
        padding: '12px 14px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif',
    };

    return (
        <div style={{ padding: '0 0 24px' }}>
            {/* Header */}
            <div style={{ padding: '52px 20px 20px' }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>Log Meal</h1>
                <p style={{ fontSize: 13, color: '#606060', margin: 0 }}>Capture or enter what you ate</p>
            </div>

            {/* Tab Switch */}
            <div style={{ padding: '0 20px 20px' }}>
                <div style={{ display: 'flex', background: '#111', border: '1px solid #262626', borderRadius: 10, padding: 4, gap: 4 }}>
                    {(['camera', 'manual'] as const).map(t => (
                        <motion.button key={t} onClick={() => setTab(t)} style={{
                            flex: 1, padding: '10px', background: tab === t ? '#1a1a1a' : 'transparent',
                            border: tab === t ? '1px solid #262626' : '1px solid transparent',
                            borderRadius: 7, color: tab === t ? '#fff' : '#606060', fontSize: 13,
                            fontWeight: tab === t ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s',
                            fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}>
                            {t === 'camera' ? <><Camera size={14} /> AI Analyze</> : <><Plus size={14} /> Manual</>}
                        </motion.button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {tab === 'camera' ? (
                    <motion.div key="camera" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                        {/* Meal Type */}
                        <div style={{ padding: '0 20px 16px' }}>
                            <div style={{ position: 'relative' }}>
                                <button onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                                    style={{ width: '100%', background: '#1a1a1a', border: '1px solid #262626', borderRadius: 8, padding: '12px 14px', color: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Inter, sans-serif', fontSize: 14 }}>
                                    <span>{MEAL_ICONS[mealType]} {mealType.charAt(0).toUpperCase() + mealType.slice(1)}</span>
                                    <ChevronDown size={16} color="#606060" />
                                </button>
                                <AnimatePresence>
                                    {showTypeDropdown && (
                                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                            style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: '#1a1a1a', border: '1px solid #262626', borderRadius: 8, zIndex: 10, overflow: 'hidden' }}>
                                            {MEAL_TYPES.map(type => (
                                                <button key={type} onClick={() => { setMealType(type); setShowTypeDropdown(false); }}
                                                    style={{ width: '100%', padding: '12px 14px', background: mealType === type ? '#262626' : 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Inter, sans-serif', fontSize: 14, textAlign: 'left' }}>
                                                    {MEAL_ICONS[type]} {type.charAt(0).toUpperCase() + type.slice(1)}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Image Capture Area */}
                        <div style={{ padding: '0 20px 16px' }}>
                            {!imagePreview ? (
                                <div style={{ border: '1px dashed #262626', borderRadius: 12, overflow: 'hidden' }}>
                                    <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                                        <div style={{ width: 56, height: 56, background: '#1a1a1a', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Camera size={24} color="#606060" />
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <p style={{ color: '#a1a1a1', fontSize: 14, fontWeight: 500, margin: '0 0 4px' }}>Capture your meal</p>
                                            <p style={{ color: '#404040', fontSize: 12, margin: 0 }}>AI will analyze the nutrition instantly</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 280 }}>
                                            <motion.button whileTap={{ scale: 0.97 }} onClick={() => cameraRef.current?.click()}
                                                style={{ flex: 1, background: '#fff', color: '#000', border: 'none', borderRadius: 8, padding: '12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'Inter, sans-serif' }}>
                                                <Camera size={14} /> Camera
                                            </motion.button>
                                            <motion.button whileTap={{ scale: 0.97 }} onClick={() => fileInputRef.current?.click()}
                                                style={{ flex: 1, background: 'transparent', color: '#fff', border: '1px solid #262626', borderRadius: 8, padding: '12px', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'Inter, sans-serif' }}>
                                                <Upload size={14} /> Upload
                                            </motion.button>
                                        </div>
                                    </div>
                                    <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileUpload} />
                                    <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                                </div>
                            ) : (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={imagePreview} alt="Meal preview" style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block' }} />
                                    <button onClick={() => { setImagePreview(null); setImageBase64(null); setResult(null); }}
                                        style={{ position: 'absolute', top: 10, right: 10, width: 32, height: 32, background: 'rgba(0,0,0,0.7)', border: '1px solid #444', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <X size={16} color="#fff" />
                                    </button>
                                </motion.div>
                            )}
                        </div>

                        {/* Analyze Button */}
                        {imagePreview && !result && (
                            <div style={{ padding: '0 20px 16px' }}>
                                <motion.button whileTap={{ scale: 0.98 }} onClick={analyzeImage} disabled={isAnalyzing}
                                    style={{ width: '100%', background: '#fff', color: '#000', border: 'none', borderRadius: 8, padding: '14px', fontSize: 14, fontWeight: 600, cursor: isAnalyzing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'Inter, sans-serif', opacity: isAnalyzing ? 0.8 : 1 }}>
                                    {isAnalyzing ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Sparkles size={16} />}
                                    {isAnalyzing ? 'Analyzing with AI...' : 'Analyze with Gemini AI'}
                                </motion.button>
                            </div>
                        )}

                        {/* AI Loading Skeleton */}
                        {isAnalyzing && (
                            <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {[80, 60, 100, 50].map((w, i) => (
                                    <div key={i} className="skeleton" style={{ height: 20, width: `${w}%`, borderRadius: 6 }} />
                                ))}
                            </div>
                        )}

                        {/* Results Display */}
                        <AnimatePresence>
                            {result && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                    style={{ padding: '0 20px' }}
                                >
                                    {/* Meal Name Input */}
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={{ fontSize: 12, color: '#a1a1a1', display: 'block', marginBottom: 6, fontWeight: 500 }}>Meal Name</label>
                                        <input type="text" value={mealName} onChange={e => setMealName(e.target.value)}
                                            placeholder="e.g. Grilled Chicken Salad" style={inputStyle}
                                            onFocus={e => e.target.style.borderColor = '#fff'}
                                            onBlur={e => e.target.style.borderColor = '#262626'} />
                                    </div>

                                    {/* Food Items */}
                                    <div style={{ background: '#1a1a1a', border: '1px solid #262626', borderRadius: 12, padding: 18, marginBottom: 12 }}>
                                        <p style={{ fontSize: 12, color: '#606060', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>Detected Foods</p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                            {result.food_items.map((food, i) => (
                                                <span key={i} style={{ background: '#111', border: '1px solid #262626', borderRadius: 20, padding: '4px 12px', fontSize: 12, color: '#a1a1a1' }}>
                                                    {food}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Calories + Health Score */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, marginBottom: 12 }}>
                                        <div style={{ background: '#1a1a1a', border: '1px solid #262626', borderRadius: 12, padding: 18 }}>
                                            <p style={{ fontSize: 11, color: '#606060', margin: '0 0 6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Calories</p>
                                            <p style={{ fontSize: 36, fontWeight: 800, color: '#fff', margin: 0 }}>{result.calories}</p>
                                            <p style={{ fontSize: 11, color: '#606060', margin: '2px 0 0' }}>kcal</p>
                                        </div>
                                        <div style={{ background: '#1a1a1a', border: '1px solid #262626', borderRadius: 12, padding: '18px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                            <HealthGauge score={result.health_score} />
                                        </div>
                                    </div>

                                    {/* Macros */}
                                    <div style={{ background: '#1a1a1a', border: '1px solid #262626', borderRadius: 12, padding: 18, marginBottom: 12 }}>
                                        <p style={{ fontSize: 12, color: '#606060', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 14px' }}>Macronutrients</p>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
                                            {[
                                                { label: 'Protein', value: result.macros.protein, unit: 'g', color: '#fff' },
                                                { label: 'Carbs', value: result.macros.carbs, unit: 'g', color: '#a1a1a1' },
                                                { label: 'Fats', value: result.macros.fats, unit: 'g', color: '#606060' },
                                            ].map(m => (
                                                <div key={m.label} style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{m.value}<span style={{ fontSize: 12, color: '#606060' }}>{m.unit}</span></div>
                                                    <div style={{ fontSize: 11, color: '#606060', marginTop: 2 }}>{m.label}</div>
                                                    <div style={{ height: 3, background: '#111', borderRadius: 100, marginTop: 6, overflow: 'hidden' }}>
                                                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((m.value / 100) * 100, 100)}%` }}
                                                            transition={{ duration: 0.8, delay: 0.3 }}
                                                            style={{ height: '100%', background: m.color, borderRadius: 100 }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            {[
                                                { label: 'Fiber', value: result.macros.fiber },
                                                { label: 'Sugar', value: result.macros.sugar },
                                            ].map(m => (
                                                <div key={m.label} style={{ flex: 1, background: '#111', borderRadius: 8, padding: '10px 12px', display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: 12, color: '#606060' }}>{m.label}</span>
                                                    <span style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>{m.value}g</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Micronutrients */}
                                    {Object.keys(result.micronutrients).length > 0 && (
                                        <div style={{ background: '#1a1a1a', border: '1px solid #262626', borderRadius: 12, padding: 18, marginBottom: 12 }}>
                                            <p style={{ fontSize: 12, color: '#606060', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>Micronutrients</p>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                {Object.entries(result.micronutrients).map(([key, val]) => {
                                                    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                                                    const unit = key === 'sodium' || key === 'potassium' || key === 'calcium' ? 'mg' : key.startsWith('vitamin') ? 'mcg' : 'mg';
                                                    const maxRef: Record<string, number> = { vitaminA: 900, vitaminC: 90, vitaminD: 20, vitaminE: 15, iron: 18, calcium: 1000, potassium: 3500, sodium: 2300, magnesium: 420, zinc: 11 };
                                                    const pct = Math.min(((val as number) / (maxRef[key] || 100)) * 100, 100);
                                                    return (
                                                        <div key={key}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                                <span style={{ fontSize: 12, color: '#a1a1a1' }}>{label}</span>
                                                                <span style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>{val as number}{unit}</span>
                                                            </div>
                                                            <div style={{ height: 3, background: '#111', borderRadius: 100, overflow: 'hidden' }}>
                                                                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                                                    transition={{ duration: 0.6, delay: 0.1 }}
                                                                    style={{ height: '100%', background: pct > 100 ? '#f87171' : '#fff', borderRadius: 100 }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Recommendations */}
                                    {result.recommendations.length > 0 && (
                                        <div style={{ background: '#1a1a1a', border: '1px solid #262626', borderRadius: 12, padding: 18, marginBottom: 16 }}>
                                            <p style={{ fontSize: 12, color: '#606060', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>AI Recommendations</p>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                {result.recommendations.map((rec, i) => (
                                                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                                                        style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                                        <div style={{ width: 5, height: 5, background: '#606060', borderRadius: '50%', flexShrink: 0, marginTop: 6 }} />
                                                        <span style={{ fontSize: 13, color: '#a1a1a1', lineHeight: 1.5 }}>{rec}</span>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Save Button */}
                                    <motion.button whileTap={{ scale: 0.98 }} onClick={saveMeal} disabled={isSaving}
                                        style={{ width: '100%', background: '#fff', color: '#000', border: 'none', borderRadius: 8, padding: '14px', fontSize: 14, fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'Inter, sans-serif', opacity: isSaving ? 0.7 : 1 }}>
                                        {isSaving ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Save size={16} />}
                                        {isSaving ? 'Saving...' : 'Save to Meal Log'}
                                    </motion.button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    /* Manual Entry Tab */
                    <motion.div key="manual" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}
                        style={{ padding: '0 20px' }}>
                        <div style={{ background: '#1a1a1a', border: '1px solid #262626', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                                <label style={{ fontSize: 12, color: '#a1a1a1', display: 'block', marginBottom: 6, fontWeight: 500 }}>Meal Name *</label>
                                <input type="text" value={manualForm.name} onChange={e => setManualForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. Avocado Toast" style={inputStyle}
                                    onFocus={e => e.target.style.borderColor = '#fff'}
                                    onBlur={e => e.target.style.borderColor = '#262626'} />
                            </div>

                            <div>
                                <label style={{ fontSize: 12, color: '#a1a1a1', display: 'block', marginBottom: 6, fontWeight: 500 }}>Meal Type</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
                                    {MEAL_TYPES.map(type => (
                                        <button key={type} onClick={() => setManualForm(f => ({ ...f, mealType: type }))}
                                            style={{ padding: '10px 4px', border: `1px solid ${manualForm.mealType === type ? '#fff' : '#262626'}`, borderRadius: 8, background: manualForm.mealType === type ? 'rgba(255,255,255,0.06)' : 'transparent', color: manualForm.mealType === type ? '#fff' : '#606060', cursor: 'pointer', fontSize: 10, fontWeight: 500, textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
                                            {MEAL_ICONS[type]}<br />{type.charAt(0).toUpperCase() + type.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: 12, color: '#a1a1a1', display: 'block', marginBottom: 6, fontWeight: 500 }}>Calories (kcal) *</label>
                                <input type="number" value={manualForm.calories} onChange={e => setManualForm(f => ({ ...f, calories: e.target.value }))}
                                    placeholder="450" style={inputStyle}
                                    onFocus={e => e.target.style.borderColor = '#fff'}
                                    onBlur={e => e.target.style.borderColor = '#262626'} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                                {[
                                    { key: 'protein', label: 'Protein (g)' },
                                    { key: 'carbs', label: 'Carbs (g)' },
                                    { key: 'fats', label: 'Fats (g)' },
                                ].map(field => (
                                    <div key={field.key}>
                                        <label style={{ fontSize: 11, color: '#a1a1a1', display: 'block', marginBottom: 6, fontWeight: 500 }}>{field.label}</label>
                                        <input type="number" value={manualForm[field.key as keyof typeof manualForm]}
                                            onChange={e => setManualForm(f => ({ ...f, [field.key]: e.target.value }))}
                                            placeholder="0" style={{ ...inputStyle, padding: '12px 10px' }}
                                            onFocus={e => e.target.style.borderColor = '#fff'}
                                            onBlur={e => e.target.style.borderColor = '#262626'} />
                                    </div>
                                ))}
                            </div>

                            <motion.button whileTap={{ scale: 0.98 }} onClick={saveManualMeal} disabled={isSaving}
                                style={{ width: '100%', background: '#fff', color: '#000', border: 'none', borderRadius: 8, padding: '14px', fontSize: 14, fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'Inter, sans-serif', opacity: isSaving ? 0.7 : 1 }}>
                                {isSaving ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Plus size={16} />}
                                {isSaving ? 'Saving...' : 'Log Meal'}
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
