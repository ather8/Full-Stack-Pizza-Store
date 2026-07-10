# PizzaStore — Full-Stack Restaurant Management System

A production-style restaurant management platform built with FastAPI, React, PostgreSQL, and two AI layers: a demand forecasting model and a natural language query interface.

## Live Demo

- **Frontend:** https://pizza-store-frontend-iota.vercel.app
- **Backend API:** https://pizza-store-production.up.railway.app/docs

**Demo credentials:**

| Role    | Email               | Password   |
| ------- | ------------------- | ---------- |
| Admin   | admin@admin.com     | admin123   |
| Manager | manager@manager.com | manager123 |
| Cashier | cashier@cashier.com | cashier123 |

## Features

**Backend**

- JWT authentication with bcrypt password hashing
- Role-based access control (Admin, Manager, Cashier), enforced per-endpoint via FastAPI dependencies
- Bootstrap-aware user creation — the first user in an empty database is created without a token and force-assigned Admin; every user after that requires an existing Admin's token
- Full CRUD for users, products, and transactions, split into resource routers (`routers/users.py`, `routers/products.py`, `routers/transactions.py`)
- Inventory tracking with automatic stock deduction
- Atomic bulk checkout (`POST /transactions/bulk`) — a multi-item cart is validated and committed as one all-or-nothing operation, so a mid-cart stock failure can't leave earlier lines charged
- Price and product snapshots on transactions for auditability
- Weekly automatic model retraining via APScheduler (Sundays at 3am), rebuilding the training dataset from live transactions and reloading the model in place

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
- Role-aware UI — navigation, default landing page, and route access all adapt per user role, matching the backend's permission rules
- Route guards (`RoleRoute`) so a restricted page can't be reached by URL even if it's hidden from the sidebar
- JWT auth context with protected routes
- Responsive down to mobile — collapsible drawer navigation, stacked layouts, and scrollable tables below the `md` breakpoint
- Pages: Dashboard, New Order (POS), Products, Transactions, Demand Forecast, AI Query, User Management

## Tech Stack

| Layer      | Technology                            |
| ---------- | ------------------------------------- |
| Backend    | FastAPI, Python, SQLAlchemy           |
| Database   | PostgreSQL                            |
| Auth       | JWT, bcrypt, OAuth2                   |
| Scheduling | APScheduler (weekly model retrain)    |
| ML         | XGBoost, Scikit-learn, Pandas         |
| LLM        | Google Gemini API                     |
| Frontend   | React, TypeScript, Tailwind CSS, Vite |
| DevOps     | Docker, Docker Compose                |

## Architecture

```
PizzaStore/
├── store-backend/
│   ├── main.py             # App setup, CORS, retrain scheduler, /query endpoint
│   ├── model.py            # SQLAlchemy models
│   ├── schema.py           # Pydantic schemas
│   ├── auth.py             # JWT, password hashing, role enforcement, bootstrap logic
│   ├── database.py         # DB session dependencies (main + read-only)
│   ├── routers/
│   │   ├── users.py        # User CRUD, /login, /me
│   │   ├── products.py     # Product CRUD
│   │   └── transactions.py # Transaction CRUD, /transactions/bulk, /forecast
│   └── ml/
│       ├── prepare_data.py     # Feature engineering pipeline
│       ├── train.py            # Model training with hyperparameter search
│       ├── predict.py          # 7-day recursive forecasting
│       ├── retrain_pipeline.py # Rebuilds dataset + retrains + reloads model
│       ├── llm_query.py        # Intent classification + SQL templates
│       └── seed_transactions.py  # Dev data seeding script
└── store-frontend/
    └── src/
        ├── pages/           # DashboardPage, OrderPage, ProductsPage,
        │                    # TransactionsPage, ForecastPage, QueryPage, UsersPage
        ├── components/
        │   ├── layout/      # Layout (mobile top bar + drawer state), Sidebar
        │   └── auth/        # RoleRoute — blocks a restricted page even by direct URL
        ├── lib/roles.ts     # Single source of truth mapping routes to allowed roles
        ├── api/             # Typed API client functions
        ├── context/         # AuthContext with role management
        └── types/           # TypeScript interfaces
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
- User creation is bootstrap-aware: an empty database allows one unauthenticated request that is force-assigned Admin; every subsequent user creation requires an existing Admin's token
- Frontend route guards (`RoleRoute`) mirror the backend's role rules, so a page a user's role can't access isn't reachable even by typing the URL directly
- Bulk checkout is atomic — a multi-item order is validated against current stock before anything is written, so a failure partway through never leaves earlier items already charged
- LLM queries execute against a read-only PostgreSQL user — destructive SQL is impossible at the database level
- Template-based SQL generation — user input never touches SQL strings directly

## Author

Ather Sayed — [LinkedIn](https://www.linkedin.com/in/ather-sayed/) | [GitHub](https://github.com/ather-sayed)
