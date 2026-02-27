import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    passwordHash: string;
    weight: number;
    height: number;
    age: number;
    goal: 'lose_weight' | 'maintain' | 'gain_muscle';
    dailyCalorieTarget: number;
    dailyWaterTarget: number;
    createdAt: Date;
}

const UserSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    weight: { type: Number, default: 70 },
    height: { type: Number, default: 170 },
    age: { type: Number, default: 25 },
    goal: { type: String, enum: ['lose_weight', 'maintain', 'gain_muscle'], default: 'maintain' },
    dailyCalorieTarget: { type: Number, default: 2000 },
    dailyWaterTarget: { type: Number, default: 2500 },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
