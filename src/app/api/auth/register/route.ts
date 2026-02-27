import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/lib/auth';
import { demoStore } from '@/lib/demoStore';

async function tryMongoRegister(body: Record<string, unknown>) {
    const bcrypt = await import('bcryptjs');
    const dbConnect = (await import('@/lib/mongodb')).default;
    const User = (await import('@/models/User')).default;

    await dbConnect();
    const { name, email, password, weight, height, age, goal } = body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return { error: 'Email already in use', status: 409 };

    const passwordHash = await bcrypt.hash(password as string, 12);
    const user = await User.create({
        name, email, passwordHash,
        weight: weight || 70, height: height || 170, age: age || 25,
        goal: goal || 'maintain',
    });

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
        const { name, email, password, weight, height, age, goal } = body;

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
        }

        let result;
        try {
            result = await tryMongoRegister(body);
        } catch {
            console.warn('[NutraMeter] MongoDB unavailable, using demo mode');
            // Demo fallback
            if (demoStore.users.find(u => u.email === email)) {
                return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
            }
            const id = `demo-${Date.now()}`;
            const newUser = {
                id, name, email, password,
                weight: parseFloat(weight) || 70,
                height: parseFloat(height) || 170,
                age: parseInt(age) || 25,
                goal: goal || 'maintain',
                dailyCalorieTarget: 2000,
                dailyWaterTarget: 2500,
            };
            demoStore.users.push(newUser);
            const token = signToken({ userId: id, email });
            result = {
                token,
                user: {
                    id, name, email,
                    weight: newUser.weight, height: newUser.height, age: newUser.age,
                    goal: newUser.goal,
                    dailyCalorieTarget: 2000, dailyWaterTarget: 2500,
                },
            };
        }

        if ('error' in result && result.error) {
            return NextResponse.json({ error: result.error }, { status: (result as { status?: number }).status || 400 });
        }

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error('Register error:', error);
        return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
    }
}
