import os
import pandas as pd
import numpy as np
from .train_growth_predictor import load_model

# Constants
DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'child_growth_0_60_months_synthetic.csv')

def load_who_standards():
    """Load WHO growth standards from the dataset."""
    # Load the data
    who_standards = pd.read_csv(DATA_PATH)
    
    # Rename columns to be consistent with the rest of the code
    who_standards = who_standards.rename(columns={
        'AgeMonths': 'AgeMonths',
        'Gender': 'Gender',
        'Height_cm': 'Height_cm',
        'Height_SD': 'Height_SD',
        'Weight_kg': 'Weight_kg',
        'Weight_SD': 'Weight_SD'
    })
    
    return who_standards

def get_status(z_score):
    """Map z-score to status category."""
    if abs(z_score) <= 2:
        return 'normal'
    elif z_score < -2:
        return 'low'
    else:
        return 'high'

class GrowthPredictor:
    def __init__(self):
        self.model = load_model()
        self.who_standards = load_who_standards()
    
    def prepare_features(self, age_months, gender, height_cm, weight_kg):
        """Prepare input features for prediction."""
        gender_encoded = 1 if gender.lower() == 'male' else 0
        return np.array([[age_months, gender_encoded, height_cm, weight_kg]])
    
    def get_who_standards(self, age_months, gender, include_chart_data=False):
        """
        Get WHO standards for the given age and gender.
        
        Args:
            age_months: Age in months
            gender: 'male' or 'female'
            include_chart_data: If True, returns additional data for growth charts
            
        Returns:
            Dictionary with mean and SD values, and optionally chart data
        """
        gender_code = 'M' if gender.lower() == 'male' else 'F'
        
        # Find the closest age in the standards
        standards = self.who_standards[
            (self.who_standards['AgeMonths'] == age_months) & 
            (self.who_standards['Gender'] == gender_code)
        ]
        
        if len(standards) == 0:
            # If no exact match, find the closest age
            all_standards = self.who_standards[self.who_standards['Gender'] == gender_code]
            closest_age = all_standards.iloc[(all_standards['AgeMonths'] - age_months).abs().argsort()[:1]]
            if len(closest_age) > 0:
                standards = closest_age
        
        if len(standards) == 0:
            raise ValueError(f"No WHO standards found for age {age_months} months and gender {gender}")
        
        # Get the first row (should be only one)
        row = standards.iloc[0]
        
        result = {
            'height_mean': float(row['Height_cm']),
            'height_sd': max(float(row['Height_SD']), 0.1),  # Avoid division by zero
            'weight_mean': float(row['Weight_kg']),
            'weight_sd': max(float(row['Weight_SD']), 0.1)   # Avoid division by zero
        }
        
        if include_chart_data:
            # Get data for growth chart (all ages for the gender)
            gender_standards = self.who_standards[self.who_standards['Gender'] == gender_code]
            
            # Calculate percentiles (mean ± 1SD, ±2SD)
            gender_standards = gender_standards.copy()
            
            # For height
            gender_standards['Height_cm_p2.3'] = gender_standards['Height_cm'] - 2 * gender_standards['Height_SD']  # -2SD (2.3rd percentile)
            gender_standards['Height_cm_p15.9'] = gender_standards['Height_cm'] - gender_standards['Height_SD']     # -1SD (15.9th percentile)
            gender_standards['Height_cm_p84.1'] = gender_standards['Height_cm'] + gender_standards['Height_SD']     # +1SD (84.1th percentile)
            gender_standards['Height_cm_p97.7'] = gender_standards['Height_cm'] + 2 * gender_standards['Height_SD']  # +2SD (97.7th percentile)
            
            # For weight
            gender_standards['Weight_kg_p2.3'] = gender_standards['Weight_kg'] - 2 * gender_standards['Weight_SD']  # -2SD (2.3rd percentile)
            gender_standards['Weight_kg_p15.9'] = gender_standards['Weight_kg'] - gender_standards['Weight_SD']     # -1SD (15.9th percentile)
            gender_standards['Weight_kg_p84.1'] = gender_standards['Weight_kg'] + gender_standards['Weight_SD']     # +1SD (84.1th percentile)
            gender_standards['Weight_kg_p97.7'] = gender_standards['Weight_kg'] + 2 * gender_standards['Weight_SD']  # +2SD (97.7th percentile)
            
            # Convert to list of dicts for JSON serialization
            chart_data = []
            for _, row in gender_standards.iterrows():
                chart_data.append({
                    'age_months': int(row['AgeMonths']),
                    'height': {
                        'p2.3': float(row['Height_cm_p2.3']),
                        'p15.9': float(row['Height_cm_p15.9']),
                        'mean': float(row['Height_cm']),
                        'p84.1': float(row['Height_cm_p84.1']),
                        'p97.7': float(row['Height_cm_p97.7'])
                    },
                    'weight': {
                        'p2.3': float(row['Weight_kg_p2.3']),
                        'p15.9': float(row['Weight_kg_p15.9']),
                        'mean': float(row['Weight_kg']),
                        'p84.1': float(row['Weight_kg_p84.1']),
                        'p97.7': float(row['Weight_kg_p97.7'])
                    }
                })
            
            result['chart_data'] = chart_data
        
        return result
    
    def predict(self, age_months, gender, height_cm, weight_kg, include_chart_data=False):
        """
        Predict next month's height and weight, and calculate z-scores.
        
        Args:
            age_months: Current age in months
            gender: 'male' or 'female'
            height_cm: Current height in cm
            weight_kg: Current weight in kg
            include_chart_data: If True, includes data for growth charts
            
        Returns:
            Dictionary with predictions, z-scores, status, and optional chart data
        """
        # Prepare input features
        X = self.prepare_features(age_months, gender, height_cm, weight_kg)
        
        # Make prediction
        predicted_height, predicted_weight = self.model.predict(X)[0]
        
        # Get WHO standards for the next month
        next_month = age_months + 1
        try:
            who_std = self.get_who_standards(next_month, gender, include_chart_data)
            
            # Calculate z-scores
            height_z = (predicted_height - who_std['height_mean']) / who_std['height_sd']
            weight_z = (predicted_weight - who_std['weight_mean']) / who_std['weight_sd']
            
            # Determine status categories
            height_status = get_status(height_z)
            weight_status = get_status(weight_z)
            
            result = {
                'predicted_height': round(float(predicted_height), 2),
                'predicted_weight': round(float(predicted_weight), 2),
                'height_z_score': round(float(height_z), 2),
                'weight_z_score': round(float(weight_z), 2),
                'height_status': height_status,
                'weight_status': weight_status,
                'next_month_age': next_month,
                'current_data': {
                    'age_months': age_months,
                    'height_cm': height_cm,
                    'weight_kg': weight_kg
                }
            }
            
            # Add chart data if requested
            if include_chart_data and 'chart_data' in who_std:
                result['chart_data'] = who_std['chart_data']
                
                # Add current data point to chart data
                result['current_point'] = {
                    'age_months': age_months,
                    'height_cm': height_cm,
                    'weight_kg': weight_kg
                }
                
                # Add predicted point to chart data
                result['predicted_point'] = {
                    'age_months': next_month,
                    'height_cm': round(float(predicted_height), 2),
                    'weight_kg': round(float(predicted_weight), 2)
                }
            
            return result
            
        except Exception as e:
            # If we can't calculate z-scores, still return the predictions
            print(f"Warning: Could not calculate z-scores: {str(e)}")
            return {
                'predicted_height': round(float(predicted_height), 2),
                'predicted_weight': round(float(predicted_weight), 2),
                'height_z_score': None,
                'weight_z_score': None,
                'height_status': 'unknown',
                'weight_status': 'unknown',
                'next_month_age': next_month,
                'current_data': {
                    'age_months': age_months,
                    'height_cm': height_cm,
                    'weight_kg': weight_kg
                },
                'error': str(e)
            }
