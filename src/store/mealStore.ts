'use client';

import { create } from 'zustand';

export interface Macros {
    protein: number;
    carbs: number;
    fats: number;
    fiber?: number;
    sugar?: number;
}

export interface Micronutrients {
    vitaminA?: number;
    vitaminC?: number;
    vitaminD?: number;
    vitaminE?: number;
    iron?: number;
    calcium?: number;
    potassium?: number;
    sodium?: number;
    magnesium?: number;
    zinc?: number;
}

export interface Meal {
    _id: string;
    name: string;
    imageUrl?: string;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    foodItems: string[];
    calories: number;
    macros: Macros;
    micronutrients: Micronutrients;
    healthScore: number;
    recommendations: string[];
    isAiAnalyzed: boolean;
    createdAt: string;
}

interface MealState {
    meals: Meal[];
    isLoading: boolean;
    error: string | null;
    setMeals: (meals: Meal[]) => void;
    addMeal: (meal: Meal) => void;
    updateMeal: (id: string, updates: Partial<Meal>) => void;
    removeMeal: (id: string) => void;
    setLoading: (loading: boolean) => void;
    setError: (err: string | null) => void;
    getTodayCalories: () => number;
    getTodayMacros: () => Macros;
}

export const useMealStore = create<MealState>((set, get) => ({
    meals: [],
    isLoading: false,
    error: null,
    setMeals: (meals) => set({ meals }),
    addMeal: (meal) => set((state) => ({ meals: [meal, ...state.meals] })),
    updateMeal: (id, updates) =>
        set((state) => ({
            meals: state.meals.map((m) => (m._id === id ? { ...m, ...updates } : m)),
        })),
    removeMeal: (id) => set((state) => ({ meals: state.meals.filter((m) => m._id !== id) })),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    getTodayCalories: () => {
        const today = new Date().toDateString();
        return get().meals
            .filter((m) => new Date(m.createdAt).toDateString() === today)
            .reduce((sum, m) => sum + m.calories, 0);
    },
    getTodayMacros: () => {
        const today = new Date().toDateString();
        const todayMeals = get().meals.filter((m) => new Date(m.createdAt).toDateString() === today);
        return todayMeals.reduce(
            (acc, m) => ({
                protein: acc.protein + (m.macros.protein || 0),
                carbs: acc.carbs + (m.macros.carbs || 0),
                fats: acc.fats + (m.macros.fats || 0),
                fiber: (acc.fiber || 0) + (m.macros.fiber || 0),
                sugar: (acc.sugar || 0) + (m.macros.sugar || 0),
            }),
            { protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0 }
        );
    },
}));
