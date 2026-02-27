import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const userPayload = getUserFromRequest(req);
        if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const user = await User.findById(userPayload.userId).select('-passwordHash');
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Get profile error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const userPayload = getUserFromRequest(req);
        if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const body = await req.json();
        const allowedFields = ['name', 'weight', 'height', 'age', 'goal', 'dailyCalorieTarget', 'dailyWaterTarget'];
        const updates: Record<string, unknown> = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) updates[field] = body[field];
        }

        const user = await User.findByIdAndUpdate(
            userPayload.userId,
            { $set: updates },
            { new: true }
        ).select('-passwordHash');

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        return NextResponse.json({ user });
    } catch (error) {
        console.error('Update profile error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
