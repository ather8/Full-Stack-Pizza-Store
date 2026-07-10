import pandas as pd
import numpy as np
import pickle
from datetime import date, timedelta
import math


FEATURES = ['product_code', 'day_of_week', 'month', 'is_weekend',
            'season', 'lag_7', 'lag_14', 'rolling_mean_7']

_model = None
_name_to_code = None

def load_model(model_path='ml/models/forecast_model.pkl',
                mapping_path='ml/models/product_mapping.pkl'):
    global _model, _name_to_code
    _model = pickle.load(open(model_path, 'rb'))
    product_mapping = pickle.load(open(mapping_path, 'rb'))
    _name_to_code = {v: k for k, v in product_mapping.items()}
    print(f"[predict] Model reloaded. {len(_name_to_code)} products known.")

# Load once when the module first imports (app startup)
load_model()


def get_season(month: int) -> int:
    return {12: 0, 1: 0, 2: 0,
            3: 1, 4: 1, 5: 1,
            6: 2, 7: 2, 8: 2,
            9: 3, 10: 3, 11: 3}[month]


def forecast(product_name: str, last_14_days: list[float]) -> list[dict] | None:
    if product_name not in _name_to_code:
        return None

    today = date.today()
    prediction_dates = [today + timedelta(days=i) for i in range(1, 8)]
    predictions = []
    history = list(last_14_days)
    product_code = _name_to_code[product_name]

    for pred_date in prediction_dates:
        lag_7 = history[-7]
        lag_14 = history[-14]
        day_of_week = pred_date.weekday()
        month = pred_date.month
        # Weekend = Saturday/Sunday (day_of_week 5,6) — must match the
        # definition used in prepare_data.py's rebuild_processed_dataset,
        # since that's what the weekly retrain trains on. If these two
        # disagree, the model learns one definition of "weekend" and gets
        # fed a different one at prediction time.
        is_weekend = 1 if day_of_week >= 5 else 0
        season = get_season(month)
        rolling_mean_7 = np.mean(history[-7:])

        features = [[product_code, day_of_week, month, is_weekend, season, lag_7, lag_14, rolling_mean_7]]
        pred = _model.predict(pd.DataFrame(features, columns=FEATURES))[0]

        predictions.append({'date': str(pred_date), 'predicted_quantity': math.ceil(float(pred))})
        history.append(pred)

    return predictions