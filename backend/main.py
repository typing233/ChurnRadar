from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import pandas as pd
import numpy as np
import io
import os
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import json

app = FastAPI(title="ChurnRadar - 客户流失分析系统")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

def clean_nan_values(obj):
    if isinstance(obj, dict):
        return {k: clean_nan_values(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_nan_values(v) for v in obj]
    elif isinstance(obj, float):
        if np.isnan(obj) or np.isinf(obj):
            return None
        return obj
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        if np.isnan(obj) or np.isinf(obj):
            return None
        return float(obj)
    elif pd.isna(obj):
        return None
    return obj

def safe_mean(series, default=0.5):
    result = series.mean()
    if pd.isna(result) or np.isinf(result):
        return default
    return float(result)

class LLMConfig(BaseModel):
    base_url: str
    api_key: str
    model_name: str

class UserSegment(BaseModel):
    id: str
    name: str
    description: str
    users: List[Dict[str, Any]]
    risk_level: str
    color: str

class AnalysisResult(BaseModel):
    task_id: str
    total_users: int
    metrics: Dict[str, Any]
    heatmap_data: List[List[float]]
    heatmap_labels: Dict[str, List[str]]
    user_segments: List[Dict[str, Any]]
    high_risk_users: List[Dict[str, Any]]
    generated_at: datetime

analysis_results: Dict[str, AnalysisResult] = {}

def parse_csv_content(content: bytes) -> pd.DataFrame:
    try:
        df = pd.read_csv(io.BytesIO(content))
        return df
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"无法解析CSV文件: {str(e)}")

def clean_and_standardize_data(df: pd.DataFrame) -> pd.DataFrame:
    column_mapping = {
        'customer_id': ['customer_id', 'customer id', 'id', 'user_id', 'user id', 'client_id'],
        'customer_name': ['customer_name', 'customer name', 'name', 'user_name'],
        'email': ['email', 'e-mail', 'customer_email'],
        'subscription_plan': ['subscription_plan', 'plan', 'subscription type', 'product'],
        'monthly_revenue': ['monthly_revenue', 'revenue', 'amount', 'value', 'mrr', 'price'],
        'last_activity_date': ['last_activity_date', 'last active', 'last seen', 'last login', 'activity_date'],
        'signup_date': ['signup_date', 'created', 'created_at', 'join_date'],
        'support_tickets_count': ['support_tickets', 'tickets', 'ticket_count', 'support_count'],
        'support_tickets_last_30_days': ['tickets_last_30_days', 'recent_tickets', 'tickets_30d'],
        'payment_failures': ['payment_failures', 'failed_payments', 'declines', 'failed_charges'],
        'consecutive_failures': ['consecutive_failures', 'consecutive_declines'],
        'subscription_status': ['subscription_status', 'status', 'subscription state'],
        'churn_risk': ['churn_risk', 'risk_score', 'churn_probability']
    }

    new_columns = {}
    for standard_name, possible_names in column_mapping.items():
        for col in df.columns:
            col_lower = col.lower().strip()
            if col_lower in [pn.lower() for pn in possible_names]:
                new_columns[col] = standard_name
                break

    df = df.rename(columns=new_columns)

    if 'customer_id' not in df.columns:
        if 'email' in df.columns:
            df['customer_id'] = df['email'].astype(str)
        else:
            df['customer_id'] = [f"user_{i}" for i in range(len(df))]

    for col in ['last_activity_date', 'signup_date']:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors='coerce')

    for col in ['monthly_revenue', 'support_tickets_count', 'support_tickets_last_30_days', 
                'payment_failures', 'consecutive_failures']:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

    return df

def calculate_activity_trend(df: pd.DataFrame) -> pd.DataFrame:
    df['activity_score'] = 0.5
    df['activity_trend'] = 'stable'
    df['days_since_last_activity'] = 30

    if 'last_activity_date' in df.columns:
        now = pd.Timestamp.now()
        df['days_since_last_activity'] = (now - df['last_activity_date']).dt.days
        df['days_since_last_activity'] = df['days_since_last_activity'].fillna(30)
        
        df['activity_score'] = df['days_since_last_activity'].apply(
            lambda x: max(0, min(1, 1 - (x / 90))) if pd.notna(x) else 0.5
        )
        
        df.loc[df['days_since_last_activity'] > 60, 'activity_trend'] = 'declining'
        df.loc[df['days_since_last_activity'] < 14, 'activity_trend'] = 'increasing'

    if 'signup_date' in df.columns:
        now = pd.Timestamp.now()
        df['account_age_days'] = (now - df['signup_date']).dt.days
        df['account_age_days'] = df['account_age_days'].fillna(30)

    return df

