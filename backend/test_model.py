import sys
import os
import traceback
from pathlib import Path
import pandas as pd
import numpy as np

# Add the parent directory to the path so we can import the api module
sys.path.append(str(Path(__file__).parent))

from api.utils import get_growth_risk_model, predict_growth_risk, load_growth_data, prepare_features
from api.zscore_calculator import ZScoreCalculator

def test_model():
    print("Testing growth risk prediction model...")
    
    # First, let's check the training data
    print("\nLoading training data...")
    try:
        data = load_growth_data()
        print(f"Loaded {len(data)} samples from training data")
        print("\nSample of training data:")
        print(data[['age_months', 'gender', 'weight_kg', 'height_cm', 'risk_status']].head())
        
        # Check class distribution
        print("\nClass distribution in training data:")
        print(data['risk_status'].value_counts())
        
        # Check feature preparation
        print("\nPreparing features...")
        X, y, le_status = prepare_features(data)
        print(f"Prepared features with shape: {X.shape}")
        print(f"Number of classes: {len(le_status.classes_)}")
        print("Classes:", le_status.classes_)
        
    except Exception as e:
        print(f"Error loading training data: {str(e)}")
        traceback.print_exc()
    
    # Test cases with different age, gender, height, and weight combinations
    test_cases = [
        {"age_months": 24, "gender": "male", "height_cm": 85, "weight_kg": 12.5},  # Normal
        {"age_months": 12, "gender": "female", "height_cm": 70, "weight_kg": 8},  # Underweight
        {"age_months": 36, "gender": "male", "height_cm": 92, "weight_kg": 18},   # Overweight
        {"age_months": 6, "gender": "female", "height_cm": 62, "weight_kg": 5.5}, # Normal
        {"age_months": 48, "gender": "male", "height_cm": 98, "weight_kg": 14},   # Stunted
    ]
    
    # This will load or train the model
    print("\nLoading model...")
    try:
        model = get_growth_risk_model()
        print("Model loaded successfully")
    except Exception as e:
        print(f"Error loading model: {str(e)}")
        traceback.print_exc()
        return
    
    print("\nTest Predictions:")
    print("-" * 80)
    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest Case {i}: {test_case}")
        print("-" * 80)
        
        # Calculate z-scores for debugging
        try:
            z_calc = ZScoreCalculator()
            z_weight = z_calc.calculate_weight_z_score(
                test_case['weight_kg'], 
                test_case['age_months'], 
                test_case['gender']
            )
            z_height = z_calc.calculate_height_z_score(
                test_case['height_cm'],
                test_case['age_months'],
                test_case['gender']
            )
            print(f"Calculated z-scores - Weight: {z_weight:.2f}, Height: {z_height:.2f}")
        except Exception as e:
            print(f"Warning: Could not calculate z-scores: {str(e)}")
        
        # Make prediction
        try:
            result = predict_growth_risk(**test_case)
            print(f"Prediction: {result.get('risk_status', 'N/A')}")
            print(f"Confidence: {result.get('confidence', 0):.2f}")
            print(f"Details: {result.get('details', 'No details')}")
            
            # Print feature vector for debugging
            if 'feature_vector' in result:
                print("\nFeature vector:")
                for name, value in result['feature_vector'].items():
                    print(f"  {name}: {value}")
                    
        except Exception as e:
            print(f"Error in prediction: {str(e)}")
            traceback.print_exc()
        
        print("-" * 80)

if __name__ == "__main__":
    test_model()
