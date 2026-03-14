"""
Main FastAPI Application — InsightGPT BI Dashboard
Enhanced pipeline: Intent Detection → Query Gen → Execution → Chart Selection → Insights
"""
import os
import json
import re
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai
import pandas as pd
import numpy as np

from data_engine import DataEngine
from query_engine import QueryEngine
from chart_engine import ChartEngine
from insight_engine import InsightEngine

load_dotenv()

# ───── Global State ────────────────────────────────────────────────────────────
data_engine = DataEngine()
query_engine = QueryEngine()
chart_engine = ChartEngine()
gemini_model = None
insight_engine: Optional[InsightEngine] = None
previous_spec: Optional[Dict] = None

DATASET_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "customer_behaviour.csv")

SCHEMA_DESCRIPTION = """
Dataset: Customer Behaviour (Online vs Offline)
Columns:
- Demographics: age (Int), gender (String: Male/Female), monthly_income (Int), city_tier (String: Tier 1/Tier 2/Tier 3)
- Digital Behavior: daily_internet_hours (Float), smartphone_usage_years (Int), social_media_hours (Float), online_payment_trust_score (1-10)
- Shopping: monthly_online_orders (Int), monthly_store_visits (Int), avg_online_spend (Float), avg_store_spend (Float), shopping_preference (String: Online/Offline/Both)
- Psychometrics (1-10): tech_savvy_score, discount_sensitivity, return_frequency, impulse_buying_score, brand_loyalty_score, environmental_awareness, need_touch_feel_score, free_return_importance, delivery_fee_sensitivity, time_pressure_level, product_availability_online
"""


@asynccontextmanager
async def lifespan(app_: Any):
    """FastAPI lifespan — replaces deprecated on_event startup."""
    global gemini_model, insight_engine
    result = data_engine.load_default_dataset(DATASET_PATH)
    if result.get("success"):
        query_engine.set_dataframe(data_engine.df)
        print(f"✅ Dataset loaded: {result['rows']} rows, {result['columns']} columns")
    else:
        print(f"⚠️  Dataset not found: {result.get('error')}")

    api_key = os.getenv("GEMINI_API_KEY", "")
    if api_key:
        genai.configure(api_key=api_key)
        gemini_model = genai.GenerativeModel("gemini-1.5-flash")
        insight_engine = InsightEngine(gemini_model)
        print("✅ Gemini AI engine ready")
    else:
        print("⚠️  GEMINI_API_KEY not set")
    yield


app = FastAPI(title="InsightGPT BI API", version="2.0.0", lifespan=lifespan)