def calculate_support_ticket_trend(df: pd.DataFrame) -> pd.DataFrame:
    df['ticket_risk_score'] = 0.0
    df['ticket_trend'] = 'stable'

    tickets_30d = df.get('support_tickets_last_30_days', df.get('support_tickets_count', pd.Series([0]*len(df))))
    total_tickets = df.get('support_tickets_count', tickets_30d)

    df['ticket_risk_score'] = tickets_30d.apply(
        lambda x: min(1, x / 5) if pd.notna(x) else 0.0
    )

    df.loc[tickets_30d > 3, 'ticket_trend'] = 'increasing'
    df.loc[tickets_30d == 0, 'ticket_trend'] = 'low'

    return df

def calculate_payment_health(df: pd.DataFrame) -> pd.DataFrame:
    df['payment_health_score'] = 1.0
    df['payment_status'] = 'healthy'

    consecutive = df.get('consecutive_failures', df.get('payment_failures', pd.Series([0]*len(df))))
    total_failures = df.get('payment_failures', consecutive)

    df['payment_health_score'] = consecutive.apply(
        lambda x: max(0, 1 - (x * 0.3)) if pd.notna(x) else 1.0
    )

    df.loc[consecutive >= 3, 'payment_status'] = 'critical'
    df.loc[(consecutive >= 1) & (consecutive < 3), 'payment_status'] = 'at_risk'
    df.loc[total_failures > 5, 'payment_status'] = 'at_risk'

    return df

def calculate_overall_churn_risk(df: pd.DataFrame) -> pd.DataFrame:
    df['churn_risk_score'] = 0.0

    activity_weight = 0.4
    ticket_weight = 0.3
    payment_weight = 0.3

    activity_score = df.get('activity_score', pd.Series([0.5]*len(df)))
    ticket_score = df.get('ticket_risk_score', pd.Series([0.0]*len(df)))
    payment_score = 1 - df.get('payment_health_score', pd.Series([1.0]*len(df)))

    df['churn_risk_score'] = (
        (1 - activity_score) * activity_weight +
        ticket_score * ticket_weight +
        payment_score * payment_weight
    )

    df['churn_risk_score'] = df['churn_risk_score'].round(4)

    df['risk_level'] = 'medium'
    df.loc[df['churn_risk_score'] < 0.2, 'risk_level'] = 'low'
    df.loc[df['churn_risk_score'] >= 0.6, 'risk_level'] = 'high'
    df.loc[df['churn_risk_score'] >= 0.8, 'risk_level'] = 'critical'

    return df

def generate_heatmap_data(df: pd.DataFrame) -> Dict[str, Any]:
    activity_bins = [0, 0.25, 0.5, 0.75, 1.01]
    activity_labels = ['0-25%', '25-50%', '50-75%', '75-100%']
    
    payment_bins = [0, 0.25, 0.5, 0.75, 1.01]
    payment_labels = ['0-25%', '25-50%', '50-75%', '75-100%']

    df['activity_bin'] = pd.cut(
        df.get('activity_score', pd.Series([0.5]*len(df))),
        bins=activity_bins,
        labels=range(4),
        right=False
    ).fillna(2)

    df['payment_bin'] = pd.cut(
        df.get('payment_health_score', pd.Series([1.0]*len(df))),
        bins=payment_bins,
        labels=range(4),
        right=False
    ).fillna(3)

    heatmap_matrix = np.zeros((4, 4))

    for _, row in df.iterrows():
        activity_idx = int(row['activity_bin'])
        payment_idx = int(row['payment_bin'])
        
        risk_score = row.get('churn_risk_score', 0.5)
        heatmap_matrix[3 - payment_idx][activity_idx] += risk_score

    row_sums = heatmap_matrix.sum(axis=1, keepdims=True)
    row_sums[row_sums == 0] = 1
    heatmap_normalized = heatmap_matrix / row_sums

    return {
        'matrix': heatmap_normalized.tolist(),
        'activity_labels': activity_labels,
        'payment_labels': list(reversed(payment_labels))
    }

