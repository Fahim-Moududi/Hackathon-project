import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib
from pathlib import Path
from .zscore_calculator import ZScoreCalculator

# Constants
BASE_DIR = Path(__file__).resolve().parent.parent  # Points to api directory
MODEL_DIR = BASE_DIR / 'ml_models'
MODEL_PATH = MODEL_DIR / 'growth_risk_model.joblib'
ENCODER_PATH = MODEL_DIR / 'label_encoder.joblib'
SCALER_PATH = MODEL_DIR / 'feature_scaler.joblib'
DATA_FILE = Path('d:/hackathon/Hackathon-project/backend/child_growth_0_60_months_synthetic.csv')

def ensure_model_dir_exists():
    """Ensure the model directory exists."""
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

def load_growth_data():
    """Load and preprocess the growth data from CSV."""
    # Load the data
    df = pd.read_csv(DATA_FILE)
    
    # Calculate z-scores using WHO standards
    z_calculator = ZScoreCalculator()
    
    data = []
    for _, row in df.iterrows():
        age_months = row['AgeMonths']
        gender = 'male' if row['Gender'] == 'M' else 'female'
        weight_kg = row['Weight_kg']
        height_cm = row['Height_cm']
        
        # Calculate z-scores
        try:
            z_weight = z_calculator.calculate_weight_z_score(weight_kg, age_months, gender)
            z_height = z_calculator.calculate_height_z_score(height_cm, age_months, gender)
            
            # Determine risk status based on z-scores
            if z_weight < -3 or z_height < -3:
                status = 'severely_underweight' if z_weight < -3 else 'severely_stunted'
            elif z_weight < -2 or z_height < -2:
                status = 'underweight' if z_weight < -2 else 'stunted'
            elif z_weight > 3:
                status = 'severely_overweight'
            elif z_weight > 2:
                status = 'overweight'
            else:
                status = 'normal'
                
            data.append({
                'age_months': age_months,
                'gender': gender,
                'weight_kg': weight_kg,
                'height_cm': height_cm,
                'z_score_weight': z_weight,
                'z_score_height': z_height,
                'bmi': weight_kg / ((height_cm/100) ** 2),
                'risk_status': status
            })
            
        except Exception as e:
            print(f"Error processing row {_}: {e}")
    
    return pd.DataFrame(data)

def prepare_features(data):
    """Prepare features for training."""
    df = data.copy()
    
    # Encode gender
    le_gender = LabelEncoder()
    df['gender_encoded'] = le_gender.fit_transform(df['gender'])
    
    # Encode risk status (target)
    le_status = LabelEncoder()
    y = le_status.fit_transform(df['risk_status'])
    
    # Calculate BMI if not present
    if 'bmi' not in df.columns:
        df['bmi'] = df['weight_kg'] / ((df['height_cm']/100) ** 2)
    
    # Select features
    features = ['age_months', 'gender_encoded', 'height_cm', 'weight_kg', 
               'bmi', 'z_score_weight', 'z_score_height']
    
    X = df[features]
    
    # Save the label encoder with the model
    joblib.dump(le_status, ENCODER_PATH)
    
    return X, y, le_status

def train_growth_risk_model():
    """Train and save the growth risk prediction model using the provided dataset."""
    try:
        ensure_model_dir_exists()
        
        # Load and prepare data
        print("Loading and preparing growth data...")
        data = load_growth_data()
        
        # Ensure we have enough samples
        if len(data) < 400:
            raise ValueError(f"Insufficient data samples: {len(data)}. Need at least 400 samples for reliable training.")
            
        X, y, le_status = prepare_features(data)
        
        # Verify we have all expected classes
        unique_classes = le_status.classes_
        print(f"Found {len(unique_classes)} classes: {', '.join(unique_classes)}")
        
        # Ensure we have enough samples for each class
        class_counts = pd.Series(y).value_counts()
        print("\nClass distribution:")
        for cls, count in class_counts.items():
            print(f"- {le_status.inverse_transform([cls])[0]}: {count} samples")
        
        # Split data with stratification to ensure all classes are represented
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, 
            test_size=0.2, 
            random_state=42, 
            stratify=y,
            shuffle=True
        )
        
        print(f"\nTraining samples: {len(X_train)}")
        print(f"Testing samples: {len(X_test)}")
        
        # Initialize and train the model with balanced class weights
        print("\nTraining model...")
        model = RandomForestClassifier(
            n_estimators=200,  # Increased number of trees
            max_depth=8,       # Slightly deeper trees
            min_samples_split=5,  # Avoid overfitting
            min_samples_leaf=2,   # Avoid overfitting
            class_weight='balanced',
            random_state=42,
            n_jobs=-1,          # Use all cores
            verbose=1
        )
        
        model.fit(X_train, y_train)
        
        # Save the model
        joblib.dump(model, MODEL_PATH)
        
        # Print model performance
        y_pred = model.predict(X_test)
        print("\nModel Performance:")
        print(classification_report(y_test, y_pred, target_names=le_status.classes_))
        
        return model
        
    except Exception as e:
        print(f"Error training model: {str(e)}")
        raise

