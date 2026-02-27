import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { demoStore } from '@/lib/demoStore';

export async function GET(req: NextRequest) {
    try {
        const user = getUserFromRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '30');

        try {
            const dbConnect = (await import('@/lib/mongodb')).default;
            const Progress = (await import('@/models/Progress')).default;
            await dbConnect();
            const entries = await Progress.find({ userId: user.userId }).sort({ date: -1 }).limit(limit);
            return NextResponse.json({ entries });
        } catch {
            const entries = demoStore.progress
                .filter(p => p.userId === user.userId)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, limit);
            return NextResponse.json({ entries });
        }
    } catch (error) {
        console.error('Get progress error:', error);
        return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = getUserFromRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { weight, waterIntake, notes } = body;
        if (!weight) return NextResponse.json({ error: 'Weight is required' }, { status: 400 });

        try {
            const dbConnect = (await import('@/lib/mongodb')).default;
            const Progress = (await import('@/models/Progress')).default;
            await dbConnect();
            const entry = await Progress.create({ userId: user.userId, weight, waterIntake: waterIntake || 0, notes, date: new Date() });
            return NextResponse.json({ entry }, { status: 201 });
        } catch {
            const entry = {
                _id: `progress-${Date.now()}`,
                userId: user.userId,
                weight: parseFloat(weight),
                waterIntake: waterIntake || 0,
                date: new Date().toISOString(),
                notes,
            };
            demoStore.progress.push(entry);
            return NextResponse.json({ entry }, { status: 201 });
        }
    } catch (error) {
        console.error('Create progress error:', error);
        return NextResponse.json({ error: 'Failed to log progress' }, { status: 500 });
    }
}
