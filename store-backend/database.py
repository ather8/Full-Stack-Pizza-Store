from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

# Main engine — full privileges
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autocommit=False , autoflush=False)

# Read-only engine — LLM queries only
LLM_DATABASE_URL = os.getenv("LLM_DATABASE_URL")
llm_engine = create_engine(LLM_DATABASE_URL)
LLMSessionLocal = sessionmaker(bind=llm_engine)

Base = declarative_base()