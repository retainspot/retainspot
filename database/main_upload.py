# main_upload.py
import pandas as pd
from database_utils import get_engine, upload_to_sql

def main():
    engine = get_engine()
    df_customers = pd.read_csv('data/data_with_churn_score.csv')
    df_feedback = pd.read_csv('data/Customer_feedback.csv')
    
    upload_to_sql(df_customers, 'customers_info', engine)
    upload_to_sql(df_feedback, 'customer_feedback', engine)
    
    print("Successfully ! ")

if __name__ == "__main__":
    main()