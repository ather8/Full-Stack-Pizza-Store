# PizzaStore — Full-Stack Restaurant Management System

A production-style restaurant management platform built with FastAPI, React, PostgreSQL, and two AI layers: a demand forecasting model and a natural language query interface.

## Live Demo

- **Frontend:** https://pizza-store-frontend-iota.vercel.app
- **Backend API:** https://pizza-store-production.up.railway.app/docs

**Demo credentials:**

- Email: `demo@demo.com`
- Password: `12345678`

## Features

**Backend**

- JWT authentication with bcrypt password hashing
- Role-based access control (Admin, Manager, Cashier)
- Full CRUD for users, products, and transactions
- Inventory tracking with automatic stock deduction
- Price and product snapshots on transactions for auditability

**Machine Learning**

- XGBoost demand forecasting model trained on 48,000 real restaurant orders
- Hyperparameter tuning with RandomizedSearchCV (MAE: 1.74 units)
- Feature engineering with lag features and rolling averages
- 7-day recursive multi-step forecasting endpoint

**LLM Integration**

- Natural language query interface powered by Google Gemini
- Template-based intent classification — Gemini classifies intent, pre-written SQL executes
- Read-only PostgreSQL user as database-level security layer
- Three independent security layers: role enforcement, keyword validation, DB permissions

**Frontend**

- React + TypeScript + Tailwind CSS
- Role-aware UI — navigation and features adapt per user role
- JWT auth context with protected routes
- Pages: Products, Transactions, Demand Forecast, AI Query, User Management

## Tech Stack

| Layer    | Technology                            |
| -------- | ------------------------------------- |
| Backend  | FastAPI, Python, SQLAlchemy           |
| Database | PostgreSQL                            |
| Auth     | JWT, bcrypt, OAuth2                   |
| ML       | XGBoost, Scikit-learn, Pandas         |
| LLM      | Google Gemini API                     |
| Frontend | React, TypeScript, Tailwind CSS, Vite |
| DevOps   | Docker, Docker Compose                |

## Architecture

```
store/
├── store-backend/
│   ├── main.py          # FastAPI app, routes
│   ├── model.py         # SQLAlchemy models
│   ├── schema.py        # Pydantic schemas
│   ├── auth.py          # JWT, password hashing, role enforcement
│   ├── database.py      # DB connections (main + read-only)
│   └── ml/
│       ├── prepare_data.py    # Feature engineering pipeline
│       ├── train.py           # Model training with hyperparameter search
│       ├── predict.py         # 7-day recursive forecasting
│       ├── llm_query.py       # Intent classification + SQL templates
│       └── seed_transactions.py  # Dev data seeding script
└── store-frontend/
    └── src/
        ├── pages/       # LoginPage, ProductsPage, TransactionsPage,
        │                # ForecastPage, QueryPage, UsersPage
        ├── components/  # Navbar
        ├── api/         # Typed API client functions
        ├── context/     # AuthContext with role management
        └── types/       # TypeScript interfaces
```

## Setup

**Backend:**

```bash
cd store-backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
# Create .env with DATABASE_URL, LLM_DATABASE_URL, GEMINI_API_KEY, SECRET_KEY
uvicorn main:app --reload
```

**Frontend:**

```bash
cd store-frontend
npm install
# Update src/api/client.ts with your backend URL
npm run dev
```

**ML Pipeline:**

```bash
# Train the forecasting model
python ml/train.py

# Seed development data
python -m ml.seed_transactions
```

## API Documentation

FastAPI auto-generates interactive API docs at `http://localhost:8000/docs`

## Security Design

- Passwords hashed with bcrypt, never stored in plain text
- JWT tokens expire after 30 minutes
- Role enforcement via FastAPI dependency injection on every protected endpoint
- LLM queries execute against a read-only PostgreSQL user — destructive SQL is impossible at the database level
- Template-based SQL generation — user input never touches SQL strings directly

## Author

Ather Sayed — [LinkedIn](https://www.linkedin.com/in/ather-sayed/) | [GitHub](https://github.com/ather-sayed)
