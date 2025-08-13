import pandas as pd
import numpy as np
from pathlib import Path
import os

# Output file path
OUTPUT_FILE = Path(__file__).parent / 'child_growth_0_60_months_synthetic.csv'

# Number of samples to generate per month
SAMPLES_PER_MONTH = 15  # Will generate 15 samples per month (5 for each category)

# WHO Growth Standards (simplified for demonstration)
# These are approximate median values for weight and height by age and gender
# Source: WHO Child Growth Standards

def get_median_weight(age_months, gender):
    """Get median weight in kg based on WHO standards."""
    if gender == 'M':
        # Simplified weight curve for boys 0-60 months
        return 3.3 + (age_months * 0.25) - (age_months ** 2 * 0.0005)
    else:
        # Simplified weight curve for girls 0-60 months
        return 3.2 + (age_months * 0.23) - (age_months ** 2 * 0.0004)

def get_median_height(age_months, gender):
    """Get median height in cm based on WHO standards."""
    if gender == 'M':
        # Simplified height curve for boys 0-60 months
        return 50 + (age_months * 0.9) - (age_months ** 2 * 0.001)
    else:
        # Simplified height curve for girls 0-60 months
        return 49 + (age_months * 0.87) - (age_months ** 2 * 0.0009)

def generate_growth_data():
    """Generate synthetic growth data based on WHO standards."""
    data = []
    
    for age_months in range(0, 61):  # 0 to 60 months
        for gender in ['M', 'F']:
            # Generate multiple samples for each age and gender
            for _ in range(SAMPLES_PER_MONTH):
                # Base values on WHO medians
                median_weight = get_median_weight(age_months, gender)
                median_height = get_median_height(age_months, gender)
                
                # Add some random variation (more variation for older children)
                weight_variation = np.random.normal(0, 0.1 + (age_months * 0.01))
                height_variation = np.random.normal(0, 0.5 + (age_months * 0.02))
                
                weight = max(0.1, median_weight * (1 + weight_variation))
                height = max(10, median_height * (1 + height_variation * 0.03))
                
                # Calculate standard deviations (simplified)
                weight_sd = 0.15 * median_weight
                height_sd = 0.04 * median_height
                
                data.append({
                    'AgeMonths': age_months,
                    'Gender': gender,
                    'Weight_kg': round(weight, 2),
                    'Weight_SD': round(weight_sd, 2),
                    'Height_cm': round(height, 1),
                    'Height_SD': round(height_sd, 1)
                })
    
    return pd.DataFrame(data)

def main():
    print(f"Generating synthetic growth data for 0-60 months...")
    df = generate_growth_data()
    
    # Save to CSV
    df.to_csv(OUTPUT_FILE, index=False)
    print(f"Generated {len(df)} records")
    print(f"Data saved to: {os.path.abspath(OUTPUT_FILE)}")
    
    # Show sample of the data
    print("\nSample data:")
    print(df.head())

if __name__ == "__main__":
    main()
