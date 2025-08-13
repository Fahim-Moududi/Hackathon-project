"""
Script to train the growth prediction model and test the prediction functionality.
"""
import os
import sys
import pandas as pd
import numpy as np
from ml_models.train_growth_predictor import train_and_save_model
from ml_models.predict_growth import GrowthPredictor

def test_prediction():
    """Test the prediction with sample data."""
    print("\nTesting prediction...")
    
    # Initialize the predictor (this will load the model)
    predictor = GrowthPredictor()
    
    # Test cases
    test_cases = [
        {"age_months": 12, "gender": "male", "height_cm": 75.0, "weight_kg": 9.5},
        {"age_months": 24, "gender": "female", "height_cm": 85.0, "weight_kg": 11.2},
        {"age_months": 36, "gender": "male", "height_cm": 95.0, "weight_kg": 14.0},
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest Case {i}:")
        print(f"Input: {test_case}")
        
        try:
            # Make prediction
            prediction = predictor.predict(**test_case)
            
            # Print results
            print("Prediction:")
            for key, value in prediction.items():
                print(f"  {key}: {value}")
                
        except Exception as e:
            print(f"Error: {str(e)}")

def main():
    """Main function to train and test the model."""
    print("Training growth prediction model...")
    train_and_save_model()
    
    # Test the prediction
    test_prediction()

if __name__ == "__main__":
    main()
