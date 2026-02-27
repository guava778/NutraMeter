import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/lib/auth';
import { demoStore } from '@/lib/demoStore';

async function tryMongoLogin(email: string, password: string) {
    const bcrypt = await import('bcryptjs');
    const dbConnect = (await import('@/lib/mongodb')).default;
    const User = (await import('@/models/User')).default;

    await dbConnect();
    const user = await User.findOne({ email });
    if (!user) return { error: 'Invalid credentials', status: 401 };

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return { error: 'Invalid credentials', status: 401 };

    const token = signToken({ userId: user._id.toString(), email: user.email });
    return {
        token,
        user: {
            id: user._id.toString(), name: user.name, email: user.email,
            weight: user.weight, height: user.height, age: user.age, goal: user.goal,
            dailyCalorieTarget: user.dailyCalorieTarget, dailyWaterTarget: user.dailyWaterTarget,
        },
    };
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        let result;
        try {
            result = await tryMongoLogin(email, password);
        } catch {
            console.warn('[NutraMeter] MongoDB unavailable, using demo mode');
            const user = demoStore.users.find(u => u.email === email && u.password === password);
            if (!user) {
                return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
            }
            const token = signToken({ userId: user.id, email: user.email });
            result = {
                token,
                user: {
                    id: user.id, name: user.name, email: user.email,
                    weight: user.weight, height: user.height, age: user.age, goal: user.goal,
                    dailyCalorieTarget: user.dailyCalorieTarget, dailyWaterTarget: user.dailyWaterTarget,
                },
            };
        }

        if ('error' in result && result.error) {
            return NextResponse.json({ error: result.error }, { status: (result as { status?: number }).status || 401 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
    }
}
