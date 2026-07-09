# ml/prepare_data.py
import pandas as pd
from sqlalchemy.orm import Session
from database import SessionLocal  # adjust import to match your project
import model  # your SQLAlchemy models


SEASON_MAP = {12: 0, 1: 0, 2: 0,
              3: 1, 4: 1, 5: 1,
              6: 2, 7: 2, 8: 2,
              9: 3, 10: 3, 11: 3}


def rebuild_processed_dataset(output_path='ml/data/processed.csv'):
    db: Session = SessionLocal()
    try:
        # 1. Pull raw transactions
        transactions = db.query(
            model.Transaction.product_name,
            model.Transaction.quantity,
            model.Transaction.created_at
        ).all()
    finally:
        db.close()

    df = pd.DataFrame(transactions, columns=['product_name', 'quantity', 'created_at'])
    df['created_at'] = pd.to_datetime(df['created_at'])
    df['date'] = df['created_at'].dt.date

    # 2. Aggregate to daily totals per product
    daily = (
        df.groupby(['product_name', 'date'])['quantity']
        .sum()
        .reset_index()
        .rename(columns={'quantity': 'quantity_sold'})
    )

    # 3. Make sure every product has a row for every day in range (fills gaps with 0 sales)
    all_rows = []
    for product, group in daily.groupby('product_name'):
        group = group.set_index('date').sort_index()
        full_range = pd.date_range(group.index.min(), group.index.max(), freq='D')

        # reindex only the quantity_sold series, filling gaps with 0
        quantity_series = group['quantity_sold'].reindex(full_range, fill_value=0)

        rebuilt = pd.DataFrame({
            'date': full_range,
            'quantity_sold': quantity_series.values,
            'product_name': product  # same value for every row, no reindex needed
        })
        all_rows.append(rebuilt)

    daily_full = pd.concat(all_rows, ignore_index=True)
    daily_full['date'] = pd.to_datetime(daily_full['date'])

    # 4. Add calendar features
    daily_full['day_of_week'] = daily_full['date'].dt.dayofweek
    daily_full['month'] = daily_full['date'].dt.month
    daily_full['is_weekend'] = (daily_full['day_of_week'] >= 5).astype(int)
    daily_full['season'] = daily_full['month'].map(SEASON_MAP)

    # 5. Add lag + rolling features (per product, so history doesn't leak across products)
    daily_full = daily_full.sort_values(['product_name', 'date'])
    daily_full['lag_7'] = daily_full.groupby('product_name')['quantity_sold'].shift(7)
    daily_full['lag_14'] = daily_full.groupby('product_name')['quantity_sold'].shift(14)
    daily_full['rolling_mean_7'] = (
        daily_full.groupby('product_name')['quantity_sold']
        .transform(lambda s: s.shift(1).rolling(7).mean())
    )

    # 6. Drop early rows that don't have enough history for lag features yet
    daily_full = daily_full.dropna(subset=['lag_7', 'lag_14', 'rolling_mean_7'])

    daily_full.to_csv(output_path, index=False)
    print(f"Saved {len(daily_full)} rows to {output_path}, covering {daily_full['product_name'].nunique()} products.")

    return daily_full