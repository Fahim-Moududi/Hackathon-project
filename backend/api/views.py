from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db import IntegrityError
from django.utils import timezone
from .models import Baby, GrowthRecord
from .serializers import BabySerializer, GrowthRecordSerializer
from .utils import predict_growth_risk

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
    data = request.data
    
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
        
        # Prepare response data
        response_data = {
            'status': 'success',
            'risk_status': prediction['risk_status'],
            'confidence': prediction['confidence'],
            'is_anomaly': prediction['is_anomaly'],
            'z_scores': prediction['z_scores']
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