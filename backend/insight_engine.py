"""
Insight Engine: Generates executive-level AI insights using Gemini.
Produces chart insights, executive summaries, and customer personas.
"""
import json
import re
from typing import Any, Dict, List, Optional
import google.generativeai as genai


class InsightEngine:
    def __init__(self, model):
        self.model = model

    def generate_chart_insight(self, chart_title: str, chart_type: str,
                                data_sample: List[Dict], correlation: Optional[float] = None,
                                extra_context: str = "") -> str:
        """Generate a 1-2 sentence executive insight for a chart."""
        prompt = f"""You are a Business Intelligence analyst.

Chart: "{chart_title}" (Type: {chart_type})
Data sample:
{json.dumps(data_sample[:8], indent=2)}
{f'Pearson correlation: {correlation}' if correlation is not None else ''}
{extra_context}

Write a single, SPECIFIC, data-driven executive insight (max 50 words).
Rules:
- Start with the key finding (use actual numbers from data).
- End with the business implication.
- No bullet points. No intro phrases like "The chart shows".
Example: "Tier 1 city customers spend 2.4x more online (₹8,200 avg) than Tier 3 users, suggesting premium digital offerings should target metro regions first."
"""
        try:
            resp = self.model.generate_content(prompt)
            return resp.text.strip()
        except Exception:
            return f"Analysis of {chart_title} reveals key patterns. Review the visualization for actionable business intelligence."

    def generate_executive_summary(self, user_query: str, chart_insights: List[str]) -> str:
        """Generate an overall C-suite summary for the full dashboard."""
        insights_block = "\n".join(f"• {i}" for i in chart_insights if i)
        prompt = f"""You are a C-suite BI consultant presenting to a CEO.

Original question: "{user_query}"

Key findings from dashboard:
{insights_block}

Write a 3-sentence executive summary:
1. The main answer to the question (with numbers).
2. The most important business implication.
3. A single recommended action.

Be direct. Use specific data points. No filler. Max 80 words."""
        try:
            resp = self.model.generate_content(prompt)
            return resp.text.strip()
        except Exception:
            return "Dashboard analysis complete. Review the charts and individual insights above for detailed findings."

    def generate_customer_persona(self, segment_data: Dict) -> str:
        """Generate a customer persona description from segment data."""
        prompt = f"""Based on this customer segment data:
{json.dumps(segment_data, indent=2)}

Create a brief customer persona (3-4 sentences) including:
- Who they are (age, income level, location)
- Their digital behavior (internet, tech savvy)
- Their shopping preference and spending habits
- One key marketing recommendation

Be vivid and specific. Write as a persona card description."""
        try:
            resp = self.model.generate_content(prompt)
            return resp.text.strip()
        except Exception:
            return "Customer persona analysis based on demographic and behavioral data."

    def suggest_followup_questions(self, current_intent: str, columns: List[str]) -> List[str]:
        """Suggest 4 intelligent follow-up questions for the user."""
        prompt = f"""Current BI dashboard topic: "{current_intent}"
Available dataset columns: {', '.join(columns[:15])}

Suggest 4 specific, actionable follow-up questions a business executive might ask.
Return ONLY a JSON array of strings. Example:
["Filter only Tier 1 cities", "Compare male vs female spending", "Show top 20% income spenders", "Break down by shopping preference"]"""
        try:
            resp = self.model.generate_content(prompt)
            match = re.search(r'\[.*?\]', resp.text, re.DOTALL)
            if match:
                return json.loads(match.group(0))
        except Exception:
            pass
        return [
            "Filter by Tier 1 cities only",
            "Compare male vs female behavior",
            "Show high income segment only",
            "Break down by shopping preference"
        ]

    def generate_kpi_insight(self, label: str, value: float, context: str = "") -> str:
        """Short insight for a KPI card."""
        prompt = f"""KPI: {label} = {value:.2f}
Context: {context}
Write one sentence explaining what this KPI means for the business. Max 25 words."""
        try:
            resp = self.model.generate_content(prompt)
            return resp.text.strip()
        except Exception:
            return f"{label}: {value:.2f}"