def get_growth_risk_model():
    """Load the trained model or train a new one if not found."""
    try:
        # Ensure model directory exists
        ensure_model_dir_exists()
        
        # Always train a new model to ensure consistency
        # This ensures the label encoder and model are in sync
        print("Training a new model to ensure consistency...")
        return train_growth_risk_model()
        
    except Exception as e:
        print(f"Error in get_growth_risk_model: {e}")
        # If training fails, try to load existing model as fallback
        try:
            if MODEL_PATH.exists() and ENCODER_PATH.exists():
                print("Loading existing model as fallback...")
                return joblib.load(MODEL_PATH)
            raise
        except Exception as e2:
            print(f"Fatal error: Could not load or train model: {e2}")
            raise

def predict_growth_risk(age_months, gender, height_cm=None, weight_kg=None, 
                      z_score_weight=None, z_score_height=None, debug=False):
    """
    Predict growth risk based on child's metrics.
    
    Args:
        age_months: Age in months (1-60)
        gender: 'male' or 'female'
        height_cm: Height in centimeters (optional if z-scores provided)
        weight_kg: Weight in kilograms (optional if z-scores provided)
        z_score_weight: Weight z-score (optional, will be calculated if not provided)
        z_score_height: Height z-score (optional, will be calculated if not provided)
        debug: If True, returns additional debugging information
        
    Returns:
        dict: Dictionary containing risk status and confidence
    """
    result = {
        'status': 'success',
        'risk_status': 'unknown',
        'confidence': 0.0,
        'details': 'No prediction made',
        'feature_vector': None,
        'debug_info': {}
    }
    
    try:
        # Convert inputs to appropriate types
        age_months = int(age_months)
        gender = str(gender).lower()
        
        # Store debug information
        debug_info = {
            'input': {
                'age_months': age_months,
                'gender': gender,
                'height_cm': height_cm,
                'weight_kg': weight_kg,
                'z_score_weight': z_score_weight,
                'z_score_height': z_score_height
            },
            'calculations': {}
        }
        
        # Validate inputs
        if gender not in ['male', 'female']:
            raise ValueError("Gender must be 'male' or 'female'")
            
        if age_months < 0 or age_months > 60:
            raise ValueError("Age must be between 0 and 60 months")
        
        # Calculate z-scores if not provided but height/weight are available
        try:
            z_calc = ZScoreCalculator()
            
            if z_score_weight is None and weight_kg is not None:
                z_score_weight = z_calc.calculate_weight_z_score(
                    weight_kg, age_months, gender
                )
                debug_info['calculations']['calculated_z_weight'] = z_score_weight
            
            if z_score_height is None and height_cm is not None:
                z_score_height = z_calc.calculate_height_z_score(
                    height_cm, age_months, gender
                )
                debug_info['calculations']['calculated_z_height'] = z_score_height
                
        except Exception as e:
            debug_info['calculations']['z_score_error'] = str(e)
            if z_score_weight is None:
                z_score_weight = 0
            if z_score_height is None:
                z_score_height = 0
            print(f"Warning: Error calculating z-scores: {str(e)}")
        
        # Ensure we have the required values
        if height_cm is None or weight_kg is None:
            raise ValueError("Both height_cm and weight_kg are required for prediction")
            
        if z_score_weight is None or z_score_height is None:
            print("Warning: Using default z-scores (0). Predictions may be less accurate.")
            z_score_weight = z_score_weight or 0
            z_score_height = z_score_height or 0
        
        # Load model and encoder
        try:
            model = get_growth_risk_model()
            le = joblib.load(ENCODER_PATH)
            debug_info['model_loaded'] = True
            debug_info['model_classes'] = le.classes_.tolist()
        except Exception as e:
            debug_info['model_error'] = str(e)
            raise RuntimeError(f"Failed to load model or encoder: {str(e)}")
        
        # Calculate BMI and prepare feature vector
        try:
            height_m = height_cm / 100
            bmi = weight_kg / (height_m * height_m)
            debug_info['calculations']['bmi'] = bmi
            
            # Prepare feature vector with the exact same features as used in training
            feature_vector = {
                'age_months': float(age_months),
                'gender_encoded': 1 if gender == 'male' else 0,
                'height_cm': float(height_cm),
                'weight_kg': float(weight_kg),
                'bmi': float(bmi),
                'z_score_weight': float(z_score_weight),
                'z_score_height': float(z_score_height)
            }
            
            # Convert to DataFrame for prediction
            X = pd.DataFrame([list(feature_vector.values())], 
                           columns=feature_vector.keys())
            
            debug_info['feature_vector'] = feature_vector
            
        except Exception as e:
            debug_info['feature_error'] = str(e)
            raise RuntimeError(f"Error preparing features: {str(e)}")
        
        # Make prediction
        try:
            y_pred = model.predict(X)
            y_proba = model.predict_proba(X)
            
            debug_info['prediction'] = {
                'predicted_class': int(y_pred[0]),
                'probabilities': y_proba[0].tolist()
            }
            
        except Exception as e:
            debug_info['prediction_error'] = str(e)
            raise RuntimeError(f"Error making prediction: {str(e)}")
        
        # Load the label encoder to ensure we have all classes
        le_status = joblib.load(ENCODER_PATH)
        
        # Get risk status and confidence
        try:
            # Get the predicted class index and probabilities
            predicted_class_idx = int(y_pred[0])
            confidence = float(np.max(y_proba))
            
            # Get the corresponding class name from the label encoder
            if not hasattr(le, 'classes_'):
                raise RuntimeError("Label encoder is missing classes_ attribute")
                
            if not le.classes_.size:
                raise RuntimeError("No classes found in label encoder")
            
            # Ensure the predicted class index is within bounds
            if predicted_class_idx < 0 or predicted_class_idx >= len(le.classes_):
                print(f"Warning: Predicted class index {predicted_class_idx} out of range [0, {len(le.classes_)-1}]. Using most probable class.")
                predicted_class_idx = int(np.argmax(y_proba[0]))
            
            # Get the risk status from the label encoder
            risk_status = str(le.classes_[predicted_class_idx]).lower()
            
            # Map to standardized risk categories
            original_risk_status = risk_status
            if 'stunt' in risk_status:
                risk_status = 'stunted'
            elif 'underweight' in risk_status or 'under' in risk_status or 'severely_underweight' in risk_status:
                risk_status = 'underweight'
            elif 'overweight' in risk_status or 'over' in risk_status or 'obese' in risk_status or 'severely_overweight' in risk_status:
                risk_status = 'overweight'
            else:
                risk_status = 'normal'
            
            # Add to debug info
            debug_info['risk_mapping'] = {
                'original': original_risk_status,
                'mapped': risk_status,
                'confidence': confidence
            }
            
            # Determine if this is an anomaly (low confidence or extreme z-scores)
            is_anomaly = (
                confidence < 0.6 or
                (z_score_weight is not None and abs(z_score_weight) > 3) or
                (z_score_height is not None and abs(z_score_height) > 3)
            )
            
            # Prepare the result
            result.update({
                'status': 'success',
                'risk_status': risk_status,
                'confidence': confidence,
                'is_anomaly': is_anomaly,
                'details': f"Predicted {risk_status} with {confidence:.1%} confidence" + 
                          (" (anomaly detected)" if is_anomaly else ""),
                'feature_vector': feature_vector,
                'debug_info': debug_info if debug else None
            })
            
        except Exception as e:
            error_msg = f"Error in prediction: {str(e)}"
            print(error_msg)
            debug_info['error'] = error_msg
            debug_info['traceback'] = traceback.format_exc()
            
            # Update result with error information
            result.update({
                'status': 'error',
                'error': error_msg,
                'details': f"Prediction failed: {str(e)}",
                'debug_info': debug_info if debug else None
            })
        
        return result
            
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }