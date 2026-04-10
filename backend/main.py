from fastapi import FastAPI, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
from database.database_utils import get_engine
from sqlalchemy import text
import uvicorn
import sys
import os
import random
import string
from ml.pipeline import predict_sentiment
import joblib
from sklearn.base import BaseEstimator, TransformerMixin
import numpy as np
from groq import Groq
from dotenv import load_dotenv
from sklearn.pipeline import Pipeline
from pydantic import BaseModel
import re
from typing import List, Optional, Any
import asyncpg
import logging
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if root_path not in sys.path:
    sys.path.append(root_path)

load_dotenv()
GROQ_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_KEY)

# ==================== Database Configuration ====================
DB_CONFIG = {
    "host": "shortline.proxy.rlwy.net",
    "port": 34425,
    "user": "postgres",
    "password": "qIQZrgwGDJvkjejkgPPHyNObPlEVEeOZ",
    "database": "railway",
    "ssl": "require"
}

# ==================== Pydantic Models ====================
class SafeColumnDropper(BaseEstimator, TransformerMixin):
    def __init__(self, columns):
        self.columns = columns
    def fit(self, X, y=None):
        return self
    def transform(self, X):
        cols_to_drop = [col for col in self.columns if col in X.columns]
        return X.drop(columns=cols_to_drop)

class DTypeCaster(BaseEstimator, TransformerMixin):
    def __init__(self, cast_map):
        self.cast_map = cast_map
    def fit(self, X, y=None):
        return self
    def transform(self, X):
        X = X.copy()
        for col, dtype in self.cast_map.items():
            if col in X.columns:
                X[col] = X[col].astype(dtype)
        return X

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    query: str
    history: Optional[List[ChatMessage]] = []

class RiskSegment(BaseModel):
    segment: str
    count: int

class ChurnStatus(BaseModel):
    status: str
    value: int

class ServiceChurn(BaseModel):
    service: str
    avg_churn: float

class SentimentData(BaseModel):
    sentiment: str
    value: int

class LoyaltyType(BaseModel):
    type: str
    value: int

class TenureYear(BaseModel):
    years: float
    customers: int

class ServiceLife(BaseModel):
    service: str
    avg_tenure: float

class DashboardResponse(BaseModel):
    risk: List[RiskSegment]
    churn: List[ChurnStatus]
    services: List[ServiceChurn]
    sentiment: List[SentimentData]
    loyalty: List[LoyaltyType]
    tenure: List[TenureYear]
    serviceLife: List[ServiceLife]
    totalCustomers: int

# ==================== Load ML Models ====================
CHURN_PIPELINE = joblib.load("ml/models/churn_pipeline.pkl")
SDV_SYNTHESIZER = joblib.load("ml/models/gc_synthesizer.pkl")
CHURN_EXPLAINER = joblib.load('ml/models/explainer.pkl')

# ==================== Database Pool ====================
class DatabasePool:
    def __init__(self):
        self.pool = None
    
    async def connect(self):
        """Create database connection pool"""
        try:
            self.pool = await asyncpg.create_pool(
                host=DB_CONFIG["host"],
                port=DB_CONFIG["port"],
                user=DB_CONFIG["user"],
                password=DB_CONFIG["password"],
                database=DB_CONFIG["database"],
                ssl=DB_CONFIG["ssl"],
                min_size=1,
                max_size=10
            )
            logger.info("Database connected successfully!")
            return self.pool
        except Exception as e:
            logger.error(f"Database connection failed: {str(e)}")
            raise
    
    async def disconnect(self):
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            logger.info("Database disconnected")

# Create global database pool instance
db = DatabasePool()

# ==================== Lifespan Manager ====================
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await db.connect()
    yield
    # Shutdown
    await db.disconnect()

