# NutraMeter 🥗

> AI-powered nutritional tracking web application

## Features

- 📸 **Camera AI Analysis** – Capture meal photos for instant nutritional breakdown via Gemini 2.5 Flash
- 📊 **Macro & Micro Tracking** – Complete nutritional dashboard with animated charts
- 🎯 **Progress Tracking** – Weekly trends, weight log, BMI calculator
- 💡 **Smart Insights** – AI-generated personalized nutrition recommendations
- 🔐 **Secure Auth** – JWT-based authentication with encrypted passwords
- 📱 **Mobile-First** – Bottom navigation, optimized for mobile

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript |
| Styling | TailwindCSS v4 |
| Animation | Framer Motion |
| Charts | Recharts |
| State | Zustand (with persistence) |
| Backend | Next.js API Routes |
| Database | MongoDB (Mongoose) |
| AI | Google Gemini 2.5 Flash Vision |
| Auth | JWT + bcrypt |

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=mongodb://localhost:27017/nutrameter
JWT_SECRET=your_secret_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> Get your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### 3. Start MongoDB

```bash
# Using local MongoDB
mongod --dbpath /data/db

# Or use MongoDB Atlas (set MONGODB_URI to your Atlas connection string)
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login & Register pages
│   │   ├── login/
│   │   └── register/
│   ├── (app)/           # Protected app pages
│   │   ├── dashboard/   # Home with calorie ring & macros
│   │   ├── log/         # Meal logging (camera + manual)
│   │   ├── progress/    # Charts, weight, BMI
│   │   ├── insights/    # AI recommendations
│   │   └── profile/     # User settings
│   └── api/             # Backend API routes
│       ├── auth/
│       ├── meals/
│       ├── analyze/     # Gemini Vision endpoint
│       ├── progress/
│       └── user/
├── components/
│   └── BottomNav.tsx
├── lib/
│   ├── mongodb.ts
│   └── auth.ts
├── models/
│   ├── User.ts
│   ├── Meal.ts
│   └── Progress.ts
└── store/
    ├── authStore.ts
    └── mealStore.ts
```

## AI Meal Analysis

The `/api/analyze` endpoint accepts a base64 image and returns:

```json
{
  "food_items": ["grilled chicken", "salad"],
  "calories": 450,
  "macros": {
    "protein": 45,
    "carbs": 20,
    "fats": 18,
    "fiber": 4,
    "sugar": 3
  },
  "micronutrients": {
    "vitaminA": 120,
    "vitaminC": 35,
    "iron": 3.5,
    "calcium": 150,
    "sodium": 380
  },
  "health_score": 82,
  "recommendations": ["Great protein source!", "Consider adding more fiber"]
}
```

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

Set environment variables in Vercel dashboard.

### Docker

```bash
docker build -t nutrameter .
docker run -p 3000:3000 nutrameter
```

## License

MIT
