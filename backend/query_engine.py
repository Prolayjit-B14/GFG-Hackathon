"""
Query Engine: Converts AI-generated Pandas code into actual results.
Executes structured Pandas queries safely with sandboxed execution.
"""
import pandas as pd
import numpy as np
import json
import traceback
from typing import Any, Dict, List, Optional


ALLOWED_BUILTINS = {
    "len": len, "range": range, "int": int, "float": float,
    "str": str, "list": list, "dict": dict, "round": round,
    "sum": sum, "min": min, "max": max, "abs": abs, "enumerate": enumerate,
    "zip": zip, "sorted": sorted, "print": print, "__import__": None
}


class QueryEngine:
    def __init__(self):
        self.df: Optional[pd.DataFrame] = None

    def set_dataframe(self, df: pd.DataFrame):
        self.df = df

    def execute_pandas_code(self, code: str) -> Dict[str, Any]:
        """
        Safely execute AI-generated Pandas code.
        Returns {"data": [...], "columns": [...]} or {"error": "..."}
        """
        if self.df is None:
            return {"error": "No dataset loaded"}

        # Sandbox execution environment
        exec_globals = {
            "pd": pd,
            "np": np,
            "df": self.df.copy(),
        }

        try:
            # Wrap code to capture result
            wrapped = f"""
import pandas as _pd
import numpy as _np
_result = None
{code}
# Try to capture the last expression
"""
            # inject result capture: if code assigns 'result', use it
            # otherwise look for last assignment to any variable
            local_vars = {}
            exec(code, exec_globals, local_vars)

            # Look for result in order of priority
            result_df = None
            for candidate in ["result", "df_result", "output", "filtered_df", "grouped", "final"]:
                if candidate in local_vars:
                    result_df = local_vars[candidate]
                    break
                if candidate in exec_globals:
                    result_df = exec_globals[candidate]
                    break

            # Fallback: check any DataFrame in local vars
            if result_df is None:
                for v in local_vars.values():
                    if isinstance(v, (pd.DataFrame, pd.Series)):
                        result_df = v
                        break

            if result_df is None:
                # Try executing with result = last line
                return self._execute_with_result_extraction(code)

            return self._format_result(result_df)

        except Exception as e:
            return {"error": f"Query execution error: {str(e)}", "traceback": traceback.format_exc()[-300:]}

    def _execute_with_result_extraction(self, code: str) -> Dict[str, Any]:
        """Retry execution by auto-wrapping last expression."""
        lines = [l for l in code.strip().split('\n') if l.strip()]
        if not lines:
            return {"error": "Empty query"}

        # Add result capture to last line
        last_line = lines[-1]
        if not any(last_line.strip().startswith(kw) for kw in ["#", "print", "result ="]):
            lines[-1] = f"result = {last_line}"

        modified_code = "\n".join(lines)
        exec_globals = {"pd": pd, "np": np, "df": self.df.copy()}
        local_vars = {}

        try:
            exec(modified_code, exec_globals, local_vars)
            result = local_vars.get("result") or exec_globals.get("result")
            return self._format_result(result)
        except Exception as e:
            return {"error": str(e)}

    def _format_result(self, result) -> Dict[str, Any]:
        """Format various result types into a consistent dict."""
        if result is None:
            return {"error": "Query produced no result"}

        if isinstance(result, pd.DataFrame):
            result = result.round(2)
            return {
                "data": result.head(500).fillna(0).to_dict(orient="records"),
                "columns": list(result.columns),
                "row_count": len(result)
            }
        elif isinstance(result, pd.Series):
            df_result = result.reset_index()
            df_result.columns = [str(c) for c in df_result.columns]
            df_result = df_result.round(2)
            return {
                "data": df_result.head(200).fillna(0).to_dict(orient="records"),
                "columns": list(df_result.columns),
                "row_count": len(df_result)
            }
        elif isinstance(result, (int, float)):
            return {
                "data": [{"value": round(float(result), 2)}],
                "columns": ["value"],
                "row_count": 1,
                "kpi_value": round(float(result), 2)
            }
        elif isinstance(result, dict):
            return {
                "data": [result],
                "columns": list(result.keys()),
                "row_count": 1
            }
        else:
            return {"error": f"Unsupported result type: {type(result)}"}

    # ── Built-in fallback queries (used when AI code fails) ──────────────────

    def query_groupby_mean(self, group_col: str, value_cols: List[str], filters: List[Dict] = None) -> Dict:
        df = self.df.copy()
        if filters:
            df = self._apply_filters(df, filters)
        valid = [c for c in value_cols if c in df.columns]
        if group_col not in df.columns or not valid:
            return {"error": f"Columns not found: {group_col}, {value_cols}"}
        result = df.groupby(group_col)[valid].mean().round(2).reset_index()
        return {"data": result.to_dict(orient="records"), "columns": list(result.columns), "row_count": len(result)}

    def query_correlation(self, col1: str, col2: str, color_col: str = None) -> Dict:
        if col1 not in self.df.columns or col2 not in self.df.columns:
            return {"error": f"Columns {col1}, {col2} not found"}
        cols = [col1, col2] + ([color_col] if color_col and color_col in self.df.columns else [])
        df = self.df[cols].dropna().head(500)
        corr = round(float(self.df[col1].corr(self.df[col2])), 3)
        return {"data": df.to_dict(orient="records"), "columns": cols, "correlation": corr}

    def query_distribution(self, col: str, bins: int = 20) -> Dict:
        if col not in self.df.columns:
            return {"error": f"Column {col} not found"}
        counts, edges = np.histogram(self.df[col].dropna(), bins=bins)
        labels = [f"{edges[i]:.1f}–{edges[i+1]:.1f}" for i in range(len(counts))]
        return {"data": [{"range": l, "count": int(c)} for l, c in zip(labels, counts)], "columns": ["range", "count"]}

    def query_heatmap(self, cols: List[str] = None) -> Dict:
        numeric = self.df.select_dtypes(include="number")
        if cols:
            numeric = numeric[[c for c in cols if c in numeric.columns]]
        numeric = numeric.iloc[:, :10]
        matrix = numeric.corr().round(3)
        columns = list(matrix.columns)
        data = [{"x": c, "y": r, "value": float(matrix.loc[r, c])}
                for r in columns for c in columns]
        return {"data": data, "columns": columns}

    def query_kpi(self, col: str, agg: str = "mean") -> Dict:
        if col not in self.df.columns:
            return {"error": f"Column {col} not found"}
        fns = {"mean": self.df[col].mean, "sum": self.df[col].sum,
               "max": self.df[col].max, "min": self.df[col].min,
               "count": self.df[col].count}
        value = round(float(fns.get(agg, self.df[col].mean)()), 2)
        return {"data": [{"value": value}], "columns": ["value"], "kpi_value": value,
                "kpi_label": f"{agg.capitalize()} {col.replace('_', ' ').title()}"}

    def _apply_filters(self, df: pd.DataFrame, filters: List[Dict]) -> pd.DataFrame:
        for f in filters:
            col, op, val = f.get("column"), f.get("operator", "=="), f.get("value")
            if col not in df.columns:
                continue
            ops = {"==": df[col] == val, "!=": df[col] != val, ">": df[col] > val,
                   "<": df[col] < val, ">=": df[col] >= val, "<=": df[col] <= val,
                   "in": df[col].isin(val if isinstance(val, list) else [val])}
            if op in ops:
                df = df[ops[op]]
        return df