def segment_users(df: pd.DataFrame) -> List[Dict[str, Any]]:
    segments = []

    high_value_at_risk = df[
        (df.get('monthly_revenue', 0) > df['monthly_revenue'].quantile(0.7) if 'monthly_revenue' in df.columns else True) &
        (df['churn_risk_score'] >= 0.6)
    ].to_dict('records')

    high_value_at_risk = clean_nan_values(high_value_at_risk)

    segments.append({
        'id': 'high_value_at_risk',
        'name': '高价值高风险用户',
        'description': '高价值用户但流失风险高，需要立即关注',
        'users': high_value_at_risk,
        'risk_level': 'critical',
        'color': '#FF4444'
    })

    silent_users = df[
        (df.get('days_since_last_activity', 30) > 60) &
        (df['churn_risk_score'] >= 0.4)
    ].to_dict('records')

    silent_users = clean_nan_values(silent_users)

    segments.append({
        'id': 'silent_users',
        'name': '沉默用户',
        'description': '长时间未活跃，需要重新激活',
        'users': silent_users,
        'risk_level': 'high',
        'color': '#FF8844'
    })

    payment_issues = df[
        (df.get('consecutive_failures', 0) >= 2) |
        (df.get('payment_health_score', 1) < 0.5)
    ].to_dict('records')

    payment_issues = clean_nan_values(payment_issues)

    segments.append({
        'id': 'payment_issues',
        'name': '支付问题用户',
        'description': '存在连续支付失败记录',
        'users': payment_issues,
        'risk_level': 'high',
        'color': '#FFAA44'
    })

    support_heavy = df[
        (df.get('ticket_risk_score', 0) > 0.6)
    ].to_dict('records')

    support_heavy = clean_nan_values(support_heavy)

    segments.append({
        'id': 'support_heavy',
        'name': '高频支持用户',
        'description': '近期提交大量支持工单，可能存在不满',
        'users': support_heavy,
        'risk_level': 'medium',
        'color': '#FFCC44'
    })

    low_risk = df[
        (df['churn_risk_score'] < 0.2)
    ].to_dict('records')

    low_risk = clean_nan_values(low_risk)

    segments.append({
        'id': 'low_risk',
        'name': '低风险稳定用户',
        'description': '活跃且支付健康，保持正常维护',
        'users': low_risk,
        'risk_level': 'low',
        'color': '#44AA44'
    })

    return segments

@app.post("/api/upload")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="只支持CSV文件")

    content = await file.read()
    df = parse_csv_content(content)

    task_id = str(uuid.uuid4())[:8]

    file_path = os.path.join(UPLOAD_DIR, f"{task_id}_{file.filename}")
    with open(file_path, 'wb') as f:
        f.write(content)

    return JSONResponse(content={
        "task_id": task_id,
        "filename": file.filename,
        "total_rows": len(df),
        "columns": list(df.columns)
    })

@app.post("/api/analyze/{task_id}")
async def analyze_data(task_id: str):
    upload_files = [f for f in os.listdir(UPLOAD_DIR) if f.startswith(task_id)]
    if not upload_files:
        raise HTTPException(status_code=404, detail="未找到上传的文件")

    file_path = os.path.join(UPLOAD_DIR, upload_files[0])
    df = pd.read_csv(file_path)

    df = clean_and_standardize_data(df)
    df = calculate_activity_trend(df)
    df = calculate_support_ticket_trend(df)
    df = calculate_payment_health(df)
    df = calculate_overall_churn_risk(df)

    heatmap = generate_heatmap_data(df)
    segments = segment_users(df)

    high_risk = df[df['risk_level'].isin(['high', 'critical'])].to_dict('records')

    silent_users_count = int(len(df[df.get('days_since_last_activity', pd.Series([30]*len(df))) > 60]))
    payment_issues_count = int(len(df[df.get('payment_health_score', pd.Series([1.0]*len(df))) < 0.7]))
    high_ticket_users_count = int(len(df[df.get('ticket_risk_score', pd.Series([0.0]*len(df))) > 0.5]))

    result = {
        "task_id": task_id,
        "total_users": len(df),
        "metrics": {
            "low_risk_count": int(len(df[df['risk_level'] == 'low'])),
            "medium_risk_count": int(len(df[df['risk_level'] == 'medium'])),
            "high_risk_count": int(len(df[df['risk_level'] == 'high'])),
            "critical_risk_count": int(len(df[df['risk_level'] == 'critical'])),
            "avg_churn_risk": safe_mean(df['churn_risk_score'], 0.5),
            "silent_users_count": silent_users_count,
            "payment_issues_count": payment_issues_count,
            "high_ticket_users_count": high_ticket_users_count
        },
        "heatmap_data": heatmap['matrix'],
        "heatmap_labels": {
            "x": heatmap['activity_labels'],
            "y": heatmap['payment_labels']
        },
        "user_segments": segments,
        "high_risk_users": high_risk,
        "generated_at": datetime.now().isoformat()
    }

    result = clean_nan_values(result)

    output_path = os.path.join(OUTPUT_DIR, f"{task_id}_analysis.json")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, default=str)

    analysis_results[task_id] = result

    return JSONResponse(content=result)

