import mongoose, { Document, Schema } from 'mongoose';

export interface IMacros {
    protein: number;
    carbs: number;
    fats: number;
    fiber?: number;
    sugar?: number;
}

export interface IMicronutrients {
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

export interface IMeal extends Document {
    userId: mongoose.Types.ObjectId;
    name: string;
    imageUrl?: string;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    foodItems: string[];
    calories: number;
    macros: IMacros;
    micronutrients: IMicronutrients;
    healthScore: number;
    recommendations: string[];
    isAiAnalyzed: boolean;
    createdAt: Date;
}

const MealSchema = new Schema<IMeal>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    imageUrl: { type: String },
    mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], default: 'lunch' },
    foodItems: [{ type: String }],
    calories: { type: Number, required: true, default: 0 },
    macros: {
        protein: { type: Number, default: 0 },
        carbs: { type: Number, default: 0 },
        fats: { type: Number, default: 0 },
        fiber: { type: Number, default: 0 },
        sugar: { type: Number, default: 0 },
    },
    micronutrients: {
        vitaminA: Number,
        vitaminC: Number,
        vitaminD: Number,
        vitaminE: Number,
        iron: Number,
        calcium: Number,
        potassium: Number,
        sodium: Number,
        magnesium: Number,
        zinc: Number,
    },
    healthScore: { type: Number, default: 0, min: 0, max: 100 },
    recommendations: [{ type: String }],
    isAiAnalyzed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Meal || mongoose.model<IMeal>('Meal', MealSchema);
