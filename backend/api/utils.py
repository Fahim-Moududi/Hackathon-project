import pandas as pd
from sklearn.ensemble import IsolationForest


WHO_DATA = {
    'male': {12: {'weight_median': 9.5, 'weight_sd': 1.0, 'height_median': 75, 'height_sd': 2.5}}
}

def calculate_z_score(value, median, sd):
    return (value - median) / sd

def classify_growth(z_weight, z_height):
    if z_weight < -2 or z_height < -2:
        return "Underweight/Stunted"
    elif z_weight > 2 or z_height > 2:
        return "Overweight/Obese"
    else:
        return "Normal"

def detect_anomalies(records):
    df = pd.DataFrame(records)
    if df.empty:
        return []
    model = IsolationForest(contamination=0.1, random_state=42)
    df['anomaly'] = model.fit_predict(df[['weight_kg','height_cm']])
    return df['anomaly'].tolist()
