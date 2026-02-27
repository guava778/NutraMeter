/**
 * In-memory demo store for when MongoDB is unavailable.
 * Uses Node.js global to persist across hot reloads.
 */

interface DemoUser {
    id: string;
    name: string;
    email: string;
    password: string;
    weight: number;
    height: number;
    age: number;
    goal: string;
    dailyCalorieTarget: number;
    dailyWaterTarget: number;
}

interface DemoMeal {
    _id: string;
    userId: string;
    name: string;
    imageUrl?: string;
    mealType: string;
    foodItems: string[];
    calories: number;
    macros: { protein: number; carbs: number; fats: number; fiber: number; sugar: number };
    micronutrients: Record<string, number>;
    healthScore: number;
    recommendations: string[];
    isAiAnalyzed: boolean;
    createdAt: string;
}

interface DemoProgress {
    _id: string;
    userId: string;
    weight: number;
    waterIntake: number;
    date: string;
    notes?: string;
}

interface GlobalDemoStore {
    users: DemoUser[];
    meals: DemoMeal[];
    progress: DemoProgress[];
}

declare global {
    // eslint-disable-next-line no-var
    var __demoStore: GlobalDemoStore;
}

if (!global.__demoStore) {
    global.__demoStore = {
        users: [
            // Built-in demo account
            {
                id: 'demo-user-001',
                name: 'Demo User',
                email: 'demo@nutrameter.com',
                password: 'demo123',
                weight: 70, height: 175, age: 28,
                goal: 'maintain',
                dailyCalorieTarget: 2000,
                dailyWaterTarget: 2500,
            },
        ],
        meals: [],
        progress: [],
    };
}

export const demoStore = global.__demoStore;
