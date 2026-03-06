# database_utils.py
from sqlalchemy import create_engine
from config import DATABASE_URL

def get_engine():
    return create_engine(DATABASE_URL)

def upload_to_sql(df, table_name, engine):
    df.to_sql(table_name, engine, if_exists='replace', index=False)