# ==================== FastAPI App ====================
app = FastAPI(
    title="Customer Analytics & CRM API",
    description="Complete API for customer dashboard analytics and CRM operations",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== Utility Functions ====================
def load_explainer(explainer_path):
    explainer = joblib.load(explainer_path)
    return explainer

def apply_preprocessor(df, pipeline):
    X_transformed = df.copy()
    for name, step in pipeline.steps[:-1]:
        X_transformed = step.transform(X_transformed)
    return X_transformed

def get_customer_explanation(customer_id):
    engine = get_engine()
    query = text("""
        SELECT i.*, f.* FROM customers_info i 
        JOIN customer_feedback f ON UPPER(i."CustomerID") = UPPER(f."customerID")
        WHERE UPPER(i."CustomerID") = :cid
    """)
    
    with engine.connect() as conn:
        df_customer = pd.read_sql(query, conn, params={"cid": customer_id.upper()})
    
    if df_customer.empty:
        return None

    df_customer['Total Charges'] = pd.to_numeric(df_customer['Total Charges'], errors='coerce').fillna(0)
    customer_data = df_customer.drop(columns=['Churn Score'], errors='ignore')
    
    customer_data_tf = apply_preprocessor(customer_data, CHURN_PIPELINE)
    customer_data_np = np.array(customer_data_tf, dtype=np.float64)
    feature_names = customer_data_tf.columns.tolist()
    
    shap_results = CHURN_EXPLAINER(customer_data_np, check_additivity=False)
    
    if len(shap_results.shape) == 3:
        shap_values = shap_results[0, :, 1] 
    else:
        shap_values = shap_results[0]

    important_features = pd.DataFrame({
        'Feature': feature_names,
        'SHAP Value': shap_values.values
    }).sort_values('SHAP Value', ascending=False)

    return important_features

def generate_unique_ids(n):
    ids = set()
    while len(ids) < n:
        digits  = ''.join(random.choices(string.digits, k=4))
        letters = ''.join(random.choices(string.ascii_uppercase, k=5))
        ids.add(f"{digits}-{letters}")
    return list(ids)

def get_actual_columns(table_name: str):
    query = text(f"""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '{table_name}'
    """)
    with get_engine().connect() as conn:
        result = conn.execute(query).fetchall()
        return [col[0] for col in result]

# ==================== Root Endpoint ====================
@app.get("/")
async def root():
    return {"message": "Customer Analytics & CRM API Running", "version": "2.0.0"}

# ==================== Dashboard Endpoint ====================
@app.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard():
    """
    Get all dashboard analytics data including:
    - Risk segments based on churn score
    - Churn vs Not Churn analysis
    - Average churn by internet service
    - Sentiment analysis from customer feedback
    - Loyalty classification
    - Tenure distribution
    - Service life metrics
    """
    try:
        # 1. Risk segments based on Churn Score
        risk = await db.pool.fetch("""
            SELECT 
                CASE
                    WHEN "Churn Score" >= 80 THEN 'Immediate Action'
                    WHEN "Churn Score" >= 60 THEN 'Moderate'
                    WHEN "Churn Score" >= 40 THEN 'At Risk'
                    ELSE 'Good'
                END AS segment,
                COUNT(*)::int as count
            FROM customers_info
            GROUP BY segment
        """)

        # 2. Churn vs Not Churn
        churn = await db.pool.fetch("""
            SELECT 
                CASE 
                    WHEN "Churn Score" > 50 THEN 'Churn'
                    ELSE 'Not Churn'
                END as status,
                COUNT(*)::int as value
            FROM customers_info
            GROUP BY status
        """)

        # 3. Average churn score by internet service
        services = await db.pool.fetch("""
            SELECT 
                "Internet Service" as service,
                AVG("Churn Score")::float as avg_churn
            FROM customers_info
            GROUP BY "Internet Service"
        """)

        # 4. Sentiment query
        sentiment = await db.pool.fetch("""
            SELECT 
                CASE
                    WHEN sentiment_label_roberta = 'positive' THEN 'Positive'
                    WHEN sentiment_label_roberta = 'negative' THEN 'Negative'
                    WHEN sentiment_label_roberta = 'neutral' THEN 'Neutral'
                    ELSE 'Unknown'
                END as sentiment,
                COUNT(*)::int as value
            FROM customer_feedback
            WHERE sentiment_label_roberta IS NOT NULL
            GROUP BY sentiment
        """)

        sentiment_rows = [dict(row) for row in sentiment]
        if len(sentiment_rows) == 0:
            sentiment_rows = [
                {"sentiment": "Positive", "value": 0},
                {"sentiment": "Neutral", "value": 0},
                {"sentiment": "Negative", "value": 0},
            ]

        # 5. Loyalty classification
        loyalty = await db.pool.fetch("""
            SELECT 
                CASE 
                    WHEN "Tenure Months" >= 12 THEN 'Loyal'
                    ELSE 'Not Loyal'
                END as type,
                COUNT(*)::int as value
            FROM customers_info
            GROUP BY type
        """)

        # 6. Tenure distribution by year
        tenure = await db.pool.fetch("""
            SELECT 
                FLOOR("Tenure Months" / 12) as years,
                COUNT(*)::int as customers
            FROM customers_info
            WHERE "Tenure Months" IS NOT NULL
            GROUP BY years
            ORDER BY years
        """)

        # 7. Average tenure by internet service
        serviceLife = await db.pool.fetch("""
            SELECT 
                "Internet Service" as service,
                AVG("Tenure Months")::float as avg_tenure
            FROM customers_info
            WHERE "Internet Service" IS NOT NULL
            GROUP BY "Internet Service"
            ORDER BY avg_tenure DESC
        """)

        # 8. Total customers count
        totalCustomers = await db.pool.fetchval("""
            SELECT COUNT(*)::int FROM customers_info
        """)

        logger.info(f"Sentiment data: {sentiment_rows}")
        logger.info(f"Total customers: {totalCustomers}")

        return {
            "risk": [{"segment": row["segment"], "count": row["count"]} for row in risk],
            "churn": [{"status": row["status"], "value": row["value"]} for row in churn],
            "services": [{"service": row["service"], "avg_churn": float(row["avg_churn"])} for row in services],
            "sentiment": sentiment_rows,
            "loyalty": [{"type": row["type"], "value": row["value"]} for row in loyalty],
            "tenure": [{"years": float(row["years"]), "customers": row["customers"]} for row in tenure],
            "serviceLife": [{"service": row["service"], "avg_tenure": float(row["avg_tenure"])} for row in serviceLife],
            "totalCustomers": totalCustomers
        }

    except Exception as err:
        logger.error(f"Database Error: {str(err)}")
        raise HTTPException(status_code=500, detail=f"Server Error: {str(err)}")

# ==================== Customer Endpoints ====================
@app.get("/api/customers")
def get_customers():
    try:
        engine = get_engine()
        query = text("""
            SELECT 
                i.*, 
                i."Churn Score" AS "Churn_Score",
                i."Tenure Months" AS "Tenure_Months",
                i."Senior Citizen" AS "Senior_Citizen",
                f."CustomerFeedback" AS "CustomerFeedback"
            FROM public.customers_info i
            LEFT JOIN public.customer_feedback f ON UPPER(i."CustomerID") = UPPER(f."customerID")
        """)
        
        with engine.connect() as conn:
            df = pd.read_sql(query, conn)
        
        df = df.fillna("") 
        return df.to_dict(orient='records')
    except Exception as e:
        print(f"Server Error: {str(e)}")
        return {"error": str(e)}, 500

@app.post("/api/customers/{customer_id}/feedback")
def save_customer_feedback(customer_id: str, payload: dict = Body(...)):
    try:
        engine = get_engine()
        feedback_text = payload.get("feedback")
        
        label, score, num = predict_sentiment(feedback_text)
        has_feedback = True if feedback_text and feedback_text.strip() != "" else False

        with engine.connect() as conn:
            save_fb_query = text("""
                INSERT INTO public.customer_feedback (
                    "customerID", "CustomerFeedback", "HasFeedback", 
                    "sentiment_label_roberta", "sentiment_score_roberta", "sentiment_num_roberta"
                )
                VALUES (:cid, :fb, :has_fb, :label, :score, :num)
                ON CONFLICT ("customerID") 
                DO UPDATE SET 
                    "CustomerFeedback" = EXCLUDED."CustomerFeedback",
                    "HasFeedback" = EXCLUDED."HasFeedback",
                    "sentiment_label_roberta" = EXCLUDED."sentiment_label_roberta",
                    "sentiment_score_roberta" = EXCLUDED."sentiment_score_roberta",
                    "sentiment_num_roberta" = EXCLUDED."sentiment_num_roberta"
            """)
            conn.execute(save_fb_query, {
                "cid": customer_id.lower(),
                "fb": feedback_text,
                "has_fb": has_feedback,
                "label": label,
                "score": score,
                "num": num
            })

            select_query = text("""
                SELECT i.*, f.* FROM customers_info i 
                JOIN customer_feedback f ON UPPER(i."CustomerID") = UPPER(f."customerID")
                WHERE UPPER(i."CustomerID") = :cid
            """)
            df_customer = pd.read_sql(select_query, conn, params={"cid": customer_id.upper()})
            
            new_proba = CHURN_PIPELINE.predict_proba(df_customer)
            new_churn_score = int(new_proba[0][1] * 100)
            
            conn.execute(
                text('UPDATE customers_info SET "Churn Score" = :s WHERE UPPER("CustomerID") = :cid'),
                {"s": new_churn_score, "cid": customer_id.upper()}
            )
            
            conn.commit()

        return {
            "message": "Success", 
            "new_churn_score": new_churn_score,
            "sentiment": {"label": label, "score": score}
        }

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/api/customers/{customer_id}/recommendation")
def get_ai_recommendation(customer_id: str):
    features_df = get_customer_explanation(customer_id)
    if features_df is None:
        return {"recommendation": "Customer not found.", "top_influencing_factors": []}
    
    engine = get_engine()
    feedback_query = text('SELECT "CustomerFeedback" FROM customer_feedback WHERE UPPER("customerID") = :cid')
    
    customer_feedback = ""
    with engine.connect() as conn:
        result = conn.execute(feedback_query, {"cid": customer_id.upper()}).fetchone()
        if result and result[0]:
            customer_feedback = str(result[0]).strip()

    shap_input = features_df.to_string(index=False)
    feedback_context = ""
    if customer_feedback and customer_feedback.lower() not in ["none", "nan", ""]:
        feedback_context = f"\nADDITIONAL ADMIN FEEDBACK (HUMAN CONTEXT): '{customer_feedback}'"

    try:
        chat_completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": """You are a Decision Engine. Output your decision in JSON format.
                    
                    CATEGORIES:
                    1. 'Category 1: Customer Outreach — Priority contact for dissatisfied customers.'
                    2. 'Category 2: Contract Upgrade — Incentivized offers for non-two-year contracts.'
                    3. 'Category 3: Service Bundling — Discounted bundles for missing add-ons.'
                    4. 'Category 4: Family & Household Plan — Multi-line offers for customers with dependents.'
                    5. 'Category 5: Pricing & Billing Intervention — Plan right-sizing for high charges.'

                    STRICT JSON FORMAT:
                    {
                        "category": "The full category string selected above",
                        "reason": "A brief 1-sentence explanation why this was chosen based on SHAP or feedback."
                    }"""
                },
                {
                    "role": "user",
                    "content": f"DATA INPUTS:\nSHAP VALUES:\n{shap_input}{feedback_context}\n\nDecision:"
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.2
        )

        import json
        ai_response = json.loads(chat_completion.choices[0].message.content)
        
        return {
            "recommendation": ai_response.get("category"),
            "reason": ai_response.get("reason"),
            "top_influencing_factors": features_df.to_dict(orient='records')
        }
    except Exception as e:
        return {"recommendation": "AI Error", "reason": str(e), "top_influencing_factors": []}

@app.get("/api/generate-customer")
def generate_customer():
    try:
        num_to_generate = 1
        synthetic_data = SDV_SYNTHESIZER.sample(num_rows=num_to_generate)
        customer_id = generate_unique_ids(num_to_generate)[0]
        synthetic_data['CustomerID'] = customer_id
        
        cols_for_feedback = [
            'CustomerFeedback', 'HasFeedback', 
            'sentiment_label_roberta', 'sentiment_score_roberta', 'sentiment_num_roberta'
        ]
        df_customers_info = synthetic_data.drop(columns=[c for c in cols_for_feedback if c in synthetic_data.columns], errors='ignore')

        df_customer_feedback = pd.DataFrame([{
            'customerID': customer_id.lower(),
            'CustomerFeedback': '',
            'HasFeedback': 'FALSE',
            'sentiment_label_roberta': '',
            'sentiment_score_roberta': 0.0,
            'sentiment_num_roberta': 3.0
        }])

        engine = get_engine()
        with engine.connect() as conn:
            df_customers_info.to_sql('customers_info', con=conn, if_exists='append', index=False)
            df_customer_feedback.to_sql('customer_feedback', con=conn, if_exists='append', index=False)
            conn.commit()
        
        display_dict = synthetic_data.to_dict(orient='records')[0]
        display_dict.update(df_customer_feedback.to_dict(orient='records')[0])
        return display_dict
    except Exception as e:
        print(f"Database Error: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})

# ==================== Prediction Endpoints ====================
@app.post("/api/predict-bulk-churn")
def predict_bulk_churn():
    try:
        engine = get_engine()
        query = text("""
            SELECT 
                i.*, 
                f."CustomerFeedback", 
                f."HasFeedback",
                f."sentiment_label_roberta", 
                f."sentiment_score_roberta", 
                f."sentiment_num_roberta"
            FROM public.customers_info i
            LEFT JOIN public.customer_feedback f ON UPPER(i."CustomerID") = UPPER(f."customerID")
            WHERE i."Churn Score" IS NULL
        """)
        
        with engine.connect() as conn:
            df_to_predict = pd.read_sql(query, conn)
        
        if df_to_predict.empty:
            return {"message": "Every customers have churn score!"}
        
        df_to_predict['Total Charges'] = pd.to_numeric(df_to_predict['Total Charges'], errors='coerce')
        df_to_predict['Total Charges'] = df_to_predict['Total Charges'].fillna(0).astype(float)
        df_to_predict['CustomerID'] = df_to_predict['CustomerID'].astype(str).str.upper().str.strip()
        df_to_predict['HasFeedback'] = df_to_predict['HasFeedback'].fillna('FALSE').astype(str)
        df_to_predict['sentiment_num_roberta'] = df_to_predict['sentiment_num_roberta'].fillna(3.0)
        df_to_predict['sentiment_score_roberta'] = df_to_predict['sentiment_score_roberta'].fillna(0.0)
        df_to_predict['CustomerFeedback'] = df_to_predict['CustomerFeedback'].fillna('')

        probs = CHURN_PIPELINE.predict_proba(df_to_predict)
        df_to_predict['Churn Score'] = np.round(probs[:, 1] * 100, 0).astype(int)

        with engine.connect() as conn:
            for _, row in df_to_predict.iterrows():
                update_sql = text("""
                    UPDATE public.customers_info 
                    SET "Churn Score" = :score 
                    WHERE UPPER("CustomerID") = :cid
                """)
                conn.execute(update_sql, {"score": int(row['Churn Score']), "cid": row['CustomerID']})
            conn.commit()

        return {"message": f"Updated Churn Score for {len(df_to_predict)} customers."}

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# ==================== Chat Endpoints ====================
@app.post("/api/chat")
async def chat_with_ai(payload: dict):
    try:
        messages = payload.get("messages", [])
        system_instructions = {
            'role':'system',
            'content':
        """
        You are 'RetainSpot AI'. Your goal is to provide information in a BEAUTIFUL and READABLE way.

        IMPORTANT UI RULES:
        1. USE EMOJIS to start each point.
        2. ALWAYS add a blank line between every single bullet point.
        3. DO NOT Use **Bold** for technical terms.
        4. Keep each bullet point short and punchy.

        YOUR KNOWLEDGE BASE (FAQ):
        - Churn Prediction: Real-time risk scoring (0-100%) using a Random Forest model.
        - Sentiment Analysis: Understanding customer emotions via the RoBERTa model.
        - Data Simulation: Generating realistic samples with SDV (Synthetic Data Vault).
        - AI Recommendations: Personalized retention suggestions based on customer behavior.
        - Tech Stack: Built with React, FastAPI, PostgreSQL, and Scikit-learn.
        - Performance: Our model achieves 96.7% Accuracy and 0.95 ROC AUC.
        
        STRICT OPERATING RULES:
        - ONLY answer about RetainSpot or Churn.
        - For unrelated topics, say: "I'm sorry, I specialize in RetainSpot and Customer Retention. How can I help with those?"
        - Respond in the language used by the user.
        """}
        
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[system_instructions] + messages,
            temperature=0.7,
        )
        
        return {"content": completion.choices[0].message.content}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# ==================== Supervisor & Worker Endpoints ====================
@app.post("/api/supervisor")
async def supervisor_node(request: ChatRequest):
    actual_fields = get_actual_columns("customers_info")
    user_message = request.query
    chat_history_data = request.history or []
    formatted_history = [{"role": m.role, "content": m.content} for m in chat_history_data]
    
    system_prompt = f"""
    You are the "Master AI Supervisor" for a Customer Database Management System (PostgreSQL).
    Your role is to orchestrate specialized sub-agents based on user requests.

    AGENT REGISTRY:
    - Agent 1 (Update Agent): For modifying existing customer records.
    - Agent 2 (Delete Agent): For removing customer records.
    - Agent 3 (Create Agent): For adding new customers.
    - Agent 4 (Feedback Agent): For recording customer feedback.
    - Agent 5 (Summarizer Agent): For churn analysis, reports, and behavior summary.

    AVAILABLE COLUMNS IN DATABASE:
    {actual_fields}

    AGENT-SPECIFIC RULES:
    1. Agent 1 (Update): 'field' MUST match EXACTLY a column name from the list above (case-sensitive). If user says 'referrals', use 'Number of Referrals'.
    2. Agent 4 (Feedback): Put the FULL feedback text into 'value' and the customer ID into 'target_id'.
    3. Agent 5 (Summarize): Use this if user wants a summary, analysis, or report on a specific customer ID.
    
    MEMORY & CONTEXT RULES:
    1. Look at the 'CHAT HISTORY' below to find the most recent Customer ID if the user doesn't provide one in the current message.
    2. If a new ID is mentioned, switch to that new ID for all subsequent actions.
    
    TASK:
    1. Identify the Agent ID based on user intent.
    2. Extract 'target_id' (CustomerID), 'field' (must match the column list above), and 'value' (the data to update or the feedback text).
    3. Set 'is_confirm_required' to TRUE for Agents 1, 2, 3, 4. Set to FALSE for Agent 5.
    4. Respond ONLY in valid JSON format.

    JSON SCHEMA:
    {{
    "agent_id": integer,
    "intent": "string",
    "entities": {{
        "target_id": "string or null",
        "field": "string or null",
        "value": "any or null"
    }},
    "confidence_score": float,
    "is_confirm_required": boolean,
    "supervisor_message": "Professional confirmation message in English."
    }}

    Example Update: "Update city for user 123 to London" -> {{"agent_id": 1, "entities": {{"field": "City", "target_id": "123", "value": "London"}}, "is_confirm_required": true}}
    Example Summarize: "Tell me about customer 555" -> {{"agent_id": 5, "entities": {{"target_id": "555", "field": null, "value": null}}, "is_confirm_required": false}}
    """
    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            *formatted_history,
            {"role": "user", "content": user_message}
        ],
        response_format={"type": "json_object"}
    )
    
    return response.choices[0].message.content

@app.post("/api/worker/update")
async def update_agent_node(supervisor_output: dict):
    entities = supervisor_output.get("entities")
    target_id = entities.get("target_id")
    db_column = entities.get("field") 
    new_value = entities.get("value")
    
    print(f"DEBUG UPDATE: ID={target_id}, Field={db_column}, Val={new_value}")

    if not target_id or not db_column:
        raise HTTPException(status_code=400, detail="Missing Target ID or Field name.")

    try:
        with get_engine().connect() as connection:
            check_query = text('SELECT * FROM customers_info WHERE "CustomerID" = :tid')
            result = connection.execute(check_query, {"tid": target_id}).fetchone()

            if not result:
                raise HTTPException(status_code=404, detail=f"Customer ID {target_id} not found.")
            
            update_sql = f'UPDATE customers_info SET "{db_column}" = :val WHERE "CustomerID" = :tid'
            connection.execute(text(update_sql), {"val": new_value, "tid": target_id})
            connection.commit() 
        
        return {
            "status": "success",
            "agent_response": f"Successfully updated [{db_column}] to '{new_value}' for Customer {target_id}.",
            "target_id": target_id
        }

    except Exception as e:
        print(f"Database Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/worker/delete")
async def delete_agent_node(supervisor_output: dict):
    entities = supervisor_output.get("entities")
    target_id = entities.get("target_id")

    if not target_id:
        raise HTTPException(status_code=400, detail="Customer ID is required for deletion.")

    try:
        with get_engine().connect() as connection:
            check_query = text('SELECT * FROM customers_info WHERE "CustomerID" = :tid')
            result = connection.execute(check_query, {"tid": target_id}).fetchone()

            if not result:
                raise HTTPException(status_code=404, detail=f"Customer ID {target_id} not found.")

            delete_fb_sql = text('DELETE FROM customer_feedback WHERE UPPER("customerID") = UPPER(:tid)')
            connection.execute(delete_fb_sql, {"tid": target_id})

            delete_info_sql = text('DELETE FROM customers_info WHERE "CustomerID" = :tid')
            connection.execute(delete_info_sql, {"tid": target_id})
            connection.commit() 

        return {
            "status": "success",
            "agent_response": f"Successfully removed Customer {target_id} and all associated feedback records from the database.",
            "target_id": target_id
        }

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print(f"Database Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/worker/create")
async def create_agent_node(supervisor_output: dict):
    try:
        new_customer_data = generate_customer()
        
        if isinstance(new_customer_data, JSONResponse) and new_customer_data.status_code == 500:
            return new_customer_data

        customer_id = new_customer_data.get('CustomerID')
        gender = new_customer_data.get('Gender')
        city = new_customer_data.get('City')

        return {
            "status": "success",
            "agent_response": f"Successfully synthesized a new customer profile. ID: {customer_id}. Data has been appended to PostgreSQL.",
            "customer_details": new_customer_data
        }

    except Exception as e:
        print(f"Create Agent Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/worker/feedback")
async def feedback_agent_node(supervisor_output: dict):
    entities = supervisor_output.get("entities")
    customer_id = entities.get("target_id")
    feedback_text = (
        entities.get("value") or 
        entities.get("feedback") or 
        entities.get("content") or 
        entities.get("text")
    )
    
    print(f"ID: {customer_id}")
    print(f"Content: {feedback_text}")
    
    if not customer_id or not feedback_text:
        raise HTTPException(status_code=400, detail="AI Supervisor could not find the feedback text in your message.")
    
    try:
        clean_id = customer_id.strip().lower()
        result = save_customer_feedback(clean_id, {"feedback": feedback_text})
        
        if isinstance(result, JSONResponse) and result.status_code == 500:
            return result
        
        sentiment_label = result["sentiment"]["label"]
        new_score = result["new_churn_score"]
        
        return {
            "status": "success",
            "agent_response": (
                f"Feedback recorded for Customer {customer_id}.\n"
                f"Analysis: Sentiment is {sentiment_label.upper()}.\n"
                f"System Update: New Churn Score recalculated to {new_score}%."
            ),
            "details": result
        }
    except Exception as e:
        print(f"Feedback Agent Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/worker/summarize")
async def summarizer_agent_node(supervisor_output: dict):
    entities = supervisor_output.get("entities", {})
    target_id = entities.get("target_id")

    try:
        with get_engine().connect() as connection:
            query = text("""
                SELECT i.*, f."CustomerFeedback", f."sentiment_label_roberta"
                FROM customers_info i
                LEFT JOIN customer_feedback f ON UPPER(i."CustomerID") = UPPER(f."customerID")
                WHERE UPPER(i."CustomerID") = UPPER(:tid)
            """)
            res = connection.execute(query, {"tid": target_id}).fetchone()

            if not res:
                raise HTTPException(status_code=404, detail="Customer not found.")

            data = dict(res._mapping)
            
            has_actual_fb = data.get("CustomerFeedback") and data.get("CustomerFeedback").strip() != ""
            fb_status = data.get("CustomerFeedback") if has_actual_fb else "No feedback submitted yet."
            sentiment = data.get("sentiment_label_roberta") if has_actual_fb else "N/A"

            data_context = (
                f"Customer {target_id} is in {data.get('City')}, using {data.get('Contract')} contract. "
                f"Monthly bill is ${data.get('Monthly Charges')}. Churn Risk Score: {data.get('Churn Score')}%. "
                f"Feedback Status: {fb_status}. Sentiment: {sentiment}."
            )

            if has_actual_fb:
                prompt = f"Summarize this customer's profile and their specific feedback: {data_context}"
            else:
                prompt = f"This customer has no feedback. Summarize their risk based ONLY on their billing and contract: {data_context}"

            llm_res = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": "You are a senior CRM analyst."},
                    {"role": "user", "content": prompt}
                ]
            )
            
            clean_report = re.sub(r'\*\*', '', llm_res.choices[0].message.content.strip())
            
            return {
                "status": "success",
                "agent_response": f"\n{clean_report}",
                "has_feedback": has_actual_fb
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== Run the App ====================
if __name__ == "__main__":
    print("Starting merged Customer Analytics & CRM API...")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True
    )
