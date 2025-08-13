import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib

# Constants
MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'ml_models')
MODEL_PATH = os.path.join(MODEL_DIR, 'growth_predictor.joblib')
DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'child_growth_0_60_months_synthetic.csv')

def load_and_preprocess_data():
    """Load and preprocess the growth data."""
    # Load the data
    data = pd.read_csv(DATA_PATH)
    
    # Convert gender to numerical (0 for female, 1 for male)
    data['gender_encoded'] = data['Gender'].map({'F': 0, 'M': 1})
    
    # Sort by age to ensure proper shift operations
    data = data.sort_values(['Gender', 'AgeMonths'])
    
    # Create next month's height and weight as targets
    data['next_month_height'] = data.groupby('Gender')['Height_cm'].shift(-1)
    data['next_month_weight'] = data.groupby('Gender')['Weight_kg'].shift(-1)
    
    # Drop the last month for each gender (no next month data)
    data = data.groupby('Gender').apply(lambda x: x.iloc[:-1]).reset_index(drop=True)
    
    # Features: current age, gender, height, weight
    X = data[['AgeMonths', 'gender_encoded', 'Height_cm', 'Weight_kg']]
    
    # Targets: next month's height and weight
    y = data[['next_month_height', 'next_month_weight']]
    
    return X, y, data

def train_model():
    """Train the growth prediction model."""
    # Load and preprocess data
    X, y, _ = load_and_preprocess_data()
    
    # Split into train and test sets
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Initialize and train the model
    base_model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    
    model = MultiOutputRegressor(base_model)
    model.fit(X_train, y_train)
    
    # Evaluate the model
    y_pred = model.predict(X_test)
    
    # Calculate metrics
    mse = mean_squared_error(y_test, y_pred, multioutput='raw_values')
    r2 = r2_score(y_test, y_pred, multioutput='raw_values')
    
    print("Model Evaluation:")
    print(f"Height - MSE: {mse[0]:.4f}, R²: {r2[0]:.4f}")
    print(f"Weight - MSE: {mse[1]:.4f}, R²: {r2[1]:.4f}")
    
    return model

def save_model(model):
    """Save the trained model to disk."""
    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")

def load_model():
    """Load the trained model from disk."""
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model not found at {MODEL_PATH}. Please train the model first.")
    return joblib.load(MODEL_PATH)

def train_and_save_model():
    """Train the model and save it to disk."""
    print("Training growth prediction model...")
    model = train_model()
    save_model(model)
    return model

if __name__ == "__main__":
    train_and_save_model()