# ── CORS: allow localhost dev + all Vercel previews ───────────────────────────
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://*.vercel.app",
    "https://insightgpt.vercel.app",
    os.getenv("FRONTEND_URL", "http://localhost:3000"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Use specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ───── Models ──────────────────────────────────────────────────────────────────
class QueryRequest(BaseModel):
    prompt: str
    is_followup: bool = False

class ExportRequest(BaseModel):
    format: str
    data: List[Dict]
    filename: str = "export"



def get_gemini():
    if gemini_model is None:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured. Add it to backend/.env")
    return gemini_model


# ───── Core AI Function ────────────────────────────────────────────────────────
def interpret_prompt_with_gemini(user_query: str, is_followup: bool = False,
                                  previous_spec: Optional[Dict] = None) -> Dict:
    """
    The master AI prompt. Returns structured JSON with
    analysis, code, chart_type, insight for each chart.
    """
    model = get_gemini()

    followup_context = ""
    if is_followup and previous_spec:
        followup_context = f"\nPREVIOUS DASHBOARD CONTEXT:\n{json.dumps(previous_spec, indent=2)}\nThis is a follow-up query. Modify the previous dashboard accordingly.\n"

    prompt = f"""### ROLE
You are an expert Data Analyst and BI Consultant. Transform natural language questions from non-technical executives into executable Python (Pandas) code and select the best visualization type.

### DATASET SCHEMA
{SCHEMA_DESCRIPTION}
The dataframe is pre-loaded as 'df'.

### OUTPUT FORMAT
Return a JSON object with:
{{
  "intent": "brief explanation of what user asked",
  "charts": [
    {{
      "id": "chart_1",
      "title": "descriptive chart title",
      "analysis": "brief explanation of how this answers the question",
      "code": "python pandas code. Assign result to a variable named 'result'. Example: result = df.groupby('city_tier')['avg_online_spend'].mean().reset_index()",
      "chart_type": "bar|line|pie|scatter|histogram|heatmap|kpi_card",
      "x_key": "column name for x axis",
      "y_key": "column name(s) for y axis - comma separated if multiple",
      "color_key": "column for color grouping or null",
      "insight_prompt": "what specific insight to generate"
    }}
  ],
  "summary_context": "what overall business summary to generate"
}}

### CHART SELECTION RULES
- Category comparisons (by gender, city tier) → bar
- Time series or trends → line  
- Parts of a whole (proportions) → pie
- Two numeric variable correlation → scatter
- Single numeric distribution → histogram
- Multiple variable correlations → heatmap
- Single KPI number → kpi_card
- Generate 2-4 charts maximum
- For scatter charts: x_key=first numeric col, y_key=second numeric col

### CODE RULES  
- Variable MUST be named 'result'
- Only use columns in the schema
- Handle NaN with .dropna() or .fillna(0)
- For scatter/correlation: result = df[['col1','col2']].dropna().head(500)
- For groupby: result = df.groupby('col')['val'].mean().reset_index()
- For histogram: use numpy — counts, edges = np.histogram(df['col'].dropna(), bins=20); result = pd.DataFrame({{'range': [f"{{e:.1f}}-{{edges[i+1]:.1f}}" for i,e in enumerate(edges[:-1])], 'count': counts}})
- For heatmap: result = df[[col1,col2,...cols]].corr().round(3); x_key and y_key will be auto-handled
- For kpi_card: result = pd.DataFrame({{'value': [df['col'].mean()], 'label': ['KPI Name']}})

### ERROR HANDLING
If the user's request is outside dataset scope:
{{"error": "Sorry, this dataset does not contain the requested information.", "charts": []}}

{followup_context}

### USER PROMPT
"{user_query}"

Return ONLY valid JSON. No extra text."""

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        # Extract JSON
        match = re.search(r'```(?:json)?\s*([\s\S]*?)```', text)
        if match:
            text = match.group(1).strip()
        spec = json.loads(text)
        return spec
    except Exception as e:
        return {"error": str(e), "charts": []}


# ───── Routes ──────────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"message": "InsightGPT BI API v2.0", "status": "ok"}


@app.get("/api/health")
async def health():
    return {
        "api": "ok",
        "dataset_loaded": data_engine.df is not None,
        "ai_ready": gemini_model is not None,
        "dataset_rows": len(data_engine.df) if data_engine.df is not None else 0,
        "dataset_name": data_engine.dataset_name
    }


@app.get("/api/dataset-info")
async def dataset_info():
    if data_engine.df is None:
        return {"loaded": False}
    return {
        "loaded": True,
        "name": data_engine.dataset_name,
        "rows": len(data_engine.df),
        "columns": list(data_engine.df.columns),
        "column_info": data_engine.column_info
    }


@app.post("/api/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    content = await file.read()
    result = data_engine.load_uploaded_csv(content, file.filename)
    if result.get("success"):
        query_engine.set_dataframe(data_engine.df)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to load CSV"))
    return result


@app.post("/api/generate-dashboard")
async def generate_dashboard(request: QueryRequest):
    """Main pipeline: Natural Language → Charts + Insights."""
    global previous_spec

    if data_engine.df is None:
        return {"success": False, "error": "No dataset loaded. Please upload a CSV file."}

    try:
        # ── Step 1: AI Prompt Interpretation ─────────────────────────────────
        spec = interpret_prompt_with_gemini(
            request.prompt,
            is_followup=request.is_followup,
            previous_spec=previous_spec
        )

        if spec.get("error") and not spec.get("charts"):
            return {"success": False, "error": spec["error"], "charts": []}

        previous_spec = spec
        charts_output = []

        # ── Step 2: Execute Each Chart Query ─────────────────────────────────
        for chart_spec in spec.get("charts", []):
            chart_type = chart_spec.get("chart_type", "bar")
            code = chart_spec.get("code", "")
            title = chart_spec.get("title", "Chart")

            # Execute AI-generated Pandas code
            if code:
                query_result = query_engine.execute_pandas_code(code)
            else:
                query_result = {"error": "No query code generated", "data": []}

            # Fallback if code execution failed
            if "error" in query_result and not query_result.get("data"):
                query_result = _fallback_query(chart_type, chart_spec, data_engine)

            # ── Step 3: Generate AI Insight ───────────────────────────────────
            insight = ""
            if insight_engine and query_result.get("data"):
                insight = insight_engine.generate_chart_insight(
                    chart_title=title,
                    chart_type=chart_type,
                    data_sample=query_result["data"],
                    correlation=query_result.get("correlation"),
                    extra_context=chart_spec.get("insight_prompt", "")
                )

            # ── Step 4: Format Chart ──────────────────────────────────────────
            chart_payload = chart_engine.build_chart_payload(
                chart_spec=chart_spec,
                query_result=query_result,
                insight=insight
            )
            charts_output.append(chart_payload)

        # ── Step 5: Executive Summary ─────────────────────────────────────────
        summary = ""
        followup_suggestions = []
        if insight_engine:
            chart_insights = [c.get("insight", "") for c in charts_output]
            summary = insight_engine.generate_executive_summary(request.prompt, chart_insights)
            followup_suggestions = insight_engine.suggest_followup_questions(
                spec.get("intent", request.prompt),
                list(data_engine.df.columns) if data_engine.df is not None else []
            )

        return {
            "success": True,
            "intent": spec.get("intent", ""),
            "summary": summary,
            "charts": charts_output,
            "followup_suggestions": followup_suggestions,
            "query": request.prompt
        }

    except Exception as e:
        import traceback
        return {
            "success": False,
            "error": f"Analysis failed: {str(e)}",
            "message": "Data not available for this query.",
            "traceback": traceback.format_exc()[-500:]
        }


def _fallback_query(chart_type: str, chart_spec: Dict, de: DataEngine) -> Dict:
    """Fallback query logic when AI code execution fails."""
    qe = query_engine
    if chart_type == "scatter":
        cols = de.df.select_dtypes(include="number").columns[:2].tolist()
        return qe.query_correlation(cols[0], cols[1]) if len(cols) >= 2 else {"data": [], "error": "fallback"}
    elif chart_type in ("bar", "pie"):
        cat_cols = de.df.select_dtypes(exclude="number").columns
        cat = cat_cols[0] if len(cat_cols) else de.df.columns[0]
        num = de.df.select_dtypes(include="number").columns[0]
        return qe.query_groupby_mean(cat, [num])
    elif chart_type == "histogram":
        num = de.df.select_dtypes(include="number").columns[0]
        return qe.query_distribution(num)
    elif chart_type == "heatmap":
        return qe.query_heatmap()
    elif chart_type == "kpi_card":
        num = de.df.select_dtypes(include="number").columns[0]
        return qe.query_kpi(num)
    return {"data": [], "error": "No fallback available"}


@app.get("/api/example-prompts")
async def example_prompts():
    return {"prompts": [
        "Compare average online spend by city tier",
        "Show relationship between internet hours and online spending",
        "Which age group spends most online?",
        "Show online vs store spending distribution",
        "Segment users by tech savvy score",
        "Correlation between tech savvy score and online orders",
        "Compare male vs female shopping behavior",
        "Analyze impulse buying patterns by age group",
        "Show brand loyalty distribution across city tiers",
        "What is the average monthly income of online shoppers?",
        "Compare discount sensitivity by shopping preference",
        "Show top customer segments by spending"
    ]}


@app.get("/api/summary-stats")
async def summary_stats():
    return data_engine.get_summary_stats()


@app.post("/api/export-csv")
async def export_csv_data(request: ExportRequest):
    import io, csv
    if not request.data:
        raise HTTPException(status_code=400, detail="No data to export")
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=request.data[0].keys())
    writer.writeheader()
    writer.writerows(request.data)
    return {"csv_content": output.getvalue(), "filename": f"{request.filename}.csv"}



@app.get("/api/data-profile")
async def data_profile():
    """Return fast summary stats for the StatsBar component."""
    if data_engine.df is None:
        return {"loaded": False}
    df = data_engine.df
    try:
        online_pct = round(float((df["shopping_preference"] == "Online").mean() * 100), 1) if "shopping_preference" in df.columns else 0
        avg_online = round(float(df["avg_online_spend"].mean()), 2) if "avg_online_spend" in df.columns else 0
        avg_store = round(float(df["avg_store_spend"].mean()), 2) if "avg_store_spend" in df.columns else 0
        avg_tech = round(float(df["tech_savvy_score"].mean()), 1) if "tech_savvy_score" in df.columns else 0
        return {
            "total_rows": len(df),
            "total_columns": len(df.columns),
            "online_preference_pct": online_pct,
            "avg_online_spend": avg_online,
            "avg_store_spend": avg_store,
            "avg_tech_savvy": avg_tech,
        }
    except Exception as e:
        return {"error": str(e)}


@app.post("/api/generate-persona")
async def generate_persona(request: QueryRequest):
    """Generate a customer persona description from a segment query."""
    if data_engine.df is None:
        raise HTTPException(status_code=400, detail="No dataset loaded")
    if not insight_engine:
        raise HTTPException(status_code=500, detail="AI engine not ready")
    try:
        df = data_engine.df
        # Simple segmentation: filter by tech_savvy if query mentions it
        segment = {}
        if "tech savvy" in request.prompt.lower() or "high tech" in request.prompt.lower():
            sub = df[df["tech_savvy_score"] >= 7] if "tech_savvy_score" in df.columns else df
            segment["segment"] = "High Tech Savvy"
        elif "low income" in request.prompt.lower():
            sub = df[df["monthly_income"] < df["monthly_income"].quantile(0.33)] if "monthly_income" in df.columns else df
            segment["segment"] = "Low Income"
        else:
            sub = df
            segment["segment"] = "All Customers"

        numeric_cols = ["age", "monthly_income", "avg_online_spend", "avg_store_spend",
                        "tech_savvy_score", "monthly_online_orders", "daily_internet_hours"]
        for col in numeric_cols:
            if col in sub.columns:
                segment[col] = round(float(sub[col].mean()), 2)

        if "city_tier" in sub.columns:
            segment["top_city_tier"] = sub["city_tier"].value_counts().idxmax()
        if "shopping_preference" in sub.columns:
            segment["top_shopping_preference"] = sub["shopping_preference"].value_counts().idxmax()
        if "gender" in sub.columns:
            segment["gender_split"] = sub["gender"].value_counts().to_dict()

        persona = insight_engine.generate_customer_persona(segment)
        return {"success": True, "persona": persona, "segment_data": segment}
    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

