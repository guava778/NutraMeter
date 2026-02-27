import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Meal from '@/models/Meal';
import { getUserFromRequest } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = getUserFromRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        const meal = await Meal.findOneAndUpdate(
            { _id: id, userId: user.userId },
            { $set: body },
            { new: true }
        );

        if (!meal) return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
        return NextResponse.json({ meal });
    } catch (error) {
        console.error('Update meal error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = getUserFromRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const { id } = await params;

        const meal = await Meal.findOneAndDelete({ _id: id, userId: user.userId });
        if (!meal) return NextResponse.json({ error: 'Meal not found' }, { status: 404 });

        return NextResponse.json({ message: 'Meal deleted' });
    } catch (error) {
        console.error('Delete meal error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
