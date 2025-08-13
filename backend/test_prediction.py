import sys
import os
import pandas as pd
from ml_models.predict_growth import GrowthPredictor

def main():
    # Initialize the predictor (this will load the model and data)
    print("Initializing GrowthPredictor...")
    predictor = GrowthPredictor()
    
    # Test case
    test_case = {
        'age_months': 24,
        'gender': 'male',
        'height_cm': 85.0,
        'weight_kg': 12.0
    }
    
    print(f"\nTesting prediction with: {test_case}")
    
    try:
        # Get prediction
        prediction = predictor.predict(
            age_months=test_case['age_months'],
            gender=test_case['gender'],
            height_cm=test_case['height_cm'],
            weight_kg=test_case['weight_kg'],
            include_chart_data=True
        )
        
        # Print results
        print("\nPrediction successful!")
        print(f"Predicted height: {prediction['predicted_height']} cm")
        print(f"Predicted weight: {prediction['predicted_weight']} kg")
        print(f"Height z-score: {prediction['height_z_score']} ({prediction['height_status']})")
        print(f"Weight z-score: {prediction['weight_z_score']} ({prediction['weight_status']})")
        
        if 'chart_data' in prediction:
            print(f"\nChart data available for {len(prediction['chart_data'])} age points")
            print(f"Example chart data point: {prediction['chart_data'][0]}")
        
        return 0
        
    except Exception as e:
        print(f"\nError during prediction: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
