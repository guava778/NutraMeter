import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getUserFromRequest } from '@/lib/auth';

const NUTRITIONIST_PROMPT = `You are a certified nutritionist AI. Analyze the food image carefully.
Identify all visible food items.
Estimate portion sizes realistically.
Provide a detailed nutritional breakdown.

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "food_items": ["item1", "item2"],
  "calories": 450,
  "macros": {
    "protein": 25,
    "carbs": 45,
    "fats": 15,
    "fiber": 5,
    "sugar": 8
  },
  "micronutrients": {
    "vitaminA": 120,
    "vitaminC": 35,
    "vitaminD": 0,
    "vitaminE": 2,
    "iron": 3.5,
    "calcium": 150,
    "potassium": 520,
    "sodium": 480,
    "magnesium": 45,
    "zinc": 2.1
  },
  "health_score": 72,
  "recommendations": [
    "Consider adding more vegetables for fiber",
    "Good protein source detected"
  ]
}

Ensure estimates are realistic and scientifically reasonable. If you cannot identify food items, make your best estimate based on visual cues.`;

export async function POST(req: NextRequest) {
    try {
        const user = getUserFromRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === 'your_api_key_here') {
            return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 503 });
        }

        const body = await req.json();
        const { imageBase64, mimeType = 'image/jpeg' } = body;

        if (!imageBase64) {
            return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const imagePart = {
            inlineData: {
                data: imageBase64,
                mimeType: mimeType,
            },
        };

        const result = await model.generateContent([NUTRITIONIST_PROMPT, imagePart]);
        const responseText = result.response.text();

        // Extract JSON from response
        let nutritionData;
        try {
            // Try to parse the raw response first
            nutritionData = JSON.parse(responseText);
        } catch {
            // Extract JSON from markdown code blocks if needed
            const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ||
                responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                nutritionData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            } else {
                throw new Error('Could not parse AI response as JSON');
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                food_items: nutritionData.food_items || [],
                calories: nutritionData.calories || 0,
                macros: {
                    protein: nutritionData.macros?.protein || 0,
                    carbs: nutritionData.macros?.carbs || 0,
                    fats: nutritionData.macros?.fats || 0,
                    fiber: nutritionData.macros?.fiber || 0,
                    sugar: nutritionData.macros?.sugar || 0,
                },
                micronutrients: nutritionData.micronutrients || {},
                health_score: nutritionData.health_score || 0,
                recommendations: nutritionData.recommendations || [],
            },
        });
    } catch (error) {
        console.error('Analyze error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'AI analysis failed',
        }, { status: 500 });
    }
}
