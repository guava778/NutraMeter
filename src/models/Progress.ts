import mongoose, { Document, Schema } from 'mongoose';

export interface IProgress extends Document {
    userId: mongoose.Types.ObjectId;
    weight: number;
    waterIntake: number;
    date: Date;
    notes?: string;
}

const ProgressSchema = new Schema<IProgress>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    weight: { type: Number, required: true },
    waterIntake: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
    notes: { type: String },
});

export default mongoose.models.Progress || mongoose.model<IProgress>('Progress', ProgressSchema);
