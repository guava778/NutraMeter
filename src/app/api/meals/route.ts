import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { demoStore } from '@/lib/demoStore';

export async function GET(req: NextRequest) {
    try {
        const user = getUserFromRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        try {
            const dbConnect = (await import('@/lib/mongodb')).default;
            const Meal = (await import('@/models/Meal')).default;
            await dbConnect();

            const { searchParams } = new URL(req.url);
            const date = searchParams.get('date');
            const mealType = searchParams.get('mealType');

            const filter: Record<string, unknown> = { userId: user.userId };
            if (mealType) filter.mealType = mealType;
            if (date) {
                const start = new Date(date); start.setHours(0, 0, 0, 0);
                const end = new Date(date); end.setHours(23, 59, 59, 999);
                filter.createdAt = { $gte: start, $lte: end };
            }

            const meals = await Meal.find(filter).sort({ createdAt: -1 });
            return NextResponse.json({ meals });
        } catch {
            // Demo fallback
            const { searchParams } = new URL(req.url);
            const date = searchParams.get('date');
            let meals = demoStore.meals.filter(m => m.userId === user.userId);
            if (date) {
                meals = meals.filter(m => new Date(m.createdAt).toDateString() === new Date(date).toDateString());
            }
            return NextResponse.json({ meals: meals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) });
        }
    } catch (error) {
        console.error('Get meals error:', error);
        return NextResponse.json({ error: 'Failed to fetch meals' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = getUserFromRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();

        try {
            const dbConnect = (await import('@/lib/mongodb')).default;
            const Meal = (await import('@/models/Meal')).default;
            await dbConnect();

            const meal = await Meal.create({
                userId: user.userId,
                name: body.name || 'Unnamed Meal',
                imageUrl: body.imageUrl,
                mealType: body.mealType || 'lunch',
                foodItems: body.foodItems || [],
                calories: body.calories || 0,
                macros: body.macros || { protein: 0, carbs: 0, fats: 0 },
                micronutrients: body.micronutrients || {},
                healthScore: body.healthScore || 0,
                recommendations: body.recommendations || [],
                isAiAnalyzed: body.isAiAnalyzed || false,
            });

            return NextResponse.json({ meal }, { status: 201 });
        } catch {
            // Demo fallback
            const meal = {
                _id: `meal-${Date.now()}`,
                userId: user.userId,
                name: body.name || 'Unnamed Meal',
                imageUrl: body.imageUrl,
                mealType: body.mealType || 'lunch',
                foodItems: body.foodItems || [],
                calories: body.calories || 0,
                macros: body.macros || { protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0 },
                micronutrients: body.micronutrients || {},
                healthScore: body.healthScore || 0,
                recommendations: body.recommendations || [],
                isAiAnalyzed: body.isAiAnalyzed || false,
                createdAt: new Date().toISOString(),
            };
            demoStore.meals.push(meal);
            return NextResponse.json({ meal }, { status: 201 });
        }
    } catch (error) {
        console.error('Create meal error:', error);
        return NextResponse.json({ error: 'Failed to create meal' }, { status: 500 });
    }
}
