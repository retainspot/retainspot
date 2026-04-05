from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
import asyncpg
import logging
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== Database Configuration ====================
DB_CONFIG = {
    "host": "shortline.proxy.rlwy.net",
    "port": 34425,
    "user": "postgres",
    "password": "qIQZrgwGDJvkjejkgPPHyNObPlEVEeOZ",
    "database": "railway",
    "ssl": "require"  # Equivalent to rejectUnauthorized: false
}

# ==================== Pydantic Models ====================
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
    title="Customer Analytics API",
    description="API for customer dashboard analytics",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (like your Express app)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== Root Endpoint ====================
@app.get("/")
async def root():
    return {"message": "API Running"}

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

        # 4. Sentiment query (case-sensitive as in your original)
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

        # Convert to list of dicts
        sentiment_rows = [dict(row) for row in sentiment]

        # If no sentiment data found, add default empty values
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

        # Debug logging
        logger.info(f"Sentiment data: {sentiment_rows}")
        logger.info(f"Total customers: {totalCustomers}")

        # Return formatted response
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
        raise HTTPException(
            status_code=500,
            detail=f"Server Error: {str(err)}"
        )

# ==================== Run the App ====================
if __name__ == "__main__":
    print("Inside main block, starting uvicorn...")
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=5000,  # Same port as your Express app
        reload=True  # Auto-reload on code changes
    )