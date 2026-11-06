from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# We are using SQLite for the local prototype. 
# It creates a file called 'resume_screener.db' in your backend folder.
SQLALCHEMY_DATABASE_URL = "sqlite:///./resume_screener.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()