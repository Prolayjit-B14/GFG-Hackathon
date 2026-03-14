"""
Chart Engine — Formats raw query results into frontend-ready chart payloads.
FIXED: reads chart_type (new AI spec) with fallback to type (old spec).
FIXED: x_key/y_key from AI spec wired correctly.
"""
from typing import Any, Dict, List, Optional

CHART_COLOR_PALETTE = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981",
    "#3b82f6", "#ef4444", "#14b8a6", "#f97316", "#84cc16"
]


class ChartEngine:
    """Formats raw data into chart-ready structures for the frontend."""

    def format_bar_chart(self, data: List[Dict], x_col: str, y_cols: List[str], title: str) -> Dict:
        return {
            "type": "bar", "title": title, "data": data,
            "config": {
                "xKey": x_col, "yKeys": y_cols,
                "colors": CHART_COLOR_PALETTE[:len(y_cols)], "stacked": False, "showGrid": True
            }
        }

    def format_line_chart(self, data: List[Dict], x_col: str, y_cols: List[str], title: str) -> Dict:
        return {
            "type": "line", "title": title, "data": data,
            "config": {
                "xKey": x_col, "yKeys": y_cols,
                "colors": CHART_COLOR_PALETTE[:len(y_cols)], "showDots": True, "smooth": True
            }
        }

    def format_scatter_chart(self, data: List[Dict], x_col: str, y_col: str, title: str,
                              color_col: Optional[str] = None, correlation: Optional[float] = None) -> Dict:
        return {
            "type": "scatter", "title": title, "data": data[:400],
            "config": {
                "xKey": x_col, "yKey": y_col, "colorKey": color_col,
                "correlation": correlation, "colors": CHART_COLOR_PALETTE
            }
        }

    def format_pie_chart(self, data: List[Dict], name_col: str, value_col: str, title: str) -> Dict:
        formatted = [{"name": str(row.get(name_col, "")), "value": round(float(row.get(value_col, 0) or 0), 2)}
                     for row in data]
        return {
            "type": "pie", "title": title, "data": formatted,
            "config": {"nameKey": "name", "valueKey": "value", "colors": CHART_COLOR_PALETTE}
        }

    def format_heatmap(self, data: List[Dict], columns: List[str], title: str) -> Dict:
        return {
            "type": "heatmap", "title": title, "data": data,
            "config": {
                "columns": columns,
                "colorScale": ["#1e293b", "#6366f1", "#ec4899"], "minVal": -1, "maxVal": 1
            }
        }

    def format_histogram(self, data: List[Dict], title: str) -> Dict:
        return {
            "type": "histogram", "title": title, "data": data,
            "config": {"xKey": "range", "yKey": "count", "color": CHART_COLOR_PALETTE[0]}
        }

    def format_kpi_card(self, data: List[Dict], title: str) -> Dict:
        return {
            "type": "kpi_card", "title": title, "data": data,
            "config": {"valueKey": "value", "labelKey": "label"}
        }

    def build_chart_payload(self, chart_spec: Dict, query_result: Dict, insight: str = "") -> Dict:
        """
        Build the complete chart payload.
        CRITICAL FIX: reads 'chart_type' (new AI spec key), falls back to 'type'.
        CRITICAL FIX: reads x_key/y_key directly from AI spec.
        """
        # ── Resolve chart type (new AI format uses "chart_type", old uses "type") ──
        chart_type = chart_spec.get("chart_type") or chart_spec.get("type", "bar")
        title = chart_spec.get("title", "Chart")
        analysis = chart_spec.get("analysis", "")

        data = query_result.get("data", [])
        columns = query_result.get("columns", [])
        correlation = query_result.get("correlation", None)

        if not data:
            return {
                "id": chart_spec.get("id", "chart_1"),
                "type": chart_type, "title": title, "data": [], "config": {},
                "insight": insight, "analysis": analysis,
                "error": "No data available for this chart"
            }

        # ── Resolve axis keys (new AI spec provides x_key / y_key directly) ───
        ai_x_key = chart_spec.get("x_key") or chart_spec.get("query_spec", {}).get("x_axis")
        ai_y_key = chart_spec.get("y_key") or chart_spec.get("query_spec", {}).get("y_axis")
        ai_color_key = chart_spec.get("color_key") or chart_spec.get("query_spec", {}).get("color_by")

        def safe_col(name: Optional[str], fallback_idx: int = 0) -> str:
            """Return column name if it exists in data, else use column by index."""
            if name and name in columns:
                return name
            return columns[fallback_idx] if len(columns) > fallback_idx else ""

        def safe_y_cols(x_col: str) -> List[str]:
            """Return columns suitable for Y axis (numeric-ish, not the X col)."""
            candidates = [c for c in columns if c != x_col]
            # Prefer columns specified by AI, then first 2 candidates
            if ai_y_key:
                for key in ai_y_key.split(","):
                    key = key.strip()
                    if key in columns and key != x_col:
                        return [key]
            return candidates[:2] if candidates else [candidates[0]] if candidates else ["value"]

        chart: Dict = {}

        if chart_type == "bar":
            x_col = safe_col(ai_x_key, 0)
            y_cols = safe_y_cols(x_col)
            chart = self.format_bar_chart(data, x_col, y_cols, title)

        elif chart_type == "line":
            x_col = safe_col(ai_x_key, 0)
            y_cols = safe_y_cols(x_col)
            chart = self.format_line_chart(data, x_col, y_cols, title)

        elif chart_type == "scatter":
            x_col = safe_col(ai_x_key, 0)
            y_col = safe_col(ai_y_key, 1) if ai_y_key else (columns[1] if len(columns) > 1 else columns[0])
            chart = self.format_scatter_chart(data, x_col, y_col, title, ai_color_key, correlation)

        elif chart_type == "pie":
            x_col = safe_col(ai_x_key, 0)
            y_cols = safe_y_cols(x_col)
            y_col = y_cols[0] if y_cols else "value"
            chart = self.format_pie_chart(data, x_col, y_col, title)

        elif chart_type == "heatmap":
            # For heatmap the data is already in {x, y, value} format from query_engine
            chart = self.format_heatmap(data, columns, title)

        elif chart_type == "histogram":
            chart = self.format_histogram(data, title)

        elif chart_type == "kpi_card":
            chart = self.format_kpi_card(data, title)

        else:
            # Fallback: bar chart with first two columns
            x_col = columns[0] if columns else "x"
            y_cols = [c for c in columns[1:3] if c != x_col]
            chart = self.format_bar_chart(data, x_col, y_cols or ["value"], title)

        # ── Always include these fields ───────────────────────────────────────
        chart["insight"] = insight
        chart["analysis"] = analysis
        chart["id"] = chart_spec.get("id", f"chart_{hash(title) % 9999}")
        chart["row_count"] = query_result.get("row_count", len(data))

        return chart
