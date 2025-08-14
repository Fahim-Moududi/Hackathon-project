from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import make_password
from .models import Baby
from django.db import transaction

User = get_user_model()

class SignupView(APIView):
    permission_classes = [AllowAny]
    
    @transaction.atomic
    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        baby_name = request.data.get('baby_name')
        baby_gender = request.data.get('baby_gender')
        baby_birth_date = request.data.get('baby_birth_date')
        
        if not all([username, email, password, baby_name, baby_gender, baby_birth_date]):
            return Response(
                {'error': 'Please provide all required fields: username, email, password, baby_name, baby_gender, baby_birth_date'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'Email already registered'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            # Create the user
            user = User.objects.create(
                username=username,
                email=email,
                password=make_password(password)
            )
            
            # Create the baby and associate with the user
            baby = Baby.objects.create(
                parent=user,
                name=baby_name,
                gender=baby_gender,
                birth_date=baby_birth_date
            )
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'User and baby created successfully',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                },
                'baby': {
                    'id': baby.id,
                    'name': baby.name,
                    'gender': baby.gender,
                    'birth_date': baby.birth_date
                },
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response(
                {'error': 'Please provide both username and password'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            user = User.objects.get(username=username)
            if not user.check_password(password):
                raise User.DoesNotExist
                
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'Login successful',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                },
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            })
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RefreshTokenView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        refresh_token = request.data.get('refresh')
        
        if not refresh_token:
            return Response(
                {'error': 'Refresh token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)
            
            return Response({
                'access': access_token
            })
            
        except Exception as e:
            return Response(
                {'error': 'Invalid refresh token'},
                status=status.HTTP_401_UNAUTHORIZED
            )
