import json
import re
from typing import Any, Dict, List, Optional
import google.generativeai as genai
from data_engine import DataEngine

class AIEngine:
    def __init__(self, api_key: str, data_engine: DataEngine):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-1.5-flash")
        self.data_engine = data_engine
        self.conversation_history: List[Dict] = []

    def _parse_json_from_response(self, text: str) -> Dict:
        """Extract and parse JSON from LLM response."""
        # Try to find JSON block in markdown code blocks
        match = re.search(r'```(?:json)?\s*([\s\S]*?)```', text)
        if match:
            try:
                return json.loads(match.group(1).strip())
            except:
                pass
        # Try raw JSON
        try:
            return json.loads(text.strip())
        except:
            pass
        # Try to find JSON object in text
        match = re.search(r'\{[\s\S]*\}', text)
        if match:
            try:
                return json.loads(match.group(0))
            except:
                pass
        return {}

    def interpret_prompt(self, user_prompt: str) -> Dict[str, Any]:
        """
        Master function: Convert natural language prompt to a full dashboard specification.
        Returns chart types, queries, filters, and insight instructions.
        """
        dataset_context = self.data_engine.get_dataset_context()
        
        system_prompt = f"""You are a Business Intelligence AI that converts natural language to dashboard specifications.

DATASET CONTEXT:
{dataset_context}

USER PROMPT: "{user_prompt}"

TASK: Generate a complete dashboard specification as JSON with this exact structure:
{{
  "intent": "brief description of what the user wants",
  "charts": [
    {{
      "id": "chart_1",
      "type": "bar|line|scatter|pie|heatmap|histogram",
      "title": "descriptive chart title",
      "query_type": "groupby|correlation|distribution|heatmap|segmentation|raw",
      "query_spec": {{
        "group_by": ["column_name"],
        "agg_columns": ["column_name"],
        "agg_function": "mean|sum|count|max|min",
        "select_columns": ["col1", "col2"],
        "filters": [{{"column": "col", "operator": "==", "value": "val"}}],
        "x_axis": "column_name",
        "y_axis": "column_name",
        "color_by": "column_name or null",
        "heatmap_columns": ["col1", "col2", ...]
      }},
      "insight_prompt": "what specific insight to generate about this chart"
    }}
  ],
  "suggested_filters": [
    {{"label": "Filter Name", "column": "col", "values": ["val1", "val2"]}}
  ],
  "summary_prompt": "What overall business summary should AI generate"
}}

RULES:
- Generate 2-4 charts maximum
- Choose chart types intelligently:
  * Category comparisons → bar chart (group_by + agg)
  * Time series or trends → line chart
  * Two numeric correlations → scatter (query_type: correlation, select_columns: [x_col, y_col])
  * Distribution of one numeric → histogram (query_type: distribution)
  * Multiple correlations → heatmap (query_type: heatmap)
  * Parts of whole → pie chart (group_by + agg)
- For scatter: set x_axis and y_axis in query_spec
- For heatmap: set heatmap_columns with 4-8 relevant numeric columns
- Only use columns that exist in the dataset
- Return ONLY valid JSON, no extra text"""

        try:
            response = self.model.generate_content(system_prompt)
            spec = self._parse_json_from_response(response.text)
            return spec if spec else {"error": "Could not parse dashboard spec", "raw": response.text}
        except Exception as e:
            return {"error": str(e)}

    def generate_chart_insight(self, chart_spec: Dict, chart_data: Dict) -> str:
        """Generate AI insight for a specific chart."""
        data_sample = chart_data.get("data", [])[:10]
        correlation = chart_data.get("correlation", None)
        
        prompt = f"""You are a Business Intelligence analyst. Generate a 2-3 sentence executive insight.

Chart: {chart_spec.get('title', 'Chart')}
Chart type: {chart_spec.get('type', 'bar')}
Data sample: {json.dumps(data_sample, indent=2)}
{f'Correlation coefficient: {correlation}' if correlation is not None else ''}
Insight focus: {chart_spec.get('insight_prompt', 'General insight')}

Write a concise, actionable business insight. Be specific with numbers if available.
Format: Start with the key finding, then explain the business implication.
Keep it under 60 words. No bullet points."""

        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            return f"Analysis shows patterns in {chart_spec.get('title', 'this metric')}."

    def generate_executive_summary(self, prompt: str, charts_data: List[Dict]) -> str:
        """Generate an overall executive summary for the dashboard."""
        insights_text = "\n".join([f"- {c.get('insight', '')}" for c in charts_data if c.get('insight')])
        
        summary_prompt = f"""You are a C-suite BI consultant. Generate an executive summary for this dashboard.

Original question: "{prompt}"
Chart insights:
{insights_text}

Write 3-4 sentences maximum executive summary with:
1. Key finding
2. Business impact
3. Recommended action

Be direct, use specific numbers where available. No fluff."""

        try:
            response = self.model.generate_content(summary_prompt)
            return response.text.strip()
        except Exception as e:
            return "Analysis complete. Review the charts above for detailed business insights."

    def handle_followup(self, followup: str, previous_spec: Dict) -> Dict[str, Any]:
        """Handle follow-up conversational queries."""
        dataset_context = self.data_engine.get_dataset_context()
        
        prompt = f"""You are a BI AI assistant. The user has a follow-up question to modify their existing dashboard.

DATASET:
{dataset_context}

PREVIOUS DASHBOARD SPEC:
{json.dumps(previous_spec, indent=2)}

FOLLOW-UP QUESTION: "{followup}"

Generate an UPDATED dashboard specification JSON (same format as before) that incorporates the user's follow-up request.
Consider: filters, new groupings, different aggregations, added/removed charts.
Return ONLY valid JSON."""

        try:
            response = self.model.generate_content(prompt)
            spec = self._parse_json_from_response(response.text)
            return spec if spec else {"error": "Could not parse follow-up spec"}
        except Exception as e:
            return {"error": str(e)}

    def suggest_followup_questions(self, current_spec: Dict) -> List[str]:
        """Suggest intelligent follow-up questions based on current dashboard."""
        intent = current_spec.get("intent", "analysis")
        
        prompt = f"""Based on this BI dashboard about: "{intent}"
Dataset: Customer Behaviour (Online vs Offline) with fields like age, income, online/store spending, tech_savvy_score, city_tier, gender.

Suggest 4 natural follow-up questions a business user might ask. Return as JSON array of strings.
Example: ["Filter by Tier 1 cities only", "Compare by gender", "Show top 20% spenders"]"""

        try:
            response = self.model.generate_content(prompt)
            match = re.search(r'\[.*\]', response.text, re.DOTALL)
            if match:
                return json.loads(match.group(0))
        except:
            pass
        return [
            "Filter by Tier 1 cities only",
            "Compare male vs female patterns",
            "Show high income segment only",
            "Add age group breakdown"
        ]
