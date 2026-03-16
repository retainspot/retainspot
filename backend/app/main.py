# app.py
from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from database.database_utils import get_engine
from sqlalchemy import text
import uvicorn
# backend/app.py
import sys
import os

root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if root_path not in sys.path:
    sys.path.append(root_path)

from ml.pipeline import predict_sentiment
app = FastAPI()

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

# app.py
# app.py
from fastapi.responses import JSONResponse
@app.post("/api/customers/{customer_id}/feedback")
def save_customer_feedback(customer_id: str, payload: dict = Body(...)):
    try:
        engine = get_engine()
        feedback_text = payload.get("feedback")
        
        # Chạy AI
        label, score, num = predict_sentiment(feedback_text)
        
        # SỬA LỖI: Chuyển từ 1/0 sang True/False để khớp với kiểu boolean của DB
        has_feedback = True if feedback_text and feedback_text.strip() != "" else False

        with engine.connect() as conn:
            query = text("""
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
            
            conn.execute(query, {
                "cid": customer_id.lower(),
                "fb": feedback_text,
                "has_fb": has_feedback, # Bây giờ giá trị này là True hoặc False
                "label": label,
                "score": score,
                "num": num
            })
            conn.commit()
            
        return {"message": "Success", "sentiment": {"label": label, "score": score}}

    except Exception as e:
        from fastapi.responses import JSONResponse
        print(f"Lỗi thực tế: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})
    
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)