from django.urls import path
from . import views
from .auth_views import SignupView, LoginView, RefreshTokenView

urlpatterns = [
    # Authentication endpoints
    path('auth/signup/', SignupView.as_view(), name='signup'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/refresh/', RefreshTokenView.as_view(), name='token-refresh'),
    
    # Endpoint to list all babies
    path('babies/', views.list_babies, name='list-babies'),
    
    # Endpoint to add a new growth record and get risk prediction
    path('growth/', views.add_growth_record, name='add-growth-record'),
    
    # Endpoint to get all growth records
    path('growth/records/', views.get_growth_records, name='get-growth-records'),
    
    # Endpoint to get a specific growth record by ID
    path('growth/records/<int:record_id>/', views.get_growth_record, name='get-growth-record'),
    
    # Endpoint to get a risk prediction without saving the record
    path('growth/predict/', views.predict_growth_risk_api, name='predict-growth-risk'),
    
    # Endpoint to predict next month's height and weight using regression model
    path('growth/predict-next-month/', views.predict_growth, name='predict-growth'),
    
    # Endpoint to calculate z-scores for height and weight
    path('growth/calculate-zscores/', views.calculate_zscores, name='calculate-zscores'),
]