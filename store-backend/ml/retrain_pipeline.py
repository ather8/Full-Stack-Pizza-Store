from ml.prepare_data import rebuild_processed_dataset
from ml.train import retrain_model
from ml.predict import load_model

def run_full_retrain():
    print("Rebuilding dataset from transactions...")
    rebuild_processed_dataset()

    print("Retraining model...")
    result = retrain_model()

    print("Reloading model into memory...")
    load_model()

    print(f"Done. {result}")
    return result