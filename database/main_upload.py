# main_upload.py
import pandas as pd
from database_utils import get_engine, upload_to_sql

def main():
    engine = get_engine()
    df_customers = pd.read_csv('data/telco_churn_with_all_feedback.csv')
    df_behavior = pd.read_csv('data/data_with_churn_score.csv')
    
    upload_to_sql(df_customers, 'customers', engine)
    upload_to_sql(df_behavior, 'customer_behavior', engine)
    
    print("Successfully ! ")

if __name__ == "__main__":
    main()