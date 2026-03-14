# InsightGPT — Conversational AI Business Intelligence Dashboard

> Type a plain English question → get an instant interactive BI dashboard powered by Google Gemini.

![InsightGPT](https://img.shields.io/badge/AI-Gemini-blue) ![Stack](https://img.shields.io/badge/Stack-Next.js%2014%20%2B%20FastAPI-blueviolet)

---

## 🚀 Features

- **Natural Language → Dashboard**: Ask any business question in plain English
- **7 Chart Types**: Bar, Line, Scatter, Pie, Heatmap, Histogram, KPI Card
- **AI-Generated Insights**: Gemini writes executive summaries under every chart
- **Conversational Follow-ups**: Ask follow-up questions to drill deeper
- **CSV Upload**: Upload any dataset and start querying instantly
- **Export**: Download dashboards as CSV, PNG, or PDF
- **Dark/Light Mode**: Modern glassmorphism UI

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, TailwindCSS, Framer Motion, Recharts |
| Backend | Python FastAPI |
| AI Engine | Google Gemini 1.5 Flash |
| Data | Pandas, NumPy |

---

## 📁 Project Structure

```
GFG/
├── frontend/              # Next.js 14 App
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx       # Main dashboard page
│   │   └── globals.css
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── ChartCard.tsx
│   │   ├── LoadingAnimation.tsx
│   │   └── charts/
│   │       └── ChartComponents.tsx  # All 7 chart types
│   ├── lib/
│   │   ├── api.ts         # API client
│   │   └── types.ts       # TypeScript interfaces
│   └── package.json
│
├── backend/               # FastAPI Python API
│   ├── main.py            # FastAPI app + routes
│   ├── ai_engine.py       # Gemini prompt interpreter
│   ├── query_engine.py    # Sandboxed Pandas execution
│   ├── chart_engine.py    # Chart formatting
│   ├── insight_engine.py  # AI insight generation
│   ├── data_engine.py     # Dataset loader
│   ├── requirements.txt
│   └── .env.example
│
└── data/
    ├── customer_behaviour.csv   # 500-row sample dataset
    └── generate_data.py         # Regenerate dataset
```

---

## ⚡ Quick Start

### 1. Get a Gemini API Key

Go to [Google AI Studio](https://aistudio.google.com/) → Create API Key.

### 2. Setup Backend

```bash
cd backend

# Windows
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure API key
copy .env.example .env
# Edit .env and add: GEMINI_API_KEY=your_key_here

# Start backend
python main.py
```

Backend runs at: **http://localhost:8000**

### 3. Setup Frontend

```bash
cd frontend
npm install

# Configure API URL
copy .env.local.example .env.local

# Start frontend
npm run dev
```

Frontend runs at: **http://localhost:3000**

### 4. Upload Your Dataset (Optional)

If you have the actual `Customer Behaviour (Online vs Offline).csv`, place it at `data/customer_behaviour.csv` **OR** upload it through the UI → **Upload CSV** button.

---

## 💬 Example Queries

| Query | Charts Generated |
|-------|-----------------|
| "Compare average online spend by city tier" | Bar chart |
| "Correlation between tech savvy and online orders" | Scatter plot + KPI |
| "Which age group spends most online?" | Bar + histogram |
| "Show online vs store spending distribution" | Pie + bar chart |
| "Segment users by tech savvy score" | Bar + scatter |
| "Heatmap of all behavioral correlations" | Heatmap |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/generate-dashboard` | Main NLP → dashboard pipeline |
| POST | `/api/upload-csv` | Upload custom dataset |
| GET | `/api/dataset-info` | Dataset metadata |
| GET | `/api/health` | API health + AI status |
| GET | `/api/example-prompts` | Suggested queries |
| POST | `/api/export-csv` | Export chart data |

---

## 🤖 AI Pipeline

```
User Prompt
    ↓
Gemini Intent Detection + Code Generation
    ↓
Sandboxed Pandas Code Execution
    ↓
Chart Type Selection (7 types)
    ↓
Gemini Insight Generation per Chart
    ↓
Gemini Executive Summary
    ↓
Interactive Dashboard Rendered
```

---

## 📊 Dataset Fields

The sample dataset `customer_behaviour.csv` includes 500 rows with:

- **Demographics**: age, gender, monthly_income, city_tier
- **Digital Behavior**: daily_internet_hours, smartphone_usage_years, tech_savvy_score
- **Shopping**: monthly_online_orders, avg_online_spend, avg_store_spend, shopping_preference
- **Psychometrics** (1-10 scores): impulse_buying_score, brand_loyalty_score, discount_sensitivity, etc.

---

## 🎨 Design

Inspired by Vercel Analytics, Stripe Dashboard, and Notion.

- Dark glassmorphism UI with subtle gradients
- Framer Motion animations throughout
- Custom Recharts tooltips with dark theme
- Responsive 2-column chart grid

---

Built for **hackathon demo** — InsightGPT by Team 🚀
