# app.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from database.database_utils import get_engine
from sqlalchemy import text

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/customers")
def get_customers():
    engine = get_engine()
    query = """
        SELECT 
            c.*, 
            b."Churn Score" AS "Churn_Score" 
        FROM customers c
        LEFT JOIN customer_behavior b ON c."customerID" = b."CustomerID"
    """ 
    df = pd.read_sql(query, engine)
    
    if 'Churn_Score' in df.columns:
        df['Churn_Score'] = df['Churn_Score'].fillna(0)
        
    return df.to_dict(orient='records')

from fastapi import Body

@app.post("/api/customers/{customer_id}/feedback")
def save_customer_feedback(customer_id: str, payload: dict = Body(...)):
    engine = get_engine()
    feedback_text = payload.get("feedback")
    
    with engine.connect() as conn:
        query = text('UPDATE customers SET "CustomerFeedback" = :fb WHERE "customerID" = :cid')
        conn.execute(query, {"fb": feedback_text, "cid": customer_id})
        conn.commit()
        
    return {"message": "Feedback saved successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)