@app.get("/api/results/{task_id}")
async def get_results(task_id: str):
    if task_id in analysis_results:
        return JSONResponse(content=analysis_results[task_id])
    
    output_path = os.path.join(OUTPUT_DIR, f"{task_id}_analysis.json")
    if os.path.exists(output_path):
        with open(output_path, 'r', encoding='utf-8') as f:
            return JSONResponse(content=json.load(f))
    
    raise HTTPException(status_code=404, detail="未找到分析结果")

@app.post("/api/export/{task_id}")
async def export_high_risk(task_id: str):
    if task_id in analysis_results:
        result = analysis_results[task_id]
    else:
        output_path = os.path.join(OUTPUT_DIR, f"{task_id}_analysis.json")
        if os.path.exists(output_path):
            with open(output_path, 'r', encoding='utf-8') as f:
                result = json.load(f)
        else:
            raise HTTPException(status_code=404, detail="未找到分析结果")

    high_risk_users = result.get('high_risk_users', [])
    
    if not high_risk_users:
        raise HTTPException(status_code=404, detail="没有高危用户数据")

    df = pd.DataFrame(high_risk_users)
    
    export_path = os.path.join(OUTPUT_DIR, f"{task_id}_high_risk_users.xlsx")
    df.to_excel(export_path, index=False, engine='openpyxl')

    return FileResponse(
        path=export_path,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename=f"high_risk_users_{task_id}.xlsx"
    )

@app.post("/api/test-llm")
async def test_llm_connection(config: LLMConfig):
    try:
        import requests
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {config.api_key}"
        }
        
        base_url = config.base_url.rstrip('/')
        
        models_url = f"{base_url}/models"
        try:
            response = requests.get(models_url, headers=headers, timeout=10)
            if response.status_code == 200:
                return JSONResponse(content={
                    "success": True,
                    "message": "LLM连接测试成功",
                    "details": "API连接正常，模型列表可访问"
                })
        except:
            pass
        
        chat_url = f"{base_url}/chat/completions"
        test_payload = {
            "model": config.model_name,
            "messages": [{"role": "user", "content": "Hello"}],
            "max_tokens": 5
        }
        
        response = requests.post(chat_url, headers=headers, json=test_payload, timeout=15)
        
        if response.status_code == 200:
            return JSONResponse(content={
                "success": True,
                "message": "LLM连接测试成功",
                "details": f"模型 {config.model_name} 响应正常"
            })
        else:
            return JSONResponse(content={
                "success": False,
                "message": f"LLM连接测试失败: HTTP {response.status_code}",
                "details": response.text
            })
            
    except requests.exceptions.Timeout:
        return JSONResponse(content={
            "success": False,
            "message": "LLM连接超时",
            "details": "请求超时，请检查网络连接或API地址"
        })
    except requests.exceptions.RequestException as e:
        return JSONResponse(content={
            "success": False,
            "message": f"LLM连接错误: {str(e)}",
            "details": "请检查API地址、API密钥和网络连接"
        })
    except Exception as e:
        return JSONResponse(content={
            "success": False,
            "message": f"测试失败: {str(e)}",
            "details": "未知错误，请检查配置"
        })

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
