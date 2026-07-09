# ml/train.py
import pandas as pd
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.metrics import mean_absolute_error
import pickle

FEATURES = ['product_code', 'day_of_week', 'month', 'is_weekend',
            'season', 'lag_7', 'lag_14', 'rolling_mean_7']
TARGET = 'quantity_sold'

def retrain_model(data_path='ml/data/processed.csv',
                   model_path='ml/models/forecast_model.pkl',
                   mapping_path='ml/models/product_mapping.pkl'):

    df = pd.read_csv(data_path)
    df['product_code'] = pd.Categorical(df['product_name']).codes

    X = df[FEATURES]
    y = df[TARGET]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)

    param_grid = {
        'n_estimators': [100, 200, 300, 500],
        'learning_rate': [0.01, 0.05, 0.1, 0.2],
        'max_depth': [3, 4, 5, 6, 7],
        'subsample': [0.7, 0.8, 0.9, 1.0],
        'colsample_bytree': [0.7, 0.8, 0.9, 1.0],
    }
    search = RandomizedSearchCV(
        XGBRegressor(random_state=42), param_grid, n_iter=50, cv=3,
        scoring='neg_mean_absolute_error', random_state=42, n_jobs=-1
    )
    search.fit(X_train, y_train)

    model = search.best_estimator_
    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    print(f"Retrained. MAE: {mae:.2f}")

    pickle.dump(model, open(model_path, 'wb'))
    product_mapping = dict(enumerate(pd.Categorical(df['product_name']).categories))
    pickle.dump(product_mapping, open(mapping_path, 'wb'))

    return {"mae": mae, "n_products": len(product_mapping)}