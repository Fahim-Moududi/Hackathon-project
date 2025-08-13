"""
Z-Score Calculator for Child Growth Metrics
Based on WHO Child Growth Standards
"""
import math
import numpy as np
from scipy import stats

class ZScoreCalculator:
    """
    Calculate z-scores for child growth metrics (weight, height, BMI)
    using WHO Child Growth Standards.
    """
    
    # WHO Growth Standards LMS parameters for height-for-age (0-60 months)
    # L: Box-Cox power, M: Median, S: Coefficient of Variation
    # Format: {gender: {age_months: (L, M, S)}}
    HEIGHT_LMS = {
        'male': {
            # Age (months): (L, M, S)
            0: (1, 49.8842, 0.03795),
            1: (1, 54.7244, 0.03557),
            2: (1, 58.4249, 0.03424),
            3: (1, 61.4292, 0.03328),
            6: (1, 67.2516, 0.03257),
            9: (1, 71.4818, 0.0322),
            12: (1, 75.6709, 0.03164),
            18: (1, 82.7761, 0.02922),
            24: (1, 87.094, 0.02796),
            36: (1, 95.2506, 0.02634),
            48: (1, 102.352, 0.02544),
            60: (1, 108.411, 0.02519)
        },
        'female': {
            0: (1, 49.1477, 0.0379),
            1: (1, 53.6872, 0.0364),
            2: (1, 57.0673, 0.03568),
            3: (1, 59.8029, 0.0352),
            6: (1, 65.4606, 0.03424),
            9: (1, 69.8135, 0.0339),
            12: (1, 74.0, 0.03337),
            18: (1, 80.698, 0.03192),
            24: (1, 85.6346, 0.0309),
            36: (1, 94.1076, 0.02917),
            48: (1, 101.054, 0.02818),
            60: (1, 107.418, 0.02777)
        }
    }
    
    # WHO Growth Standards LMS parameters for weight-for-age (0-60 months)
    WEIGHT_LMS = {
        'male': {
            # Age (months): (L, M, S)
            0: (0.3487, 3.3464, 0.14602),
            1: (0.2297, 4.4709, 0.13395),
            2: (0.197, 5.5675, 0.12385),
            3: (0.1738, 6.3762, 0.11727),
            6: (0.1553, 7.9322, 0.11316),
            9: (0.1395, 8.9626, 0.1108),
            12: (0.1268, 9.7289, 0.10958),
            18: (0.1041, 10.7095, 0.11047),
            24: (0.0876, 11.4805, 0.11228),
            36: (0.067, 13.346, 0.11023),
            48: (0.0549, 15.099, 0.10816),
            60: (0.0448, 16.514, 0.10632)
        },
        'female': {
            0: (0.3809, 3.2322, 0.14171),
            1: (0.1714, 4.1873, 0.14478),
            2: (0.096, 5.1282, 0.1327),
            3: (0.0402, 5.8458, 0.1236),
            6: (-0.005, 7.24, 0.11727),
            9: (-0.043, 8.1466, 0.11364),
            12: (-0.0756, 8.875, 0.11101),
            18: (-0.1399, 9.8129, 0.10842),
            24: (-0.1911, 10.5561, 0.10741),
            36: (-0.2384, 12.108, 0.10632),
            48: (-0.2689, 13.761, 0.10408),
            60: (-0.2708, 15.351, 0.10115)
        }
    }
    
    @classmethod
    def _get_lms(cls, age_months, gender, metric):
        """Get L, M, S values for the given age and gender."""
        try:
            gender = gender.lower()
            age_months = int(age_months)
            
            # Get the appropriate LMS table
            lms_table = cls.HEIGHT_LMS if metric == 'height' else cls.WEIGHT_LMS
            
            # Get the closest age in the table
            available_ages = sorted(lms_table[gender].keys())
            closest_age = min(available_ages, key=lambda x: abs(x - age_months))
            
            return lms_table[gender][closest_age]
        except (KeyError, ValueError, AttributeError) as e:
            raise ValueError(f"Invalid input parameters: {str(e)}")
    
    @classmethod
    def calculate_z_score(cls, value, age_months, gender, metric='height'):
        """
        Calculate z-score for a given measurement.
        
        Args:
            value: The measurement value (height in cm or weight in kg)
            age_months: Age in months (0-60)
            gender: 'male' or 'female'
            metric: 'height' or 'weight'
            
        Returns:
            float: The z-score
        """
        try:
            L, M, S = cls._get_lms(age_months, gender, metric)
            
            # Special case for weight when L is 0 (logarithmic transformation)
            if L == 0:
                z = math.log(value / M) / S
            else:
                z = ((value / M) ** L - 1) / (L * S)
                
            return z
        except (ValueError, ZeroDivisionError) as e:
            raise ValueError(f"Error calculating z-score: {str(e)}")
    
    @classmethod
    def calculate_height_z_score(cls, height_cm, age_months, gender):
        """Calculate z-score for height."""
        return cls.calculate_z_score(height_cm, age_months, gender, 'height')
    
    @classmethod
    def calculate_weight_z_score(cls, weight_kg, age_months, gender):
        """Calculate z-score for weight."""
        return cls.calculate_z_score(weight_kg, age_months, gender, 'weight')
    
    @classmethod
    def calculate_bmi_z_score(cls, height_cm, weight_kg, age_months, gender):
        """Calculate z-score for BMI."""
        if height_cm <= 0 or weight_kg <= 0:
            raise ValueError("Height and weight must be positive values")
            
        # Calculate BMI (kg/m²)
        height_m = height_cm / 100
        bmi = weight_kg / (height_m * height_m)
        
        # Get height and weight z-scores
        height_z = cls.calculate_height_z_score(height_cm, age_months, gender)
        weight_z = cls.calculate_weight_z_score(weight_kg, age_months, gender)
        
        # For simplicity, return the average of height and weight z-scores
        # Note: In a production environment, you would use WHO BMI-for-age tables
        return (height_z + weight_z) / 2

# Example usage
if __name__ == "__main__":
    # Example: Calculate z-scores for a 12-month-old male
    age = 12
    gender = 'male'
    height = 75.5  # cm
    weight = 9.8    # kg
    
    try:
        height_z = ZScoreCalculator.calculate_height_z_score(height, age, gender)
        weight_z = ZScoreCalculator.calculate_weight_z_score(weight, age, gender)
        bmi_z = ZScoreCalculator.calculate_bmi_z_score(height, weight, age, gender)
        
        print(f"Height: {height} cm, Z-score: {height_z:.2f}")
        print(f"Weight: {weight} kg, Z-score: {weight_z:.2f}")
        print(f"BMI Z-score: {bmi_z:.2f}")
        
        # Interpret the z-scores
        def interpret_z(z, metric):
            if z < -3:
                return "Severely under"
            elif z < -2:
                return "Moderately under"
            elif z <= 2:
                return "Normal"
            elif z <= 3:
                return "Over"
            else:
                return "Severely over"
        
        print(f"\nHeight is {interpret_z(height_z, 'height')} the expected range")
        print(f"Weight is {interpret_z(weight_z, 'weight')} the expected range")
        
    except ValueError as e:
        print(f"Error: {str(e)}")
