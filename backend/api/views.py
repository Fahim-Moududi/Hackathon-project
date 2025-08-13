from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db import IntegrityError
from django.utils import timezone
from .models import Baby, GrowthRecord
from .serializers import BabySerializer, GrowthRecordSerializer
from .utils import predict_growth_risk
from ml_models.predict_growth import GrowthPredictor
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
def add_growth_record(request):
    """
    Create a new growth record and get risk prediction.
    Required fields: baby/baby_id, age_months, gender, height_cm, weight_kg
    Optional fields: z_score_weight, z_score_height (will be calculated if not provided)
    """
    data = request.data.copy()
    
    # Handle both 'baby' and 'baby_id' for backward compatibility
    if 'baby' in data and 'baby_id' not in data:
        data['baby_id'] = data['baby']
    
    # Validate required fields
    required_fields = ['baby_id', 'age_months', 'gender']
    missing_fields = [field for field in required_fields if field not in data]
    if missing_fields:
        return Response(
            {'status': 'error', 'message': f'Missing required fields: {", ".join(missing_fields)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
        
    # Ensure we have either height/weight or z-scores
    if 'height_cm' not in data and 'z_score_height' not in data:
        return Response(
            {'status': 'error', 'message': 'Either height_cm or z_score_height is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
        
    if 'weight_kg' not in data and 'z_score_weight' not in data:
        return Response(
            {'status': 'error', 'message': 'Either weight_kg or z_score_weight is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Check if baby exists, create a test baby if not
        baby = Baby.objects.filter(id=data['baby_id']).first()
        if not baby:
            # Create a default user if none exists
            from django.contrib.auth.models import User
            from datetime import date
            
            user = User.objects.first()
            if not user:
                user = User.objects.create_user(
                    username='testuser',
                    email='test@example.com',
                    password='testpass123'
                )
            
            # Create a test baby
            baby = Baby.objects.create(
                id=data['baby_id'],
                parent=user,
                name=f"Baby {data['baby_id']}",
                gender=data.get('gender', 'male').lower(),
                birth_date=date.today()
            )
            print(f"Created test baby with ID: {baby.id}")
            
        # Get prediction from ML model
        prediction = predict_growth_risk(
            age_months=data['age_months'],
            gender=data['gender'],
            height_cm=data.get('height_cm'),
            weight_kg=data.get('weight_kg'),
            z_score_weight=data.get('z_score_weight'),
            z_score_height=data.get('z_score_height')
        )
        
        if prediction['status'] == 'error':
            return Response(
                {'status': 'error', 'message': prediction['message']},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create growth record with the calculated z-scores
        record = GrowthRecord.objects.create(
            baby=baby,
            date=data.get('date', timezone.now().date()),
            age_months=data['age_months'],
            weight_kg=data.get('weight_kg'),
            height_cm=data.get('height_cm'),
            z_score_weight=prediction['z_scores']['weight'],
            z_score_height=prediction['z_scores']['height'],
            classification=prediction['risk_status'],
            anomaly=prediction['is_anomaly']
        )
        
        # Prepare response
        response_data = {
            'status': 'success',
            'record_id': record.id,
            'risk_status': prediction['risk_status'],
            'confidence': prediction['confidence'],
            'is_anomaly': record.anomaly,
            'z_scores': prediction['z_scores']
        }
        
        # Add height/weight to response if they were provided
        if 'height_cm' in data:
            response_data['height_cm'] = data['height_cm']
        if 'weight_kg' in data:
            response_data['weight_kg'] = data['weight_kg']
            
        return Response(response_data, status=status.HTTP_201_CREATED)
        
    except (ValueError, TypeError) as e:
        return Response(
            {'status': 'error', 'message': f'Invalid data format: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'status': 'error', 'message': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def get_growth_records(request):
    """
    Get all growth records.
    Optional query parameters: baby_id (to filter by baby)
    """
    baby_id = request.query_params.get('baby_id')
    if baby_id:
        records = GrowthRecord.objects.filter(baby_id=baby_id)
    else:
        records = GrowthRecord.objects.all()
    serializer = GrowthRecordSerializer(records, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_growth_record(request, record_id):
    """
    Get a specific growth record by ID.
    """
    record = get_object_or_404(GrowthRecord, id=record_id)
    serializer = GrowthRecordSerializer(record)
    return Response(serializer.data)

@api_view(['POST'])
def predict_growth_risk_api(request):
    """
    Get growth risk prediction without saving the record.
    Required fields: age_months, gender
    And at least one of: height_cm or z_score_height
    And at least one of: weight_kg or z_score_weight
    """
    data = request.data.copy()
    
    # Validate required fields
    required_fields = ['age_months', 'gender']
    missing_fields = [field for field in required_fields if field not in data]
    if missing_fields:
        return Response(
            {'status': 'error', 'message': f'Missing required fields: {", ".join(missing_fields)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
        
    # Ensure we have either height/weight or z-scores
    if 'height_cm' not in data and 'z_score_height' not in data:
        return Response(
            {'status': 'error', 'message': 'Either height_cm or z_score_height is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
        
    if 'weight_kg' not in data and 'z_score_weight' not in data:
        return Response(
            {'status': 'error', 'message': 'Either weight_kg or z_score_weight is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Get or calculate z-scores if not provided
        if 'z_score_height' not in data and 'height_cm' in data:
            # In a real implementation, you would calculate z-score based on WHO standards
            # For now, we'll just pass None if not provided
            data['z_score_height'] = None
            
        if 'z_score_weight' not in data and 'weight_kg' in data:
            # In a real implementation, you would calculate z-score based on WHO standards
            # For now, we'll just pass None if not provided
            data['z_score_weight'] = None
            
        # Get prediction from the utility function
        prediction = predict_growth_risk(
            age_months=data['age_months'],
            gender=data['gender'],
            height_cm=data.get('height_cm'),
            weight_kg=data.get('weight_kg'),
            z_score_height=data.get('z_score_height'),
            z_score_weight=data.get('z_score_weight')
        )
        
        # Prepare response data
        response_data = {
            'status': 'success',
            'data': prediction
        }
        
        # Add height/weight to response if they were provided
        if 'height_cm' in data:
            response_data['height_cm'] = data['height_cm']
        if 'weight_kg' in data:
            response_data['weight_kg'] = data['weight_kg']
        
        return Response(response_data)
        
    except (ValueError, TypeError) as e:
        return Response(
            {'status': 'error', 'message': f'Invalid data format: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'status': 'error', 'message': f'Prediction failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
def predict_growth(request):
    """
    Predict next month's height and weight using regression model.
    Required fields: age_months, gender, height_cm, weight_kg
    """
    data = request.data.copy()
    
    # Validate required fields
    required_fields = ['age_months', 'gender', 'height_cm', 'weight_kg']
    missing_fields = [field for field in required_fields if field not in data]
    if missing_fields:
        return Response(
            {'status': 'error', 'message': f'Missing required fields: {", ".join(missing_fields)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Initialize the predictor (this will load the model)
        predictor = GrowthPredictor()
        
        # Get prediction with chart data
        prediction = predictor.predict(
            age_months=float(data['age_months']),
            gender=data['gender'],
            height_cm=float(data['height_cm']),
            weight_kg=float(data['weight_kg']),
            include_chart_data=True  # Include growth chart data
        )
        
        # Extract chart data if available
        chart_data = prediction.pop('chart_data', None)
        current_point = prediction.pop('current_point', None)
        predicted_point = prediction.pop('predicted_point', None)
        
        response_data = {
            'status': 'success',
            'prediction': prediction
        }
        
        # Add chart data if available
        if chart_data is not None:
            response_data['chart_data'] = {
                'height': {
                    'labels': [str(item['age_months']) for item in chart_data],
                    'datasets': [
                        {
                            'label': '2.3rd percentile',
                            'data': [item['height']['p2.3'] for item in chart_data],
                            'borderColor': '#FF6384',
                            'backgroundColor': 'rgba(255, 99, 132, 0.1)',
                            'borderWidth': 1,
                            'fill': True,
                            'pointRadius': 0
                        },
                        {
                            'label': '15.9th percentile',
                            'data': [item['height']['p15.9'] for item in chart_data],
                            'borderColor': '#36A2EB',
                            'backgroundColor': 'rgba(54, 162, 235, 0.1)',
                            'borderWidth': 1,
                            'fill': '+1',
                            'pointRadius': 0
                        },
                        {
                            'label': 'Mean',
                            'data': [item['height']['mean'] for item in chart_data],
                            'borderColor': '#4BC0C0',
                            'borderWidth': 2,
                            'pointRadius': 0,
                            'borderDash': [5, 5]
                        },
                        {
                            'label': '84.1th percentile',
                            'data': [item['height']['p84.1'] for item in chart_data],
                            'borderColor': '#36A2EB',
                            'backgroundColor': 'rgba(54, 162, 235, 0.1)',
                            'borderWidth': 1,
                            'fill': '-1',
                            'pointRadius': 0
                        },
                        {
                            'label': '97.7th percentile',
                            'data': [item['height']['p97.7'] for item in chart_data],
                            'borderColor': '#FF6384',
                            'backgroundColor': 'rgba(255, 99, 132, 0.1)',
                            'borderWidth': 1,
                            'fill': '-2',
                            'pointRadius': 0
                        },
                        {
                            'label': 'Current',
                            'data': [None] * len(chart_data),
                            'borderColor': '#000000',
                            'borderWidth': 2,
                            'pointRadius': 6,
                            'pointHoverRadius': 8,
                            'pointStyle': 'rect',
                            'pointBackgroundColor': '#000000'
                        },
                        {
                            'label': 'Predicted',
                            'data': [None] * len(chart_data),
                            'borderColor': '#FFA500',
                            'borderWidth': 2,
                            'pointRadius': 6,
                            'pointHoverRadius': 8,
                            'pointStyle': 'triangle',
                            'pointBackgroundColor': '#FFA500'
                        }
                    ]
                },
                'weight': {
                    'labels': [str(item['age_months']) for item in chart_data],
                    'datasets': [
                        {
                            'label': '2.3rd percentile',
                            'data': [item['weight']['p2.3'] for item in chart_data],
                            'borderColor': '#FF6384',
                            'backgroundColor': 'rgba(255, 99, 132, 0.1)',
                            'borderWidth': 1,
                            'fill': True,
                            'pointRadius': 0
                        },
                        {
                            'label': '15.9th percentile',
                            'data': [item['weight']['p15.9'] for item in chart_data],
                            'borderColor': '#36A2EB',
                            'backgroundColor': 'rgba(54, 162, 235, 0.1)',
                            'borderWidth': 1,
                            'fill': '+1',
                            'pointRadius': 0
                        },
                        {
                            'label': 'Mean',
                            'data': [item['weight']['mean'] for item in chart_data],
                            'borderColor': '#4BC0C0',
                            'borderWidth': 2,
                            'pointRadius': 0,
                            'borderDash': [5, 5]
                        },
                        {
                            'label': '84.1th percentile',
                            'data': [item['weight']['p84.1'] for item in chart_data],
                            'borderColor': '#36A2EB',
                            'backgroundColor': 'rgba(54, 162, 235, 0.1)',
                            'borderWidth': 1,
                            'fill': '-1',
                            'pointRadius': 0
                        },
                        {
                            'label': '97.7th percentile',
                            'data': [item['weight']['p97.7'] for item in chart_data],
                            'borderColor': '#FF6384',
                            'backgroundColor': 'rgba(255, 99, 132, 0.1)',
                            'borderWidth': 1,
                            'fill': '-2',
                            'pointRadius': 0
                        },
                        {
                            'label': 'Current',
                            'data': [None] * len(chart_data),
                            'borderColor': '#000000',
                            'borderWidth': 2,
                            'pointRadius': 6,
                            'pointHoverRadius': 8,
                            'pointStyle': 'rect',
                            'pointBackgroundColor': '#000000'
                        },
                        {
                            'label': 'Predicted',
                            'data': [None] * len(chart_data),
                            'borderColor': '#FFA500',
                            'borderWidth': 2,
                            'pointRadius': 6,
                            'pointHoverRadius': 8,
                            'pointStyle': 'triangle',
                            'pointBackgroundColor': '#FFA500'
                        }
                    ]
                }
            }
            
            # Add current and predicted points to the chart data
            if current_point and predicted_point:
                # Find the indices for current and predicted points
                age_months = [item['age_months'] for item in chart_data]
                if current_point['age_months'] in age_months:
                    idx = age_months.index(current_point['age_months'])
                    response_data['chart_data']['height']['datasets'][5]['data'][idx] = current_point['height_cm']
                    response_data['chart_data']['weight']['datasets'][5]['data'][idx] = current_point['weight_kg']
                
                if predicted_point['age_months'] in age_months:
                    idx = age_months.index(predicted_point['age_months'])
                    response_data['chart_data']['height']['datasets'][6]['data'][idx] = predicted_point['height_cm']
                    response_data['chart_data']['weight']['datasets'][6]['data'][idx] = predicted_point['weight_kg']
        
        return Response(response_data)
        
    except Exception as e:
        logger.error(f"Error in predict_growth: {str(e)}", exc_info=True)
        return Response(
            {'status': 'error', 'message': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )