import pandas as pd
import numpy as np
import io
import json
from typing import Any, Dict, List, Optional, Tuple
import re

class DataEngine:
    def __init__(self):
        self.df: Optional[pd.DataFrame] = None
        self.dataset_name: str = ""
        self.column_info: Dict[str, Any] = {}

    def load_default_dataset(self, path: str) -> Dict[str, Any]:
        """Load the default Customer Behaviour CSV dataset."""
        try:
            self.df = pd.read_csv(path)
            self.dataset_name = "Customer Behaviour (Online vs Offline)"
            self._analyze_columns()
            return {"success": True, "rows": len(self.df), "columns": list(self.df.columns)}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def load_uploaded_csv(self, content: bytes, filename: str) -> Dict[str, Any]:
        """Load a user-uploaded CSV file."""
        try:
            self.df = pd.read_csv(io.BytesIO(content))
            self.dataset_name = filename
            self._analyze_columns()
            return {"success": True, "rows": len(self.df), "columns": list(self.df.columns)}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def _analyze_columns(self):
        """Analyze column types and statistics for context building."""
        self.column_info = {}
        for col in self.df.columns:
            dtype = str(self.df[col].dtype)
            if self.df[col].dtype in ['int64', 'float64']:
                self.column_info[col] = {
                    "type": "numeric",
                    "min": float(self.df[col].min()),
                    "max": float(self.df[col].max()),
                    "mean": float(self.df[col].mean()),
                    "unique": int(self.df[col].nunique())
                }
            else:
                self.column_info[col] = {
                    "type": "categorical",
                    "unique_values": self.df[col].unique().tolist()[:20],
                    "unique_count": int(self.df[col].nunique())
                }

    def get_dataset_context(self) -> str:
        """Get a text description of the dataset for the AI."""
        if self.df is None:
            return "No dataset loaded."
        
        context = f"Dataset: {self.dataset_name}\n"
        context += f"Total rows: {len(self.df)}\n"
        context += f"Columns ({len(self.df.columns)}):\n"
        for col, info in self.column_info.items():
            if info['type'] == 'numeric':
                context += f"  - {col} (numeric): min={info['min']:.2f}, max={info['max']:.2f}, mean={info['mean']:.2f}\n"
            else:
                context += f"  - {col} (categorical): {info['unique_values'][:5]}\n"
        return context

    def execute_query(self, query_spec: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a data query based on the AI-generated specification."""
        if self.df is None:
            return {"error": "No dataset loaded"}
        
        try:
            df = self.df.copy()
            
            # Apply filters
            filters = query_spec.get("filters", [])
            for f in filters:
                col = f.get("column")
                op = f.get("operator")
                val = f.get("value")
                if col and col in df.columns:
                    if op == "==" or op == "eq":
                        df = df[df[col] == val]
                    elif op == "!=" or op == "ne":
                        df = df[df[col] != val]
                    elif op == ">" or op == "gt":
                        df = df[df[col] > val]
                    elif op == "<" or op == "lt":
                        df = df[df[col] < val]
                    elif op == ">=" or op == "gte":
                        df = df[df[col] >= val]
                    elif op == "<=" or op == "lte":
                        df = df[df[col] <= val]
                    elif op == "in":
                        df = df[df[col].isin(val if isinstance(val, list) else [val])]

            # Groupby + aggregation
            group_by = query_spec.get("group_by", [])
            agg_cols = query_spec.get("agg_columns", [])
            agg_func = query_spec.get("agg_function", "mean")

            if group_by and agg_cols:
                valid_groups = [g for g in group_by if g in df.columns]
                valid_aggs = [c for c in agg_cols if c in df.columns]
                if valid_groups and valid_aggs:
                    agg_map = {col: agg_func for col in valid_aggs}
                    result_df = df.groupby(valid_groups)[valid_aggs].agg(agg_map).reset_index()
                    result_df = result_df.round(2)
                    return {"data": result_df.to_dict(orient="records"), "columns": list(result_df.columns), "row_count": len(result_df)}

            # Raw columns selection
            select_cols = query_spec.get("select_columns", [])
            if select_cols:
                valid_cols = [c for c in select_cols if c in df.columns]
                if valid_cols:
                    result_df = df[valid_cols].dropna().head(500)
                    return {"data": result_df.to_dict(orient="records"), "columns": list(result_df.columns), "row_count": len(result_df)}

            # Default: return first meaningful columns
            numeric_cols = df.select_dtypes(include='number').columns[:5].tolist()
            result_df = df[numeric_cols].head(200) if numeric_cols else df.head(50)
            return {"data": result_df.to_dict(orient="records"), "columns": list(result_df.columns), "row_count": len(result_df)}

        except Exception as e:
            return {"error": str(e)}

    def get_correlation_data(self, col1: str, col2: str, group_col: Optional[str] = None) -> Dict[str, Any]:
        """Get correlation data between two numeric columns."""
        if self.df is None:
            return {"error": "No dataset loaded"}
        
        if col1 not in self.df.columns or col2 not in self.df.columns:
            return {"error": f"Columns {col1} or {col2} not found"}
        
        try:
            df = self.df[[col1, col2] + ([group_col] if group_col and group_col in self.df.columns else [])].dropna()
            corr = float(df[col1].corr(df[col2]))
            data = df.head(500).to_dict(orient="records")
            return {"data": data, "correlation": round(corr, 3), "columns": [col1, col2], "group_col": group_col}
        except Exception as e:
            return {"error": str(e)}

    def get_distribution_data(self, col: str, bins: int = 20) -> Dict[str, Any]:
        """Get histogram distribution data for a column."""
        if self.df is None or col not in self.df.columns:
            return {"error": f"Column {col} not found"}
        
        try:
            counts, bin_edges = np.histogram(self.df[col].dropna(), bins=bins)
            labels = [f"{bin_edges[i]:.1f}-{bin_edges[i+1]:.1f}" for i in range(len(counts))]
            return {"data": [{"range": l, "count": int(c)} for l, c in zip(labels, counts)], "columns": ["range", "count"]}
        except Exception as e:
            return {"error": str(e)}

    def get_heatmap_data(self, cols: Optional[List[str]] = None) -> Dict[str, Any]:
        """Get correlation matrix data for heatmap."""
        if self.df is None:
            return {"error": "No dataset loaded"}
        
        try:
            numeric_df = self.df.select_dtypes(include='number')
            if cols:
                valid_cols = [c for c in cols if c in numeric_df.columns]
                numeric_df = numeric_df[valid_cols] if valid_cols else numeric_df
            numeric_df = numeric_df.iloc[:, :10]  # max 10 cols
            corr_matrix = numeric_df.corr().round(3)
            columns = list(corr_matrix.columns)
            data = []
            for i, row_col in enumerate(columns):
                for j, col in enumerate(columns):
                    data.append({"x": col, "y": row_col, "value": float(corr_matrix.iloc[i, j])})
            return {"data": data, "columns": columns}
        except Exception as e:
            return {"error": str(e)}

    def get_segmentation_data(self, segment_col: str, value_cols: List[str]) -> Dict[str, Any]:
        """Get segmentation analysis data."""
        if self.df is None:
            return {"error": "No dataset loaded"}
        
        try:
            valid_vals = [c for c in value_cols if c in self.df.columns]
            if segment_col not in self.df.columns:
                return {"error": f"Column {segment_col} not found"}
            
            agg = self.df.groupby(segment_col)[valid_vals].mean().round(2).reset_index()
            return {"data": agg.to_dict(orient="records"), "columns": list(agg.columns)}
        except Exception as e:
            return {"error": str(e)}

    def get_summary_stats(self) -> Dict[str, Any]:
        """Get overall summary statistics."""
        if self.df is None:
            return {"error": "No dataset loaded"}
        
        try:
            numeric = self.df.select_dtypes(include='number').describe().round(2)
            return {"stats": numeric.to_dict(), "shape": list(self.df.shape), "columns": list(self.df.columns)}
        except Exception as e:
            return {"error": str(e)}
