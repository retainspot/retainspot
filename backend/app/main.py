from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
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
root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if root_path not in sys.path:
    sys.path.append(root_path)

app = FastAPI()

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

CHURN_PIPELINE = joblib.load("ml/models/churn_pipeline.pkl")
SDV_SYNTHESIZER = joblib.load("ml/models/gc_synthesizer.pkl")

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

def generate_unique_ids(n):
    ids = set()
    while len(ids) < n:
        digits  = ''.join(random.choices(string.digits, k=4))
        letters = ''.join(random.choices(string.ascii_uppercase, k=5))
        ids.add(f"{digits}-{letters}")
    return list(ids)

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

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

from fastapi.responses import JSONResponse
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
    
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)